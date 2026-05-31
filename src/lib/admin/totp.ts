import { generateSecret, verify, generateURI } from "otplib";
import QRCode from "qrcode";

export function generateTotpSecret() {
  return generateSecret();
}

export async function verifyTotpCode(secret: string, token: string) {
  const result = await verify({ secret, token });
  return result.valid;
}

export function getTotpUri(email: string, secret: string) {
  return generateURI({
    issuer: "InventoryPOS Admin",
    label: email,
    secret,
  });
}

export async function getTotpQrDataUrl(email: string, secret: string) {
  const uri = getTotpUri(email, secret);
  return QRCode.toDataURL(uri);
}
