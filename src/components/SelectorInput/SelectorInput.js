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
import { Platform, TextInput, FlatList, Keyboard } from 'react-native';
import { CachedImage } from 'react-native-cached-image';
import { SDK_PROVIDER } from 'react-native-dotenv';

// COMPONENTS
import { BoldText, BaseText, MediumText } from 'components/Typography';
import Icon from 'components/Icon';
import SlideModal from 'components/Modals/SlideModal';
import TankAssetBalance from 'components/TankAssetBalance';
import SearchBar from 'components/SearchBar';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import Separator from 'components/Separator';

// UTILS
import { baseColors, fontSizes, spacing, UIColors } from 'utils/variables';
import { formatMoney, noop } from 'utils/common';

import { ETH } from 'constants/assetsConstants';

type InputValue = {
  selector?: Object,
  input?: string,
};

type Props = {
  wrapperStyle?: Object,
  inputProps: Object,
  options: Object[],
  hasInput?: boolean,
  errorMessage?: string,
  value: InputValue,
  inputAddonText?: string,
  inputRef?: Object,
};

type State = {
  showOptionsSelector: boolean,
  query: string,
};

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
  ${props => props.error ? 'border-color: tomato;' : ''}
`;

const Selector = styled.TouchableOpacity`
  height: 100%;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px 10px 12px;
  ${props => props.fullWidth ? 'flex: 1;' : ''}
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
  justify-content: flex-end;
  align-items: center;
  flex-direction: row;
`;

const InputField = styled(TextInput)`
  flex: 1;
  text-align: right;
  font-weight: bold;
  padding: 0;
  margin: 0;
  font-size: ${fontSizes.giant}px;
  height: 100%;
  ${props => Platform.OS === 'ios' || props.value ? 'font-family: Aktiv Grotesk App;' : ''}
  ${props => props.value && Platform.OS === 'android'
    ? 'lineHeight: 42px;'
    : ''}
  min-width: 10px;
`;

const PlaceholderWrapper = styled.View`
`;

const Placeholder = styled(BaseText)`
  font-size: ${fontSizes.extraSmall}px;
  line-height: ${fontSizes.mediumLarge}px;
  letter-spacing: 0.23px;
  color: ${baseColors.darkGray};
`;

const ErrorMessage = styled(BaseText)`
  font-size: ${fontSizes.extraSmall}px;
  line-height: ${fontSizes.medium}px;
  color: tomato;
  margin: 8px 12px;
`;

const TextHolder = styled.View`
  flex-direction: row;
  align-items: center;
  height: 100%;
  padding-right: ${spacing.small}px;
`;

const AddonText = styled(BaseText)`
  color: ${UIColors.placeholderTextColor};
`;

const SearchBarWrapper = styled.View`
  padding: 0 ${spacing.mediumLarge}px;
`;

const genericToken = require('assets/images/tokens/genericToken.png');

const MIN_QUERY_LENGTH = 2;

const viewConfig = {
  minimumViewTime: 300,
  viewAreaCoveragePercentThreshold: 100,
  waitForInteraction: true,
};

export default class SelectorInput extends React.Component<Props, State> {
  searchInput: ?Object;

  constructor(props: Props) {
    super(props);
    this.searchInput = React.createRef();
    this.state = {
      showOptionsSelector: false,
      query: '',
    };
  }

  handleChange = (e: EventLike) => {
    const { inputProps = {}, value } = this.props;
    const { selector } = value;
    const { onChange } = inputProps;
    if (onChange) onChange({ selector, input: e.nativeEvent.text });
  };

  handleSearch = (query: string) => {
    const formattedQuery = !query ? '' : query.trim();

    this.setState({
      query: formattedQuery,
    });
  };

  selectValue = (selectedValue: Object) => {
    const { inputProps = {}, value } = this.props;
    const { input } = value;
    const { onChange, onSelectorChange } = inputProps;
    this.setState({ showOptionsSelector: false, query: '' });
    if (onChange) onChange({ selector: selectedValue, input });
    if (onSelectorChange) onSelectorChange();
  };

  focusInput = () => {
    if (this.searchInput) this.searchInput.focus();
  };

  renderOption = ({ item: option }: Object) => {
    const {
      value,
      symbol,
      assetBalance,
      paymentNetworkBalance,
    } = option;
    const iconUrl = `${SDK_PROVIDER}/${option.icon}?size=3`;
    const paymentNetworkBalanceFormatted = formatMoney(paymentNetworkBalance, 4);

    return (
      <ListItemWithImage
        onPress={() => this.selectValue(option)}
        label={value}
        itemImageUrl={iconUrl || genericToken}
        itemValue={assetBalance ? `${assetBalance} ${symbol}` : null}
        fallbackSource={genericToken}
        customAddon={paymentNetworkBalance
          ? (
            <TankAssetBalance
              amount={paymentNetworkBalanceFormatted}
              isSynthetic={symbol !== ETH}
            />)
          : null
        }
        rightColumnInnerStyle={{ alignItems: 'flex-end' }}
      />
    );
  };

  openSelector = () => {
    this.setState({ showOptionsSelector: true });
    const { inputProps } = this.props;
    const { onSelectorOpen } = inputProps;
    if (onSelectorOpen) onSelectorOpen();
  };

  render() {
    const { showOptionsSelector, query } = this.state;
    const {
      wrapperStyle,
      inputProps = {},
      options = [],
      hasInput,
      value,
      errorMessage,
      inputAddonText,
      inputRef,
    } = this.props;
    const {
      label,
      placeholderSelector,
    } = inputProps;
    const { selector: selectedOption = {}, input: inputValue } = value;
    const { value: selectedValue, icon } = selectedOption;
    const iconUrl = `${SDK_PROVIDER}/${icon}?size=3`;

    const filteredListData = (query && query.length >= MIN_QUERY_LENGTH && options.length)
      ? options.filter(({ value: val }) => val.toUpperCase().includes(query.toUpperCase()))
      : options;

    return (
      <React.Fragment>
        <Wrapper style={wrapperStyle}>
          {!!label && <Label>{label}</Label>}
          <ItemHolder error={!!errorMessage}>
            {!!options.length &&
            <Selector
              fullWidth={!hasInput}
              onPress={options.length > 1 ? this.openSelector : noop}
              disabled={options.length < 1}
            >
              <ValueWrapper>
                {Object.keys(selectedOption).length
                  ? (
                    <SelectorImage
                      key={selectedValue}
                      source={{ uri: iconUrl }}
                      fallbackSource={genericToken}
                      resizeMode="contain"
                    />)
                  : (
                    <PlaceholderWrapper>
                      <Placeholder>{placeholderSelector || 'select'}</Placeholder>
                    </PlaceholderWrapper>
                  )}
                <SlectorValue>{selectedValue}</SlectorValue>
              </ValueWrapper>
              {options.length > 1 &&
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
                </ChevronWrapper>}
            </Selector>
            }
            {!!hasInput
              && (
                <InputWrapper>
                  {!!inputAddonText &&
                  <TextHolder>
                    <AddonText numberOfLines={2} ellipsizeMode="tail">{inputAddonText}</AddonText>
                  </TextHolder>
                  }
                  <InputField
                    {...inputProps}
                    error={!!errorMessage}
                    onChange={this.handleChange}
                    numberOfLines={1}
                    value={inputValue}
                    textAlignVertical="center"
                    placeholderTextColor={baseColors.darkGray}
                    underlineColorAndroid="white"
                    innerRef={inputRef}
                  />
                </InputWrapper>
              )
            }
          </ItemHolder>
          {!!errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
        </Wrapper>
        <SlideModal
          isVisible={showOptionsSelector}
          fullScreen
          showHeader
          onModalHide={() => {
            this.setState({ showOptionsSelector: false, query: '' });
            Keyboard.dismiss();
          }}
          onModalShow={this.focusInput}
          backgroundColor={baseColors.lightGray}
          avoidKeyboard
          noSwipeToDismiss
        >
          <Wrapper flex={1}>
            <SearchBarWrapper>
              <SearchBar
                inputProps={{
                  onChange: this.handleSearch,
                  value: query,
                  autoCapitalize: 'none',
                }}
                placeholder="Search for an asset"
                backgroundColor={baseColors.white}
                inputRef={ref => { this.searchInput = ref; }}
              />
            </SearchBarWrapper>
            <FlatList
              data={filteredListData}
              renderItem={this.renderOption}
              keyExtractor={({ value: val }) => val}
              keyboardShouldPersistTaps="always"
              contentContainerStyle={{ paddingBottom: 40 }}
              ListEmptyComponent={
                <Wrapper
                  fullScreen
                  style={{
                    paddingTop: 90,
                    paddingBottom: 90,
                    alignItems: 'center',
                  }}
                >
                  <EmptyStateParagraph title="Nothing found" />
                </Wrapper>
              }
              ItemSeparatorComponent={() => <Separator spaceOnLeft={82} />}
              initialNumToRender={10}
              maxToRenderPerBatch={5}
              removeClippedSubviews
              viewabilityConfig={viewConfig}
            />
          </Wrapper>
        </SlideModal>
      </React.Fragment>
    );
  }
}
