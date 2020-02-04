// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

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
import { FlatList, Image, Dimensions } from 'react-native';
import styled from 'styled-components/native';
import { themedColors } from 'utils/themes';
import { spacing, fontStyles } from 'utils/variables';
import { POPULAR_SWAPS } from 'constants/assetsConstants';

const { width: screenWidth } = Dimensions.get('window');
const threeColumnsMinScreenWidth = 350;

type Props = {
  onPress: (from: string, to: string) => void,
};

type SwapPillProps = {
  from: string,
  to: string,
  grid: ?boolean,
  onPress: (from: string, to: string) => void,
};

const WrappingContainer = styled.View`
  background-color: ${themedColors.card};
  border-bottom-color: ${themedColors.tertiary};
  border-bottom-width: 1px;
`;

const IconWrapper = styled.View`
  align-items: center;
  margin: 0 ${spacing.rhythm}px;
`;

const PopularSwapsText = styled.Text`
  color: ${themedColors.popularSwaps};
  text-align: center;
`;

const Pill = styled.TouchableOpacity`
  background-color: ${themedColors.tertiary};
  border-radius: 6px;
  padding: 10px 20px;
  margin: 0 2px;
`;

const GridPill = styled.TouchableOpacity`
  background-color: ${themedColors.tertiary};
  border-radius: 6px;
  padding: 10px 10px;
  margin: 5px;
  flex: 1;
  align-items: center;
`;

const PlaceholderPill = styled.View`
  padding: 10px 10px;
  margin: 5px;
  flex: 1;
`;

const SwapText = styled.Text`
  color: ${themedColors.primary};
  ${fontStyles.small}
`;

const hotSwapsIcon = require('assets/icons/popular.png');

const SwapPill = (props: SwapPillProps) => {
  const {
    from,
    to,
    grid = false,
    onPress,
  } = props;

  const PillComponent = grid ? GridPill : Pill;

  return (
    <PillComponent onPress={onPress}>
      <SwapText>{from} → {to}</SwapText>
    </PillComponent>
  );
};

export const HotSwapsHorizontalList = (props: Props) => {
  const { onPress } = props;
  return (
    <WrappingContainer>
      <FlatList
        horizontal
        data={POPULAR_SWAPS}
        renderItem={({ item }) => <SwapPill {...item} onPress={() => onPress(item.from, item.to)} />}
        keyExtractor={item => `${item.from}-${item.to}`}
        ListHeaderComponent={
          <IconWrapper>
            <Image source={hotSwapsIcon} />
            <PopularSwapsText>Popular{'\n'}swaps</PopularSwapsText>
          </IconWrapper>
        }
        contentContainerStyle={{
          alignItems: 'center',
          paddingVertical: spacing.mediumLarge,
        }}
      />
    </WrappingContainer>
  );
};

export const HotSwapsGridList = (props: Props) => {
  const { onPress } = props;
  // on small devices 3 columns will cause text lines to be broken
  // on larger devices 2 columns will cause pills to be too wide
  const columns = screenWidth >= threeColumnsMinScreenWidth ? 3 : 2;
  const data = [...POPULAR_SWAPS];
  while (data.length % columns !== 0) {
    data.push({});
  }

  return (
    <FlatList
      data={data}
      columnWrapperStyle={{
        paddingHorizontal: 15,
        justifyContent: 'space-around',
      }}
      renderItem={
        ({ item }) => {
          return item.from ?
            <SwapPill {...item} onPress={() => onPress(item.from, item.to)} grid /> :
            <PlaceholderPill />;
        }
      }
      keyExtractor={item => `${item.from}-${item.to}`}
      numColumns={columns}
    />
  );
};
