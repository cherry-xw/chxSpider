import dayjs from 'dayjs';
import { writeFile } from './common.ts';

type CollectData = {
  name: string;
  info: string;
  data?: any;
};
export type CollectOrSave = ((data: CollectData) => void) & { check: () => boolean; save: () => string };

export default function errorCollectCreator(fileName = '', suffix: `.${string}` = '.txt') {
  let list: CollectData[] = [];
  /**
   *
   * @param data 收集数据 不传为存储数据
   */
  function collectOrSave(data: CollectData) {
    if (data) {
      list.push(data);
    }
  }
  /**
   * 检查是否存在错误日志
   * @returns 是否有错误日志
   */
  collectOrSave.check = () => Boolean(list.length);
  collectOrSave.save = (part = '') => {
    const fn = fileName + (part ? '-' + part : '') + dayjs().format('-YYYY-MM-DD_HH-mm-ss');
    if (list.length) {
      writeFile(fn, JSON.stringify(list, null, 2), suffix);
      list = [];
    }
    return fn;
  };
  return collectOrSave as CollectOrSave;
}
