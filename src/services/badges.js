// @flow
import { Contract } from 'ethers';
import { BADGES_CONTRACT_ADDRESS, NETWORK_PROVIDER } from 'react-native-dotenv';
import badgesAbi from 'abi/badges.json';
import type { UserBadgesResponse } from 'models/Badge';
import { getEthereumProvider } from 'utils/common';

export function fetchBadges(walletAddress: string): Promise<UserBadgesResponse> {
  const provider = getEthereumProvider(NETWORK_PROVIDER);
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
