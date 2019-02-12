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
