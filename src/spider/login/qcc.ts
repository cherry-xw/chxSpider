import Browser from '@/util/browser.ts';
import { wait, waitRandom } from '@/util/common.ts';

export default async function qccLogin(browser: Browser, mode: AutoLogin['mode'], data: AutoLogin['input']) {
  console.log((mode === 'auto' ? '自动' : '手动') + '登录：企查查');
  await browser.visit('qcc', 'https://www.qcc.com/');
  await waitRandom(2500);
  await browser.do(async (page) => {
    const loginDialog = await page.$('#loginModal');
    if (!loginDialog) {
      console.log('已有登录状态，无需重复登录');
      return;
    }
    if (mode !== 'auto') {
      return;
    }
    const switchPwdLoginBtn = await loginDialog.$('div.login-change > img');
    if (!switchPwdLoginBtn) {
      console.log('未找到密码登录按钮');
      return;
    }
    await switchPwdLoginBtn.evaluate((el) => el.click());
    await waitRandom(1500);
    const pwdLoginTabBtn = await loginDialog.$('.login-panel-head > .login-tab:last-child > a');
    if (!pwdLoginTabBtn) {
      console.log('未找到密码登录按钮');
      return;
    }
    await pwdLoginTabBtn.evaluate((el) => el.click());
    await page.focus(".password-login_wrapper input[name='phone-number']");
    await browser.input(data!.userName, 'qcc');
    await waitRandom();
    await page.focus(".password-login_wrapper input[name='password']");
    await browser.input(data!.password, 'qcc');
    const loginBtn = await loginDialog.$('.password-login_wrapper button.login-btn');
    if (!loginBtn) {
      console.log('未找到登录按钮');
      return;
    }
    await loginBtn.evaluate((el) => el.click());
  }, 'qcc');
  console.log('登录完成');
}
