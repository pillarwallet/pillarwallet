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
import { useTranslation } from 'translations/translate';

// Components
import { Spacing } from 'components/modern/Layout';
import Button from 'components/modern/Button';
import Text from 'components/modern/Text';

// Constants
import { BADGE } from 'constants/navigationConstants';

// Utils
import { spacing } from 'utils/variables';

// Types
import type { BadgeReceivedEvent } from 'models/History';

// Local
import BaseEventDetails from './BaseEventDetails';

type Props = {|
  event: BadgeReceivedEvent,
|};

function BadgeReceivedEventDetails({ event }: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation();

  return (
    <BaseEventDetails
      date={event.date}
      title={event.title}
      subtitle={t('label.badge')}
      iconUrl={event.iconUrl}
    >
      <Text variant="large">{t('label.received')}</Text>
      <Spacing h={spacing.extraLarge} />

      <Button
        variant="secondary"
        title={t('button.viewBadge')}
        onPress={() => navigation.navigate(BADGE, { badgeId: event.badgeId })}
      />
    </BaseEventDetails>
  );
}

export default BadgeReceivedEventDetails;
