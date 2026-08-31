import nodemailer from "nodemailer";
import { config } from "../../config";

const transporter = nodemailer.createTransport({
  host: "smtp.resend.com",
  secure: true,
  port: 465,
  auth: {
    user: "resend",
    pass: config.RESEND_API_KEY,
  },
});

export const sendVerificationEmail = async (
  receiver: string,
  url: string,
): Promise<void> => {
  await transporter.sendMail({
    from: config.RESEND_EMAIL_FROM,
    to: receiver,
    subject: "Verify your email",
    html: `
      <h1>Verify your email</h1>
      <p>Please verify your email by clicking on the link: <a href="${url}">Verify your email</a></p>
    `,
  });
};

export const sendResetPasswordEmail = async (
  receiver: string,
  url: string,
): Promise<void> => {
  await transporter.sendMail({
    from: config.RESEND_EMAIL_FROM,
    to: receiver,
    subject: "Reset your password",
    html: `
      <h1>Reset your password</h1>
      <p>Click on the link below to reset your password: <a href="${url}">Reset password</a></p>
    `,
  });
};
