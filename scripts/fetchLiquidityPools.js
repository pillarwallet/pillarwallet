// @flow
/* eslint-disable no-console */
/* eslint-disable i18next/no-literal-string */
/* eslint-disable import/no-extraneous-dependencies */

const fetch = require('node-fetch');

const query = `
  {
    pairs(
      first: 20,
      orderBy: volumeUSD, 
      orderDirection: desc,
    ) {
      id
      token0 {
        id
        name
        symbol
      }
      token1 {
        id
        name
        symbol
      }
      volumeUSD
      reserveUSD
    }
  }
`;

const mapSymbol = (str) => str === 'WETH' ? 'ETH' : str;

const fetchData = async () => {
  const response = await fetch(
    'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2',
    {
      method: 'POST',
      body: JSON.stringify({
        query,
      }),
    },
  );

  return response.json();
};

const main = async () => {
  console.log('🔵 Uniswap-v2 GraphQL Query 🔵', query);

  try {
    const data = await fetchData();
    const { pairs } = data.data;

    pairs.forEach(pair => {
      const symbol0 = mapSymbol(pair.token0.symbol);
      const symbol1 = mapSymbol(pair.token1.symbol);

      console.log(
        `     {
        name: 'Uniswap v2 ${symbol0}/${symbol1}',
        type: LIQUIDITY_POOL_TYPES.UNISWAP,
        symbol: '${symbol0.toUpperCase()}-${symbol1.toUpperCase()} UNI-V2',
        tokensProportions: [
          { symbol: '${symbol0}', proportion: 0.5 },
          { symbol: '${symbol1}', proportion: 0.5 },
        ],
        uniswapPairAddress: '${pair.id}',
        iconUrl: '',
      },`,
      );
    });
  } catch (error) {
    console.error('🔴 Script Error 🔴', error);
  }
};

main();
