declare module "qrcode" {
  export function toDataURL(text: string): Promise<string>;
  export function toString(text: string): Promise<string>;
  export function toCanvas(
    canvas: HTMLCanvasElement,
    text: string
  ): Promise<void>;
}
