// @flow
import Toast from 'components/Toast';

export function toastWalletBackup(isWalletBackedUp: boolean) {
  if (!isWalletBackedUp) {
    Toast.show({
      message: 'Please go to settings to complete wallet backup. Pillar cannot help you retrieve your wallet if lost.', // eslint-disable-line max-len
      type: 'warning',
      title: 'Your funds are currently at risk.',
      autoClose: false,
    });
  }
}
