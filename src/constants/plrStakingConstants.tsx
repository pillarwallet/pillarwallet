import { CHAIN } from './chainConstantsTs';

export const MIN_PLR_STAKE_AMOUNT = 10000;
export const MAX_PLR_STAKE_AMOUNT = 250000;

export const STAKING_CONTRACT_ADDRESS = '0xdf5cFefc1CE077Fc468E3CFF130f955421D9B95a'; // Will need to be replaced by the contract deployed on mainnet
export const STAKING_CONTRACT_ADDRESS_TESTNET = '0x0E6A112aEfD61b930490a21566F626c4f6c1B511';

export const PLR_ICON_URL =
  'https://images.prismic.io/pillar-app/83dcf8ff-6459-41d4-8d43-7ec143814b2d_pillar-logo-5.png?auto=compress,format';

export enum WalletType {
  ETHERSPOT = 'ETHERSPOT',
  KEYBASED = 'KEYBASED',
  ARCHANOVA = 'ARCAHNOVA',
}

export const plrSupportedChains = [CHAIN.ETHEREUM, CHAIN.POLYGON, CHAIN.BINANCE];

export const stkPlrToken = {
  chain: CHAIN.ETHEREUM,
  address: '',
  name: 'Staked PLR',
  symbol: 'stkPLR',
  decimals: 18,
  iconUrl: PLR_ICON_URL,
};
