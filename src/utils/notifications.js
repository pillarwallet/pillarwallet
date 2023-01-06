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
import { Platform } from 'react-native';
import { utils, BigNumber as EthersBigNumber } from 'ethers';
import { Notifications } from 'react-native-notifications';
import isEmpty from 'lodash.isempty';
import t from 'translations/translate';
import { BigNumber } from 'bignumber.js';

// $FlowFixMe – throws "react-native-android-badge" not found
import BadgeAndroid from 'react-native-android-badge';

// Constants
import { COLLECTIBLE, BCX, BADGE, FCM_DATA_TYPE } from 'constants/notificationConstants';
import { TRANSACTION_TYPE } from 'constants/transactionsConstants';

// Utils
import { logBreadcrumb, getCurrencySymbol } from 'utils/common';
import { addressesEqual } from 'utils/assets';
import { getAssetValueInFiat } from 'utils/rates';
import { formatFiatValue } from 'utils/format';
import { chainFromChainId } from 'utils/chains';
import { getTxFeeInFiat } from 'utils/transactions';

// Selectors
import { useFiatCurrency, useChainRates } from 'selectors';

// Models
import type { ApiNotification, Notification } from 'models/Notification';

const parseNotification = (notificationBody: string): ?Object => {
  let messageObj = null;
  try {
    messageObj = JSON.parse(notificationBody);
  } catch (e) {
    // do nothing
  }
  return messageObj;
};

const validBcxTransaction = (transaction: ?Object): boolean => {
  if (!transaction || !transaction.fromAddress || !transaction.toAddress) return false;
  if (!transaction.status || !transaction.asset) return false;
  if (transaction.value === undefined) {
    logBreadcrumb('validBcxTransaction', 'Wrong BCX tx notification received', { transaction });
    return false;
  }
  return true;
};

const validCollectibleTransaction = (transaction: ?Object): boolean => {
  if (!transaction || !transaction.fromAddress || !transaction.toAddress) return false;
  if (!transaction.status || !transaction.contractAddress) return false;
  return true;
};

export const processNotification = (notification: Object): ?Object => {
  let result = null;
  const parsedNotification = parseNotification(notification.msg);
  if (!parsedNotification) return result;

  if (notification.type === BCX) {
    if (!parsedNotification || !validBcxTransaction(parsedNotification)) return result;
    result = { type: notification.type };
  }

  if (notification.type === BADGE) {
    result = { type: notification.type };
  }

  if (!!notification.type && notification.type.toUpperCase() === COLLECTIBLE) {
    if (!parsedNotification || !validCollectibleTransaction(parsedNotification)) return result;
    result = { type: COLLECTIBLE };
  }

  return result;
};

export const getToastNotification = (data: mixed, myEthAddress: ?string): null | Notification => {
  if (typeof data !== 'object') return null;
  const { type, msg } = data ?? {};
  const notification = typeof msg === 'string' && parseNotification(msg);
  if (!notification) return null;

  if (type === FCM_DATA_TYPE.BCX) {
    if (!validBcxTransaction(notification)) return null;

    const { asset, status, value, decimals, fromAddress: sender, toAddress: receiver } = notification;

    const tokenValue = t('tokenValue', {
      value: utils.formatUnits(EthersBigNumber.from(value.toString()), decimals),
      token: asset,
    });

    if (addressesEqual(receiver, myEthAddress) && status === 'pending') {
      return {
        message: t('notification.transactionReceivedPending', { tokenValue }),
        emoji: 'ok_hand',
      };
    } else if (addressesEqual(receiver, myEthAddress) && status === 'confirmed') {
      return {
        message: t('notification.transactionReceivedConfirmed', { tokenValue }),
        emoji: 'ok_hand',
      };
    } else if (addressesEqual(sender, myEthAddress) && status === 'pending') {
      return {
        message: t('notification.transactionSentPending', { tokenValue }),
        emoji: 'ok_hand',
      };
    } else if (addressesEqual(sender, myEthAddress) && status === 'confirmed') {
      return {
        message: t('notification.transactionSentConfirmed', { tokenValue }),
        emoji: 'ok_hand',
      };
    }
  }

  if (type === FCM_DATA_TYPE.COLLECTIBLE) {
    if (!validCollectibleTransaction(notification)) return null;
    const { fromAddress: sender, toAddress: receiver } = notification;

    if (addressesEqual(receiver, myEthAddress)) {
      return {
        message: t('notification.receivedCollectible'),
        emoji: 'ok_hand',
      };
    } else if (addressesEqual(sender, myEthAddress)) {
      return {
        message: t('notification.collectibleSentAndReceived'),
        emoji: 'ok_hand',
      };
    }
  }

  return null;
};

export const mapInviteNotifications = (notifications: ApiNotification[]): Object[] =>
  notifications
    .map(({ createdAt, payload }) => {
      let notification: Object = { createdAt };

      // note: payload.msg is optional and per Sentry reports might not be JSON
      if (payload.msg) {
        try {
          const parsedMessage = JSON.parse(payload.msg);
          notification = { ...notification, ...parsedMessage };
        } catch (e) {
          logBreadcrumb('mapInviteNotifications', 'failed Invite notification payload', { e });
        }
      }

      return notification;
    })
    .filter(({ createdAt, ...rest }) => !isEmpty(rest)) // filter if notification empty after parsing
    .map(({ senderUserData, type, createdAt }) => ({ ...senderUserData, type, createdAt }))
    .sort((a, b) => b.createdAt - a.createdAt);

export const resetAppNotificationsBadgeNumber = () => {
  if (Platform.OS === 'ios') {
    Notifications.ios.setBadgeCount(0);
    return;
  }
  BadgeAndroid.setBadge(0);
};

export function useExchangeAmountsNotification(offer: any) {
  const { fromAmount, toAmount, fromAsset, toAsset, gasFeeAsset, feeInfo } = offer;

  if (fromAsset?.chainId) {
    fromAsset.chain = chainFromChainId[fromAsset.chainId];
  }
  if (toAsset?.chainId) {
    toAsset.chain = chainFromChainId[toAsset.chainId];
  }

  const fromRates = useChainRates(fromAsset.chain);
  const toRates = useChainRates(toAsset.chain);
  const gasFeeRates = useChainRates(gasFeeAsset.chain);
  const currency = useFiatCurrency();

  // eslint-disable-next-line i18next/no-literal-string
  const decimalValue: any = `10e${gasFeeAsset?.decimals - 1}`;
  const gasFee: any = parseInt(feeInfo.fee, 10) / (decimalValue ?? 1);

  const fromFiatValue = getAssetValueInFiat(fromAmount, fromAsset?.address, fromRates, currency) ?? new BigNumber(0);
  const fromFormattedFiatValue = formatFiatValue(fromFiatValue, currency);
  const toFiatValue = getAssetValueInFiat(toAmount, toAsset?.address, toRates, currency) ?? new BigNumber(0);
  const toFormattedFiatValue = formatFiatValue(toFiatValue, currency);
  const gasFeeFiatValue = getAssetValueInFiat(gasFee, gasFeeAsset?.address, gasFeeRates, currency) ?? new BigNumber(0);
  const gasFeeFormattedFiatValue = formatFiatValue(gasFeeFiatValue, currency);

  return { fromValue: fromFormattedFiatValue, toValue: toFormattedFiatValue, gasValue: gasFeeFormattedFiatValue };
}

export function useSendTransactionNotification(data: any) {
  const { gasToken, assetData, chain, txFeeInWei, amount, type } = data;

  const chainRates = useChainRates(chain);
  const currency = useFiatCurrency();
  const currencySymbol = getCurrencySymbol(currency);

  const feeInFiat = getTxFeeInFiat(chain, txFeeInWei, gasToken, chainRates, currency);
  const feeInFiatDisplayValue = `${currencySymbol}${feeInFiat.toFixed(2)}`;

  if (type === TRANSACTION_TYPE.SENDNFT) {
    return { value: data.name, gasValue: feeInFiatDisplayValue };
  }

  const fiatValue = getAssetValueInFiat(amount, assetData?.address, chainRates, currency) ?? new BigNumber(0);
  const formattedFiatValue = formatFiatValue(fiatValue, currency);

  return { value: formattedFiatValue, gasValue: feeInFiatDisplayValue };
}
