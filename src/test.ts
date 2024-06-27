// import prisma from './util/prisma.ts';

const downloadCheckPath: string[] = JSON.parse(process.env.SAVE_AND_CHECK_PATH || '[]');

export default async function run(payload: any) {
  console.log(payload);
}
