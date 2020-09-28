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
import styled from 'styled-components/native';

import { themedColors } from 'utils/themes';
import { fontStyles } from 'utils/variables';

import { BaseText } from 'components/Typography';
import Spinner from 'components/Spinner';
import { Wrapper } from 'components/Layout';

type Value = string | number

export type Option = {
  id: string,
  label: string,
  valueToShow: string,
  value: Value,
}

type Props = {
  options: Array<Option>,
  minItemWidth?: number,
  numColumns?: number,
  selectedValue: Value,
  onSelect: (Value) => void,
}

type State = {
  selectorWidth: number,
  recalculatedColumns: number,
  options: Array<Option>,
  itemWidth: number,
}


const Selector = styled.FlatList`
  background-color: ${themedColors.border};
  border-radius: 6px;
`;

const ItemWrapper = styled.TouchableOpacity`
  padding: 4px 10px;
  border-radius: 4px;
  align-items: center;
  ${({ isSelected, theme }) => isSelected && `background-color: ${theme.colors.card};`}
  ${({ width }) => width && `width: ${width}px;`}
`;

const Label = styled(BaseText)`
  ${fontStyles.regular}px;
  margin-bottom: 2px;
  text-align: center;
`;

const ValueText = styled(BaseText)`
  ${fontStyles.tiny}px;
  color: ${themedColors.secondaryText};
  text-align: center;
`;

const CONTENT_PADDING = 2;


class SelectorList extends React.Component<Props, State> {
  state = {
    selectorWidth: 0,
    recalculatedColumns: 0,
    options: [],
    itemWidth: 0,
  };

  componentDidUpdate(prevProps: Props, prevState: State) {
    const { selectorWidth } = this.state;
    const { options } = this.props;

    if (selectorWidth !== prevState.selectorWidth || prevProps.options.length !== options.length) {
      this.setOptions();
    }
  }

  setOptions = () => {
    const { selectorWidth } = this.state;
    const { options, minItemWidth, numColumns } = this.props;
    const recalculatedColumns = numColumns && minItemWidth && (selectorWidth / numColumns) < minItemWidth
      ? Math.floor(selectorWidth / minItemWidth)
      : numColumns;

    const itemWidth = recalculatedColumns ? selectorWidth / recalculatedColumns : selectorWidth;
    this.setState({ options, recalculatedColumns, itemWidth });
  };

  renderOption = ({ item }: { item: Option }) => {
    const { itemWidth } = this.state;
    const { selectedValue, onSelect } = this.props;
    const { label, valueToShow, value } = item;

    return (
      <ItemWrapper onPress={() => onSelect(value)} isSelected={selectedValue === value} width={itemWidth}>
        <Label>{label}</Label>
        <ValueText>{valueToShow}</ValueText>
      </ItemWrapper>
    );
  };

  render() {
    const { options, recalculatedColumns } = this.state;

    return (
      <Selector
        onLayout={(e) => {
          this.setState({ selectorWidth: e.nativeEvent.layout.width - (CONTENT_PADDING * 2) });
        }}
        data={options}
        numColumns={recalculatedColumns}
        key={recalculatedColumns}
        keyExtractor={({ id }) => id.toString()}
        style={{ width: '100%' }}
        renderItem={this.renderOption}
        initialNumToRender={recalculatedColumns}
        contentContainerStyle={{ padding: CONTENT_PADDING }}
        ListEmptyComponent={
          <Wrapper flex={1} center style={{ padding: 10 }}>
            <Spinner height={20} width={20} />
          </Wrapper>
        }
      />
    );
  }
}

export default SelectorList;
