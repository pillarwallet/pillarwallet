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
import { BaseText } from 'components/Typography';
import Icon from 'components/Icon';

// Utils
import { spacing } from 'utils/variables';

// Types
import type { IconName } from 'components/Icon';

export type Item = {|
  title: string,
  iconName: IconName,
  onPress?: () => mixed,
|};

type Props = {|
  items: (?Item | false)[],
|};

const FloatingButtons = ({ items: falsyItems }: Props) => {
  const items: Item[] = (falsyItems.filter(Boolean): any);

  if (items.length === 0) {
    return null;
  }

  return (
    <Container>
      {items.map((item) => (
        <ItemView key={item.title} onPress={item.onPress} testID="FloatingButtonItem">
          <ItemIconWrapper>
            <ItemIcon name={item.iconName} />
          </ItemIconWrapper>
          <ItemTitle>{item.title}</ItemTitle>
        </ItemView>
      ))}
    </Container>
  );
};

// Bottom content inset to apply to ScrollView/FlatView in order allow for interaction
// with all content underneath. It assumes icon size of 24 px.
FloatingButtons.SCROLL_VIEW_BOTTOM_INSET = 160;

export default FloatingButtons;

const Container = styled.View`
  position: absolute;
  bottom: 50px;
  flex-direction: row;
  align-self: center;
  align-items: center;
  padding-horizontal: ${spacing.large / 2}px;
  background-color: ${({ theme }) => theme.colors.basic050};
  border-radius: 20px;
  shadow-opacity: 0.05;
  shadow-color: #000;
  shadow-offset: 0 8px;
  shadow-radius: 16px;
  elevation: 6;
`;

const ItemView = styled.TouchableOpacity`
  align-items: center;
  padding-horizontal: ${spacing.extraLarge / 2}px;
  padding-top: ${spacing.mediumLarge}px;
  padding-bottom: ${spacing.medium}px;
`;

const ItemIconWrapper = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  margin-horizontal: ${spacing.extraLarge}px;
`;

const ItemIcon = styled(Icon)`
  font-size: 24px;
  color: ${({ theme }) => theme.colors.basic010};
`;

const ItemTitle = styled(BaseText).attrs({ regular: true })`
  margin-top: ${spacing.extraSmall}px;
  text-align: center;
`;
