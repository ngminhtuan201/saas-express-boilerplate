import { UserRole } from "../../enums/user.enum";
import { config } from "../../libs/env";
import { errors } from "../../libs/errors";
import { documentId } from "../../libs/id";
import { signVerificationToken } from "../../libs/jwt";
import { SessionModel } from "../../models/Session";
import { User, UserModel } from "../../models/User";
import { addSendEmailJob } from "../../worker/modules/send-email/send-email.queue";
import {
  comparePassword,
  extractJwtPayloadFromUser,
  hashPassword,
  isEmailTaken,
  signAuthTokens,
} from "./auth.helper";
import { AuthToken } from "./auth.type";
import { ManualLoginDto } from "./dto/manual-login.dto";
import { ManualRegisterDto } from "./dto/manual-register.dto";

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
    !(await comparePassword(password, user.hashedPassword))
  ) {
    throw errors.InvalidCredentials;
  }

  if (!user.emailVerified) {
    throw errors.UnverifiedAccount;
  }

  const jwtPayload = extractJwtPayloadFromUser(user);
  const { accessToken, refreshToken } = signAuthTokens(jwtPayload);

  await SessionModel.create({
    userId: user.id,
    refreshToken: refreshToken.token,
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
  if (await isEmailTaken(email)) {
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
    hashedPassword: await hashPassword(password),
    verificationToken: verificationToken,
    verificationTokenExpiry: new Date(Date.now() + 15 * 60 * 1000),
  };

  const verificationUrl = `${config.APP_HOST}:${config.APP_PORT}/api/auth/verify?token=${verificationToken}`;

  await UserModel.create(newUser);

  addSendEmailJob({
    type: "verify-account",
    receiver: newUser.email,
    payload: {
      url: verificationUrl,
    },
  });

  return true;
};
