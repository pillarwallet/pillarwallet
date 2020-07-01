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
import type { HorizontalOption, Option } from 'models/Selector';


export type Props = {
  selectedOption?: ?Option,
  onOptionSelect?: (option: Option, onSuccess: () => void) => void,
  onOptionImagePress?: (option: Option) => void,
  label?: string,
  placeholder?: string,
  optionsTitle?: string,
  options?: Option[],
  searchPlaceholder?: string,
  horizontalOptionsData?: HorizontalOption[],
  wrapperStyle?: Object,
  noOptionImageFallback?: boolean,
};
type State = {
  areOptionsVisible: boolean,
};

const Wrapper = styled.View`
  width: 100%;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 24px ${spacing.layoutSides}px;
`;

const SelectedOption = styled.TouchableOpacity`
  flex: 1;
`;

class Selector extends React.Component<Props, State> {
  state = {
    areOptionsVisible: false,
  };

  closeOptions = () => {
    this.setState({ areOptionsVisible: false });
  };

  openOptions = () => {
    this.setState({ areOptionsVisible: true });
  };


  onOptionSelect = (option: Option, onSuccess: () => void) => {
    const { onOptionSelect } = this.props;
    if (onOptionSelect) onOptionSelect(option, onSuccess);
  };

  renderOption = (option: ?Option, onPress?: () => void) => {
    if (!option) return null;
    const { onOptionImagePress } = this.props;
    const {
      name,
      imageUrl,
      lastUpdateTime,
      imageSource,
    } = option;

    return (
      <ListItemWithImage
        label={name}
        onPress={onPress}
        avatarUrl={imageUrl}
        navigateToProfile={onOptionImagePress ? () => onOptionImagePress(option) : onPress}
        imageUpdateTimeStamp={lastUpdateTime}
        itemImageSource={imageSource}
        padding="0 14px"
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
      wrapperStyle,
      noOptionImageFallback,
    } = this.props;
    const { areOptionsVisible } = this.state;
    const hasValue = !isEmpty(selectedOption);
    const hasOptions = !!options?.length;
    const placeholderText = hasOptions ? `${placeholder}...` : 'no options to select';

    return (
      <>
        <Wrapper style={wrapperStyle}>
          <MediumText regular accent>{label}: </MediumText>
          <SelectedOption onPress={this.openOptions} disabled={!hasOptions}>
            {hasValue
              ? this.renderOption(selectedOption, this.openOptions)
              : <MediumText big style={{ paddingHorizontal: spacing.layoutSides }}>{placeholderText}</MediumText>}
          </SelectedOption>
        </Wrapper>
        <SelectorOptions
          isVisible={areOptionsVisible}
          onHide={this.closeOptions}
          title={optionsTitle || placeholder}
          options={options}
          searchPlaceholder={searchPlaceholder}
          optionKeyExtractor={({ name }) => name}
          horizontalOptionsData={horizontalOptionsData}
          onOptionSelect={this.onOptionSelect}
          noImageFallback={noOptionImageFallback}
        />
      </>
    );
  }
}


export default Selector;
