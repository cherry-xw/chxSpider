import Browser from '@/util/browser.ts';
import { wait, waitRandom } from '@/util/common.ts';

export default async function qyyjtLogin(browser: Browser, mode: AutoLogin['mode'], data: AutoLogin['input']) {
  console.log((mode === 'auto' ? '自动' : '手动') + '登录：企业预警通');
  await browser.visit('qyyjt', 'https://www.qyyjt.cn/user/login');
  await waitRandom(2500);
  await browser.do(async (page) => {
    if (page.url().includes('user/login')) {
      if (mode === 'auto') {
        const usePwdBtn = await page.$('div.ant-tabs-tab');
        if (usePwdBtn) {
          await usePwdBtn.evaluate((el) => el.click());
          await page.focus('input#username');
          await browser.input(data!.userName, 'qyyjt');
          await waitRandom();
          await page.focus('input#password');
          await browser.input(data!.password, 'qyyjt');
          const loginBtn = await page.$(
            '#rc-tabs-0-panel-0 > form > div.ant-row.ant-form-item > div > div > div > button'
          );
          if (loginBtn) {
            await loginBtn.evaluate((el) => el.click());
          } else {
            console.log('未找到登录按钮');
          }
        } else {
          console.log('未找到用户名密码切换按钮');
        }
      } else {
        console.log('等待用户手动操作');
      }
      let isDone = false;
      while (!isDone) {
        if (!page.url().includes('user/login')) {
          isDone = true;
        }
        await wait();
      }
    } else {
      console.log('已有登录状态，无需重复登录');
    }
  }, 'qyyjt');
  console.log('登录完成');
}
