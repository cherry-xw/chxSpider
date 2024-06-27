import fs from 'node:fs';
import path from 'node:path';
import { exec as exxcCallback } from 'node:child_process';
import { promisify } from 'node:util';
import chalk from 'chalk';
import { type Lower, type Upper, getFullPath, getWinDriveLetter } from './path.ts';
import { stat } from 'fs/promises';

const exec = promisify(exxcCallback);

/**
 * 移动文件
 * @param file 文件名
 * @param dirFrom 路径
 * @param dirTo 路径
 */
export function mv(file: string, dirFrom: string, dirTo: string) {
  fs.renameSync(path.join(dirFrom, file), path.join(dirTo, file));
}
function m3u8CMD(url: string, dir: string, filename: string, proxy = false, suffix: string = '') {
  const m3u8DLL = process.env.DOWNLOADER_DLL_PATH;
  return `${m3u8DLL} "${url}" --workDir "${dir}" --saveName "${filename}" ${
    proxy ? `--proxyAddress '${process.env.PROXY}'` : ''
  } ${suffix} --enableDelAfterDone\n`;
}

function ariaCMD(url: string, dir: string, filename: string, suffix: string) {
  const ariaDLL = getFullPath(process.env.ARIA_DLL_PATH || '');
  return `${ariaDLL} -c -x 8 -d "${dir}" -o "${filename}.${suffix}" "${url}"\n`;
}

function mklinkCMD(target: string, source: string) {
  return `mklink /H "${target}" "${source}"`;
}

const suffixReg = /.+\.([A-z]{2-4})$/;
/**
 * 下载文件
 * @param param 下载参数
 * @returns 下载状态
 */
export async function downloadExec(
  param: {
    downloader: 'm3u8' | 'aria2';
    url: string;
    dir: string;
    filename: string;
    proxy?: boolean;
    suffix?: string;
  } & Record<string, any>
) {
  if (param.downloader === 'm3u8') {
    const res = await exec('start ' + m3u8CMD(param.url, param.dir, param.filename, param.proxy, param.suffix));
    if (res.stderr) {
      throw new Error(res.stderr);
    } else {
      return res.stdout;
    }
  } else if (param.downloader === 'aria2') {
    let suffix = param.suffix || 'unknow';
    if (suffixReg.test(param.url)) {
      suffix = param.url.replace(suffixReg, '$1');
    }
    const res = await exec('start ' + ariaCMD(param.url, param.dir, param.filename, suffix));
    if (res.stderr) {
      throw new Error(res.stderr);
    } else {
      return res.stdout;
    }
  } else {
    console.log(chalk.bgRed.black('未知工具'));
    process.exit(1);
  }
}

// 将字节格式化为更易读的形式
function formatBytes(bytes: number) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Byte';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)) + '');
  return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
}

/**
 * 获取Windows硬盘数据
 * @param diskname 硬盘盘符
 */
export async function windiskusageHandle(diskname: Lower | Upper): Promise<
  | {
      letter: string;
      desc: string;
      type: string;
      free: string;
      freeByte: number;
      total: string;
      totalByte: number;
    }
  | undefined
> {
  const data = await exec(`wmic logicaldisk get caption, description, drivetype, freespace, size`, {
    encoding: 'buffer'
  });
  if (!data.stderr || data.stderr.length) {
    return undefined;
  }
  const str = new TextDecoder('gb2312').decode(data.stdout);
  const lines = str.split(/\r?\n/);
  lines.shift();
  const diskStr = diskname.toUpperCase() + ':';
  const result = lines
    .map((line) => {
      const data = line.split(/\s+/);
      if (data[0] === diskStr)
        return {
          letter: getWinDriveLetter(data[0])!,
          desc: data[1],
          type: data[2],
          free: formatBytes(parseInt(data[3])),
          freeByte: parseInt(data[3]),
          total: formatBytes(parseInt(data[4])),
          totalByte: parseInt(data[4])
        };
    })
    .filter(Boolean);
  if (result.length) return result[0];
  else return undefined;
}

/**
 * 移动文件
 * @param file 文件名
 * @param fromPath 文件所在文件夹
 * @param toPath 文件移动到的文件夹
 */
export async function moveOrdelFile(filename: string, fromPath: string, toPath: string) {
  const fromFileWithPath = getFullPath(fromPath, filename);
  const toFileWithPath = getFullPath(toPath, filename);
  try {
    const info = await stat(toFileWithPath);
    if (info.isFile()) {
      // const data = await exec(`del "${fromFileWithPath}"`);
      console.log('\n删除文件', fromFileWithPath);
      return '';
    }
  } catch (error) {
    // pass
  }
  const data = await exec(`move "${fromFileWithPath}" "${toPath}"`);
  if (data.stderr) {
    throw new Error(data.stderr);
  } else {
    return data.stdout;
  }
}

/**
 * 拷贝文件
 * @param fromFileWithPath 文件全路径
 * @param toFileWithPath 文件拷贝到的文件夹(可携带文件名称)
 */
export async function copyFile(fromFileWithPath: string, toFileWithPath: string) {
  const data = await exec(`copy "${fromFileWithPath}" "${toFileWithPath}"`);
  if (data.stderr) {
    throw new Error(data.stderr);
  } else {
    return data.stdout;
  }
}

/**
 * 创建硬链接（必须是管理员启动）
 * @param target 目标文件全链接
 * @param source 源文件全链接
 * @returns 操作输出结果
 */
export async function hardLink(target: string, source: string) {
  const command = mklinkCMD(target, source);
  const data = await exec(command);
  if (data.stderr) {
    throw new Error(data.stderr);
  } else {
    return data.stdout;
  }
}
