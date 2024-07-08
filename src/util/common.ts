import { type Argv } from 'mri';
import Browser from '@/util/browser.ts';
import path from 'path';
import fs from 'fs';
import { checkAndCreatePath } from './path.ts';
import readline from 'readline';
import chalk from 'chalk';
import dayjs from 'dayjs';
import { defaults } from 'lodash-es';

/**
 * 异步等待
 * @param time 等待毫秒数 默认1000
 * @returns void
 */
export function wait(time: number = 1000) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

/**
 * 异步等待
 * @param time 随机抖动毫秒下限 默认1000
 * @param noice 随机抖动毫秒数上限 默认500
 * @returns void
 */
export function waitRandom(time: number = 1000, noice: number = 500) {
  return new Promise((resolve) => setTimeout(resolve, time + Math.random() * noice));
}

type MultiEventCtrlOptions<T, V> = {
  fourceStopCheck: (taskListOrigin: T) => Promise<boolean> | boolean;
  whichNext: (taskListOrigin: T, executingTask: V[]) => number;
  thread: number;
  showLog: boolean;
};
/**
 * 多线程处理任务列表
 * @param taskOriginList 待处理任务数组
 * @param taskWrapper 任务包装函数，返回值包含key和已经执行的异步task，注意，包装函数本身不异步，所有异步操作包装到task返回中执行
 * @param options 配置项
 * @param options.fourceStopCheck 在任意一个任务执行结束后判断是否需要强制中断任务,true中断，false不中断
 * @param options.whichNext 下一个任务在待处理数组中的位置，该索引如果取不到值，任务将单线程运行
 * @param options.thread 任务线程数
 * @param options.showLog 是否显示调试日志
 */
export async function MultiEventCtrl<T extends Array<any>, V extends { key: string; task: Promise<string> }>(
  taskOriginList: T,
  taskWrapper: (param: T[0]) => V,
  options: Partial<MultiEventCtrlOptions<T, V>> = {}
) {
  const defaultOption: MultiEventCtrlOptions<T, V> = {
    fourceStopCheck: () => false,
    whichNext: () => 0,
    thread: 3,
    showLog: false
  };

  const { fourceStopCheck, thread, showLog, whichNext } = defaults(options, defaultOption);
  if (showLog) console.log(`\n线程数量：${thread}`);
  const taskExecList: V[] = [];
  if (await fourceStopCheck(taskOriginList)) {
    if (showLog) console.log(`\n任务强制中断`);
    return;
  }
  let isSingleThreadRun = thread === 1;
  let stopLoop = 0;
  const maxLoop = taskOriginList.length * 3 + 50;
  while (taskOriginList.length && stopLoop++ < maxLoop) {
    // console.log(taskOriginList.length, stopLoop, maxLoop);

    if (taskExecList.length >= thread || (isSingleThreadRun && taskExecList.length)) {
      const str = await Promise.any(taskExecList.map((el) => el.task));
      const idx = taskExecList.findIndex((el) => el.key === str);
      if (showLog) console.log(`\n完成任务：${str}`);
      if (idx !== -1) {
        taskExecList.splice(idx, 1);
      } else {
        if (showLog) console.log(`\n完成任务列表中找不到任务：${str}`);
      }
    } else {
      const nextIndex = whichNext(taskOriginList, taskExecList);
      if (nextIndex < 0 || !taskOriginList[nextIndex]) {
        if (taskOriginList.length) {
          if (!taskExecList.length) {
            const task = taskWrapper(taskOriginList.pop());
            if (showLog) console.log(`\n启动任务2：${task.key}`);
            taskExecList.push(task);
          }
          isSingleThreadRun = true;
        } else {
          break;
        }
      } else {
        const data = taskOriginList.splice(nextIndex, 1);
        if (data.length) {
          const task = taskWrapper(data[0]);
          if (showLog) console.log(`\n启动任务1：${task.key}`);
          isSingleThreadRun = false;
          taskExecList.push(task);
        }
      }
    }
    if (await fourceStopCheck(taskOriginList)) {
      if (showLog) console.log(`\n任务强制中断`);
      return;
    }
  }
  if (taskExecList.length) {
    if (showLog) console.log(`\n剩余最后${taskExecList.length}个任务`);
    await Promise.all(taskExecList.map((el) => el.task));
    if (showLog) console.log(`\n所有任务完成`);
  }
}

export function writeFile(name: string, data: string, suffix = '.txt') {
  const configDir = checkAndCreatePath(process.env.LOG_MESSAGE_DIR);
  const file = path.resolve(configDir, `${name}${suffix}`);
  // 异步写入数据到文件
  fs.writeFileSync(file, data, { encoding: 'utf8', flag: 'a' });
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
export function ask(question: string) {
  return new Promise<string>((resolve) => {
    rl.question(question, resolve);
  });
}

function pad(num: number) {
  return (num + '').padStart(2, '0');
}
export function getDeltaTimeFormat(timeDot: number) {
  const timeSecondDelta = parseInt((Date.now() - timeDot) / 1000 + '');
  const ss = timeSecondDelta % 60;
  const timeMinutesDelta = (timeSecondDelta - ss) / 60;
  const mm = timeMinutesDelta % 60;
  const HH = (timeMinutesDelta - mm) / 60;
  return `${pad(HH)}:${pad(mm)}:${pad(ss)}`;
}

export function runInterval(fn: (doneFn: () => void) => void, time: number) {
  return new Promise((resolve) => {
    let iid: any = -1;
    function done() {
      clearInterval(iid);
      resolve(true);
    }
    iid = setInterval(async () => {
      await fn(done);
    }, time);
  });
}
