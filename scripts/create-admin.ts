import mongoose from "mongoose";
import { connectToMongoDB } from "../src/dbs/mongodb";
import { UserRole } from "../src/enums/user.enum";
import { documentId } from "../src/libs/id";
import { logger } from "../src/libs/logger";
import { UserModel } from "../src/models/User";
import { hashPassword } from "../src/modules/auth/auth.helper";

const getArgValue = (argName: string): string | undefined => {
  const args = process.argv.slice(2);
  const index = args.findIndex((arg) => arg === `--${argName}`);
  if (index !== -1 && args[index + 1] && !args[index + 1].startsWith("--")) {
    return args[index + 1];
  }
  const prefixArg = args.find((arg) => arg.startsWith(`--${argName}=`));
  if (prefixArg) {
    return prefixArg.split("=")[1];
  }
  return undefined;
};

const createAdmin = async () => {
  try {
    const email = (
      getArgValue("email") ||
      process.env.ADMIN_EMAIL ||
      "admin@example.com"
    )
      .trim()
      .toLowerCase();

    const password =
      getArgValue("password") || process.env.ADMIN_PASSWORD || "Admin@123456";

    const fullName =
      getArgValue("name") || process.env.ADMIN_NAME || "Super Administrator";

    if (!email || !email.includes("@")) {
      throw new Error(`Invalid email address: ${email}`);
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }

    logger.info("📦 Connecting to MongoDB...");
    await connectToMongoDB();

    const existingUser = await UserModel.findOne({ email }).exec();

    if (existingUser) {
      logger.info(
        `ℹ️ User with email '${email}' already exists. Updating to ADMIN role...`,
      );

      existingUser.role = UserRole.ADMIN;
      existingUser.emailVerified = true;
      existingUser.fullName = fullName || existingUser.fullName;
      if (getArgValue("password") || process.env.ADMIN_PASSWORD) {
        existingUser.hashedPassword = await hashPassword(password);
      }

      await existingUser.save();
      logger.info(`✅ Admin user '${email}' updated successfully!`);
    } else {
      logger.info(`🔨 Creating new ADMIN user '${email}'...`);
      const hashedPassword = await hashPassword(password);

      const newAdmin = await UserModel.create({
        id: documentId(),
        email,
        fullName,
        role: UserRole.ADMIN,
        emailVerified: true,
        hashedPassword,
      });

      logger.info(`🎉 Admin account created successfully!`);
      logger.info(`   ID:       ${newAdmin.id}`);
      logger.info(`   Email:    ${newAdmin.email}`);
      logger.info(`   Name:     ${newAdmin.fullName}`);
      logger.info(`   Role:     ${newAdmin.role}`);
    }

    await mongoose.disconnect();
    logger.info("📦 MongoDB disconnected.");
    process.exit(0);
  } catch (error) {
    logger.error(`❌ Failed to create admin user: ${error}`);
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
    process.exit(1);
  }
};

createAdmin();
