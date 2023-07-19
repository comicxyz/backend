declare module 'webp-converter' {
  export function dwebp(input: string, output: string, flags: string): Promise<any>;
  export function dwebp2(input: string,
    output: string, flags: string, logging: string): Promise<any>;
}
