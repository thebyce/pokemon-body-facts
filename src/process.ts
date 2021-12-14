import { axiosGet } from './utils';

const POKEMON_BASE_URL = 'https://pokeapi.co/api/v2/pokemon';
const CHUNK_SIZE = 40;

export type BodyStat = { name: string; height: number; weight: number; types: string[] };
export type TypedBodyStat = { [pokemanType: string]: BodyStat[] };

export const processPokemonQuery = async (offset: number, limit: number): Promise<{ executionSeconds: number }> => {
  const start = Date.now();

  const pokemonIds = await idsForPage(offset, limit);
  const bodyStats = await bodyStatsForIds(pokemonIds, CHUNK_SIZE);
  if (bodyStats.length) {
    reportOverallAverages(bodyStats);
    reportAvergesByType(bodyStats);
  } else {
    console.log(`There is no Pokémon data for the requested page: OFFSET=${offset}, LIMIT=${limit}`);
  }
  return { executionSeconds: (Date.now() - start) / 1000 };
};

export const idsForPage = async (offset: number, limit: number): Promise<number[]> => {
  const url = `${POKEMON_BASE_URL}?offset=${offset}&limit=${limit}`;
  const { results } = await axiosGet(url);

  return results.map((r: { name: string; url: string }) => {
    const slugs = r.url.split('/');
    return parseInt(slugs[slugs.length - 2]);
  });
};

export const bodyStatsForIds = async (ids: number[], chunkSize: number): Promise<BodyStat[]> => {
  let chunkStart = 0;
  let chunk = 1;
  let totalChunks = Math.ceil(ids.length / chunkSize);
  let bodyStats: BodyStat[] = [];

  while (chunkStart < ids.length) {
    if (totalChunks > 1) console.log(`Fetching Chunk ${chunk} of ${totalChunks}`);
    const chunkIds = ids.slice(chunkStart, chunkSize * chunk++);
    bodyStats.push(...(await bodyStatsForIdChunk(chunkIds)));
    chunkStart += chunkSize;
  }
  return bodyStats;
};

export const bodyStatsForIdChunk = async (ids: number[]): Promise<BodyStat[]> => {
  const buildUrlForId = (id: number) => `${POKEMON_BASE_URL}/${id}`;
  const bodyStatRawData = await Promise.all(ids.map((id) => axiosGet(buildUrlForId(id))));

  return bodyStatRawData.reduce((acc, curr) => {
    const types = curr.types.map((t: { type: { name: string } }) => t.type.name);
    return [...acc, { name: curr.name, height: curr.height, weight: curr.weight, types }];
  }, [] as BodyStat[]);
};

const reportOverallAverages = (bodyStats: BodyStat[]) => {
  const { heightAve, weightAve } = calculateAverage(bodyStats);
  console.log(`
  AGGREGATE AVERAGES (${bodyStats.length} individual Pokémons):
  Height:  ${heightAve}
  Weight: ${weightAve}
  `);
};

const reportAvergesByType = (bodyStats: BodyStat[]) => {
  const typedBodyStats = bodyStatsByType(bodyStats);

  console.log(`
  AVERAGES BY TYPE:
  ====================================
  TYPE: HEIGHT / WEIGHT`);
  Object.keys(typedBodyStats).forEach((tc) => {
    const { heightAve, weightAve } = calculateAverage(typedBodyStats[tc]);
    console.log(`  ${tc}: ${heightAve} / ${weightAve}`);
  });
};

export const bodyStatsByType = (bodyStats: BodyStat[]): TypedBodyStat => {
  const typeCollector: TypedBodyStat = {};
  bodyStats.forEach((bStat) => {
    bStat.types.forEach((bType) => {
      if (!typeCollector[bType]) typeCollector[bType] = [];
      typeCollector[bType].push(bStat);
    });
  });

  return typeCollector;
};

export const calculateAverage = (bodyStats: BodyStat[]): { heightAve: string; weightAve: string } => {
  return {
    heightAve: (bodyStats.reduce((acc, curr) => acc + curr.height, 0) / bodyStats.length).toFixed(2),
    weightAve: (bodyStats.reduce((acc, curr) => acc + curr.weight, 0) / bodyStats.length).toFixed(2),
  };
};
