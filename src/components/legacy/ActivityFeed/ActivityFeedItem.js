// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

import * as React from 'react';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import get from 'lodash.get';
import isEqual from 'lodash.isequal';
import styled, { withTheme } from 'styled-components/native';
import t from 'translations/translate';
import { BigNumber as EthersBigNumber } from 'ethers';

// utils
import { getThemeColors } from 'utils/themes';
import { addressesEqual, findAssetByAddress } from 'utils/assets';
import { fontSizes, spacing } from 'utils/variables';
import {
  isPendingTransaction,
  isSmartWalletAccountAddress,
  groupPPNTransactions,
  isFailedTransaction,
  isTimedOutTransaction,
  isArchanovaAccountAddress,
} from 'utils/feedData';
import { formatHexAddress } from 'utils/format';
import { images, isSvgImage } from 'utils/images';
import { getFormattedValue } from 'utils/strings';
import {
  formatAmount,
  formatUnits,
  getDecimalPlaces,
  findEnsNameCaseInsensitive,
  formatTokenAmount,
} from 'utils/common';
import { nativeAssetPerChain } from 'utils/chains';
import { getMigratedEnsName } from 'utils/accounts';

// components
import ListItemWithImage from 'components/legacy/ListItem/ListItemWithImage';
import TankAssetBalance from 'components/TankAssetBalance';
import { BaseText } from 'components/legacy/Typography';

// constants
import { COLLECTIBLE_TRANSACTION } from 'constants/collectiblesConstants';
import {
  TRANSACTION_EVENT,
  TX_PENDING_STATUS,
  TX_FAILED_STATUS,
} from 'constants/historyConstants';
import {
  PAYMENT_NETWORK_ACCOUNT_DEPLOYMENT,
  PAYMENT_NETWORK_ACCOUNT_TOPUP,
  PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL,
  PAYMENT_NETWORK_TX_SETTLEMENT,
} from 'constants/paymentNetworkConstants';
import {
  SET_ARCHANOVA_WALLET_ACCOUNT_ENS,
  ARCHANOVA_WALLET_ACCOUNT_DEVICE_ADDED,
  ARCHANOVA_WALLET_ACCOUNT_DEVICE_REMOVED,
  ARCHANOVA_WALLET_SWITCH_TO_GAS_TOKEN_RELAYER,
  ARCHANOVA_WALLET_ASSET_MIGRATION,
  ARCHANOVA_WALLET_ENS_MIGRATION,
} from 'constants/archanovaConstants';
import { AAVE_LENDING_DEPOSIT_TRANSACTION, AAVE_LENDING_WITHDRAW_TRANSACTION } from 'constants/transactionsConstants';
import {
  POOLTOGETHER_WITHDRAW_TRANSACTION,
  POOLTOGETHER_DEPOSIT_TRANSACTION,
} from 'constants/poolTogetherConstants';
import {
  SABLIER_CREATE_STREAM,
  SABLIER_WITHDRAW,
  SABLIER_CANCEL_STREAM,
} from 'constants/sablierConstants';
import { DAI } from 'constants/assetsConstants';
import { WBTC_SETTLED_TRANSACTION, WBTC_PENDING_TRANSACTION } from 'constants/exchangeConstants';
import {
  RARI_DEPOSIT_TRANSACTION,
  RARI_WITHDRAW_TRANSACTION,
  RARI_TRANSFER_TRANSACTION,
  RARI_CLAIM_TRANSACTION,
  RARI_TOKENS_DATA,
  RARI_GOVERNANCE_TOKEN_DATA,
} from 'constants/rariConstants';
import {
  LIQUIDITY_POOLS_ADD_LIQUIDITY_TRANSACTION,
  LIQUIDITY_POOLS_REMOVE_LIQUIDITY_TRANSACTION,
  LIQUIDITY_POOLS_STAKE_TRANSACTION,
  LIQUIDITY_POOLS_UNSTAKE_TRANSACTION,
  LIQUIDITY_POOLS_REWARDS_CLAIM_TRANSACTION,
} from 'constants/liquidityPoolsConstants';

// selectors
import { activeAccountAddressSelector } from 'selectors';
import {
  assetDecimalsSelector,
  ethereumSupportedAssetsSelector,
} from 'selectors/assets';
import { isArchanovaAccountDeployedSelector } from 'selectors/archanova';

// types
import type { ColorKey, Theme } from 'models/Theme';
import type { RootReducerState } from 'reducers/rootReducer';
import type { EnsRegistry } from 'reducers/ensRegistryReducer';
import type { Account } from 'models/Account';
import type { TransactionsGroup } from 'utils/feedData';
import type { Asset } from 'models/Asset';
import type { AaveExtra } from 'models/Transaction';
import { EVENT_TYPE } from 'models/History';

type Props = {
  type?: string,
  asset?: string,
  isPending?: boolean,
  selectEvent: Function,
  ensRegistry: EnsRegistry,
  theme: Theme,
  event: Object,
  feedType?: string,
  activeAccountAddress: string,
  accounts: Account[],
  isArchanovaWalletActivated: boolean,
  assetDecimals: number,
  isPPNView?: boolean,
  isForAllAccounts?: boolean,
  isAssetView?: boolean,
  supportedAssets: Asset[],
  sessionLanguageCode: ?string, // important for re-rendering on language change
};

export type EventData = {
  label?: string,
  itemImageSource?: number,
  actionLabel?: ?string,
  badge?: ?string,
  subtext?: string,
  labelAsButton?: boolean,
  username?: string,
  itemImageUrl?: string,
  iconName?: ?string,
  iconColor?: string,
  itemValue?: string,
  fullItemValue?: string,
  valueColor?: ColorKey,
  customAddon?: React.Node,
  itemStatusIcon?: string,
  iconBackgroundColor?: string,
  iconBorder?: boolean,
  fallbackToGenericToken?: boolean,
  secondaryButton?: boolean,
  buttonActionLabel?: string,
  isReceived?: boolean,
  collectibleUrl?: string,
  statusIconColor?: ?string,
  isFailed?: boolean,
  itemImageRoundedSquare?: boolean,
  cornerIcon?: any,
  profileImage?: boolean,
};

const poolTogetherLogo = require('assets/images/pool_together.png');
const daiIcon = require('assets/images/dai_color.png');
const usdcIcon = require('assets/images/usdc_color.png');
const sablierLogo = require('assets/icons/sablier.png');
const wbtcLogo = require('assets/images/exchangeProviders/wbtcLogo.png');

const ListWrapper = styled.View`
  align-items: flex-end;
  padding-left: ${spacing.mediumLarge}px;
`;

const ItemValue = styled(BaseText)`
  font-size: ${fontSizes.big}px;
  color: ${({ theme }) => theme.colors.secondaryAccent140};
  text-align: right;
`;

const aaveImage = require('assets/images/apps/aave.png');
const rariLogo = require('assets/images/rari_logo.png');

export class ActivityFeedItem extends React.Component<Props> {
  NAMES = () => ({
    LEGACY_SMART_WALLET: t('legacySmartWallet'),
    KEY_WALLET: t('keyWallet'),
    PPN_NETWORK: t('pillarNetwork'),
    AAVE_DEPOSIT: t('aaveDeposit'),
    POOL_TOGETHER: t('poolTogether'),
    ASSET_MIGRATION: t('label.assetMigration'),
    ENS_MIGRATION: t('label.ensMigration'),
  });

  STATUSES = () => ({
    CREATED: t('label.created'),
    IMPORTED: t('label.imported'),
    RECEIVED: t('label.received'),
    SENT: t('label.sent'),
    BACKUP: t('label.backedUp'),
    ACTIVATED: t('label.activated'),
    ADDED: t('label.added'),
    REMOVED: t('label.removed'),
    COMPLETED: t('label.completed'),
    FAILED: t('label.failed'),
    PENDING: t('label.pending'),
  });

  FROM = () => ({
    PPN_NETWORK: t('label.fromPPN'),
  });

  TO = () => ({
    PPN_NETWORK: t('label.toPPN'),
  });

  shouldComponentUpdate(nextProps: Props) {
    const isEq = isEqual(this.props, nextProps);
    return !isEq;
  }

  isReceived = (event: Object): boolean => {
    const { to, isReceived, from } = event;
    const {
      activeAccountAddress,
      isForAllAccounts,
      accounts,
    } = this.props;

    if (isForAllAccounts) {
      const isBetweenAccounts = isSmartWalletAccountAddress(to, accounts)
        && isSmartWalletAccountAddress(from, accounts);

      return (isBetweenAccounts && isReceived) || (!isBetweenAccounts && isSmartWalletAccountAddress(to, accounts));
    }

    return addressesEqual(to, activeAccountAddress);
  };

  isZeroValue(value: string): boolean {
    return value === '0' || value === '0.0';
  }

  getRelevantAddress = (event: Object): string => {
    const isReceived = this.isReceived(event);
    return isReceived ? event.from : event.to;
  };

  getFormattedSettleValues = () => {
    const {
      event,
      asset,
      assetDecimals,
    } = this.props;
    const settleData = event.extra;
    const ppnTransactions = asset
      ? settleData.filter(({ symbol }) => symbol === asset)
      : settleData;

    const groupedPPNTransactions: TransactionsGroup[] = groupPPNTransactions(ppnTransactions);

    const formattedValuesArray: Object[] = groupedPPNTransactions.map(({ symbol, value }): Object => ({
      formatted: formatAmount(formatUnits(value.toString(), assetDecimals), getDecimalPlaces(symbol)),
      symbol,
    }));
    return formattedValuesArray;
  };

  getAaveDisplayAmount = (isPositive: boolean) => {
    const { event } = this.props;
    if (!event?.extra) return '';
    const { amount, symbol, decimals }: AaveExtra = event.extra;
    if (!amount || !symbol) return '';
    const value = formatUnits(amount, decimals);
    return getFormattedValue(formatAmount(value, getDecimalPlaces(symbol)), symbol, {
      isPositive,
      noSymbol: !value,
    });
  };

  getAaveDepositedAssetImage = () => {
    const { event, supportedAssets } = this.props;
    if (!event?.extra?.symbol) return null;
    const { iconUrl } = supportedAssets.find(({ symbol }) => symbol === event.extra.symbol) || {};
    return iconUrl ? { uri: iconUrl } : null;
  };

  getWalletEventData = (event: Object) => {
    const { isArchanovaWalletActivated, theme } = this.props;
    const { keyWalletIcon, PPNIcon, smartWalletIcon } = images(theme);
    switch (event.type) {
      case EVENT_TYPE.WALLET_CREATED:
        return {
          label: this.NAMES().LEGACY_SMART_WALLET,
          itemImageSource: smartWalletIcon,
          actionLabel: this.STATUSES().CREATED,
          badge: isArchanovaWalletActivated ? null : t('label.needToActivate'),
        };
      case EVENT_TYPE.PPN_INITIALIZED:
        return {
          label: this.NAMES().PPN_NETWORK,
          itemImageSource: PPNIcon,
          actionLabel: this.STATUSES().CREATED,
          badge: isArchanovaWalletActivated ? null : t('label.needToActivate'),
        };
      case EVENT_TYPE.WALLET_BACKED_UP:
        return {
          label: this.NAMES().LEGACY_SMART_WALLET,
          itemImageSource: keyWalletIcon,
          actionLabel: this.STATUSES().BACKUP,
        };
      default:
        return null;
    }
  };

  getTransactionEventData = (event: Object) => {
    const {
      ensRegistry,
      assetDecimals,
      accounts,
      theme,
      isPPNView,
      isAssetView,
      supportedAssets,
    } = this.props;

    const isReceived = this.isReceived(event);
    let value = formatUnits(event.value, assetDecimals);
    if (event.transactionType === 'approve') {
      // if it's approval transaction, the value is some rubbish, so we hide it from the user
      value = '0';
    }
    const relevantAddress = this.getRelevantAddress(event);

    // this component is Archanova (Ethereum) only
    const assetSymbol = event?.assetSymbol ?? nativeAssetPerChain.ethereum.symbol;

    const decimalPlaces = getDecimalPlaces(assetSymbol);
    const formattedValue = formatAmount(value, decimalPlaces);
    const formattedFullValue = formatAmount(value);
    const directionIcon = isReceived ? 'received' : 'sent'; // eslint-disable-line i18next/no-literal-string

    const isFailed = isFailedTransaction(event) || isTimedOutTransaction(event);
    const isPositivePPN = event.tag === PAYMENT_NETWORK_ACCOUNT_TOPUP && !isAssetView && !event.smartWalletEvent;
    const isZero = this.isZeroValue(value) || isFailed;

    const isPending = isPendingTransaction(event);

    let data: EventData = {};

    const {
      smartWalletIcon,
      PPNIcon,
      roundedPhoneIcon,
      personIcon,
    } = images(theme);

    const fullItemValuePPN = getFormattedValue(formattedFullValue, assetSymbol, {
      isPositive: isPositivePPN,
      noSymbol: isZero,
    });
    const itemValuePPN = getFormattedValue(formattedValue, assetSymbol, {
      isPositive: isPositivePPN,
      noSymbol: isZero,
    });
    const isPPNTransaction = get(event, 'isPPNTransaction', false);

    switch (event.tag) {
      case PAYMENT_NETWORK_ACCOUNT_DEPLOYMENT:
        data = {
          label: this.NAMES().LEGACY_SMART_WALLET,
          itemImageSource: smartWalletIcon,
          actionLabel: this.STATUSES().ACTIVATED,
        };
        break;
      case PAYMENT_NETWORK_ACCOUNT_TOPUP:
        if (isAssetView) {
          data = {
            label: this.NAMES().PPN_NETWORK,
            itemImageSource: PPNIcon,
            fullItemValue: fullItemValuePPN,
            itemValue: itemValuePPN,
            valueColor: 'basic010',
          };
        } else if (isPPNView) {
          data = {
            label: t('label.topUp'),
            itemImageSource: PPNIcon,
            fullItemValue: fullItemValuePPN,
            itemValue: itemValuePPN,
            valueColor: 'secondaryAccent140',
          };
        } else if (event.smartWalletEvent) {
          data = {
            label: this.NAMES().LEGACY_SMART_WALLET,
            subtext: this.TO().PPN_NETWORK,
            itemImageSource: smartWalletIcon,
            fullItemValue: fullItemValuePPN,
            itemValue: itemValuePPN,
            valueColor: 'basic010',
          };
        } else {
          data = {
            label: this.NAMES().PPN_NETWORK,
            subtext: t('label.topUp'),
            itemImageSource: PPNIcon,
            fullItemValue: fullItemValuePPN,
            itemValue: itemValuePPN,
            valueColor: 'secondaryAccent140',
          };
        }
        break;
      case SET_ARCHANOVA_WALLET_ACCOUNT_ENS:
        data = {
          label: this.NAMES().LEGACY_SMART_WALLET,
          itemImageSource: smartWalletIcon,
          subtext: t('label.registerEnsName'),
        };
        break;
      case PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL:
        data = {
          fullItemValue: fullItemValuePPN,
          itemValue: itemValuePPN,
          valueColor: 'basic010',
        };
        if (isPPNView) {
          data.label = t('label.withdraw');
          data.iconName = 'sent'; // eslint-disable-line i18next/no-literal-string
          data.iconColor = 'secondaryAccent240'; // eslint-disable-line i18next/no-literal-string
        } else {
          data.label = this.NAMES().PPN_NETWORK;
          data.subtext = t('label.withdrawal');
          data.itemImageSource = PPNIcon;
        }
        break;
      case PAYMENT_NETWORK_TX_SETTLEMENT:
        const transactionsCount = event.extra.length;
        const formattedValuesArray = this.getFormattedSettleValues();
        data = {
          label: t('label.settle'),
          itemImageSource: PPNIcon,
          customAddonAlignLeft: true,
          rightColumnInnerStyle: { flexDirection: 'row', alignItems: 'center' },
          customAddon: (
            <ListWrapper>
              {formattedValuesArray.map(({ formatted, symbol }) => (
                <TankAssetBalance
                  key={symbol}
                  amount={getFormattedValue(formatted, symbol, { isPositive: !isFailed, noSymbol: isZero })}
                  failed={isFailed}
                />
              ))}
              {!isFailed && isPPNView && transactionsCount > 1 && (
                <BaseText regular secondary>{t('totalValue', { value: transactionsCount })}</BaseText>
              )}
              {!isFailed && !isPPNView && formattedValuesArray
                .map(({ formatted, symbol }) =>
                  (
                    <ItemValue key={symbol}>
                      {t('positiveTokenValue', { value: formatted, token: symbol })}
                    </ItemValue>
                  ),
                )
              }
            </ListWrapper>),
        };
        break;
      case ARCHANOVA_WALLET_SWITCH_TO_GAS_TOKEN_RELAYER:
        data = {
          label: this.NAMES().LEGACY_SMART_WALLET,
          itemImageSource: smartWalletIcon,
          subtext: t('label.enableSmartWalletGasRelayerPLR'),
        };
        break;
      case ARCHANOVA_WALLET_ACCOUNT_DEVICE_ADDED:
        data = {
          label: this.NAMES().LEGACY_SMART_WALLET,
          itemImageSource: roundedPhoneIcon,
          subtext: t('label.smartWalletAccountDeviceAdded'),
          actionLabel: this.STATUSES().ADDED,
        };
        break;
      case WBTC_SETTLED_TRANSACTION:
        const wbtcValue = `+ ${getFormattedValue(String(event.value / 100000000), assetSymbol)}`;
        const wbtcValueFixed = `+ ${getFormattedValue(String((event.value / 100000000).toFixed(5)), assetSymbol)}`;
        data = {
          label: formatHexAddress(relevantAddress),
          fullItemValue: wbtcValue,
          itemValue: wbtcValueFixed,
          valueColor: 'secondaryAccent140',
          isReceived,
          itemImageSource: wbtcLogo,
        };
        break;
      case ARCHANOVA_WALLET_ACCOUNT_DEVICE_REMOVED:
        data = {
          label: this.NAMES().LEGACY_SMART_WALLET,
          itemImageSource: roundedPhoneIcon,
          subtext: t('label.smartWalletAccountDeviceRemoved'),
          actionLabel: this.STATUSES().REMOVED,
        };
        break;
      case AAVE_LENDING_DEPOSIT_TRANSACTION:
        const depositDisplayValue = this.getAaveDisplayAmount(false);
        data = {
          label: this.NAMES().AAVE_DEPOSIT,
          itemValue: depositDisplayValue,
          fullItemValue: depositDisplayValue,
          valueColor: 'basic010',
          itemImageSource: aaveImage,
          itemImageRoundedSquare: true,
          iconImageSize: 52,
          cornerIcon: this.getAaveDepositedAssetImage(),
        };
        break;
      case AAVE_LENDING_WITHDRAW_TRANSACTION:
        const withdrawDisplayValue = this.getAaveDisplayAmount(true);
        data = {
          label: this.NAMES().AAVE_DEPOSIT,
          itemValue: withdrawDisplayValue,
          fullItemValue: withdrawDisplayValue,
          valueColor: 'secondaryAccent140',
          itemImageSource: aaveImage,
          itemImageRoundedSquare: true,
          iconImageSize: 52,
          cornerIcon: this.getAaveDepositedAssetImage(),
        };
        break;
      case POOLTOGETHER_DEPOSIT_TRANSACTION:
      case POOLTOGETHER_WITHDRAW_TRANSACTION: {
        const { symbol, decimals, amount } = event.extra;
        const isPositive = event.tag !== POOLTOGETHER_DEPOSIT_TRANSACTION;
        const formattedVal = parseFloat(formatUnits(amount, decimals)).toString();
        data = {
          label: this.NAMES().POOL_TOGETHER,
          itemImageSource: poolTogetherLogo,
          cornerIcon: symbol === DAI ? daiIcon : usdcIcon,
          itemValue: getFormattedValue(formattedVal, symbol, { isPositive, noSymbol: !amount }),
          itemImageRoundedSquare: true,
          valueColor: isPositive ? 'secondaryAccent140' : 'basic010',
        };
        break;
      }
      case SABLIER_CREATE_STREAM:
      case SABLIER_WITHDRAW:
      case SABLIER_CANCEL_STREAM: {
        const { amount, contactAddress, assetAddress } = event.extra;
        const usernameOrAddress = findEnsNameCaseInsensitive(ensRegistry, contactAddress) || contactAddress;

        const assetData = findAssetByAddress(supportedAssets, assetAddress);
        if (!assetData) break;

        const { decimals, symbol } = assetData;

        const formattedAmount = formatAmount(formatUnits(amount, decimals), getDecimalPlaces(symbol));

        data = {
          label: usernameOrAddress,
          cornerIcon: sablierLogo,
          profileImage: true,
        };

        if (event.tag === SABLIER_CREATE_STREAM) {
          data = {
            ...data,
            subtext: t('label.outgoingSablierStream'),
            itemValue: getFormattedValue(formattedAmount, symbol, { isPositive: false }),
            fullItemValue: getFormattedValue(formattedAmount, symbol, { isPositive: false }),
            valueColor: 'basic010',
          };
        } else if (event.tag === SABLIER_WITHDRAW) {
          data = {
            ...data,
            subtext: t('label.withdraw'),
            itemValue: getFormattedValue(formattedAmount, symbol, { isPositive: true }),
            fullItemValue: getFormattedValue(formattedAmount, symbol, { isPositive: true }),
            valueColor: 'secondaryAccent140',
          };
        } else if (event.tag === SABLIER_CANCEL_STREAM) {
          data = {
            ...data,
            subtext: t('label.outgoingSablierStream'),
            itemValue: getFormattedValue(formattedAmount, symbol, { isPositive: true }),
            itemStatusIcon: TX_FAILED_STATUS,
            statusIconColor: 'secondaryAccent240',
            isFailed: true,
          };
        }
        break;
      }
      case RARI_DEPOSIT_TRANSACTION:
      case RARI_WITHDRAW_TRANSACTION:
      case RARI_CLAIM_TRANSACTION: {
        const {
          symbol, decimals, amount, rftMinted, rftBurned, rariPool, rgtBurned,
        } = event.extra;
        let label = null;
        let subtext = null;
        let negativeValueAmount = null;
        let negativeValueToken = null;
        let positiveValueAmount = null;
        let positiveValueToken = null;

        const rariToken = rariPool && RARI_TOKENS_DATA[rariPool].symbol;
        const formattedAmount = formatAmount(formatUnits(amount, decimals), symbol ? getDecimalPlaces(symbol) : 6);

        if (event.tag === RARI_DEPOSIT_TRANSACTION) {
          label = t('label.deposit');
          subtext = t('label.fromWalletToRari');
          negativeValueAmount = formattedAmount;
          negativeValueToken = symbol;
          positiveValueAmount = rftMinted && formatAmount(formatUnits(rftMinted, 18));
          positiveValueToken = rariToken;
        } else if (event.tag === RARI_WITHDRAW_TRANSACTION) {
          label = t('label.withdraw');
          subtext = t('label.fromRariToWallet');
          negativeValueAmount = rftBurned && formatAmount(formatUnits(rftBurned, 18));
          negativeValueToken = rariToken;
          positiveValueAmount = formattedAmount;
          positiveValueToken = symbol;
        } else {
          label = t('label.claim');
          subtext = t('label.fromRariToWallet');
          negativeValueAmount = formattedAmount;
          positiveValueAmount = formatAmount(formatUnits(EthersBigNumber.from(amount).sub(rgtBurned), 18));
          negativeValueToken = RARI_GOVERNANCE_TOKEN_DATA.symbol;
          positiveValueToken = RARI_GOVERNANCE_TOKEN_DATA.symbol;
        }

        data = {
          ...data,
          label,
          subtext,
          itemImageSource: rariLogo,
          customAddon: (
            <ListWrapper>
              {negativeValueAmount && (
                <BaseText big>
                  {t('negativeTokenValue', { value: negativeValueAmount, token: negativeValueToken })}
                </BaseText>
              )}
              {positiveValueAmount && (
                <ItemValue>
                  {t('positiveTokenValue', { value: positiveValueAmount, token: positiveValueToken })}
                </ItemValue>
              )}
            </ListWrapper>
          ),
          customAddonAlignLeft: true,
          rightColumnInnerStyle: {
            flexDirection: 'row',
            alignItems: 'center',
          },
        };
        break;
      }
      case RARI_TRANSFER_TRANSACTION: {
        const { contactAddress, amount, rariPool } = event.extra;
        const formattedAmount = formatAmount(formatUnits(amount, 18));
        const usernameOrAddress = findEnsNameCaseInsensitive(ensRegistry, contactAddress) || contactAddress;
        data = {
          ...data,
          label: usernameOrAddress,
          profileImage: true,
          itemValue: getFormattedValue(formattedAmount, RARI_TOKENS_DATA[rariPool].symbol, { isPositive: false }),
          fullItemValue: getFormattedValue(formattedAmount, RARI_TOKENS_DATA[rariPool].symbol, { isPositive: false }),
        };
        break;
      }
      case LIQUIDITY_POOLS_ADD_LIQUIDITY_TRANSACTION: {
        const { amount, pool } = event.extra;
        data = {
          ...data,
          label: t('liquidityPoolsContent.label.liquidityAdded'),
          subtext: t('liquidityPoolsContent.label.fromWalletToPool', { poolName: pool.name }),
          customAddon: (
            <ListWrapper>
              <BaseText big>
                {t('negativeValue', { value: t('label.multiple') })}
              </BaseText>
              <ItemValue>
                {t('positiveTokenValue', { value: formatTokenAmount(amount, pool.symbol), token: pool.symbol })}
              </ItemValue>
            </ListWrapper>
          ),
          itemImageUrl: pool.iconUrl,
        };
        break;
      }
      case LIQUIDITY_POOLS_REMOVE_LIQUIDITY_TRANSACTION: {
        const { amount, pool } = event.extra;
        data = {
          ...data,
          label: t('liquidityPoolsContent.label.liquidityRemoved'),
          subtext: t('liquidityPoolsContent.label.fromPoolToWallet', { poolName: pool.name }),
          customAddon: (
            <ListWrapper>
              <BaseText big>
                {t('negativeTokenValue', { value: formatTokenAmount(amount, pool.symbol), token: pool.symbol })}
              </BaseText>
              <ItemValue>
                {t('positiveValue', { value: t('label.multiple') })}
              </ItemValue>
            </ListWrapper>
          ),
          itemImageUrl: pool.iconUrl,
        };
        break;
      }
      case LIQUIDITY_POOLS_STAKE_TRANSACTION: {
        const { amount, pool } = event.extra;
        data = {
          ...data,
          label: t('liquidityPoolsContent.label.staked'),
          subtext: pool.name,
          itemValue: getFormattedValue(formatAmount(amount), pool.symbol, { isPositive: false }),
          fullItemValue: getFormattedValue(formatAmount(amount), pool.symbol, { isPositive: false }),
          itemImageUrl: pool.iconUrl,
        };
        break;
      }
      case LIQUIDITY_POOLS_UNSTAKE_TRANSACTION: {
        const { amount, pool } = event.extra;
        data = {
          ...data,
          label: t('liquidityPoolsContent.label.unstaked'),
          subtext: pool.name,
          itemValue: getFormattedValue(formatAmount(amount), pool.symbol, { isPositive: true }),
          fullItemValue: getFormattedValue(formatAmount(amount), pool.symbol, { isPositive: true }),
          valueColor: 'secondaryAccent140',
          itemImageUrl: pool.iconUrl,
        };
        break;
      }
      case LIQUIDITY_POOLS_REWARDS_CLAIM_TRANSACTION: {
        const { amount, pool } = event.extra;
        data = {
          ...data,
          label: t('liquidityPoolsContent.label.rewardsClaimed'),
          subtext: t('liquidityPoolsContent.label.fromPoolToWallet', { poolName: pool.name }),
          itemValue: getFormattedValue(formatAmount(amount), pool.rewards[0].symbol, { isPositive: true }),
          fullItemValue: getFormattedValue(formatAmount(amount), pool.rewards[0].symbol, { isPositive: true }),
          valueColor: 'secondaryAccent140',
          itemImageUrl: pool.iconUrl,
        };
        break;
      }
      case ARCHANOVA_WALLET_ASSET_MIGRATION: {
        let status;
        if (isFailed) {
          status = this.STATUSES().FAILED;
        } else if (isPending) {
          status = this.STATUSES().PENDING;
        } else {
          status = this.STATUSES().COMPLETED;
        }

        data = {
          label: this.NAMES().ASSET_MIGRATION,
          itemImageSource: smartWalletIcon,
          subtext: t('label.archanovaToEtherspotShort'),
          actionLabel: status,
        };
        break;
      }
      case ARCHANOVA_WALLET_ENS_MIGRATION:
        let statusLabel = isFailed ? this.STATUSES().FAILED : this.STATUSES().PENDING;
        if (!isFailed && !isPending) statusLabel = this.STATUSES().COMPLETED;

        data = {
          label: this.NAMES().ENS_MIGRATION,
          itemImageSource: personIcon,
          subtext: getMigratedEnsName(accounts),
          actionLabel: statusLabel,
        };
        break;
      default:
        const usernameOrAddress = event.username || ensRegistry[relevantAddress] || formatHexAddress(relevantAddress);

        const isBetweenSmartWalletAccounts = isSmartWalletAccountAddress(event.from, accounts)
          && isSmartWalletAccountAddress(event.to, accounts);

        if (isPPNTransaction) {
          if (isArchanovaAccountAddress(event.from, accounts) && isArchanovaAccountAddress(event.to, accounts)) {
            data = {
              label: isAssetView ? this.NAMES().PPN_NETWORK : this.NAMES().LEGACY_SMART_WALLET,
              subtext: isAssetView ? '' : this.FROM().PPN_NETWORK,
              itemImageSource: isAssetView ? PPNIcon : smartWalletIcon,
              isReceived: true,
              fullItemValue: t('positiveTokenValue', { value: formattedFullValue, token: assetSymbol }),
              itemValue: t('positiveTokenValue', { value: formattedValue, token: assetSymbol }),
              valueColor: 'secondaryAccent140',
            };
          } else {
            data = {
              label: usernameOrAddress,
              isReceived,
            };

            if (event.extra) {
              const { syntheticTransaction: { toAmount, toAssetCode } } = event.extra;
              data.customAddon = (
                <ListWrapper>
                  <TankAssetBalance
                    amount={getFormattedValue(toAmount, toAssetCode, { isPositive: isReceived, noSymbol: !toAmount })}
                  />
                  {!isReceived &&
                  <BaseText regular secondary>
                    {t('tokenValue', { value: formattedValue, token: assetSymbol })}
                  </BaseText>}
                </ListWrapper>
              );
            } else {
              data.customAddon = (
                <ListWrapper>
                  <TankAssetBalance
                    amount={getFormattedValue(formattedValue, assetSymbol, {
                      isPositive: isReceived,
                      noSymbol: isZero,
                    })}
                    failed={isFailed}
                  />
                </ListWrapper>
              );
            }
          }
        } else {
          const additionalInfo = {};

          if (isBetweenSmartWalletAccounts) {
            additionalInfo.itemImageSource = smartWalletIcon;
          } else {
            additionalInfo.iconName = directionIcon;
            // eslint-disable-next-line i18next/no-literal-string
            additionalInfo.iconColor = isReceived ? 'secondaryAccent140' : 'secondaryAccent240';
          }

          data = {
            label: usernameOrAddress,
            fullItemValue: event.tag === WBTC_PENDING_TRANSACTION
              ? getFormattedValue(String(event.value / 1000000000000000000), assetSymbol)
              : getFormattedValue(formattedFullValue, assetSymbol, {
                isPositive: isReceived,
                noSymbol: !formattedFullValue,
              }),
            itemValue: event.tag === WBTC_PENDING_TRANSACTION
              ? `+ ${getFormattedValue((event.value / 1000000000000000000).toFixed(5), assetSymbol)}`
              : getFormattedValue(formattedValue, assetSymbol, { isPositive: isReceived, noSymbol: isZero }),
            valueColor: isReceived && !this.isZeroValue(value) ? 'secondaryAccent140' : 'basic010',
            ...additionalInfo,
            isReceived,
          };
        }
    }
    data.itemStatusIcon = data.itemStatusIcon || (isPending ? TX_PENDING_STATUS : '');
    if (isFailed) {
      // due to failed transaction UI difference, failed PPN transactions should not show an icon
      if (!isPPNTransaction) data.itemStatusIcon = TX_FAILED_STATUS;
      data.statusIconColor = 'secondaryAccent240'; // eslint-disable-line i18next/no-literal-string
      data.isFailed = true;
    }
    return data;
  };

  getCollectibleTransactionEventData = (event: Object) => {
    const isReceived = this.isReceived(event);
    const {
      assetSymbol,
      assetData: { image },
      icon,
    } = event;

    const relevantAddress = this.getRelevantAddress(event);
    const usernameOrAddress = formatHexAddress(relevantAddress);

    const subtext = isReceived
      ? t('label.collectibleFromUser', { username: usernameOrAddress })
      : t('label.collectibleToUser', { username: usernameOrAddress });

    return {
      label: assetSymbol,
      collectibleUrl: isSvgImage(image) ? image : icon,
      subtext,
      actionLabel: isReceived ? this.STATUSES().RECEIVED : this.STATUSES().SENT,
      iconBackgroundColor: 'basic070',
      iconBorder: true,
      fallbackToGenericToken: true,
      isReceived,
    };
  };

  getEventData = (event: Object): ?EventData => {
    switch (event.type) {
      case EVENT_TYPE.WALLET_BACKED_UP:
      case EVENT_TYPE.WALLET_CREATED:
      case EVENT_TYPE.PPN_INITIALIZED:
        return this.getWalletEventData(event);
      case TRANSACTION_EVENT:
        return this.getTransactionEventData(event);
      case COLLECTIBLE_TRANSACTION:
        return this.getCollectibleTransactionEventData(event);
      default:
        return null;
    }
  };

  getColor = (color: ?string): ?string => {
    if (!color) return null;
    const { theme } = this.props;
    const colors = getThemeColors(theme);

    // $FlowFixMe: js hacks
    return colors[color] || color;
  };

  render() {
    const { event, selectEvent, sessionLanguageCode } = this.props;
    const itemData = this.getEventData(event);

    if (!itemData) return null;

    const {
      iconColor,
      valueColor,
      iconBackgroundColor,
      isFailed,
      statusIconColor,
    } = itemData;

    return (
      <ListItemWithImage
        {...itemData}
        onPress={() => selectEvent(event, itemData)}
        actionLabelColor={this.getColor('basic030')}
        iconColor={this.getColor(iconColor)}
        diameter={48}
        iconBackgroundColor={this.getColor(iconBackgroundColor)}
        valueColor={isFailed ? this.getColor('basic030') : this.getColor(valueColor)}
        statusIconColor={this.getColor(statusIconColor)}
        sessionLanguageCode={sessionLanguageCode}
      />
    );
  }
}

const mapStateToProps = ({
  ensRegistry: { data: ensRegistry },
  accounts: { data: accounts },
  session: { data: { sessionLanguageCode } },
}: RootReducerState): $Shape<Props> => ({
  ensRegistry,
  accounts,
  sessionLanguageCode,
});

const structuredSelector = createStructuredSelector({
  activeAccountAddress: activeAccountAddressSelector,
  isArchanovaWalletActivated: isArchanovaAccountDeployedSelector,
  assetDecimals: assetDecimalsSelector((_, props) => props.event.assetAddress),
  supportedAssets: ethereumSupportedAssetsSelector,
});

const combinedMapStateToProps = (state: RootReducerState, props) => ({
  ...structuredSelector(state, props),
  ...mapStateToProps(state),
});

export default withTheme(connect(combinedMapStateToProps)(ActivityFeedItem));
