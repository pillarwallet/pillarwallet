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
import { getEnv } from 'configs/envConfig';
import t from 'translations/translate';

// utils
import { getThemeColors, themedColors } from 'utils/themes';
import { addressesEqual, getAssetDataByAddress } from 'utils/assets';
import { fontSizes, spacing } from 'utils/variables';
import {
  elipsizeAddress,
  isPendingTransaction,
  isSWAddress,
  isKWAddress,
  groupPPNTransactions,
  getElipsizeAddress,
  isFailedTransaction,
  isTimedOutTransaction,
} from 'utils/feedData';
import { findAccountByAddress } from 'utils/accounts';
import { images, isSvgImage } from 'utils/images';
import { isPoolTogetherAddress } from 'utils/poolTogether';
import { getFormattedValue } from 'utils/strings';

// components
import {
  formatAmount,
  formatUnits,
  getDecimalPlaces,
  findEnsNameCaseInsensitive,
} from 'utils/common';

// components
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import TankAssetBalance from 'components/TankAssetBalance';
import { BaseText } from 'components/Typography';

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
import { USER_EVENT, PPN_INIT_EVENT, WALLET_CREATE_EVENT, WALLET_BACKUP_EVENT } from 'constants/userEventsConstants';
import { BADGE_REWARD_EVENT } from 'constants/badgesConstants';
import {
  SET_SMART_WALLET_ACCOUNT_ENS,
  SMART_WALLET_ACCOUNT_DEVICE_ADDED,
  SMART_WALLET_ACCOUNT_DEVICE_REMOVED,
  SMART_WALLET_SWITCH_TO_GAS_TOKEN_RELAYER,
} from 'constants/smartWalletConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { AAVE_LENDING_DEPOSIT_TRANSACTION, AAVE_LENDING_WITHDRAW_TRANSACTION } from 'constants/lendingConstants';
import {
  POOLTOGETHER_WITHDRAW_TRANSACTION,
  POOLTOGETHER_DEPOSIT_TRANSACTION,
} from 'constants/poolTogetherConstants';
import {
  SABLIER_CREATE_STREAM,
  SABLIER_WITHDRAW,
  SABLIER_CANCEL_STREAM,
  SABLIER_STREAM_ENDED,
  SABLIER_EVENT,
} from 'constants/sablierConstants';
import { DAI } from 'constants/assetsConstants';

// selectors
import { activeAccountAddressSelector } from 'selectors';
import { assetDecimalsSelector } from 'selectors/assets';
import { isSmartWalletActivatedSelector } from 'selectors/smartWallet';

// types
import type { Theme } from 'models/Theme';
import type { RootReducerState } from 'reducers/rootReducer';
import type { EnsRegistry } from 'reducers/ensRegistryReducer';
import type { Accounts } from 'models/Account';
import type { TransactionsGroup } from 'utils/feedData';
import type { ReferralRewardsIssuersAddresses } from 'reducers/referralsReducer';
import type { Asset } from 'models/Asset';
import type { AaveExtra } from 'models/Transaction';


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
  accounts: Accounts,
  isSmartWalletActivated: boolean,
  assetDecimals: number,
  isPPNView?: boolean,
  isForAllAccounts?: boolean,
  isAssetView?: boolean,
  referralRewardIssuersAddresses: ReferralRewardsIssuersAddresses,
  supportedAssets: Asset[],
};

export type EventData = {
  label?: string,
  itemImageSource?: string,
  actionLabel?: ?string,
  badge?: ?string,
  subtext?: string,
  labelAsButton?: boolean,
  avatarUrl?: string,
  username?: string,
  itemImageUrl?: string,
  iconName?: ?string,
  iconColor?: string,
  itemValue?: string,
  fullItemValue?: string,
  valueColor?: string,
  customAddon?: React.Node,
  itemStatusIcon?: string,
  iconBackgroundColor?: string,
  iconBorder?: boolean,
  fallbackToGenericToken?: boolean,
  secondaryButton?: boolean,
  buttonActionLabel?: string,
  isReceived?: boolean,
  isBetweenAccounts?: boolean,
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

const ListWrapper = styled.View`
  align-items: flex-end;
  padding-left: ${spacing.mediumLarge}px;
`;

const ItemValue = styled(BaseText)`
  font-size: ${fontSizes.big}px;
  color: ${themedColors.positive};
  text-align: right;
`;

const aaveImage = require('assets/images/apps/aave.png');

export class ActivityFeedItem extends React.Component<Props> {
  NAMES = {
    SMART_WALLET: t('smartWallet'),
    KEY_WALLET: t('keyWallet'),
    PPN_NETWORK: t('pillarNetwork'),
    AAVE_DEPOSIT: t('aaveDeposit'),
    POOL_TOGETHER: t('poolTogether'),
  };

  STATUSES = {
    CREATED: t('label.created'),
    IMPORTED: t('label.imported'),
    RECEIVED: t('label.received'),
    SENT: t('label.sent'),
    BACKUP: t('label.backedUp'),
    ACTIVATED: t('label.activated'),
    ADDED: t('label.added'),
    REMOVED: t('label.removed'),
  };

  FROM = {
    PPN_NETWORK: t('label.fromPPN'),
  };

  TO = {
    PPN_NETWORK: t('label.toPPN'),
  };

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
      const isBetweenAccounts = (isSWAddress(to, accounts) && isKWAddress(from, accounts))
        || (isSWAddress(from, accounts) && isKWAddress(to, accounts));
      return (isBetweenAccounts && isReceived)
        || (!isBetweenAccounts && isKWAddress(to, accounts))
        || (!isBetweenAccounts && isSWAddress(to, accounts));
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
    return iconUrl ? { uri: `${getEnv().SDK_PROVIDER}/${iconUrl}?size=3` } : null;
  };

  getSablierEventData = (event: Object) => {
    const { ensRegistry } = this.props;
    const { contactAddress } = event;
    const usernameOrAddress = findEnsNameCaseInsensitive(ensRegistry, contactAddress) || contactAddress;

    let data = {
      label: usernameOrAddress,
      cornerIcon: sablierLogo,
      profileImage: true,
    };

    switch (event.tag) {
      case SABLIER_CREATE_STREAM:
        data = {
          ...data,
          subtext: t('label.incomingSablierStream'),
          actionLabel: t('label.started'),
        };
        break;
      case SABLIER_CANCEL_STREAM:
        data = {
          ...data,
          subtext: t('label.incomingSablierStream'),
          actionLabel: t('label.canceled'),
        };
        break;
      case SABLIER_STREAM_ENDED: {
        data = {
          ...data,
          subtext: event.incoming ? t('label.incomingSablierStream') : t('label.outgoingSablierStream'),
          actionLabel: t('label.ended'),
        };
        break;
      }
      default:
        data = null;
    }
    return data;
  }

  getWalletCreatedEventData = (event: Object) => {
    const { isSmartWalletActivated, theme } = this.props;
    const { keyWalletIcon, smartWalletIcon } = images(theme);
    switch (event.eventTitle) {
      case 'Wallet created':
        return {
          label: this.NAMES.KEY_WALLET,
          itemImageSource: keyWalletIcon,
          actionLabel: this.STATUSES.CREATED,
        };
      case 'Smart Wallet created':
        return {
          label: this.NAMES.SMART_WALLET,
          itemImageSource: smartWalletIcon,
          actionLabel: this.STATUSES.CREATED,
          badge: isSmartWalletActivated ? null : t('label.needToActivate'),
        };
      case 'Wallet imported':
        return {
          label: this.NAMES.KEY_WALLET,
          itemImageSource: keyWalletIcon,
          actionLabel: this.STATUSES.IMPORTED,
        };
      default:
        return null;
    }
  };

  getUserEventData = (event: Object) => {
    const { isSmartWalletActivated, theme } = this.props;
    const { keyWalletIcon, PPNIcon } = images(theme);
    switch (event.subType) {
      case WALLET_CREATE_EVENT:
        return this.getWalletCreatedEventData(event);
      case PPN_INIT_EVENT:
        return {
          label: this.NAMES.PPN_NETWORK,
          itemImageSource: PPNIcon,
          actionLabel: this.STATUSES.CREATED,
          badge: isSmartWalletActivated ? null : t('label.needToActivate'),
        };
      case WALLET_BACKUP_EVENT:
        return {
          label: this.NAMES.KEY_WALLET,
          itemImageSource: keyWalletIcon,
          actionLabel: this.STATUSES.BACKUP,
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
      isForAllAccounts,
      isAssetView,
      referralRewardIssuersAddresses,
      supportedAssets,
    } = this.props;

    const isReceived = this.isReceived(event);
    let value = formatUnits(event.value, assetDecimals);
    if (event.transactionType === 'approve') {
      // if it's approval transaction, the value is some rubbish, so we hide it from the user
      value = '0';
    }
    const relevantAddress = this.getRelevantAddress(event);

    const assetSymbol = event ? event.asset : null;
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
      keyWalletIcon,
    } = images(theme);

    const fullItemValuePPN = getFormattedValue(formattedFullValue, event.asset, {
      isPositive: isPositivePPN,
      noSymbol: isZero,
    });
    const itemValuePPN = getFormattedValue(formattedValue, event.asset, {
      isPositive: isPositivePPN,
      noSymbol: isZero,
    });

    switch (event.tag) {
      case PAYMENT_NETWORK_ACCOUNT_DEPLOYMENT:
        data = {
          label: this.NAMES.SMART_WALLET,
          itemImageSource: smartWalletIcon,
          actionLabel: this.STATUSES.ACTIVATED,
        };
        break;
      case PAYMENT_NETWORK_ACCOUNT_TOPUP:
        if (isAssetView) {
          data = {
            label: this.NAMES.PPN_NETWORK,
            itemImageSource: PPNIcon,
            fullItemValue: fullItemValuePPN,
            itemValue: itemValuePPN,
            valueColor: 'text',
          };
        } else if (isPPNView) {
          data = {
            label: t('label.topUp'),
            itemImageSource: PPNIcon,
            fullItemValue: fullItemValuePPN,
            itemValue: itemValuePPN,
            valueColor: 'positive',
          };
        } else if (event.smartWalletEvent) {
          data = {
            label: this.NAMES.SMART_WALLET,
            subtext: this.TO.PPN_NETWORK,
            itemImageSource: smartWalletIcon,
            fullItemValue: fullItemValuePPN,
            itemValue: itemValuePPN,
            valueColor: 'text',
          };
        } else {
          data = {
            label: this.NAMES.PPN_NETWORK,
            subtext: t('label.topUp'),
            itemImageSource: PPNIcon,
            fullItemValue: fullItemValuePPN,
            itemValue: itemValuePPN,
            valueColor: 'positive',
          };
        }
        break;
      case SET_SMART_WALLET_ACCOUNT_ENS:
        data = {
          label: this.NAMES.SMART_WALLET,
          itemImageSource: smartWalletIcon,
          subtext: t('label.registerEnsName'),
        };
        break;
      case PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL:
        data = {
          fullItemValue: fullItemValuePPN,
          itemValue: itemValuePPN,
          valueColor: 'text',
        };
        if (isPPNView) {
          data.label = t('label.withdraw');
          data.iconName = 'sent'; // eslint-disable-line i18next/no-literal-string
          data.iconColor = 'negative'; // eslint-disable-line i18next/no-literal-string
        } else {
          data.label = this.NAMES.PPN_NETWORK;
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
                  secondary={isFailed}
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
      case SMART_WALLET_SWITCH_TO_GAS_TOKEN_RELAYER:
        data = {
          label: this.NAMES.SMART_WALLET,
          itemImageSource: smartWalletIcon,
          subtext: t('label.enableSmartWalletGasRelayerPLR'),
        };
        break;
      case SMART_WALLET_ACCOUNT_DEVICE_ADDED:
        data = {
          label: this.NAMES.SMART_WALLET,
          itemImageSource: roundedPhoneIcon,
          subtext: t('label.smartWalletAccountDeviceAdded'),
          actionLabel: this.STATUSES.ADDED,
        };
        break;
      case SMART_WALLET_ACCOUNT_DEVICE_REMOVED:
        data = {
          label: this.NAMES.SMART_WALLET,
          itemImageSource: roundedPhoneIcon,
          subtext: t('label.smartWalletAccountDeviceRemoved'),
          actionLabel: this.STATUSES.REMOVED,
        };
        break;
      case AAVE_LENDING_DEPOSIT_TRANSACTION:
        const depositDisplayValue = this.getAaveDisplayAmount(false);
        data = {
          label: this.NAMES.AAVE_DEPOSIT,
          itemValue: depositDisplayValue,
          fullItemValue: depositDisplayValue,
          valueColor: 'text',
          itemImageSource: aaveImage,
          itemImageRoundedSquare: true,
          iconImageSize: 52,
          cornerIcon: this.getAaveDepositedAssetImage(),
        };
        break;
      case AAVE_LENDING_WITHDRAW_TRANSACTION:
        const withdrawDisplayValue = this.getAaveDisplayAmount(true);
        data = {
          label: this.NAMES.AAVE_DEPOSIT,
          itemValue: withdrawDisplayValue,
          fullItemValue: withdrawDisplayValue,
          valueColor: 'positive',
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
          label: this.NAMES.POOL_TOGETHER,
          itemImageSource: poolTogetherLogo,
          cornerIcon: symbol === DAI ? daiIcon : usdcIcon,
          itemValue: getFormattedValue(formattedVal, symbol, { isPositive, noSymbol: !amount }),
          itemImageRoundedSquare: true,
          valueColor: isPositive ? 'positive' : 'text',
        };
        break;
      }
      case SABLIER_CREATE_STREAM:
      case SABLIER_WITHDRAW:
      case SABLIER_CANCEL_STREAM: {
        const { amount, contactAddress, assetAddress } = event.extra;
        const usernameOrAddress = findEnsNameCaseInsensitive(ensRegistry, contactAddress) || contactAddress;
        const assetData = getAssetDataByAddress([], supportedAssets, assetAddress);
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
            valueColor: 'text',
          };
        } else if (event.tag === SABLIER_WITHDRAW) {
          data = {
            ...data,
            subtext: t('label.withdraw'),
            itemValue: getFormattedValue(formattedAmount, symbol, { isPositive: true }),
            fullItemValue: getFormattedValue(formattedAmount, symbol, { isPositive: true }),
            valueColor: 'positive',
          };
        } else if (event.tag === SABLIER_CANCEL_STREAM) {
          data = {
            ...data,
            subtext: t('label.outgoingSablierStream'),
            itemValue: getFormattedValue(formattedAmount, symbol, { isPositive: true }),
            itemStatusIcon: TX_FAILED_STATUS,
            statusIconColor: this.getColor('negative'),
            isFailed: true,
          };
        }
        break;
      }
      default:
        const usernameOrAddress = event.username
          || ensRegistry[relevantAddress]
          || elipsizeAddress(relevantAddress);
        const isPPNTransaction = get(event, 'isPPNTransaction', false);

        const isTrxBetweenSWAccount = isSWAddress(event.from, accounts) && isSWAddress(event.to, accounts);
        const isReferralRewardTransaction = referralRewardIssuersAddresses.includes(relevantAddress) && isReceived;

        if (isPPNTransaction) {
          if (isTrxBetweenSWAccount) {
            data = {
              label: isAssetView ? this.NAMES.PPN_NETWORK : this.NAMES.SMART_WALLET,
              subtext: isAssetView ? '' : this.FROM.PPN_NETWORK,
              itemImageSource: isAssetView ? PPNIcon : smartWalletIcon,
              isReceived: true,
              fullItemValue: t('positiveTokenValue', { value: formattedFullValue, token: event.asset }),
              itemValue: t('positiveTokenValue', { value: formattedValue, token: event.asset }),
              valueColor: 'positive',
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
                  {!isReceived && <BaseText regular secondary>{formattedValue} {event.asset}</BaseText>}
                </ListWrapper>
              );
            } else {
              data.customAddon = (
                <ListWrapper>
                  <TankAssetBalance
                    amount={getFormattedValue(formattedValue, event.asset, {
                      isPositive: isReceived,
                      noSymbol: isZero,
                    })}
                  />
                </ListWrapper>
              );
            }
          }
        } else if (isPoolTogetherAddress(event.to)) {
          data = {
            label: this.NAMES.POOL_TOGETHER,
            itemImageSource: poolTogetherLogo,
            itemImageRoundedSquare: true,
          };
        } else {
          const additionalInfo = {};
          const isTrxBetweenAccounts = (isKWAddress(event.to, accounts) && isSWAddress(event.from, accounts)) ||
            (isKWAddress(event.from, accounts) && isSWAddress(event.to, accounts));

          const sendingAccountType = isReceived
            ? (findAccountByAddress(event.to, accounts) || {}).type
            : (findAccountByAddress(event.from, accounts) || {}).type;

          if (isTrxBetweenAccounts) {
            if (isForAllAccounts) {
              additionalInfo.itemImageSource = sendingAccountType === ACCOUNT_TYPES.KEY_BASED
                ? keyWalletIcon
                : smartWalletIcon;
            } else {
              additionalInfo.itemImageSource = event.accountType === ACCOUNT_TYPES.KEY_BASED
                ? keyWalletIcon
                : smartWalletIcon;
            }
            additionalInfo.isBetweenAccounts = true;
          }

          if (!isTrxBetweenAccounts) {
            additionalInfo.iconName = directionIcon;
            // eslint-disable-next-line i18next/no-literal-string
            additionalInfo.iconColor = isReceived ? 'transactionReceivedIcon' : 'negative';
          }

          if (isReferralRewardTransaction) {
            let referralAwardTokenImage;
            const referralAwardAssetData = supportedAssets.find(({ symbol }) => symbol === event.asset);
            if (referralAwardAssetData) {
              const { iconUrl } = referralAwardAssetData;
              referralAwardTokenImage = iconUrl ? `${getEnv().SDK_PROVIDER}/${iconUrl}?size=3` : '';
              additionalInfo.iconName = null;
              additionalInfo.avatarUrl = referralAwardTokenImage;
            }
            additionalInfo.label = t('label.referralReward');
          }

          data = {
            label: usernameOrAddress,
            fullItemValue: getFormattedValue(formattedFullValue, event.asset, {
              isPositive: isReceived,
              noSymbol: !formattedFullValue,
            }),
            itemValue: getFormattedValue(formattedValue, event.asset, { isPositive: isReceived, noSymbol: isZero }),
            valueColor: isReceived && !this.isZeroValue(value) ? 'positive' : 'text',
            ...additionalInfo,
            isReceived,
          };
        }
    }
    data.itemStatusIcon = data.itemStatusIcon || (isPending ? TX_PENDING_STATUS : '');
    if (isFailed) {
      data.itemStatusIcon = TX_FAILED_STATUS;
      data.statusIconColor = this.getColor('negative');
      data.isFailed = true;
    }
    return data;
  };

  getCollectibleTransactionEventData = (event: Object) => {
    const { accounts } = this.props;
    const isReceived = this.isReceived(event);
    const {
      asset,
      to,
      from,
      assetData: { image },
      icon,
    } = event;

    const relevantAddress = this.getRelevantAddress(event);

    const usernameOrAddress = getElipsizeAddress(relevantAddress);
    const isBetweenAccounts = (isSWAddress(to, accounts) && isKWAddress(from, accounts))
      || (isSWAddress(from, accounts) && isKWAddress(to, accounts));

    const subtext = isReceived
      ? t('label.collectibleFromUser', { username: usernameOrAddress })
      : t('label.collectibleToUser', { username: usernameOrAddress });

    return {
      label: asset,
      collectibleUrl: isSvgImage(image) ? image : icon,
      subtext,
      actionLabel: isReceived ? this.STATUSES.RECEIVED : this.STATUSES.SENT,
      iconBackgroundColor: 'card',
      iconBorder: true,
      fallbackToGenericToken: true,
      isReceived,
      isBetweenAccounts,
    };
  };

  getBadgeRewardEventData = (event: Object): EventData => {
    const { name, imageUrl } = event;
    return {
      label: name,
      itemImageUrl: imageUrl,
      subtext: t('label.badge'),
      actionLabel: this.STATUSES.RECEIVED,
    };
  };

  getEventData = (event: Object): ?EventData => {
    switch (event.type) {
      case USER_EVENT:
        return this.getUserEventData(event);
      case TRANSACTION_EVENT:
        return this.getTransactionEventData(event);
      case COLLECTIBLE_TRANSACTION:
        return this.getCollectibleTransactionEventData(event);
      case BADGE_REWARD_EVENT:
        return this.getBadgeRewardEventData(event);
      case SABLIER_EVENT:
        return this.getSablierEventData(event);
      default:
        return null;
    }
  };

  getColor = (color: ?string): ?string => {
    if (!color) return null;
    const { theme } = this.props;
    const colors = getThemeColors(theme);
    return colors[color] || color;
  };

  render() {
    const { event, selectEvent } = this.props;
    const itemData = this.getEventData(event);

    if (!itemData) return null;

    const {
      iconColor,
      valueColor,
      iconBackgroundColor,
      isFailed,
    } = itemData;

    return (
      <ListItemWithImage
        {...itemData}
        onPress={() => selectEvent(event, itemData)}
        actionLabelColor={this.getColor('secondaryText')}
        iconColor={this.getColor(iconColor)}
        diameter={48}
        iconBackgroundColor={this.getColor(iconBackgroundColor)}
        valueColor={isFailed ? this.getColor('secondaryText') : this.getColor(valueColor)}
      />
    );
  }
}

const mapStateToProps = ({
  ensRegistry: { data: ensRegistry },
  accounts: { data: accounts },
  referrals: { referralRewardIssuersAddresses },
  assets: { supportedAssets },
}: RootReducerState): $Shape<Props> => ({
  ensRegistry,
  accounts,
  referralRewardIssuersAddresses,
  supportedAssets,
});

const structuredSelector = createStructuredSelector({
  activeAccountAddress: activeAccountAddressSelector,
  isSmartWalletActivated: isSmartWalletActivatedSelector,
  assetDecimals: assetDecimalsSelector((_, props) => props.event.asset),
});

const combinedMapStateToProps = (state: RootReducerState, props) => ({
  ...structuredSelector(state, props),
  ...mapStateToProps(state),
});

export default withTheme(connect(combinedMapStateToProps)(ActivityFeedItem));
