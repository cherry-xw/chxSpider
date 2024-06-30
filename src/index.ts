import mri from 'mri';
import chalk from 'chalk';
import '@/configInit.ts';
import '@/util/prisma.ts';
import runTest from './test.ts';
import runSpiser from './spider/index.ts';
import spiderConfig from './spider.config.ts';

const argv = process.argv.slice(2);

const payload = mri<Payload>(argv, {
  alias: {
    m: 'mode'
  }
});

switch (payload.mode) {
  case 'config':
    runSpiser(spiderConfig);
    break;
  case 'test':
    runTest(payload);
    break;
  default:
    console.log(chalk.red('Invalid mode'));
    process.exit(1);
}
