// @flow
import { Contract, providers } from 'ethers';
import { NETWORK_PROVIDER } from 'react-native-dotenv';
import badgesAbi from 'abi/badges.json';

const PROVIDER = NETWORK_PROVIDER;
const BADGES_CONTRACT_ADDRESS = '0x2Fa66b2F4d2dEcA83975E0196E202a0e61833D3a';

export function fetchBadges(walletAddress: string) {
  const provider = new providers.JsonRpcProvider();
  const contract = new Contract(BADGES_CONTRACT_ADDRESS, badgesAbi, provider);
  return contract.tokensOwned(walletAddress).then(data => {
    const indexes = data.indexes.map(bgNumber => bgNumber.toNumber());
    const balances = data.balances.map(bgNumber => bgNumber.toNumber());

    const badges = indexes.reduce((memo, badgeId, i) => {
      memo[badgeId] = balances[i];
      return memo;
    }, {});

    return badges;
  });
}
