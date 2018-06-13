// @flow
import { formatMoney } from 'utils/common';

const parseNotification = (notificationBody: string) => {
  let messageObj;
  try {
    messageObj = JSON.parse(notificationBody);
  } catch (e) {
    console.log(e); // eslint-disable-line
  }
  return messageObj;
};

const validBcxTransaction = (transaction: ?Object): boolean => {
  if (!transaction || !transaction.from || !transaction.to) return false;
  if (!transaction.status || !transaction.asset) return false;
  return true;
};

export const processNotification = (notification: Object, myEthAddress: string): ?Object => {
  let result = null;

  if (notification.type === 'BCX') {
    const transaction = parseNotification(notification.msg);
    if (!transaction || !validBcxTransaction(transaction)) return result;

    let message = '';
    const sender = transaction.from.toUpperCase();
    const receiver = transaction.to.toUpperCase();
    const amount = formatMoney(transaction.value, 4);
    const { asset, status } = transaction;

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
