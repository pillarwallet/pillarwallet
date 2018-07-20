// @flow
import { utils } from 'ethers';
import {
  TYPE_ACCEPTED,
  TYPE_CANCELLED,
  TYPE_BLOCKED,
  TYPE_REJECTED,
  TYPE_RECEIVED,
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
];

export const processNotification = (notification: Object, myEthAddress: string): ?Object => {
  let result = null;
  const parsedNotification = parseNotification(notification.msg);
  if (!parsedNotification) return result;
  if (parsedNotification.type !== 'undefined' && parsedNotification.type === 'signal') {
    return {
      message: 'New message on chat',
      type: 'SIGNAL',
    };
  }
  if (connectionEvents.includes(parsedNotification.type)) {
    result = {
      message: 'Connection update',
      type: 'CONNECTION',
    };
  }
  if (notification.type === 'BCX') {
    if (!parsedNotification || !validBcxTransaction(parsedNotification)) return result;

    let message = '';
    const { asset, status, value } = parsedNotification;
    const sender = parsedNotification.fromAddress.toUpperCase();
    const receiver = parsedNotification.toAddress.toUpperCase();
    const amount = utils.formatUnits(utils.bigNumberify(value));

    if (receiver === myEthAddress && status === 'pending') {
      message = `New incoming transaction ${amount} ${asset}`;
    } else if (receiver === myEthAddress && status === 'confirmed') {
      message = `Transaction of ${amount} ${asset} confirmed`;
    } else if (sender === myEthAddress && status === 'pending') {
      message = 'Transaction sent';
    } else if (sender === myEthAddress && status === 'confirmed') {
      message = `Your transaction of ${amount} ${asset} was received`;
    }

    result = {
      message,
      asset,
      status,
      type: notification.type,
    };
  }

  return result;
};
