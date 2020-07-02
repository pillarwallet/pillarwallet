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
import { utils } from 'ethers';
import { Notifications } from 'react-native-notifications';
import isEmpty from 'lodash.isempty';
// $FlowFixMe – throws "react-native-android-badge" not found
import BadgeAndroid from 'react-native-android-badge';

// constants
import {
  TYPE_ACCEPTED,
  TYPE_CANCELLED,
  TYPE_BLOCKED,
  TYPE_REJECTED,
  TYPE_RECEIVED,
  TYPE_DISCONNECTED,
  MESSAGE_ACCEPTED,
  MESSAGE_DISCONNECTED,
  MESSAGE_REQUEST,
} from 'constants/invitationsConstants';
import { COLLECTIBLE, CONNECTION, BCX, BADGE } from 'constants/notificationConstants';

// utils
import { reportLog } from 'utils/common';

// models
import type { ApiNotification } from 'models/Notification';


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
    reportLog('Wrong BCX tx notification received', { transaction });
    return false;
  }
  return true;
};

export const validEthplorerTransaction = (transaction: ?Object): boolean => {
  if (!transaction || !transaction.from || !transaction.to) return false;
  return true;
};

const validCollectibleTransaction = (transaction: ?Object): boolean => {
  if (!transaction || !transaction.fromAddress || !transaction.toAddress) return false;
  if (!transaction.status || !transaction.contractAddress) return false;
  return true;
};

const connectionEvents = [
  TYPE_ACCEPTED,
  TYPE_CANCELLED,
  TYPE_BLOCKED,
  TYPE_REJECTED,
  TYPE_RECEIVED,
  TYPE_DISCONNECTED,
];

export const processNotification = (notification: Object, myEthAddress?: string): ?Object => {
  let result = null;
  const parsedNotification = parseNotification(notification.msg);
  if (!parsedNotification) return result;

  if (connectionEvents.includes(parsedNotification.type)) {
    if (parsedNotification.type === 'connectionRequestedEvent') {
      result = {
        title: parsedNotification.senderUserData.username,
        message: MESSAGE_REQUEST,
        type: CONNECTION,
        status: TYPE_RECEIVED,
      };
    } else if (parsedNotification.type === TYPE_ACCEPTED) {
      result = {
        title: parsedNotification.senderUserData.username,
        message: MESSAGE_ACCEPTED,
        type: CONNECTION,
        status: TYPE_ACCEPTED,
      };
    } else if (parsedNotification.type === TYPE_DISCONNECTED) {
      result = {
        title: parsedNotification.senderUserData.username,
        message: MESSAGE_DISCONNECTED,
        type: CONNECTION,
        status: TYPE_REJECTED,
      };
    } else {
      result = {
        message: 'Connection update',
        type: CONNECTION,
      };
    }
  }
  if (notification.type === BCX) {
    if (!parsedNotification || !validBcxTransaction(parsedNotification)) return result;

    let message = '';
    let title = '';
    const {
      asset,
      status,
      value,
      decimals,
    } = parsedNotification;
    const sender = parsedNotification.fromAddress.toUpperCase();
    const receiver = parsedNotification.toAddress.toUpperCase();
    const amount = utils.formatUnits(utils.bigNumberify(value.toString()), decimals);

    if (receiver === myEthAddress && status === 'pending') {
      title = `${amount} ${asset}`;
      message = 'Received';
    } else if (receiver === myEthAddress && status === 'confirmed') {
      title = `${amount} ${asset}`;
      message = 'Transaction confirmed';
    } else if (sender === myEthAddress && status === 'pending') {
      title = `${amount} ${asset}`;
      message = 'Transaction sent';
    } else if (sender === myEthAddress && status === 'confirmed') {
      title = `${amount} ${asset}`;
      message = 'Transaction was received';
    }

    result = {
      title,
      message,
      asset,
      status,
      type: notification.type,
    };
  }

  if (notification.type === BADGE) {
    result = {
      title: 'Success',
      message: 'New badge received!',
      type: notification.type,
    };
  }

  if (!!notification.type && notification.type.toUpperCase() === COLLECTIBLE) {
    if (!parsedNotification || !validCollectibleTransaction(parsedNotification)) return result;

    let message = '';
    let title = '';
    const {
      contractName,
    } = parsedNotification;
    const sender = parsedNotification.fromAddress.toUpperCase();
    const receiver = parsedNotification.toAddress.toUpperCase();

    if (receiver === myEthAddress) {
      title = contractName;
      message = 'You received a collectible';
    } else if (sender === myEthAddress) {
      title = contractName;
      message = 'Your collectible has been received';
    }

    result = {
      title,
      message,
      type: COLLECTIBLE,
    };
  }

  return result;
};

export const mapInviteNotifications = (notifications: ApiNotification[]): Object[] => notifications
  .map(({ createdAt, payload }) => {
    let notification: Object = { createdAt };

    // note: payload.msg is optional and per Sentry reports might not be JSON
    if (payload.msg) {
      try {
        const parsedMessage = JSON.parse(payload.msg);
        notification = { ...notification, ...parsedMessage };
      } catch (e) {
        //
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
