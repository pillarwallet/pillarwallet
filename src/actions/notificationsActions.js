// @flow

import firebase from 'react-native-firebase';
import { Toast } from 'native-base';
import { validBcxTransaction } from 'utils/validators';
import { formatMoney } from 'utils/common';

let notificationsListener = null;

const parseNotification = (notificationBody: string) => {
  let messageObj;
  try {
    messageObj = JSON.parse(notificationBody);
  } catch (e) {
    console.log(e); // eslint-disable-line
  }
  return messageObj;
};

const processNotification = (notification: Object, myEthAddress) => {
  let messageText = '';
  if (notification.type === 'BCX') {
    // transaction notification
    const transaction = parseNotification(notification.msg);
    if (!transaction || !validBcxTransaction(transaction)) return;

    const sender = transaction.from.toUpperCase();
    const receiver = transaction.to.toUpperCase();
    const transactionValue = formatMoney(transaction.value, 4);

    if (receiver === myEthAddress && transaction.status === 'pending') {
      messageText = `New incoming transaction (${transactionValue} ${transaction.asset})`;
    } else if (receiver === myEthAddress && transaction.status === 'confirmed') {
      messageText = `Transaction of ${transactionValue} ${transaction.asset} confirmed`;
    } else if (sender === myEthAddress && transaction.status === 'pending') {
      messageText = 'Transaction sent';
    } else if (sender === myEthAddress && transaction.status === 'confirmed') {
      messageText = `Your transaction of ${transactionValue} ${transaction.asset} was received`;
    }
  }

  if (!messageText) return;

  Toast.show({
    text: messageText,
    buttonText: '',
  });
};

export const startListeningNotificationsAction = () => {
  return async (dispatch: Function, getState: Function) => { // eslint-disable-line
    const { wallet: { data: wallet } } = getState();
    // check if permissions enabled
    const enabled = await firebase.messaging().hasPermission();
    if (!enabled) {
      try {
        await firebase.messaging().requestPermission();
        // create a listener
      } catch (err) { return; } // eslint-disable-line
    }
    await firebase.messaging().getToken();
    if (notificationsListener) return;
    notificationsListener = firebase.messaging().onMessage((message) => {
      if (!message._data || !Object.keys(message._data).length) return;
      processNotification(message._data, wallet.address.toUpperCase());
    });
  };
};

export const stopListeningNotificationsAction = () => {
  return async (dispatch: Function) => { // eslint-disable-line
    if (!notificationsListener) return;
    notificationsListener();
    notificationsListener = null;
  };
};
