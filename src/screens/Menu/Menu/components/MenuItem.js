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
import Icon, { type IconName } from 'components/modern/Icon';
import Text from 'components/core/Text';

// Utils
import { fontStyles, spacing } from 'utils/variables';


type Props = {|
  title: string,
  icon: IconName,
  onPress: () => mixed,
|};

const MenuItem = ({ title, icon, onPress }: Props) => {
  return (
    <Container>
      <TouchableContainer onPress={onPress}>
        <ItemIcon name={icon} width={16} height={16} />
        <Title>{title}</Title>
      </TouchableContainer>
    </Container>
  );
};

export default MenuItem;

const Container = styled.View``;

const TouchableContainer = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: ${spacing.large}px;
`;

const ItemIcon = styled(Icon)`
  margin-right: ${spacing.small}px;
`;

const Title = styled(Text)`
  ${fontStyles.medium};
`;
