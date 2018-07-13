// @flow
import { formatMoney } from 'utils/common';
import {
  TYPE_ACCEPTED,
  TYPE_CANCELLED,
  TYPE_BLOCKED,
  TYPE_REJECTED,
  TYPE_RECEIVED,
} from 'constants/invitationsConstants';


const parseNotification = (notificationBody: string): ?Object => {
  let messageObj = {};
  try {
    messageObj = JSON.parse(notificationBody);
  } catch (e) {
    messageObj = null; // eslint-disable-line
  }
  return messageObj;
};

const validBcxTransaction = (transaction: ?Object): boolean => {
  if (!transaction || !transaction.from || !transaction.to) return false;
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
  if (connectionEvents.includes(parsedNotification.type)) {
    result = {
      message: 'Connection update',
      type: 'CONNECTION',
    };
  }
  if (parsedNotification.type === 'BCX') {
    if (!parsedNotification || !validBcxTransaction(parsedNotification)) return result;

    let message = '';
    const sender = parsedNotification.fromAddress.toUpperCase();
    const receiver = parsedNotification.toAddress.toUpperCase();
    const amount = formatMoney(parsedNotification.value, 4);
    const { asset, status } = parsedNotification;

    if (receiver === myEthAddress && status === 'pending') {
      message = `New incoming transaction (${amount} ${asset})`;
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
    };
  }

  return result;
};
