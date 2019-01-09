// @flow
import Toast from 'components/Toast';

export function toastWalletBackup(isWalletBackedUp: boolean) {
  if (!isWalletBackedUp) {
    Toast.show({
      message: 'Go to settings on the home screen and complete the wallet backup. Pillar cannot help you retrieve your wallet if it is lost.', // eslint-disable-line max-len
      type: 'warning',
      title: 'Please ensure you backup your wallet now',
      autoClose: false,
    });
  }
}
