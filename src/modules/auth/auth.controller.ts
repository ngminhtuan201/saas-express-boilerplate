import { Request, Response } from "express";
import { Profile as GoogleProfile } from "passport-google-oauth20";
import { UserOAuthProvider, UserRole } from "../../enums/user.enum";
import { config } from "../../libs/env";
import { errors } from "../../libs/errors";
import { documentId } from "../../libs/id";
import {
  signAuthTokens,
  verifyRefreshToken,
  verifyVerificationToken,
} from "../../libs/jwt";
import { catchAsync, getCurrentUser } from "../../libs/request";
import { handleSuccessResponse } from "../../libs/response";
import { Session, SessionModel } from "../../models/Session";
import { User, UserModel } from "../../models/User";
import { sanitizeUser } from "../users/user.helper";
import { extractJwtPayloadFromUser } from "./auth.helper";
import { login, register } from "./auth.service";
import { AuthToken } from "./auth.type";
import { ManualLoginDto } from "./dto/manual-login.dto";
import { ManualRegisterDto } from "./dto/manual-register.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";

const isProduction = process.env.NODE_ENV === "production";

const setAuthCookie = async (res: Response, refreshToken: AuthToken) => {
  res.cookie(config.COOKIE_AUTH, refreshToken.token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: refreshToken.expiresAt.getTime() - Date.now(),
  });
};

export const handleGoogleCallback = catchAsync(
  async (req: Request, res: Response) => {
    const googleProfile = req.user as unknown as GoogleProfile;
    if (!googleProfile || !googleProfile.emails?.[0]?.value) {
      throw errors.Unauthorized;
    }

    const email = googleProfile.emails[0].value;
    const isEmailVerified = Boolean(googleProfile.emails[0].verified ?? true);
    const photoUrl = googleProfile.photos?.[0]?.value;

    let user = (await UserModel.findOne({
      email,
    })
      .lean()
      .exec()) as User;

    if (!user) {
      user = {
        id: documentId(),
        email,
        emailVerified: isEmailVerified,
        fullName: googleProfile.displayName || "Google User",
        avatarUrl: photoUrl,
        role: UserRole.USER,
        oauthId: googleProfile.id,
        oauthProvider: UserOAuthProvider.GOOGLE,
        oauthAvatarUrl: photoUrl,
      };

      await UserModel.create(user);
    }

    if (!user.emailVerified) {
      throw errors.UnverifiedAccount;
    }

    const jwtPayload = extractJwtPayloadFromUser(user);
    const { accessToken, refreshToken } = signAuthTokens(jwtPayload);

    const newSession: Session = {
      userId: user.id,
      refreshToken: refreshToken.token,
      expiresAt: refreshToken.expiresAt,
    };

    await SessionModel.create(newSession);

    setAuthCookie(res, refreshToken);

    return handleSuccessResponse(res, {
      accessToken,
      user: sanitizeUser(user),
    });
  },
);

export const manualLogin = catchAsync(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await login(
    req.body as ManualLoginDto,
  );

  setAuthCookie(res, refreshToken);

  return handleSuccessResponse(res, { accessToken, user: sanitizeUser(user) });
});

export const manualRegister = catchAsync(
  async (req: Request, res: Response) => {
    await register(req.body as ManualRegisterDto);
    return handleSuccessResponse(
      res,
      null,
      201,
      "Registration successful. Please verify your email.",
    );
  },
);

export const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const token = req.query.token as string;
  if (!token) {
    throw errors.Unauthorized;
  }

  const payload = verifyVerificationToken(token);
  const user = await UserModel.findOne({ id: payload.userId }).lean().exec();

  if (!user) {
    throw errors.Unauthorized;
  }

  if (user.emailVerified) {
    return handleSuccessResponse(res, null, 200, "Email already verified.");
  }

  await UserModel.updateOne(
    { id: user.id },
    {
      $set: {
        emailVerified: true,
      },
      $unset: {
        verificationToken: 1,
        verificationTokenExpiry: 1,
      },
    },
  );

  return handleSuccessResponse(res, null, 200, "Email verified successfully.");
});

export const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const refreshTokenCookie = req.cookies[config.COOKIE_AUTH];
  if (!refreshTokenCookie) {
    throw errors.Unauthorized;
  }

  const payload = verifyRefreshToken(refreshTokenCookie);

  // Verify session exists in DB to prevent reuse of revoked tokens
  const existingSession = await SessionModel.findOne({
    refreshToken: refreshTokenCookie,
  })
    .lean()
    .exec();

  if (!existingSession) {
    throw errors.Unauthorized;
  }

  const user = await UserModel.findOne({ id: payload.userId }).lean().exec();

  if (!user) {
    throw errors.Unauthorized;
  }

  const jwtPayload = extractJwtPayloadFromUser(user as User);
  const { accessToken, refreshToken } = signAuthTokens(jwtPayload);

  await SessionModel.updateOne(
    { refreshToken: refreshTokenCookie },
    {
      $set: {
        refreshToken: refreshToken.token,
        expiresAt: refreshToken.expiresAt,
      },
    },
  );

  setAuthCookie(res, refreshToken);

  return handleSuccessResponse(res, { accessToken });
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  const refreshTokenCookie = req.cookies[config.COOKIE_AUTH];
  if (refreshTokenCookie) {
    await SessionModel.deleteOne({ refreshToken: refreshTokenCookie });
    res.clearCookie(config.COOKIE_AUTH);
  }

  return handleSuccessResponse(res, null, 200, "Logged out successfully.");
});

export const getMe = catchAsync((req: Request, res: Response) => {
  const user = getCurrentUser(req);
  return handleSuccessResponse(res, { user: user ? sanitizeUser(user) : null });
});

export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
  if (!currentUser) {
    throw errors.Unauthorized;
  }

  const dto = req.body as UpdateProfileDto;

  const updatedUser = await UserModel.findOneAndUpdate(
    { id: currentUser.id },
    { $set: dto },
    { new: true },
  )
    .lean()
    .exec();

  return handleSuccessResponse(res, {
    user: updatedUser ? sanitizeUser(updatedUser as User) : null,
  });
});
