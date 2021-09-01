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
import styled from 'styled-components/native';

// Components
import ProfileImage from 'components/ProfileImage';
import Text from 'components/core/Text';

// Utils
import { getContactTitle } from 'utils/contacts';
import { fontStyles, spacing } from 'utils/variables';

// Types
import type { Contact } from 'models/Contact';

type Props = {|
  contact: Contact,
  onPress?: () => mixed,
|};

function ContactListItem({ contact, onPress }: Props) {
  const title = getContactTitle(contact);

  return (
    <TouchableItem onPress={onPress}>
      <ProfileImage userName={title} diameter={24} style={styles.icon} />
      <Title numberOfLines={1}>{title}</Title>
    </TouchableItem>
  );
}

export default ContactListItem;

const styles = {
  icon: {
    marginRight: spacing.mediumLarge,
  },
};

const TouchableItem = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: ${spacing.large}px ${spacing.large}px;
`;

const Title = styled(Text)`
  ${fontStyles.big};
  flex: 1;
`;
