declare module 'marked' {
  export function parse(src: string, options?: any): string | Promise<string>;
  export { parse as marked };
}
