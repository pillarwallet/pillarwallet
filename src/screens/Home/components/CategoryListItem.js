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
import Text from 'components/core/Text';
import Icon from 'components/core/Icon';

// Utils
import { fontStyles, spacing } from 'utils/variables';

// Type
import type { IconName } from 'components/core/Icon';

export type Props = {|
  title: string,
  iconName: IconName,
  onPress: ?() => mixed,
  value?: ?string,
  visibleBalance?: boolean,
|};

function CategoryListItem({ title, iconName, visibleBalance, onPress, value }: Props) {
  return (
    <Container onPress={onPress}>
      <ItemIcon name={iconName} />

      <Title>{title}</Title>

      <ValueContainer>{!!value && <Value>{visibleBalance ? value : '***'}</Value>}</ValueContainer>
    </Container>
  );
}

export default CategoryListItem;

const Container = styled.TouchableOpacity`
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

const ItemIcon = styled(Icon)`
  margin-right: ${spacing.medium}px;
`;

const Title = styled(Text)`
  flex: 1;
  margin: ${spacing.large}px 0;
  ${fontStyles.big};
`;

const ValueContainer = styled.View`
  justify-content: center;
  align-items: flex-end;
`;

const Value = styled(Text)`
  ${fontStyles.big};
  font-variant: tabular-nums;
`;
