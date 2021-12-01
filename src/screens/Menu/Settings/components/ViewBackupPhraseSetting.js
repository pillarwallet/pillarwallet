// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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

import * as React from 'react';
import { useNavigation } from 'react-navigation-hooks';
import { useTranslationWithPrefix } from 'translations/translate';

// Constants
import { REVEAL_BACKUP_PHRASE } from 'constants/navigationConstants';

// Selectors
import { useIsWalletBackedUp } from 'selectors/wallets';

// Types
import type { WalletObject } from 'models/Wallet';

// Utils
import { useThemeColors } from 'utils/themes';

// Local
import SettingsItem from './SettingsItem';

type Props = {
  wallet: ?WalletObject,
};

function ViewBackupPhraseSetting({ wallet }: Props) {
  const { t } = useTranslationWithPrefix('menu.settings');
  const navigation = useNavigation();
  const colors = useThemeColors();

  const isBackedUp = useIsWalletBackedUp();

  if (!isBackedUp || !wallet?.mnemonic) return null;

  const goToBackupPhrase = () => navigation.navigate(REVEAL_BACKUP_PHRASE, { wallet });

  return (
    <SettingsItem
      icon="key16"
      title={wallet?.mnemonic ? t('viewBackupPhrase') : t('viewPrivateKey')}
      value={t('backupComplete')}
      valueColor={colors.positive}
      onPress={goToBackupPhrase}
    />
  );
}

export default ViewBackupPhraseSetting;
