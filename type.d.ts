import init from '@/spider/init.ts';

export {};

type WaitMixin<T extends Record<string, any>> = {
  /** 操作结束后等待时间(毫秒) */
  wait?: number;
} & T;

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SHOW_BROWSER: 'true' | 'false';
      FORCE_USE_PROXY: 'true' | 'false';
      PROXY: string;
      RETRY_TIMES: string;
      THREAD: string;
      LOG_MESSAGE_DIR: string;
      DATABASE: 'sqlite' | 'mysql' | 'sqlserver';
    }
  }

  type Visit = WaitMixin<{
    /** 访问网页 */
    type: 'visit';
    /** 用于后续操作辨认网页是哪个 */
    id: string;
    input: `${'http' | 'https'}://${string}.${string}`;
  }>;

  type AutoLogin = WaitMixin<{
    /** 登录 */
    type: 'login';
    id: 'qyyjt' | 'qcc';
    mode: 'auto' | 'manual';
    input?: {
      /** 用户名 */
      userName: string;
      /** 密码 */
      password: string;
    };
  }>;

  type Selector = WaitMixin<{
    /** 选择网页元素操作 */
    type: 'select';
    /** 使用前面visit操作的网页 */
    id: string;
    /** 选择器 */
    input: string;
    /**
     * 处理网页元素
     * 函数: 入参select结果，返回Promise<any>，用于后续操作
     * text: 将结果转为文本，用于后续操作
     * origin: 查询结果不做操作，直接用于后续操作
     */
    handle: ((dom: Awaited<ReturnType<Page['$']>>) => Promise<any>) | 'text' | 'origin';
    /** 后续操作key tag */
    processTag: string;
  }>;

  type DataBase = WaitMixin<{
    /** 数据库操作 */
    type: 'database';
    /** before 取前一步操作， string使用具体的前面定义的processTag */
    input: 'before' | string;
    /**
     * 操作语句
     * 如果包含${processTag}，则会将processTag替换为具体的前面操作结果注入
     * 例：UPDATE Customers SET ContactName = '${userName}' WHERE CustomerID = 1;
     */
    sql?: string;
  }>;

  type EventList = [
    WaitMixin<{
      /** 初始化操作 */
      type: 'init';
      input?: Parameters<typeof init>[0];
    }>,
    Visit,
    ...(Visit | Selector | DataBase | AutoLogin)[]
  ];
}
