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
import isEmpty from 'lodash.isempty';

import { MediumText } from 'components/Typography';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import SelectorOptions from 'components/SelectorOptions';

import { spacing } from 'utils/variables';
import { noop } from 'utils/common';
import type { HorizontalOption, Option } from 'models/Selector';


type Props = {
  selectedOption?: Option,
  onOptionSelect: (option: Option) => void,
  onOptionImagePress?: (option: Option) => void,
  label?: string,
  placeholder?: string,
  optionsTitle?: string,
  options?: Option[],
  searchPlaceholder?: string,
  horizontalOptionsData?: HorizontalOption[],
};
type State = {
  areOptionsVisible: boolean,
};

const Wrapper = styled.View`
  width: 100%;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${spacing.layoutSides}px;
`;

const SelectedOption = styled.TouchableOpacity`
  flex: 1;
`;

class Selector extends React.Component<Props, State> {
  state = {
    areOptionsVisible: false,
  };

  toggleOptions = () => {
    this.setState(({ areOptionsVisible }) => ({ areOptionsVisible: !areOptionsVisible }));
  };

  onOptionSelect = (option: Option) => {
    const { onOptionSelect } = this.props;
    onOptionSelect(option);
  };


  renderOption = (option?: Option, onPress?: () => void) => {
    if (!option) return null;
    const { onOptionImagePress } = this.props;
    const { name, imageUrl, lastUpdateTime } = option;
    return (
      <ListItemWithImage
        label={name}
        onPress={onPress}
        avatarUrl={imageUrl}
        navigateToProfile={onOptionImagePress ? () => onOptionImagePress(option) : noop}
        imageUpdateTimeStamp={lastUpdateTime}
      />
    );
  };

  render() {
    const {
      label = 'Select',
      placeholder = 'Choose option',
      optionsTitle,
      options,
      searchPlaceholder = 'Search',
      selectedOption,
      horizontalOptionsData,
    } = this.props;
    const { areOptionsVisible } = this.state;
    const hasValue = !isEmpty(selectedOption);

    return (
      <>
        <Wrapper>
          <MediumText regular accent>{label}: </MediumText>
          <SelectedOption onPress={this.toggleOptions}>
            {hasValue
              ? this.renderOption(selectedOption)
              : <MediumText big style={{ paddingHorizontal: spacing.layoutSides }}>{placeholder}...</MediumText>}
          </SelectedOption>
        </Wrapper>
        <SelectorOptions
          isVisible={areOptionsVisible}
          onHide={this.toggleOptions}
          title={optionsTitle || placeholder}
          options={options}
          searchPlaceholder={searchPlaceholder}
          renderOption={(option, onPress) => this.renderOption(option, onPress)}
          optionKeyExtractor={({ name }) => name}
          horizontalOptionsData={horizontalOptionsData}
          onOptionSelect={this.onOptionSelect}
        />
      </>
    );
  }
}


export default Selector;
