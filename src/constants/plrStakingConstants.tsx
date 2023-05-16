import { CHAIN } from './chainConstantsTs';

export const MIN_PLR_STAKE_AMOUNT = 10000;
export const MAX_PLR_STAKE_AMOUNT = 250000;

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
  iconUrl:
    'https://images.prismic.io/pillar-app/83dcf8ff-6459-41d4-8d43-7ec143814b2d_pillar-logo-5.png?auto=compress,format',
};

export const mapWalletTypeToIcon = (type: WalletType) => {
  switch (type) {
    case WalletType.ETHERSPOT:
      return 'etherspot16';
    case WalletType.KEYBASED:
      return 'wallet16';
    case WalletType.ARCHANOVA:
      return 'pillar16';
    default:
      return 'etherspot16';
  }
};

export const mapWalletTypeToName = (type: WalletType) => {
  switch (type) {
    case WalletType.ETHERSPOT:
      return 'Etherspot';
    case WalletType.KEYBASED:
      return 'Keybased';
    case WalletType.ARCHANOVA:
      return 'Pillar v1';
    default:
      return 'Etherspot';
  }
};
