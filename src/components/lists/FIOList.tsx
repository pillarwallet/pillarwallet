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
import { TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';

// Components
import Text from 'components/core/Text';

// Utils
import { fontStyles, spacing } from 'utils/variables';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';
import type { Contact } from 'models/Contact';

// Local
import RadioButton from '../RadioButton/RadioButton';

type Props = {
  data: Contact[];
  selectedContact: Object | any;
  onSelect: (res: Contact) => void;
  style?: ViewStyleProp;
};

function FIOList({ selectedContact, data, onSelect, style }: Props) {
  if (!data || data.length === 1) {
    return null;
  }

  const renderItem = (item, index) => {
    const { label, address, zone } = item;
    return (
      <Container key={'___list' + index + label} onPress={() => onSelect(item)} style={style}>
        <RadioButton visible={selectedContact?.address === address} />
        <TitleContainer>
          <Title numberOfLines={1}>{zone === 'FIO' ? address : label}</Title>
        </TitleContainer>
      </Container>
    );
  };

  return <>{data.map(renderItem)}</>;
}

export default FIOList;

const Container = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  padding: ${spacing.medium}px ${spacing.large}px;
  min-height: 50px;
`;

const TitleContainer = styled.View`
  flex: 1;
  justify-content: center;
  padding-left: 10px;
`;

const Title = styled(Text)`
  ${fontStyles.medium};
`;
