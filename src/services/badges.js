// @flow
import { Contract, providers } from 'ethers';
// import { NETWORK_PROVIDER } from 'react-native-dotenv';
import { BADGES_CONTRACT_ADDRESS } from 'react-native-dotenv';
import badgesAbi from 'abi/badges.json';
import type { UserBadgesResponse } from 'models/Badge';

export function fetchBadges(walletAddress: string): Promise<UserBadgesResponse> {
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
