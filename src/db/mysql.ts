import mysql from 'mysql';

let connection: ReturnType<typeof mysql.createConnection> | null = null;

export async function mysqlConnect(config: DBConnect['input']) {
  return new Promise((resolve, reject) => {
    connection = mysql.createConnection({
      host: config.host,
      user: config.user,
      password: config.password,
      database: config.database
    });
    connection.connect((err, conn) => {
      if (err) {
        reject(err);
        console.error('error connecting: ' + err.stack);
        return;
      }
      console.log('connected as id ' + conn.threadId);
      resolve(conn);
    });
  });
}

export async function execMySQL(sql: string) {
  return new Promise((resolve, reject) => {
    if (!connection) {
      console.log('数据库未连接');
      return;
    }
    connection.query(sql, function (error, results, fields) {
      if (error) {
        reject(error);
        return;
      }
      resolve(results);
    });
  });
}
