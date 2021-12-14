import axios from 'axios';
import yargs, { Arguments } from 'yargs';
import { hideBin } from 'yargs/helpers';

export const processArgs = (): { offset: number; limit: number } | undefined => {
  try {
    const { offset, limit } = yargs(hideBin(process.argv)).argv as Arguments;

    return typeof offset === 'number' && offset >= 0 && typeof limit === 'number' && limit > 0 ? { limit, offset } : usage();
  } catch {
    return usage();
  }
};

const usage = (): undefined => {
  console.log(`
  USAGE: pokemon --limit < LIMIT >= 0 > --offset < OFFSET > 0 >
  Where: limit > 0 and offset > 0
  `);
  return undefined;
};

export const axiosGet = async (url: string): Promise<any> => {
  const resp = await axios.get(url);
  if (resp.status !== 200) {
    throw new Error(`Non-200 Response from Pokemon API: ${JSON.stringify(resp)}`);
  }
  return resp.data;
};
