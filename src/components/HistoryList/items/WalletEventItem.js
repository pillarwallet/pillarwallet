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
import { useTranslation } from 'translations/translate';

// Components
import Text from 'components/modern/Text';

// Utils
import { useThemeColors } from 'utils/themes';

// Types
import { type WalletEvent, EVENT_TYPE } from 'models/History';

// Local
import HistoryListItem from './HistoryListItem';

type Props = {|
  event: WalletEvent,
  onPress?: () => mixed,
|};

function WalletEventItem({ event, onPress }: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  if (event.type === EVENT_TYPE.WALLET_CREATED) {
    return (
      <HistoryListItem
        iconName="wallet"
        title={t('label.wallet')}
        valueComponent={<Text color={colors.basic030}>{t('label.created')}</Text>}
        onPress={onPress}
      />
    );
  }

  if (event.type === EVENT_TYPE.WALLET_ACTIVATED) {
    return (
      <HistoryListItem
        iconName="wallet"
        title={t('label.wallet')}
        valueComponent={<Text color={colors.basic030}>{t('label.activated')}</Text>}
        onPress={onPress}
      />
    );
  }

  return null;
}

export default WalletEventItem;
