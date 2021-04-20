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
import { Spacing } from 'components/Layout';
import Button from 'components/modern/Button';
import FeeLabel from 'components/modern/FeeLabel';
import Icon from 'components/modern/Icon';
import Text from 'components/modern/Text';

// Utils
import { viewOnBlockchain } from 'utils/linking';
import { useThemeColors } from 'utils/themes';
import { spacing } from 'utils/variables';

// Types
import type { EnsNameEvent } from 'models/History';

// Local
import BaseEventDetails from './BaseEventDetails';


type Props = {|
  event: EnsNameEvent,
|};

function EnsNameEventDetails({ event }: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <BaseEventDetails
      date={event.date}
      title={t('ensName')}
      subtitle={event.ensName}
      iconComponent={<Icon name="profile" color={colors.homeEnsNameIcon} width={64} height={64} />}
    >
      <Text variant="large">{t('label.registered')}</Text>
      <Spacing h={spacing.extraLarge} />

      <FeeLabel value={event.fee.value} symbol={event.fee.symbol} mode="actual" />
      <Spacing h={spacing.mediumLarge} />

      <Button variant="secondary" title={t('button.viewOnBlockchain')} onPress={() => viewOnBlockchain(event.hash)} />
    </BaseEventDetails>
  );
}

export default EnsNameEventDetails;
