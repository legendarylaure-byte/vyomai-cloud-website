declare module "speakeasy" {
  export interface SecretOptions {
    name?: string;
    issuer?: string;
    length?: number;
  }

  export interface Secret {
    base32: string;
    hex: string;
    qr_code_ascii: string;
    otpauth_url?: string;
  }

  export interface VerifyOptions {
    secret: string;
    encoding?: string;
    token: string;
    window?: number;
  }

  export const generateSecret: (options: SecretOptions) => Secret;
  export const totp: {
    verify: (options: VerifyOptions) => boolean;
  };
}
