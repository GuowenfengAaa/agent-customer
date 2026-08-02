declare namespace API {
  interface ApiResult<T> {
    code: number;
    msg?: string;
    data: T;
  }
}

declare module '*.module.less' {
  const styles: Record<string, string>;
  export default styles;
}
