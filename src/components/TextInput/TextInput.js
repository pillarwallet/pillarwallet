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
import styled, { withTheme } from 'styled-components/native';
import { Item as NBItem, Input, Label } from 'native-base';
import {
  View,
  TouchableOpacity,
  Platform,
  TextInput as RNInput,
  TouchableWithoutFeedback,
  Keyboard,
  FlatList,
} from 'react-native';
import { CachedImage } from 'react-native-cached-image';
import { SDK_PROVIDER } from 'react-native-dotenv';

import { ETH } from 'constants/assetsConstants';

import IconButton from 'components/IconButton';
import { BaseText, BoldText, MediumText, SubHeadingMedium } from 'components/Typography';
import Spinner from 'components/Spinner';
import Icon from 'components/Icon';
import Button from 'components/Button';
import SearchBar from 'components/SearchBar';
import { ScrollWrapper } from 'components/Layout';
import SlideModal from 'components/Modals/SlideModal';
import Separator from 'components/Separator';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import TankAssetBalance from 'components/TankAssetBalance';
import ProfileImage from 'components/ProfileImage';

import { fontSizes, baseColors, UIColors, spacing, fontStyles, appFont, itemSizes } from 'utils/variables';
import { getThemeColors, themedColors } from 'utils/themes';
import { formatMoney, noop } from 'utils/common';

import type { Theme } from 'models/Theme';
import type { Props as ButtonProps } from 'components/Button';
import type { Props as IconButtonProps } from 'components/IconButton';

const genericToken = require('assets/images/tokens/genericToken.png');

type InputPropsType = {
  placeholder?: string,
  onChange: Function,
  onBlur?: Function,
  value: any, // TODO: update type
  multiline?: boolean,
  onSelectorOpen?: () => void,
  onSelectorChange?: () => void,
}

type Props = {
  icon?: string,
  inlineLabel?: boolean,
  alignRight?: boolean,
  postfix?: string,
  label?: string,
  id?: string,
  iconColor?: string,
  errorMessage?: string,
  onIconPress?: Function,
  inputProps: InputPropsType,
  inputType: string,
  trim: boolean,
  footerAddonText?: string,
  footerAddonAction?: Function,
  autoCorrect?: boolean,
  viewWidth?: number,
  noBorder?: boolean,
  lowerCase?: boolean,
  labelBigger?: boolean,
  keyboardAvoidance?: boolean,
  loading?: boolean,
  onLayout?: Function,
  statusIcon?: string,
  statusIconColor?: string,
  additionalStyle?: Object,
  labelStyle?: Object,
  errorMessageStyle?: Object,
  getInputRef?: Function,

  innerImageURI?: string,
  fallbackSource?: number,
  buttonProps?: ButtonProps,
  theme: Theme,
  leftSideText?: string,
  numeric?: boolean,
  iconProps?: IconButtonProps,
  selectorOptions?: Object // TODO: add type,
}

type State = {
  isFocused: boolean,
  showOptionsSelector: boolean,
  query: string,
}

type EventLike = {
  nativeEvent: Object,
}

const getFontSize = (props: Props) => {
  const { inputProps: { value }, numeric } = props;
  if (numeric) return 36;
  if (value || value === 0) return 16;
  return 14;
};

const getLineHeight = (props: Props) => {
  const { inputProps: { value }, numeric } = props;
  if (numeric) return 36;
  if (value || value === 0) return 16;
  return 14;
};

const getFontFamily = (props: Props) => {
  const { inputProps: { value }, numeric } = props;
  if (!(value || value === 0)) return appFont.medium;
  if (numeric) return appFont.bold;
  return appFont.regular;
};

const viewConfig = {
  minimumViewTime: 300,
  viewAreaCoveragePercentThreshold: 100,
  waitForInteraction: true,
};

const inputTypes = {
  default: {
    fontSize: fontSizes.big,
    textAlign: 'left',
  },
  bigText: {
    backgroundColor: baseColors.lightGray,
    borderBottomWidth: 0,
    borderRadius: 6,
    color: baseColors.slateBlack,
    fontSize: fontSizes.large,
    lineHeight: Platform.OS === 'ios' ? 34 : fontSizes.large,
    padding: '0 20px',
    inputHeight: 56,
  },
  bigTextNoBackground: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    color: baseColors.slateBlack,
    fontSize: fontSizes.large,
    lineHeight: Platform.OS === 'ios' ? 34 : fontSizes.large,
    padding: '0 20px',
    inputHeight: Platform.OS === 'ios' ? 80 : 70,
  },
  noBackground: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    color: baseColors.slateBlack,
    fontSize: fontSizes.big,
    lineHeight: Platform.OS === 'ios' ? 34 : fontSizes.large,
  },
  amount: {
    fontSize: fontSizes.giant,
    textAlign: 'right',
  },
  secondary: {
    backgroundColor: baseColors.lightGray,
    borderBottomWidth: 0,
    borderRadius: 6,
    color: baseColors.slateBlack,
    fontSize: fontSizes.medium,
    padding: '0 14px',
  },
};

const FloatingButton = styled(IconButton)`
  position: absolute;
  right: 0;
  top: 20px;
  justify-content: center;
  width: 60px;
  height: 60px;
  margin: 0;
  padding: 0;
`;

const ErrorMessage = styled(BaseText)`
  color: ${themedColors.negative};
  flex: 1;
  margin-top: 10px;
`;

const PostFix = styled(BoldText)`
  line-height: 22px;
  margin-top: 8px;
`;

const InputField = styled(Input)`
  color: ${themedColors.text};
  ${props => props.inputType.borderRadius ? `border-radius: ${props.inputType.borderRadius};` : ''}
  ${props => props.inputType.lineHeight ? `line-height: ${props.inputType.lineHeight};` : ''}
  padding: ${props => props.inputType.padding || 0};
  padding: 0 14px;
  align-self: center;
  margin: 0;
  text-align: ${({ alignTextOnRight }) => alignTextOnRight ? 'right' : 'left'};
`;

const Item = styled(NBItem)`
  border-bottom-color: transparent;
  border-bottom-width: 0;
  height: ${props => props.height}px;
  flex-direction: row;
  min-height: 54px;
  width: 100%;
`;

const ItemHolder = styled.View`
  background-color: ${({ error, theme }) => error ? theme.colors.card : theme.colors.tertiary};
  border-radius: 4px;
  border-width: 1px;
  border-style: solid;
  border-color: ${({ error, theme }) => error ? theme.colors.negative : theme.colors.tertiary}
`;

const InputFooter = styled(View)`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 0 2px; 
  margin-bottom: 6px;
  margin-top: -4px;
`;

const AddonText = styled(BaseText)`
  color: ${themedColors.primary};
  width: 100%;
  text-align: right;
`;

const CustomLabel = styled(Label)`
  color: ${props => props.labelBigger ? UIColors.defaultTextColor : baseColors.darkGray};
  letter-spacing: 0.5;
  padding-top: ${props => props.labelBigger ? '35px' : '5px'};
  padding-bottom: ${props => props.labelBigger ? '12px' : '0'};
  ${props => props.labelBigger ? fontStyles.medium : fontStyles.regular};
  `;

const AbsoluteIcon = styled(Icon)`
  position: absolute;
  right: ${spacing.mediumLarge}px;
  top: 50%;
  margin-top: -13px;
  font-size: ${fontSizes.regular}px;
  color: ${props => props.color || baseColors.electricBlue};
`;

const ButtonWrapper = styled.View`
  padding: 4px;
`;

const LeftSideWrapper = styled.View`
  padding-left: 16px;
  margin-right: 16px;
  flex-direction: row;
  align-items: center;
  max-width: 25%;
`;

const RightSideWrapper = styled.View`
  padding-right: 12px;
  flex-direction: row;
  align-items: center;
`;

const Image = styled(CachedImage)`
  height: 24px;
  width: 24px;
  resize-mode: contain;
  background-color: red;
`;

const AddonRegularText = styled(BaseText)`
  color: ${themedColors.secondaryText};
  margin-left: 9px;
  flex-wrap: wrap;
`;

const Selector = styled.TouchableOpacity`
  height: 100%;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  ${props => props.fullWidth ? 'flex: 1;' : ''}
`;

const ValueWrapper = styled.View`
  flex-direction: row;
  align-items: center;
`;

const Placeholder = styled(BaseText)`
  ${fontStyles.regular};
  letter-spacing: 0.23px;
  color: ${themedColors.secondaryText};
`;

const SelectorValue = styled(MediumText)`
  ${fontStyles.big};
  color: ${themedColors.text};
  margin-left: 8px;
`;

const ChevronWrapper = styled.View`
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-left: 19px;
`;

const SelectorChevron = styled(Icon)`
  font-size: 8px;
  color: ${baseColors.electricBlue};
`;


const Wrapper = styled.View`
`;

const SearchBarWrapper = styled.View`
  padding: 0 ${spacing.large}px;
  border-bottom-width: 1px;
  border-style: solid;
  border-color: ${baseColors.mediumLightGray};
`;

const HorizontalOptions = styled.View`
  background-color: ${UIColors.defaultBackgroundColor};
  border-bottom-width: 1px;
  border-style: solid;
  border-color: ${baseColors.mediumLightGray};
  padding-bottom: ${spacing.small}px;
`;

const HorizontalOptionsScrollView = styled.ScrollView`
`;

const HorizontalOptionItem = styled.TouchableOpacity`
  align-items: center;
  width: ${itemSizes.avatarCircleMedium + 4}px;
  margin: 0 8px;
`;

const HorizontalOptionItemName = styled(BaseText)`
  ${fontStyles.small};
  color: ${baseColors.darkGray};
  padding: 0 4px;
  margin-top: 3px;
`;

const OptionsHeader = styled(SubHeadingMedium)`
  margin: ${spacing.large}px ${spacing.large}px 0;
`;

const EmptyStateWrapper = styled(Wrapper)`
  padding-top: 90px;
  padding-bottom: 90px;
  align-items: center;
`;


class TextInput extends React.Component<Props, State> {
  multilineInputField: Input;
  searchInput: RNInput;
  rnInput: Object;

  static defaultProps = {
    inputType: 'default',
    autoCorrect: false,
    trim: true,
  };

  constructor(props: Props) {
    super(props);
    this.rnInput = React.createRef();
    this.multilineInputField = React.createRef();
    this.state = {
      isFocused: false,
      showOptionsSelector: false,
      query: '',
    };
  }

  handleBlur = (e: EventLike) => {
    if (Platform.OS === 'android' && e.nativeEvent.text === undefined) {
      return;
    }

    const { inputProps: { onBlur }, trim } = this.props;
    const value = trim ? e.nativeEvent.text.trim() : e.nativeEvent.text;
    if (onBlur) {
      onBlur(value);
    }

    if (Platform.OS === 'ios' && this.props.inputProps.multiline && this.props.keyboardAvoidance) {
      this.setState({
        isFocused: false,
      });
    }
  };

  handleChange = (e: EventLike) => {
    const { inputProps: { onChange } } = this.props;
    const value = e.nativeEvent.text;
    if (onChange) onChange(value);
  };

  handleFocus = () => {
    this.setState({
      isFocused: true,
    });
  };

  handleRNFocus = () => {
    setTimeout(() => {
      if (!!this.multilineInputField && Object.keys(this.multilineInputField).length) {
        this.multilineInputField._root.focus();
      }
      this.setState({
        isFocused: true,
      });
    }, 500);
  };

  handleMultilineFocus = () => {
    if (!this.state.isFocused) {
      this.rnInput.current.focus();
    }
  };

  resolveAssetSource(uri?: string | number) {
    if (typeof uri === 'number') return uri;
    return {
      uri,
    };
  }


  openSelector = () => {
    this.setState({ showOptionsSelector: true });
    const { inputProps } = this.props;
    const { onSelectorOpen } = inputProps;
    if (onSelectorOpen) onSelectorOpen();
  };

  renderOption = ({ item: option }: Object) => {
    const {
      value,
      name,
      symbol,
      assetBalance,
      paymentNetworkBalance,
    } = option;
    const iconUrl = `${SDK_PROVIDER}/${option.icon}?size=3`;
    const paymentNetworkBalanceFormatted = formatMoney(paymentNetworkBalance, 4);

    return (
      <ListItemWithImage
        onPress={() => this.selectValue(option)}
        label={name}
        subtext={value}
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

  renderHorizontalOptions = (options: any) => {
    return options
      .map(option => {
        const { name, icon } = option;
        const iconUri = `${SDK_PROVIDER}/${icon}?size=3`;
        return (
          <HorizontalOptionItem
            key={name}
            onPress={() => this.selectValue(option)}
          >
            <ProfileImage
              uri={iconUri}
              userName={name}
              diameter={itemSizes.avatarCircleMedium}
              textStyle={{ fontSize: fontSizes.medium }}
              noShadow
            />
            <HorizontalOptionItemName numberOfLines={1}>{name}</HorizontalOptionItemName>
          </HorizontalOptionItem>
        );
      });
  };

  selectValue = (selectedValue: Object) => {
    // const { inputProps = {}, value } = this.props;
    const { inputProps = {} } = this.props;
    // const { input } = value;
    const { onChange, onSelectorChange, value = {} } = inputProps;
    const { input } = value;
    if (onChange) onChange({ selector: selectedValue, input });
    if (onSelectorChange) onSelectorChange();
    this.setState({ showOptionsSelector: false });
  };

  focusInput = () => {
    if (this.searchInput) this.searchInput.focus();
  };

  handleSearch = (query: string) => {
    const formattedQuery = !query ? '' : query.trim();

    this.setState({
      query: formattedQuery,
    });
  };

  render() {
    const {
      icon,
      postfix,
      label,
      onIconPress,
      iconColor = '#2077FD',
      inputProps,
      inlineLabel,
      errorMessage,
      footerAddonText,
      footerAddonAction,
      autoCorrect,
      // viewWidth = '100%',
      noBorder,
      lowerCase,
      labelBigger,
      loading,
      onLayout,
      statusIcon,
      statusIconColor,
      additionalStyle,
      labelStyle,
      getInputRef,
      errorMessageStyle,

      innerImageURI,
      fallbackSource,

      buttonProps,
      theme,
      leftSideText,
      numeric,
      iconProps,


      selectorOptions = {},
    } = this.props;
    const colors = getThemeColors(theme);
    const { value = '' } = inputProps;
    const { isFocused, query, showOptionsSelector } = this.state;
    const inputType = inputTypes[this.props.inputType] || inputTypes.default;

    const variableFocus = Platform.OS === 'ios' && inputProps.multiline && this.props.keyboardAvoidance ?
      this.handleMultilineFocus : this.handleFocus;
    let inputHeight = 54;

    if (inputProps.multiline) {
      inputHeight = Platform.OS === 'ios' ? 120 : 100;
    }

    const customStyle = inputProps.multiline ? { paddingTop: 10 } : {};


    const {
      options = [],
      horizontalOptions = [],
      selectedOption = {},
      selectorPlaceholder,
      fullWidth: fullWidthSelector,
      showOptionsTitles,
      horizontalOptionsTitle,
      optionsTitle,
      selectorModalTitle,
    } = selectorOptions;

    const showLeftAddon = (innerImageURI || fallbackSource) || !!leftSideText;
    const showRightAddon = iconProps || loading;

    let selectedOptionToShow = selectedOption;
    const selectorOptionsCount = options.length + horizontalOptions.length;
    if (selectorOptionsCount === 1) selectedOptionToShow = options.length ? options[0] : horizontalOptions[0];
    const {
      icon: selectedOptionIcon,
      iconFallback: selectedOptionFallback,
      value: selectedValue,
    } = selectedOptionToShow;

    const filteredHorizontalListData = horizontalOptions;
    const filteredListData = options;

    return (
      <View style={{ paddingBottom: 10, flexDirection: 'column' }}>
        {!!label &&
        <CustomLabel
          labelBigger={labelBigger}
          style={labelStyle}
        >
          {lowerCase ? label : label.toUpperCase()}
        </CustomLabel>
        }
        <ItemHolder error={!!errorMessage}>
          <Item
            inlineLabel={inlineLabel}
            stackedLabel={!inlineLabel}
            isFocused={isFocused}
            noBorder={noBorder}
            height={inputHeight}
          >
            {!!Object.keys(selectorOptions).length &&
            <Selector
              fullWidth={fullWidthSelector}
              onPress={selectorOptionsCount > 1 ? this.openSelector : noop}
              disabled={selectorOptionsCount < 1}
            >
              {Object.keys(selectedOptionToShow).length
                ? (
                  <ValueWrapper>
                    <Image
                      key={selectedValue}
                      source={this.resolveAssetSource(selectedOptionIcon)}
                      fallbackSource={selectedOptionFallback}
                      resizeMode="contain"
                    />
                    <SelectorValue>{selectedValue}</SelectorValue>
                  </ValueWrapper>
                  )
                : (<Placeholder>{selectorPlaceholder || 'select'}</Placeholder>)}
              {selectorOptionsCount > 1 &&
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
            </Selector>}
            {showLeftAddon &&
            <TouchableWithoutFeedback onPress={() => this.multilineInputField._root.focus()}>
              <LeftSideWrapper>
                {(innerImageURI || fallbackSource) && <Image
                  source={this.resolveAssetSource(innerImageURI)}
                  fallbackSource={fallbackSource}
                />}
                {!!leftSideText && <AddonRegularText>{leftSideText}</AddonRegularText>}
              </LeftSideWrapper>
            </TouchableWithoutFeedback>}
            {!fullWidthSelector &&
            <InputField
              {...inputProps}
              innerRef={(input) => {
                this.multilineInputField = input;
                if (getInputRef) getInputRef(input);
              }}
              onChange={this.handleChange}
              onBlur={this.handleBlur}
              onEndEditing={this.handleBlur}
              onFocus={variableFocus}
              value={value}
              inputType={inputType}
              autoCorrect={autoCorrect}
              style={[{
                fontSize: getFontSize(this.props),
                lineHeight: getLineHeight(this.props),
                fontFamily: getFontFamily(this.props),
                // width: viewWidth,
                textAlignVertical: inputProps.multiline ? 'top' : 'center',
                height: inputHeight,
              }, customStyle,
                additionalStyle,
              ]}
              onLayout={onLayout}


              placeholderTextColor={colors.accent}
              alignTextOnRight={!!numeric}
              // textAlign='end'
            />}
            {!!statusIcon && <AbsoluteIcon name={statusIcon} color={statusIconColor} />}
            {!!icon && <FloatingButton onPress={onIconPress} icon={icon} color={iconColor} fontSize={30} />}
            {!!postfix && <PostFix>{postfix}</PostFix>}


            {showRightAddon &&
            <RightSideWrapper>
              {!!iconProps && <IconButton color={colors.primary} {...iconProps} />}
              {!!loading && <Spinner width={30} height={30} />}
            </RightSideWrapper>}
            {!!buttonProps &&
            <ButtonWrapper>
              <Button height={48} {...buttonProps} />
            </ButtonWrapper>}

          </Item>
          {Platform.OS === 'ios' && <RNInput
            caretHidden
            autoCorrect={false}
            ref={this.rnInput}
            onFocus={this.handleRNFocus}
            style={{ marginTop: -10 }}
          />}
        </ItemHolder>
        <InputFooter>
          {errorMessage ? <ErrorMessage style={errorMessageStyle}>{errorMessage}</ErrorMessage> : <View />}
          {!!footerAddonText &&
          <TouchableOpacity onPress={footerAddonAction}>
            <AddonText>{footerAddonText}</AddonText>
          </TouchableOpacity>}
        </InputFooter>
        <SlideModal
          isVisible={showOptionsSelector}
          fullScreen
          showHeader={!!selectorModalTitle}
          onModalShow={this.focusInput}
          onModalHidden={() => this.setState({ query: '' })}
          backgroundColor={baseColors.white}
          noSwipeToDismiss
          noClose
          title={selectorModalTitle}
        >
          <Wrapper flex={1} backgroundColor={UIColors.defaultBackgroundColor}>
            <SearchBarWrapper backgroundColor={baseColors.white}>
              <SearchBar
                inputProps={{
                  onChange: this.handleSearch,
                  value: query,
                  autoCapitalize: 'none',
                }}
                placeholder="Search for an asset"
                backgroundColor={baseColors.white}
                inputRef={ref => { this.searchInput = ref; }}
                customCloseAction={() => {
                  this.setState({ showOptionsSelector: false, query: '' });
                  Keyboard.dismiss();
                }}
                forceShowCloseButton
              />
            </SearchBarWrapper>
            <ScrollWrapper
              contentContainerStyle={{ paddingBottom: 30 }}
              disableOnAndroid
            >
              {!!filteredHorizontalListData.length &&
              <HorizontalOptions>
                {(showOptionsTitles && !!horizontalOptionsTitle) &&
                <OptionsHeader>{horizontalOptionsTitle}</OptionsHeader>
                }
                <HorizontalOptionsScrollView
                  keyboardShouldPersistTaps="always"
                  horizontal
                  contentContainerStyle={{ paddingHorizontal: spacing.large / 2, paddingVertical: spacing.medium }}
                >
                  {this.renderHorizontalOptions(filteredHorizontalListData)}
                </HorizontalOptionsScrollView>
              </HorizontalOptions>
              }
              {!!filteredListData.length &&
              <FlatList
                data={filteredListData}
                renderItem={this.renderOption}
                keyExtractor={({ value: val }) => val}
                keyboardShouldPersistTaps="handled"
                ItemSeparatorComponent={() => <Separator spaceOnLeft={82} />}
                initialNumToRender={10}
                viewabilityConfig={viewConfig}
                ListHeaderComponent={
                  (showOptionsTitles && !!optionsTitle) && filteredListData.length &&
                  <OptionsHeader>{optionsTitle}</OptionsHeader>
                }
                getItemLayout={(data, index) => ({
                  length: 70,
                  offset: 70 * index,
                  index,
                })}
                windowSize={10}
                hideModalContentWhileAnimating
              />
              }
              {(!filteredListData.length && !filteredHorizontalListData.length) &&
              <EmptyStateWrapper fullScreen>
                <EmptyStateParagraph title="Nothing found" />
              </EmptyStateWrapper>
              }
            </ScrollWrapper>
          </Wrapper>
        </SlideModal>
      </View>
    );
  }
}

export default withTheme(TextInput);
