import { processArgs } from './utils';

describe('processArgs', () => {
  test('no args returns undefined', () => {
    process.argv = ['bin', 'exec'];
    expect(processArgs()).toBeUndefined();
  });

  test('valid space-delimited args returns valid offset and limit', () => {
    process.argv = ['bin', 'exec', '--limit', '123', '--offset', '456'];
    expect(processArgs()).toEqual({ offset: 456, limit: 123 });
  });

  test('valid equal-sign-delimited args returns valid offset and limit', () => {
    process.argv = ['bin', 'exec', '--limit=123', '--offset=456'];
    expect(processArgs()).toEqual({ offset: 456, limit: 123 });
  });

  test('non-numeric arg returns undefined', () => {
    process.argv = ['bin', 'exec', '--limit=BadBoy', '--offset=456'];
    expect(processArgs()).toBeUndefined();
  });

  test('negative arg returns undefined', () => {
    process.argv = ['bin', 'exec', '--limit=-10', '--offset=456'];
    expect(processArgs()).toBeUndefined();
  });
});
