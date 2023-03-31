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
import { Image } from 'react-native';
import styled from 'styled-components/native';
import SafeAreaView from 'react-native-safe-area-view';

// Components
import Icon from 'components/core/Icon';
import Text from 'components/core/Text';

// Utils
import { spacing } from 'utils/variables';

// Types
import type { ImageSource } from 'utils/types/react-native';
import type { IconName } from 'components/core/Icon';

export type Item = {|
  title: string,
  iconName?: IconName,
  iconSource?: ImageSource,
  onPress?: () => mixed,
  customIcon?: any,
  disabled?: boolean,
|};

type Props = {|
  items: (?Item | false)[],
  applyBottomInset?: boolean,
|};

const FloatingButtons = ({ items: falsyItems, applyBottomInset = true }: Props) => {
  const items: Item[] = (falsyItems.filter(Boolean): any);

  if (items.length === 0) {
    return null;
  }

  const forceInset = applyBottomInset ? { bottom: 'always' } : undefined;

  return (
    <FloatingContainer forceInset={forceInset}>
      <Container>
        {items.map((item) => (
          <ItemTouchable key={item.title} onPress={item.onPress} disabled={item.disabled} testID="FloatingButtonItem">
            <ItemIconWrapper>
              {!!item.iconName && <Icon name={item.iconName} />}
              {!!item.customIcon && item.customIcon}
              {!!item.iconSource && <ItemIconImage source={item.iconSource} />}
            </ItemIconWrapper>
            <ItemTitle>{item.title}</ItemTitle>
          </ItemTouchable>
        ))}
      </Container>
    </FloatingContainer>
  );
};

// Bottom content inset to apply to ScrollView/FlatView in order allow for interaction
// with all content underneath. It assumes icon size of 24 px.
FloatingButtons.SCROLL_VIEW_BOTTOM_INSET = 120;

export default FloatingButtons;

const FloatingContainer = styled(SafeAreaView)`
  position: absolute;
  bottom: ${spacing.large}px;
  align-self: center;
`;

const Container = styled.View`
  flex-direction: row;
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

const ItemTouchable = styled.TouchableOpacity`
  align-items: center;
  padding-horizontal: 4px;
  padding-top: ${spacing.mediumLarge}px;
  padding-bottom: ${spacing.medium}px;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
`;

const ItemIconWrapper = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  margin-horizontal: ${spacing.largePlus}px;
`;

const ItemIconImage = styled(Image)`
  width: 24px;
  height: 24px;
`;

const ItemTitle = styled(Text)`
  margin-top: 6px;
  text-align: center;
`;
