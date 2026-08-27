import { Request, Response } from "express";
import { Profile as GoogleProfile } from "passport-google-oauth20";
import { config } from "../../config";
import { UserOAuthProvider, UserRole } from "../../enums";
import { errors } from "../../errors";
import {
  catchAsync,
  documentId,
  getCurrentUser,
  handleSuccess,
  verifyRefreshToken,
} from "../../libs";
import { RefreshTokenModel, User, UserModel } from "../../models";
import { AuthToken } from "../../types";
import { authHelper } from "./auth.helper";
import { login, register } from "./auth.service";
import { ManualLoginDto, ManualRegisterDto, UpdateProfileDto } from "./dtos";

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
    const googleProfile: GoogleProfile = req.user as GoogleProfile;
    if (!googleProfile) {
      throw errors.Unauthorized;
    }

    let user = (await UserModel.findOne({
      email: googleProfile.emails[0].value,
    })
      .lean()
      .exec()) as User;

    if (!user) {
      user = {
        id: documentId(),
        email: googleProfile.emails[0].value,
        emailVerified: googleProfile.emails[0].verified,
        fullName: googleProfile.displayName,
        avatarUrl: googleProfile.photos[0].value,
        role: UserRole.USER,
        oauthId: googleProfile.id,
        oauthProvider: UserOAuthProvider.GOOGLE,
        oauthAvatarUrl: googleProfile.photos[0].value,
      };

      await UserModel.create(user);
    }

    if (!user.emailVerified) {
      throw errors.UnverifiedAccount;
    }

    const jwtPayload = authHelper.extractJwtPayloadFromUser(user);
    const { accessToken, refreshToken } =
      authHelper.signResponseTokens(jwtPayload);

    await RefreshTokenModel.create({
      userId: user.id,
      token: refreshToken.token,
      expiresAt: refreshToken.expiresAt,
    });

    setAuthCookie(res, refreshToken);

    return handleSuccess(res, { accessToken, user });
  },
);

export const manualLogin = catchAsync(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await login(
    req.body as ManualLoginDto,
  );

  setAuthCookie(res, refreshToken);

  return handleSuccess(res, { accessToken, user });
});

export const manualRegister = catchAsync(
  async (req: Request, res: Response) => {
    await register(req.body as ManualRegisterDto);
    return handleSuccess(res, null);
  },
);

export const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const token = req.query.token as string;
  if (!token) {
    throw errors.Unauthorized;
  }

  const payload = authHelper.verifyVerificationToken(token);
  const user = await UserModel.findOne({ id: payload.userId }).lean().exec();

  if (!user) {
    throw errors.Unauthorized;
  }

  if (user.emailVerified) {
    return handleSuccess(res, null);
  }

  await UserModel.updateOne(
    { id: user.id },
    {
      $set: {
        emailVerified: true,
        verificationToken: undefined,
        verificationTokenExpiry: undefined,
      },
    },
  );

  return handleSuccess(res, null);
});

export const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const refreshTokenCookie = req.cookies[config.COOKIE_AUTH];
  if (!refreshTokenCookie) {
    throw errors.Unauthorized;
  }

  const payload = verifyRefreshToken(refreshTokenCookie);
  const user = await UserModel.findOne({ id: payload.userId }).lean().exec();

  if (!user) {
    throw errors.Unauthorized;
  }

  const jwtPayload = authHelper.extractJwtPayloadFromUser(user as User);
  const { accessToken, refreshToken } =
    authHelper.signResponseTokens(jwtPayload);

  await RefreshTokenModel.updateOne(
    { token: refreshTokenCookie },
    { $set: { token: refreshToken.token, expiresAt: refreshToken.expiresAt } },
  );

  setAuthCookie(res, refreshToken);

  return handleSuccess(res, { accessToken });
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  const refreshTokenCookie = req.cookies[config.COOKIE_AUTH];
  if (!refreshTokenCookie) {
    throw errors.Unauthorized;
  }

  await RefreshTokenModel.deleteOne({ token: refreshTokenCookie });
  res.clearCookie(config.COOKIE_AUTH);

  return handleSuccess(res, null);
});

export const getMe = catchAsync((req: Request, res: Response) => {
  return handleSuccess(res, { user: getCurrentUser(req) });
});

export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
  const dto = req.body as UpdateProfileDto;

  const updatedUser = await UserModel.findOneAndUpdate(
    { id: currentUser.id },
    { $set: dto },
    { new: true },
  )
    .lean()
    .exec();

  return handleSuccess(res, { user: updatedUser });
});
