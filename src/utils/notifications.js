// @flow
import { utils } from 'ethers';
import {
  TYPE_ACCEPTED,
  TYPE_CANCELLED,
  TYPE_BLOCKED,
  TYPE_REJECTED,
  TYPE_RECEIVED,
  TYPE_DISCONNECTED,
} from 'constants/invitationsConstants';


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
  if (parsedNotification.type === 'signal') {
    return {
      message: 'New message',
      title: parsedNotification.sender,
      type: 'SIGNAL',
      navigationParams: { username: parsedNotification.sender },
    };
  }

  if (connectionEvents.includes(parsedNotification.type)) {
    if (parsedNotification.type === TYPE_RECEIVED) {
      result = {
        title: parsedNotification.senderUserData.username,
        message: 'Connection request',
        type: 'CONNECTION',
        status: TYPE_RECEIVED,
        id: parsedNotification.senderUserData.id,
      };
    } else if (parsedNotification.type === TYPE_ACCEPTED) {
      result = {
        title: parsedNotification.senderUserData.username,
        message: 'Accepted your connection request',
        type: 'CONNECTION',
        status: TYPE_ACCEPTED,
        id: parsedNotification.senderUserData.id,
      };
    } else if (parsedNotification.type === TYPE_DISCONNECTED) {
      result = {
        title: parsedNotification.senderUserData.username,
        message: 'Disconnected your connection',
        type: 'CONNECTION',
        status: TYPE_DISCONNECTED,
        id: parsedNotification.senderUserData.id,
      };
    } else if (parsedNotification.type === TYPE_REJECTED) {
      result = {
        title: parsedNotification.senderUserData.username,
        message: 'Rejected your connection request',
        type: 'CONNECTION',
        status: TYPE_REJECTED,
        id: parsedNotification.senderUserData.id,
      };
    } else {
      result = {
        message: 'Connection update',
        type: 'CONNECTION',
      };
    }
  }
  if (notification.type === 'BCX') {
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

  return result;
};
