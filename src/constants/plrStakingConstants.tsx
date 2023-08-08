import { CHAIN } from './chainConstantsTs';

export const STAKING_PERIOD = 10; // staking period in days
export const STAKING_LOCKED_PERIOD = 52 * 7; // staked period in days

export const MIN_PLR_STAKE_AMOUNT = 10;
export const MAX_PLR_STAKE_AMOUNT = 250;

export const STAKING_CONTRACT_ADDRESS = '0x3cf07383654c2569867F02098774eddEEea86573'; // Will need to be replaced by the contract deployed on mainnet
export const STAKING_CONTRACT_ADDRESS_TESTNET = '0x3cf07383654c2569867F02098774eddEEea86573';

export const STAKING_TOKEN_ADDRESS = '0x0DC0f405Fb0a716E9C5A412cD2b6f0698Dc87210';
export const STAKED_TOKEN_ADDRESS = '0x58F4CC4C150E5Ee5d39C77D72f712da69a5d8A21';

export const PLR_ICON_URL =
  'https://images.prismic.io/pillar-app/83dcf8ff-6459-41d4-8d43-7ec143814b2d_pillar-logo-5.png?auto=compress,format';

export const STAKING_APY_ENDPOINT = 'https://beacon-chain-analytics.pillar-project.workers.dev/';

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

export enum BuildStakingError {
  DAO_APPROVAL_ERROR = 'DAO_APPROVAL_ERROR',
  APPROVAL_ERROR = 'APPROVAL_ERROR',
  STAKING_ERROR = 'STAKING_ERROR',
  TRANSFER_ERROR = 'TRANSFER_ERROR',
  ESTIMATION_ERROR = 'ESTIMATION_ERROR',
}
