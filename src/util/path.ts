import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { windiskusageHandle } from './cmd.ts';
import { readdir } from 'fs/promises';

export const dirname = (url: string) => path.dirname(fileURLToPath(url));

export const dirpath = () => path.resolve();

export function getFullPath(pathStr: string, ...restPathStr: string[]) {
  if (pathStr.startsWith('.')) {
    pathStr = path.resolve(dirpath(), pathStr, ...restPathStr);
  } else if (restPathStr.length) {
    pathStr = path.resolve(pathStr, ...restPathStr);
  }
  return pathStr;
}

export function readDirSync(pathStr: string) {
  const fullPathStr = getFullPath(pathStr);
  const data = fs.readdirSync(fullPathStr, { withFileTypes: true });
  return data;
}

export async function readDir(pathStr: string, ...restPathStr: string[]) {
  const fullPathStr = getFullPath(pathStr, ...restPathStr);
  const data = await readdir(fullPathStr, { withFileTypes: true });
  return data;
}

/**
 * 根据相对或绝对路径多个字符串生成完整路径
 * @param pathStr 路径字符串
 * @param restPathStr 剩余路径
 * @returns 完整路径
 */
export function checkAndCreatePath(pathStr: string, ...restPathStr: string[]) {
  pathStr = getFullPath(pathStr, ...restPathStr);
  // console.log(pathStr);
  // 检查路径是否存在，如果不存在则创建
  if (!fs.existsSync(pathStr)) {
    fs.mkdirSync(pathStr, { recursive: true });
    // console.log(`创建路径：${pathStr}`);
  }
  return pathStr;
}

export type Lower =
  | 'a'
  | 'b'
  | 'c'
  | 'd'
  | 'e'
  | 'f'
  | 'g'
  | 'h'
  | 'i'
  | 'j'
  | 'k'
  | 'l'
  | 'm'
  | 'n'
  | 'o'
  | 'p'
  | 'q'
  | 'r'
  | 's'
  | 't'
  | 'u'
  | 'v'
  | 'w'
  | 'x'
  | 'y'
  | 'z';
export type Upper =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J'
  | 'K'
  | 'L'
  | 'M'
  | 'N'
  | 'O'
  | 'P'
  | 'Q'
  | 'R'
  | 'S'
  | 'T'
  | 'U'
  | 'V'
  | 'W'
  | 'X'
  | 'Y'
  | 'Z';

export const winDiskDriveLetterExp = /^([A-z]):?.*$/;
export function getWinDriveLetter(dirPath: string) {
  const fullPath = getFullPath(dirPath);
  if (winDiskDriveLetterExp.test(fullPath)) {
    const driveLetter = fullPath.replace(winDiskDriveLetterExp, '$1') as Lower | Upper;
    return driveLetter;
  }
}

/**
 * 获取硬盘数据
 * @param dirPath 硬盘路径
 */
export async function diskusage(dirPath: string): ReturnType<typeof windiskusageHandle> {
  let driveLetter: Upper | Lower | undefined;
  if (/[:/\\]/.test(dirPath)) {
    driveLetter = getWinDriveLetter(dirPath);
  } else if (/^[A-z]+$/.test(dirPath)) {
    driveLetter = dirPath as Upper | Lower;
  }
  if (driveLetter) {
    return await windiskusageHandle(driveLetter);
  }
}
export type DiskInfo = NonNullable<Awaited<ReturnType<typeof diskusage>>>;
