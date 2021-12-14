import { exit } from 'process';
import { processPokemonQuery } from './process';
import { processArgs } from './utils';

const args = processArgs();
if (!args) exit(1);

const { offset, limit } = args;

try {
  (async () => {
    const { executionSeconds } = await processPokemonQuery(offset, limit);
    console.log(`
  EXECUTION TIME = ${executionSeconds}s\n`);
  })();
} catch (err) {
  console.log(`Something Went Wrong: MSG = \n${JSON.stringify(err)}\n\n`);
}
