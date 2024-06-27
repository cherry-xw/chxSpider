import mri from 'mri';
import chalk from 'chalk';
import '@/configInit.ts';
import '@/util/prisma.ts';
import runTest from './test.ts';

const argv = process.argv.slice(2);

const payload = mri<Payload>(argv, {
  alias: {
    w: 'website',
    t: 'thread',
    a: 'archived',
    s: 'statistics'
  }
});

switch (payload.website) {
  case 'qyyjt':
    break;
  case 'test':
    runTest(payload);
    break;
  default:
    console.log(chalk.red('Invalid website'));
    process.exit(1);
}
