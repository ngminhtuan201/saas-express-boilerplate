import { config } from "../../config";
import { UserRole } from "../../enums";
import { errors } from "../../errors";
import { documentId, signVerificationToken } from "../../libs";
import { RefreshTokenModel, User, UserModel } from "../../models";
import { AuthToken } from "../../types";
import { addSendEmailJob } from "../../worker/modules/emails/send-email.queue";
import { authHelper } from "./auth.helper";
import { ManualLoginDto, ManualRegisterDto } from "./dtos";

export const login = async (
  loginDto: ManualLoginDto,
): Promise<{ user: User; accessToken: AuthToken; refreshToken: AuthToken }> => {
  const { email, password } = loginDto;
  const user = (await UserModel.findOne({
    email: email,
  })
    .lean()
    .exec()) as User;

  if (
    !user ||
    user.oauthProvider ||
    !user?.hashedPassword ||
    !(await authHelper.comparePassword(password, user.hashedPassword))
  ) {
    throw errors.InvalidCredentials;
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

  return {
    user,
    accessToken,
    refreshToken,
  };
};

export const register = async (
  registerDto: ManualRegisterDto,
): Promise<boolean> => {
  const { email, password, fullName } = registerDto;
  const isEmailTaken = await authHelper.isEmailTaken(email);
  if (isEmailTaken) {
    throw errors.EmailTaken;
  }

  const newUserId = documentId();
  const verificationToken = signVerificationToken({
    userId: newUserId,
  });

  const newUser: User = {
    id: newUserId,
    email: email.trim().toLowerCase(),
    emailVerified: false,
    fullName: fullName,
    role: UserRole.USER,
    hashedPassword: await authHelper.hashPassword(password),
    verificationToken: verificationToken,
    verificationTokenExpiry: new Date(Date.now() + 15 * 60 * 1000),
  };

  const verificationUrl = `${config.APP_HOST}:${config.APP_PORT}/api/auth/verify?token=${verificationToken}`;

  await UserModel.create(newUser);

  addSendEmailJob({
    type: "verify",
    receiver: newUser.email,
    payload: {
      url: verificationUrl,
    },
  });

  return true;
};
