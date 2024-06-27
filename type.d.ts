export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SHOW_BROWSER: 'true' | 'false';
      FORCE_USE_PROXY: 'true' | 'false';
      PROXY: string;
      RETRY_TIMES: string;
      THREAD: string;
      LOG_MESSAGE_DIR: string;
      DATABASE: "sqlite" | "mysql" | "sqlserver"
    }
  }
}
