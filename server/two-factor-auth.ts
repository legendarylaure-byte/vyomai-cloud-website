import speakeasy from "speakeasy";
import QRCode from "qrcode";

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
}

export async function generateTwoFactorSecret(username: string): Promise<TwoFactorSetup> {
  const secret = speakeasy.generateSecret({
    name: `VyomAi (${username})`,
    issuer: "VyomAi",
    length: 32,
  });

  if (!secret.otpauth_url) {
    throw new Error("Failed to generate 2FA secret");
  }

  const qrCode = await QRCode.toDataURL(secret.otpauth_url);

  return {
    secret: secret.base32,
    qrCode,
  };
}

export function verifyTwoFactorToken(secret: string, token: string): boolean {
  try {
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: token,
      window: 2, // Allow 2 time windows for clock skew
    });
    return verified;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("2FA verification error:", error);
    }
    return false;
  }
}

export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
  }
  return codes;
}
