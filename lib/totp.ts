import { generateSecret as otplibGenerateSecret, generateURI, verify } from "otplib";
import QRCode from "qrcode";

const ISSUER = "AzureMed Hub";

export function generateSecret(): string {
  return otplibGenerateSecret();
}

export async function generateQrCodeDataUrl(email: string, secret: string): Promise<string> {
  const otpauthUrl = generateURI({ issuer: ISSUER, label: email, secret });
  return QRCode.toDataURL(otpauthUrl);
}

export async function verifyTotp(token: string, secret: string): Promise<boolean> {
  try {
    const result = await verify({ secret, token });
    return result.valid;
  } catch {
    return false;
  }
}
