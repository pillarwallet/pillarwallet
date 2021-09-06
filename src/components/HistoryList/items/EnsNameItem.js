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
import Icon from 'components/core/Icon';
import Text from 'components/core/Text';

// Utils
import { useThemeColors } from 'utils/themes';

// Types
import { type EnsNameRegisteredEvent } from 'models/History';

// Local
import HistoryListItem from './HistoryListItem';

type Props = {|
  event: EnsNameRegisteredEvent,
  onPress?: () => mixed,
|};

function EnsNameItem({ event, onPress }: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <HistoryListItem
      iconComponent={<Icon name="profile" color={colors.homeEnsNameIcon} />}
      title={t('ensName')}
      subtitle={event.ensName}
      valueComponent={<Text color={colors.basic030}>{t('label.registered')}</Text>}
      onPress={onPress}
    />
  );
}

export default EnsNameItem;
