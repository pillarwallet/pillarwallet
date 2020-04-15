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
import { NavigationActions } from 'react-navigation';
import Toast from 'components/Toast';
import { RECOVERY_SETTINGS } from 'constants/navigationConstants';
import { navigate } from 'services/navigation';

const BACKUP_MESSAGE =
  'Go to wallet settings on the assets screen and complete the wallet backup. ' +
  'Pillar cannot help you retrieve your wallet if it is lost.';

export const toastWalletBackup = (isWalletBackedUp: boolean) => {
  if (isWalletBackedUp) {
    return;
  }

  Toast.show({
    message: BACKUP_MESSAGE,
    type: 'warning',
    title: 'Please ensure you backup your wallet now',
    autoClose: false,
    onPress: () => {
      const action = NavigationActions.navigate({
        routeName: RECOVERY_SETTINGS,
      });
      navigate(action);
    },
  });
};
