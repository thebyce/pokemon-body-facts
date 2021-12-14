import axios from 'axios';
import { BodyStat, bodyStatsByType, bodyStatsForIdChunk, bodyStatsForIds, calculateAverage, idsForPage } from './process';

jest.mock('axios');
const mockGet = jest.spyOn(axios, 'get');

afterEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  jest.unmock('axios');
});

describe('idsForPage', () => {
  test('returns ids correctly', async () => {
    mockGet.mockResolvedValueOnce({
      status: 200,
      data: {
        previous: 'p',
        next: 'n',
        results: [
          { name: 'n1', url: 'a/b/c/111/' },
          { name: 'n2', url: 'a/b/c/222/' },
          { name: 'n3', url: 'a/b/c/333/' },
        ],
      },
    });
    expect(await idsForPage(0, 3)).toEqual([111, 222, 333]);
  });
});

describe('bodyStatsFor Ids and Chunks', () => {
  test('one chunk', async () => {
    mockGet
      .mockResolvedValueOnce({
        status: 200,
        data: {
          name: 'n2',
          height: 111,
          weight: 222,
          types: [
            { slot: 1, type: { name: 'bug', url: 'ua' } },
            { slot: 2, type: { name: 'frog', url: 'ub' } },
          ],
        },
      })
      .mockResolvedValueOnce({
        status: 200,
        data: {
          name: 'n3',
          height: 333,
          weight: 444,
          types: [
            { slot: 1, type: { name: 'frog', url: 'u1' } },
            { slot: 2, type: { name: 'horse', url: 'u2' } },
          ],
        },
      });

    expect(await bodyStatsForIdChunk([1, 2])).toEqual([
      { height: 111, name: 'n2', types: ['bug', 'frog'], weight: 222 },
      { height: 333, name: 'n3', types: ['frog', 'horse'], weight: 444 },
    ]);
  });

  test('two chunks', async () => {
    mockGet
      .mockResolvedValueOnce({
        status: 200,
        data: {
          name: 'n1',
          height: 111,
          weight: 222,
          types: [
            { slot: 1, type: { name: 'bug', url: 'u' } },
            { slot: 2, type: { name: 'frog', url: 'u' } },
          ],
        },
      })
      .mockResolvedValueOnce({
        status: 200,
        data: {
          name: 'n2',
          height: 333,
          weight: 444,
          types: [
            { slot: 1, type: { name: 'frog', url: 'u' } },
            { slot: 2, type: { name: 'horse', url: 'u' } },
          ],
        },
      })
      .mockResolvedValueOnce({
        status: 200,
        data: {
          name: 'n3',
          height: 555,
          weight: 666,
          types: [
            { slot: 1, type: { name: 'cat', url: 'u' } },
            { slot: 2, type: { name: 'dog', url: 'u' } },
          ],
        },
      })
      .mockResolvedValueOnce({
        status: 200,
        data: {
          name: 'n4',
          height: 777,
          weight: 888,
          types: [
            { slot: 1, type: { name: 'fish', url: 'u' } },
            { slot: 2, type: { name: 'duck', url: 'u' } },
          ],
        },
      });

    expect(await bodyStatsForIds([1, 2, 3, 4], 2)).toEqual([
      { height: 111, name: 'n1', types: ['bug', 'frog'], weight: 222 },
      { height: 333, name: 'n2', types: ['frog', 'horse'], weight: 444 },
      { height: 555, name: 'n3', types: ['cat', 'dog'], weight: 666 },
      { height: 777, name: 'n4', types: ['fish', 'duck'], weight: 888 },
    ]);
  });
});

describe('bodyStatsByType', () => {
  test('groups single types correctly', () => {
    const mockData: BodyStat[] = [
      { name: 'n1', height: 1, weight: 4, types: ['t1'] },
      { name: 'n2', height: 2, weight: 3, types: ['t2'] },
      { name: 'n3', height: 3, weight: 2, types: ['t1'] },
      { name: 'n4', height: 4, weight: 1, types: ['t2'] },
    ];
    expect(bodyStatsByType(mockData)).toEqual({
      t1: [
        { name: 'n1', height: 1, weight: 4, types: ['t1'] },
        { name: 'n3', height: 3, weight: 2, types: ['t1'] },
      ],
      t2: [
        { name: 'n2', height: 2, weight: 3, types: ['t2'] },
        { name: 'n4', height: 4, weight: 1, types: ['t2'] },
      ],
    });
  });

  test('groups multiple types correctly', () => {
    const mockData: BodyStat[] = [
      { name: 'n1', height: 10, weight: 61, types: ['t1', 't2', 't3'] },
      { name: 'n2', height: 20, weight: 51, types: ['t2', 't3', 't4'] },
      { name: 'n3', height: 30, weight: 41, types: ['t3', 't4', 't5'] },
      { name: 'n4', height: 40, weight: 31, types: ['t4', 't5', 't6'] },
      { name: 'n5', height: 50, weight: 21, types: ['t5', 't6', 't7'] },
      { name: 'n5', height: 60, weight: 11, types: ['t6', 't7', 't8'] },
    ];
    expect(bodyStatsByType(mockData)).toEqual({
      t1: [{ name: 'n1', height: 10, weight: 61, types: ['t1', 't2', 't3'] }],
      t2: [
        { name: 'n1', height: 10, weight: 61, types: ['t1', 't2', 't3'] },
        { name: 'n2', height: 20, weight: 51, types: ['t2', 't3', 't4'] },
      ],
      t3: [
        { name: 'n1', height: 10, weight: 61, types: ['t1', 't2', 't3'] },
        { name: 'n2', height: 20, weight: 51, types: ['t2', 't3', 't4'] },
        { name: 'n3', height: 30, weight: 41, types: ['t3', 't4', 't5'] },
      ],
      t4: [
        { name: 'n2', height: 20, weight: 51, types: ['t2', 't3', 't4'] },
        { name: 'n3', height: 30, weight: 41, types: ['t3', 't4', 't5'] },
        { name: 'n4', height: 40, weight: 31, types: ['t4', 't5', 't6'] },
      ],
      t5: [
        { name: 'n3', height: 30, weight: 41, types: ['t3', 't4', 't5'] },
        { name: 'n4', height: 40, weight: 31, types: ['t4', 't5', 't6'] },
        { name: 'n5', height: 50, weight: 21, types: ['t5', 't6', 't7'] },
      ],
      t6: [
        { name: 'n4', height: 40, weight: 31, types: ['t4', 't5', 't6'] },
        { name: 'n5', height: 50, weight: 21, types: ['t5', 't6', 't7'] },
        { name: 'n5', height: 60, weight: 11, types: ['t6', 't7', 't8'] },
      ],
      t7: [
        { name: 'n5', height: 50, weight: 21, types: ['t5', 't6', 't7'] },
        { name: 'n5', height: 60, weight: 11, types: ['t6', 't7', 't8'] },
      ],
      t8: [{ name: 'n5', height: 60, weight: 11, types: ['t6', 't7', 't8'] }],
    });
  });
});

describe('calculateAverage', () => {
  test('perfect fit', () => {
    const mockData: BodyStat[] = [
      { name: 'n1', height: 1, weight: 2, types: [] },
      { name: 'n2', height: 3, weight: 4, types: [] },
    ];
    expect(calculateAverage(mockData)).toEqual({ heightAve: '2.00', weightAve: '3.00' });
  });

  test('equal values', () => {
    const mockData: BodyStat[] = [
      { name: 'n1', height: 1, weight: 2, types: [] },
      { name: 'n2', height: 1, weight: 2, types: [] },
      { name: 'n3', height: 1, weight: 2, types: [] },
    ];
    expect(calculateAverage(mockData)).toEqual({ heightAve: '1.00', weightAve: '2.00' });
  });

  test('irrational values', () => {
    const mockData: BodyStat[] = [
      { name: 'n1', height: 4, weight: 3, types: [] },
      { name: 'n2', height: 3, weight: 2, types: [] },
      { name: 'n2', height: 3, weight: 2, types: [] },
    ];
    expect(calculateAverage(mockData)).toEqual({ heightAve: '3.33', weightAve: '2.33' });
  });
});
