/// <reference types="astro/client" />

declare module "../../clinic.config.mjs" {
  const value: Record<string, unknown>;
  export default value;
}

declare module "qrcode" {
  const QRCode: {
    toString(text: string, options?: Record<string, unknown>): Promise<string>;
  };
  export default QRCode;
}
