import Browser, { iPad, iPhone } from '@/util/browser.ts';
import { defaults } from 'lodash-es';

const deviceMap = { iPad, iPhone };

/**
 * 初始化浏览器
 * @param userConfig 用户配置 proxy: 是否使用代理，show: 是否显示浏览器 device: 模拟设备类型 iPad | iPhone
 * @returns 浏览器实例
 */
export default function init(
  userConfig: Partial<{
    proxy: boolean;
    show: boolean;
    device: 'iPad' | 'iPhone';
  }> = {}
) {
  const config = defaults({ proxy: false, show: process.env.SHOW_BROWSER === 'true', device: 'iPad' }, userConfig);
  const browser = new Browser(config.proxy, config.show);
  browser.device = deviceMap[config.device];
  return browser;
}
