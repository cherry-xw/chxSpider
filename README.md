### 爬虫

> type="init" 初始化浏览器

| 字段  | 值类型                                              | 字段说明                                                |
| ----- | --------------------------------------------------- | ------------------------------------------------------- |
| input | {proxy:boolean;show:boolean;device:'iPad'/'iPhone'} | proxy是否使用代理,show是否显示浏览器,device模拟设备类型 |

> type="visit" 访问网站

| 字段  | 值类型 | 字段说明                   |
| ----- | ------ | -------------------------- |
| id    | string | 用于后续操作辨认网页是哪个 |
| input | string | 访问网站的地址             |

> type="select" 选择网页元素

| 字段       | 值类型          | 字段说明                                                                             |
| ---------- | --------------- | ------------------------------------------------------------------------------------ |
| id         | string          | 前面visit的网页id                                                                    |
| input      | string          | 选择器[CSS Selector](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_selectors) |
| processTag | string          | 后续使用这里拿到的网页数据的key                                                      |
| handle     | string/function | 处理网页元素                                                                         |

#### handle的情况

1. 函数: 入参select结果，返回Promise\<any>，用于后续操作
2. text: 将结果转为文本，用于后续操作
3. origin: 查询结果不做操作，直接用于后续操作

> type="database" 数据库操作

| 字段  | 值类型          | 字段说明                                 |
| ----- | --------------- | ---------------------------------------- |
| input | string/string[] | 使用具体的前面定义的processTag，可以多个 |
| sql   | string          | 数据库操作语句                           |

```SQL
- sql语句
- 如果包含${processTag}，则会将processTag替换为具体的前面操作结果注入
- 例：
UPDATE Customers SET ContactName = '${userName}' WHERE CustomerID = 1;
```

> type="login" 登录

| 字段  | 值类型                            | 字段说明                                               |
| ----- | --------------------------------- | ------------------------------------------------------ |
| id    | 'qyyjt' \| 'qcc'                  | 企业预警通，企查查                                     |
| mode  | 'auto' \| 'manual'                | 自动登录，手动登录，如果自动登录失败会尝试使用手动登录 |
| input | {userName:string;password:string} | 登录信息                                               |

> type="dbConnect" 数据库连接

| 字段  | 值类型                                                                | 字段说明                    |
| ----- | --------------------------------------------------------------------- | --------------------------- |
| id    | sqlite\|mysql                                                         | 数据库类型                  |
| input | {host:string;port:number;database:string;user:string;password:string} | 数据库连接信息(mysql需配置) |
