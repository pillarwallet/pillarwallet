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
import { FlatList, Image, Dimensions, StyleSheet } from 'react-native';
import styled from 'styled-components/native';
import { themedColors } from 'utils/themes';
import { spacing, fontStyles } from 'utils/variables';
import { POPULAR_SWAPS } from 'constants/assetsConstants';
import { BaseText } from 'components/Typography';

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
  style?: StyleSheet.Styles,
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

const PopularSwapsText = styled(BaseText)`
  color: ${themedColors.popularSwaps};
  text-align: center;
  ${fontStyles.tiny}
`;

const Pill = styled.TouchableOpacity`
  background-color: ${({ placeholder }) => placeholder ? 'transparent' : themedColors.tertiary};
  border-radius: 6px;
  padding: 10px ${({ grid }) => grid ? 10 : 20}px;
  align-items: center;
  flex: ${({ grid }) => grid ? 1 : 0};
`;

const SwapText = styled(BaseText)`
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
    style,
  } = props;

  return (
    <Pill onPress={onPress} grid={grid} style={style}>
      <SwapText>{from} → {to}</SwapText>
    </Pill>
  );
};

export const HotSwapsHorizontalList = (props: Props) => {
  const { onPress } = props;
  return (
    <WrappingContainer>
      <FlatList
        horizontal
        data={POPULAR_SWAPS}
        renderItem={
          ({ item }) => (
            <SwapPill
              {...item}
              onPress={() => onPress(item.from, item.to)}
              style={{ marginHorizontal: 2 }}
            />
          )
        }
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
          paddingRight: spacing.mediumLarge,
        }}
      />
    </WrappingContainer>
  );
};

export class HotSwapsGridList extends React.Component<Props> {
  renderItem = ({ item }: {item: {from: string, to: string}}) => {
    const { onPress } = this.props;
    if (item.from) {
      return (
        <SwapPill
          {...item}
          onPress={() => onPress(item.from, item.to)}
          grid
          style={{ margin: spacing.mediumLarge / 2 }}
        />
      );
    }
    return (
      <Pill
        placeholder
        grid
        style={{ margin: spacing.mediumLarge / 2 }}
      />
    );
  }

  render() {
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
          paddingHorizontal: spacing.layoutSides,
          justifyContent: 'space-around',
        }}
        renderItem={this.renderItem}
        keyExtractor={item => `${item.from}-${item.to}`}
        numColumns={columns}
      />
    );
  }
}
