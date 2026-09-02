export interface ISendEmailJob {
  type: "verify-account" | "reset-password";
  receiver: string;
  payload: Record<string, string>;
}
