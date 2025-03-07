import Browser from '@/util/browser.ts';
import init from './init.ts';
import qyyjtLogin from './login/qyyjt.ts';
import qccLogin from './login/qcc.ts';
import { wait, waitRandom } from '@/util/common.ts';
import { execMySQL, mysqlConnect } from '@/db/mysql.ts';
import { isObjectLike } from 'lodash';

async function runSpiser(eventList: EventList) {
  let browser: Browser;
  // 爬取数据
  const processDataMap: Record<string, any> = {};
  for (let index = 0; index < eventList.length; index++) {
    const event = eventList[index];
    console.log(index, event.type);
    if (event.type === 'init') {
      console.log('初始化');
      browser = init(event.input);
    } else if (event.type === 'visit') {
      await browser!.visit(event.id, event.input);
    } else if (event.type === 'select') {
      if (event.handle === 'text') {
        await browser!.do(async (page) => {
          try {
            processDataMap[event.processTag] = await page.$eval(event.input, (el) => (el as HTMLElement).innerText);
          } catch (error) {
            console.log('选择出错：', event.input);
            console.log(error);
          }
        }, event.id);
        console.log(processDataMap[event.processTag]);
      } else {
        await browser!
          .select({ single: { key: event.input } }, event.id)
          ?.next(async ({ key }) => {
            if (typeof event.handle === 'function') {
              processDataMap[event.processTag] = await event.handle(key);
            } else if (event.handle === 'origin') {
              processDataMap[event.processTag] = key;
            }
          })
          .done();
      }
    } else if (event.type === 'login') {
      if (event.id === 'qyyjt') {
        await qyyjtLogin(browser!, event.mode, event.input);
      } else if (event.id === 'qcc') {
        await qccLogin(browser!, event.mode, event.input);
      }
    } else if (event.type === 'dbConnect') {
      if (event.id === 'mysql') {
        try {
          await mysqlConnect(event.input);
        } catch (error) {
          console.error(error);
        }
      }
    } else if (event.type === 'database') {
      if (event.id === 'mysql') {
        const data = await execMySQL(
          event.input.replace(/(\$\{[A-z0-9_]+\})/g, (_, key) => {
            return processDataMap[key];
          })
        );
        if (isObjectLike(data)) {
          console.log(JSON.stringify(data, null, 2));
        } else {
          console.log(data);
        }
      }
    }
    if (event.wait) {
      await waitRandom(event.wait);
    }
  }
}

export default runSpiser;
