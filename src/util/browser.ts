import { nanoid } from 'nanoid';
import puppeteer, { type Browser as TBrowser, type Page, type PuppeteerLaunchOptions, KnownDevices } from 'puppeteer';
import { pipeline } from './pipeline.ts';
import { noop } from 'lodash-es';
import { wait } from './common.ts';

type SelectReturn = Awaited<ReturnType<Page['$']>>;
type SelectAllReturn = Awaited<ReturnType<Page['$$']>>;

export const iPad = KnownDevices['iPad Pro 11'];
export const iPhone = KnownDevices['iPhone 13 Pro Max'];

class Browser {
  private _browser?: TBrowser;
  private _pageList: Record<string, Page> = {};
  private _initResolve: ((value: boolean) => void)[] = [];
  private _latestUUID: string = '';
  private _idUsedTimeCount: Record<string, number> = {};
  device = iPad;
  constructor(proxy = false, show = process.env.SHOW_BROWSER === 'true') {
    // 无头模式，即不显示浏览器界面
    const option: PuppeteerLaunchOptions = {
      headless: show ? false : 'new',
      userDataDir: process.env.USER_TEMP_DATA_DIR
    };
    if (proxy || process.env.FORCE_USE_PROXY !== 'false') {
      option.args = [`--proxy-server=${process.env.PROXY}`];
    }
    puppeteer.launch(option).then((browser) => {
      this._browser = browser;
      if (this._initResolve.length) {
        while (this._initResolve.length) {
          const resolve = this._initResolve.pop();
          if (resolve) resolve(true);
        }
      }
    });
  }
  private _waitInit() {
    return new Promise<boolean>((resolve) => {
      if (this._browser) {
        resolve(true);
      } else {
        this._initResolve.push(resolve);
      }
    });
  }
  async visit(
    uuid: string,
    url: string,
    size = { width: 1920, height: 1080 },
    initCallback: (page: Page) => void = noop,
    gotoOptions?: puppeteer.GoToOptions
  ) {
    await this.visitInternal(uuid, url, size, initCallback, gotoOptions);
    this._latestUUID = uuid;
    return this;
  }
  private async autoReload3Times(uuid: string, url: string, gotoOptions: any, errorTimes = 0) {
    try {
      this._idUsedTimeCount[uuid]++;
      await this._pageList[uuid].goto(url, gotoOptions);
    } catch (error) {
      // console.log(`加载页面“${uuid}”失败${errorTimes + 1}次`);
      if (errorTimes < 3) {
        await this.autoReload3Times(uuid, url, gotoOptions, errorTimes++);
      } else {
        delete this._pageList[uuid];
        delete this._idUsedTimeCount[uuid];
        // console.log(`页面“${uuid}”尝试多次失败，停止继续`);
      }
    }
  }
  private async visitInternal(
    uuid: string,
    url: string,
    size = { width: 1920, height: 1080 },
    initCallback: (page: Page) => void,
    gotoOptions?: puppeteer.GoToOptions
  ) {
    await this._waitInit();
    if (!uuid) throw new Error('uuid is required when visit a page');
    // 单个页面使用次数太多有内存泄漏问题，超过使用次数自动重启页签
    if (this._idUsedTimeCount[uuid] > 29) {
      if (this._pageList[uuid]) {
        await this._pageList[uuid].close();
        delete this._pageList[uuid];
      }
      delete this._idUsedTimeCount[uuid];
    }
    if (!this._pageList[uuid]) {
      const page = await this._browser!.newPage();
      await initCallback(page);
      this._idUsedTimeCount[uuid] = 0;
      this._pageList[uuid] = page;
      await page.emulate(this.device);
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.157 Safari/537.36'
      );
      await page.evaluateOnNewDocument(() => {
        // @ts-ignore
        delete navigator.__proto__.webdriver;
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en']
        });
        Object.defineProperty(navigator, 'platform', {
          get: () => 'Linux armxxxxx',
          configurable: true
        });
        // @ts-ignore
        window.chrome = {
          app: {},
          runtime: {},
          getUserMedia: {}
        };
      });
      await page.setViewport({
        width: size.width,
        height: size.height,
        deviceScaleFactor: 1
      });
    }
    if (url) {
      await this.autoReload3Times(uuid, url, gotoOptions);
    }
    return this._pageList[uuid];
  }
  async do(fn: (page: Page) => Promise<any>, uuid?: string) {
    if (!uuid) uuid = this._latestUUID;
    if (!uuid) throw new Error('do handle uuid is not specified');
    if (this._pageList[uuid]) {
      await fn(this._pageList[uuid]);
    } else {
      console.log(uuid, 'uuid not found');
    }
    await wait(800 * Math.random());
    return this;
  }
  select<A extends Record<string, string>, S extends Record<string, string>>(
    selectorConfig: {
      all?: A;
      single?: S;
    },
    uuid?: string
  ) {
    if (!uuid) uuid = this._latestUUID;
    if (!uuid) throw new Error('select handle uuid is not specified');
    if (this._pageList[uuid]) {
      const page = this._pageList[uuid];
      return pipeline({ page, selectorConfig }).next(async (data) => {
        const { all, single } = data.selectorConfig;
        const ret: Record<string, any> = {};
        if (all) {
          for (const key in all) {
            if (Object.prototype.hasOwnProperty.call(all, key)) {
              const selector = all[key];
              ret[key] = await page.$$(selector);
            }
          }
        }
        if (single) {
          for (const key in single) {
            if (Object.prototype.hasOwnProperty.call(single, key)) {
              const selector = single[key];
              ret[key] = await page.$(selector);
            }
          }
        }
        return ret as Partial<Record<keyof S, SelectReturn> & Record<keyof A, SelectAllReturn>>;
      });
    } else {
      console.log(`page "${uuid}" not found`);
    }
  }

  async done(uuid?: string) {
    if (!uuid) uuid = this._latestUUID;
    this._latestUUID = '';
    if (this._pageList[uuid]) {
      await this._pageList[uuid].close();
      delete this._pageList[uuid];
      delete this._idUsedTimeCount[uuid];
    }
  }
  async clear() {
    for (const uuid in this._pageList) {
      await this._pageList[uuid].close();
      delete this._pageList[uuid];
      delete this._idUsedTimeCount[uuid];
    }
  }
  async close() {
    await this._waitInit();
    this._browser!.close();
  }

  async downloadImage(url: string, fileSavePath: string, width = 125, height = 125, id: string = '', autoClose = true) {
    if (!id) {
      id = nanoid();
    }
    await this._waitInit();
    const page = await this.visitInternal(id, url, { width, height }, noop, { waitUntil: 'networkidle0' });
    if (page) {
      await page.setViewport({ width, height });
      await page.screenshot({ path: fileSavePath, fullPage: true });
      if (autoClose) {
        await this.done(id);
      }
    }
  }
  async input(str: string, uuid?: string) {
    if (!uuid) uuid = this._latestUUID;
    const page = this._pageList[uuid];
    if (page) {
      for (let index = 0; index < str.length; index++) {
        const char = str[index];
        await wait(500 * Math.random());
        await page.keyboard.press(char as any);
      }
    }
  }
  async scrollEnd(checkScrollEnd: () => Promise<boolean>, uuid?: string) {
    if (!uuid) uuid = this._latestUUID;
    const page = this._pageList[uuid];
    if (page) {
      let preventInfinityLoop = 300;
      while (!(await checkScrollEnd()) && preventInfinityLoop--) {
        await page.mouse.wheel({
          deltaY: 280 + Math.random() * 25
        });
        await wait(200 + Math.random() * 600);
      }
    }
  }
}

export default Browser;
