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
import { Platform, TextInput, FlatList, Easing } from 'react-native';
import { CachedImage } from 'react-native-cached-image';
import Modal from 'react-native-modalbox';

// COMPONENTS
import { BoldText, MediumText } from 'components/Typography';
import Icon from 'components/Icon';
import Header from 'components/Header';

// UTILS
import { baseColors, fontSizes, spacing } from 'utils/variables';


type Props = {
  wrapperStyle?: Object,
  inputProps: Object,
  onValueSelected: Function,
  options: Object[],
  selectedOption: Object,
  hasInput?: boolean,
}

type State = {
  showOptionsSelector: boolean,
}

type EventLike = {
  nativeEvent: Object,
};

const Wrapper = styled.View`
`;

const Label = styled(BoldText)`
  font-size: ${fontSizes.medium}px;
  line-height: ${fontSizes.mediumLarge}px;
  letter-spacing: 0.23px;
  color: ${baseColors.slateBlack};
  margin-bottom: ${spacing.small}px;
`;

const ItemHolder = styled.View`
  height: 56px;
  width: 100%;
  border-radius: 3px;
  border: 1px solid ${baseColors.mediumLightGray};
  background-color: ${baseColors.white};
  flex-direction: row;
`;

const Selector = styled.TouchableOpacity`
  height: 100%;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px 10px 12px;
  ${props => props.fullWidth ? 'flex: 1' : ''}
`;

const ValueWrapper = styled.View`
  flex-direction: row;
  align-items: center;
`;

const ChevronWrapper = styled.View`
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const SelectorChevron = styled(Icon)`
  font-size: 8px;
  color: ${baseColors.electricBlue};
`;

const SelectorImage = styled(CachedImage)`
  height: 24px;
  width: 24px;
  margin-right: 12px;
`;

const SlectorValue = styled(MediumText)`
  font-size: ${fontSizes.small}px;
  line-height: ${fontSizes.mediumLarge}px;
  color: ${baseColors.slateBlack};
  margin-right: 20px;
`;

const InputWrapper = styled.View`
  flex: 1;
  height: 100%;
  border-left-width: 1px;
  border-left-color: ${baseColors.mediumLightGray};
  padding: 0 ${spacing.mediumLarge}px
  justify-content: center;
`;

const InputField = styled(TextInput)`
  flex: 1;
  text-align: right;
  font-weight: bold;
  padding: 0;
  margin: 0;
  overflow: visible;
  font-size: ${fontSizes.giant}px;
  height: ${fontSizes.giant}px;
  ${props => Platform.OS === 'ios' || props.value ? 'font-family: Aktiv Grotesk App;' : ''}
  ${props => props.value && Platform.OS === 'android'
    ? `margin-bottom: -6px;
    lineHeight: ${fontSizes.giant}px;`
    : ''}
`;

const OptionWrapper = styled.TouchableOpacity`
  padding: 20px 0;
  width: 100%;
  flex-direction: row;
`;

const OptionsContentWrapper = styled.View`
  border-top-left-radius: 30px;
  border-top-right-radius:  30px;
  background-color: ${baseColors.white};
  
`;

const Separator = styled.View`
  width: 100%;
  height: 1px;
  background-color: ${baseColors.mediumLightGray}
`;

const genericToken = require('assets/images/tokens/genericToken.png');

export default class SelectorInput extends React.Component<Props, State> {
  state = {
    showOptionsSelector: false,
  };

  handleChange = (e: EventLike) => {
    const { inputProps = {} } = this.props;
    const { onChange } = inputProps;
    if (onChange) onChange(e.nativeEvent.text);
  };

  selectValue = (value: Object) => {
    const { onValueSelected } = this.props;
    if (onValueSelected) onValueSelected(value);
    this.setState({ showOptionsSelector: false });
  };

  renderOption = ({ item: option }: Object) => {
    return (
      <OptionWrapper onPress={() => this.selectValue(option)}>
        <SelectorImage
          key={option.value}
          source={{ uri: option.icon }}
          fallbackSource={genericToken}
          resizeMode="contain"
        />
        <SlectorValue>{option.value}</SlectorValue>
      </OptionWrapper>
    );
  };

  render() {
    const { showOptionsSelector } = this.state;
    const {
      wrapperStyle,
      inputProps = {},
      options,
      selectedOption = {},
      hasInput,
    } = this.props;
    const { label, value, errorMessage } = inputProps;
    const { value: selectedValue, icon } = selectedOption;

    return (
      <React.Fragment>
        <Wrapper style={wrapperStyle}>
          {!!label && <Label>{label}</Label>}
          <ItemHolder>
            {!!options &&
            <Selector fullWidth={!hasInput} onPress={() => this.setState({ showOptionsSelector: true })}>
              <ValueWrapper>
                <SelectorImage
                  key={selectedValue}
                  source={{ uri: icon }}
                  fallbackSource={genericToken}
                  resizeMode="contain"
                />
                <SlectorValue>{selectedValue}</SlectorValue>
              </ValueWrapper>
              <ChevronWrapper>
                <SelectorChevron
                  name="chevron-right"
                  style={{ transform: [{ rotate: '-90deg' }] }}
                />
                <SelectorChevron
                  name="chevron-right"
                  style={{
                    transform: [{ rotate: '90deg' }],
                    marginTop: 4,
                  }}
                />
              </ChevronWrapper>
            </Selector>
            }
            {!!hasInput
              && (
                <InputWrapper>
                  <InputField
                    {...inputProps}
                    error={!!errorMessage}
                    onChange={this.handleChange}
                    numberOfLines={1}
                    value={value}
                    textAlignVertical="center"
                    placeholderTextColor={baseColors.darkGray}
                    underlineColorAndroid="white"
                  />
                </InputWrapper>
              )
            }
          </ItemHolder>
        </Wrapper>
        <Modal
          style={{ flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' }}
          swipeToClose
          swipeThreshold={50} // The threshold to reach in pixels to close the modal
          isOpen={showOptionsSelector}
          onClosed={() => this.setState({ showOptionsSelector: false })}
          easing={Easing.linear()}
          coverScreen
        >
          <OptionsContentWrapper>
            <Header
              title="select options"
              onClose={() => this.setState({ showOptionsSelector: false })}
            />
            <FlatList
              data={options}
              keyExtractor={(item) => item.key}
              renderItem={this.renderOption}
              style={{ height: 200, paddingHorizontal: spacing.large }}
              contentContainerStyle={{ paddingBottom: 40 }}
              ItemSeparatorComponent={() => (<Separator />)}
            />
          </OptionsContentWrapper>
        </Modal>
      </React.Fragment>
    );
  }
}
