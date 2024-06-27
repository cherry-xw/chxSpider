import chalk from 'chalk';
import dotenv from 'dotenv';
import path from 'path';
import { dirname } from '@/util/path.ts';

if (!process.env.NODE_ENV) {
  console.log(chalk.red('NODE_ENV is not set'));
  process.exit(1);
}

const config = dotenv.config({
  path: path.resolve(dirname(import.meta.url), `../.env.${process.env.NODE_ENV}`)
});
if (!config.parsed) {
  console.log(chalk.red(`Failed to load .env."${process.env.NODE_ENV}" file`));
  process.exit(1);
}
