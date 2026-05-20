import * as OTPAuth from "otpauth";

export function generateTOTP(secret: string): string {
  const totp = new OTPAuth.TOTP({
    issuer: "AngelOne",
    label: "SmartAPI",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });

  return totp.generate();
}
