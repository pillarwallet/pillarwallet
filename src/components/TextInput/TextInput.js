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
import { Item as NBItem } from 'native-base';
import {
  View,
  Platform,
  TextInput as RNInput,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { CachedImage } from 'react-native-cached-image';
import get from 'lodash.get';
import t from 'translations/translate';

import { DARK_THEME } from 'constants/appSettingsConstants';

import IconButton from 'components/IconButton';
import { BaseText, MediumText } from 'components/Typography';
import Spinner from 'components/Spinner';
import Icon from 'components/Icon';
import Button from 'components/Button';
import Input from 'components/Input';
import ButtonText from 'components/ButtonText';
import SelectorOptions from 'components/SelectorOptions/SelectorOptions-old';

import { fontSizes, fontStyles } from 'utils/variables';
import { getThemeColors, themedColors } from 'utils/themes';
import { noop } from 'utils/common';
import { images } from 'utils/images';
import { resolveAssetSource, getFontFamily, getLineHeight, getFontSize } from 'utils/textInput';

import type { Theme } from 'models/Theme';
import type { Props as ButtonProps } from 'components/Button';
import type { Props as IconButtonProps } from 'components/IconButton';
import type { InputPropsType, SelectorOptions as SelectorOptionsType } from 'models/TextInput';


type Props = {
  errorMessage?: string,
  inputProps: InputPropsType,
  trim?: boolean,
  autoCorrect?: boolean,
  keyboardAvoidance?: boolean,
  loading?: boolean,
  onLayout?: () => void,
  additionalStyle?: Object,
  errorMessageStyle?: Object,
  itemHolderStyle?: Object,
  getInputRef?: (Input) => void,
  innerImageURI?: string,
  fallbackSource?: number,
  buttonProps?: ButtonProps,
  theme: Theme,
  leftSideText?: string,
  numeric?: boolean,
  iconProps?: IconButtonProps,
  selectorOptions?: SelectorOptionsType,
  errorMessageOnTop?: boolean,
  inputWrapperStyle?: Object,
  rightPlaceholder?: string,
  fallbackToGenericToken?: boolean,
  renderOption?: (item: Object, selectOption: () => void) => React.Node,
  renderSelector?: (selector: Object) => React.Node,
  optionKeyExtractor?: (item: Object) => string,
  hasError?: boolean,
  customInputHeight?: number,
  onLeftSideTextPress?: () => void,
  onRightAddonPress?: () => void,
  leftSideSymbol?: string,
};

type State = {
  isFocused: boolean,
  showOptionsSelector: boolean,
};

type EventLike = {
  nativeEvent: Object,
};

const ErrorMessage = styled(BaseText)`
  color: ${themedColors.negative};
  width: 100%;
  ${({ isOnTop }) => isOnTop ? 'margin-bottom: 10px' : 'margin-top: 10px'};
`;

const InputField = styled(Input)`
  color: ${themedColors.text};
  ${({ smallPadding }) => `padding: 0 ${smallPadding ? 6 : 14}px`};
  align-self: center;
  margin: 0;
  text-align: ${({ alignTextOnRight }) => alignTextOnRight ? 'right' : 'auto'};
`;

const IosFocusInput = styled(RNInput)`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 1px;
`;

const Item = styled(NBItem)`
  border-bottom-color: transparent;
  border-bottom-width: 0;
  flex-direction: row;
  min-height: 0;
  height: ${({ height }) => height}px;
  width: 100%;
  margin: 0;
`;

const InputBorder = styled.View`
  border-radius: 4px;
  border: 1px;
  border-color: ${({ error, theme }) => error ? theme.colors.negative : 'transparent'};
`;

const ItemHolder = styled.View`
  background-color: ${({ error, theme }) => error ? theme.colors.card : theme.colors.tertiary};
  position: relative;
  border-radius: 4px;
`;

const InputFooter = styled(View)`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 0 2px;
  margin-bottom: 6px;
  margin-top: -4px;
`;

const ButtonWrapper = styled.View`
  padding: 4px;
`;

const LeftSideWrapper = styled.View`
  padding-left: 14px;
  flex-direction: row;
  align-items: center;
  max-width: 25%;
`;

const RightSideWrapper = styled.TouchableOpacity`
  padding-right: 14px;
  flex-direction: row;
  align-items: center;
`;

const Image = styled(CachedImage)`
  height: 24px;
  width: 24px;
  resize-mode: contain;
  ${({ source, theme }) => !source && `tint-color: ${theme.colors.text};`}
`;

const AddonRegularText = styled(BaseText)`
  color: ${themedColors.secondaryText};
  flex-wrap: wrap;
`;

const AddonBigText = styled(BaseText)`
  ${fontStyles.giant};
  color: ${themedColors.text};
  margin-right: 9;
  margin-top: -5;
`;

const Selector = styled.TouchableOpacity`
  height: ${({ height }) => height}px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-left: 16px;
  padding-right: ${({ paddingRight }) => paddingRight || 10}px;
  background-color: ${themedColors.card};
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
  border: 1px solid ${({ theme: { current, colors } }) => {
    return current === DARK_THEME ? colors.tertiary : colors.secondaryAccent;
  }};
  ${({ fullWidth }) => fullWidth && `
    flex: 1;
    border-radius: 4px;
  `}
  margin: 0;
`;

const ValueWrapper = styled.View`
  flex-direction: row;
  align-items: center;
`;

const Placeholder = styled(MediumText)`
  ${fontStyles.big};
`;

const PlaceholderRight = styled(BaseText)`
  ${fontStyles.medium};
  ${({ addMargin }) => !!addMargin && 'margin-right: 8px;'}
`;

const SelectorValue = styled(MediumText)`
  ${fontStyles.big};
  color: ${themedColors.text};
  margin-left: 8px;
`;

const SelectorChevron = styled(Icon)`
  font-size: 16px;
  color: ${themedColors.primary};
  margin-left: 15px;
`;

const InputLabel = styled(MediumText)`
  margin-bottom: 8px;
`;


class TextInput extends React.Component<Props, State> {
  multilineInputField: Input;
  searchInput: RNInput;
  rnInput: Object;

  static defaultProps = {
    autoCorrect: false,
    trim: true,
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      isFocused: false,
      showOptionsSelector: false,
    };
  }

  handleBlur = (e: EventLike) => {
    if (Platform.OS === 'android' && e.nativeEvent.text === undefined) {
      return;
    }

    const { inputProps: { onBlur, selectorValue = {} }, trim } = this.props;
    const { selector } = selectorValue;
    const value = trim ? e.nativeEvent.text.trim() : e.nativeEvent.text;
    if (onBlur) {
      if (selector) {
        onBlur({ selector, input: value });
      } else {
        onBlur(value);
      }
    }

    if (Platform.OS === 'ios' && this.props.inputProps.multiline && this.props.keyboardAvoidance) {
      this.setState({
        isFocused: false,
      });
    }
  };

  handleChange = (e: EventLike) => {
    const { inputProps: { onChange, selectorValue = {} } } = this.props;
    const value = e.nativeEvent.text;
    const { selector } = selectorValue;

    if (onChange) {
      if (selector) {
        onChange({ selector, input: value });
      } else {
        onChange(value);
      }
    }
  };

  handleFocus = () => {
    const { inputProps: { multiline, onFocus }, keyboardAvoidance } = this.props;
    if (Platform.OS === 'ios' && multiline && keyboardAvoidance) {
      this.handleMultilineFocus();
      return;
    }
    this.setState({
      isFocused: true,
    });
    if (onFocus) {
      onFocus();
    }
  };

  handleRNFocus = () => {
    setTimeout(() => {
      if (this.multilineInputField) this.multilineInputField.focus();
      this.setState({
        isFocused: true,
      });
    }, 250);
  };

  handleMultilineFocus = () => {
    if (!this.state.isFocused && this.rnInput) {
      this.rnInput.focus();
    }
  };

  handleSubmit = () => {
    const { onSubmit } = this.props.inputProps;
    if (onSubmit) onSubmit();
  };

  openSelector = () => {
    Keyboard.dismiss();
    this.setState({ showOptionsSelector: true });
    const { inputProps } = this.props;
    const { onSelectorOpen } = inputProps;
    if (onSelectorOpen) onSelectorOpen();
  };

  closeSelector = () => {
    this.setState({ showOptionsSelector: false });
    const { inputProps } = this.props;
    const { onSelectorClose } = inputProps;
    if (onSelectorClose) onSelectorClose();
  };

  selectValue = (selectedValue: Object, onSuccess: () => void) => {
    const { inputProps: { onChange, selectorValue } } = this.props;
    const { input } = selectorValue;
    if (onChange) onChange({ selector: selectedValue, input });
    this.setState({ showOptionsSelector: false });
    if (onSuccess) onSuccess();
  };

  focusInput = () => {
    if (this.searchInput) this.searchInput.focus();
  };

  onMultilineInputFieldPress = () => {
    const { onLeftSideTextPress } = this.props;
    if (onLeftSideTextPress) onLeftSideTextPress();
    if (this.multilineInputField) this.multilineInputField.focus();
  };

  renderSelector = () => {
    const {
      theme, inputProps, selectorOptions = {}, renderSelector,
    } = this.props;
    const { genericToken } = images(theme);
    const selector = get(inputProps, 'selectorValue.selector', {});

    if (renderSelector) return renderSelector(selector);

    const {
      icon: selectedOptionIcon,
      iconFallback: selectedOptionFallback,
      value: selectedValue,
    } = selector;

    const shouldDisplaySpinner = this.getSelectorOptionsCount(selectorOptions) < 1;

    if (!selectedValue) {
      return (
        <View style={{ flexDirection: 'row' }}>
          <Placeholder>{selectorOptions.selectorPlaceholder || t('label.select')}</Placeholder>
          {shouldDisplaySpinner && <Spinner width={30} height={30} style={{ paddingLeft: 15 }} />}
        </View>
      );
    }

    if (shouldDisplaySpinner) {
      return <Spinner width={30} height={30} />;
    }

    const optionImageSource = resolveAssetSource(selectedOptionIcon);
    return (
      <ValueWrapper>
        <Image
          key={selectedValue}
          source={optionImageSource}
          fallbackSource={selectedOptionFallback || genericToken}
          resizeMode="contain"
        />
        <SelectorValue>{selectedValue}</SelectorValue>
      </ValueWrapper>
    );
  };

  optionKeyExtractor = (option) => {
    const { optionKeyExtractor } = this.props;
    if (optionKeyExtractor) {
      return optionKeyExtractor(option);
    }
    return option?.value;
  };

  renderInputHeader = () => {
    const { inputProps } = this.props;
    const {
      label,
      onPressRightLabel,
      rightLabel,
      inputHeaderStyle = {},
      customLabel,
      customRightLabel,
    } = inputProps;

    if (!label && !rightLabel && !customLabel) return null;
    const justifyContent = rightLabel && !(label || customLabel) ? 'flex-end' : 'space-between';

    return (
      <View style={{
        flexDirection: 'row',
        width: '100%',
        justifyContent,
        ...inputHeaderStyle,
      }}
      >
        {customLabel}
        {!!label && <InputLabel>{label}</InputLabel>}
        {!!rightLabel &&
          <ButtonText buttonText={rightLabel} onPress={onPressRightLabel} fontSize={fontSizes.regular} />
        }
        {customRightLabel}
      </View>
    );
  };

  getSelectorOptionsCount = (selectorOptions?: SelectorOptionsType): number => {
    if (!selectorOptions) return 0;
    const {
      options = [],
      optionTabs,
      horizontalOptions,
    } = selectorOptions;

    const horizontalOptionsLength = !horizontalOptions ? 0 : horizontalOptions.reduce((sum, item) => {
      if (item.data?.length) sum += item.data?.length;
      return sum;
    }, 0);
    const optionsInTabsLength = !optionTabs ? 0 : optionTabs.reduce((sum, tab) => {
      if (tab.options?.length) sum += tab.options?.length;
      return sum;
    }, 0);

    const selectorOptionsCount = options.length + horizontalOptionsLength + optionsInTabsLength;
    return selectorOptionsCount;
  }

  render() {
    const { isFocused, showOptionsSelector } = this.state;
    const {
      inputProps,
      errorMessage,
      hasError,
      autoCorrect,
      loading,
      onLayout,
      additionalStyle,
      getInputRef,
      errorMessageStyle,
      innerImageURI,
      fallbackToGenericToken,
      buttonProps,
      theme,
      leftSideText,
      numeric,
      iconProps,
      rightPlaceholder,
      selectorOptions = {},
      errorMessageOnTop,
      customInputHeight,
      inputWrapperStyle = {},
      renderOption,
      itemHolderStyle,
      leftSideSymbol,
      onRightAddonPress,
    } = this.props;
    let { fallbackSource } = this.props;

    const colors = getThemeColors(theme);
    const {
      value = '', selectorValue = {}, multiline, editable = true,
    } = inputProps;
    const { input: inputValue } = selectorValue;
    const textInputValue = inputValue || value;
    const { genericToken } = images(theme);
    if (fallbackToGenericToken) fallbackSource = genericToken;

    let inputHeight = 54;
    if (customInputHeight) {
      inputHeight = customInputHeight;
    } else if (multiline) {
      inputHeight = Platform.OS === 'ios' ? 120 : 100;
    }

    const customStyle = multiline ? { paddingTop: 10 } : {};

    const {
      options = [],
      optionTabs,
      fullWidth: fullWidthSelector,
      selectorModalTitle,
      optionsSearchPlaceholder,
      horizontalOptions,
    } = selectorOptions;

    const showLeftAddon = (innerImageURI || fallbackSource) || !!leftSideText || !!leftSideSymbol;
    const showRightAddon = !!iconProps || loading || rightPlaceholder;

    const selectorOptionsCount = this.getSelectorOptionsCount(selectorOptions);

    const imageSource = resolveAssetSource(innerImageURI);

    const errorTop = !!errorMessage && !!errorMessageOnTop;
    const errorBottom = !!errorMessage && !errorMessageOnTop;
    const showErrorIndicator = hasError || !!errorMessage;
    const disabledSelector = selectorOptionsCount <= 1;

    const defaultInputStyle = {
      fontSize: getFontSize(value, numeric),
      lineHeight: multiline ? getLineHeight(value, numeric) : null,
      fontFamily: getFontFamily(value, numeric),
      textAlignVertical: multiline ? 'top' : 'center', // eslint-disable-line i18next/no-literal-string
      height: inputHeight,
      flex: 1,
    };

    return (
      <View style={{ paddingBottom: 10, flexDirection: 'column', ...inputWrapperStyle }}>
        {errorTop && <ErrorMessage style={errorMessageStyle} isOnTop>{errorMessage}</ErrorMessage>}
        {this.renderInputHeader()}
        <InputBorder error={showErrorIndicator} style={itemHolderStyle} >
          <ItemHolder error={showErrorIndicator} style={itemHolderStyle} >
            <Item
              isFocused={isFocused}
              height={inputHeight}
            >
              {!!Object.keys(selectorOptions).length &&
              <Selector
                fullWidth={fullWidthSelector}
                onPress={!disabledSelector ? this.openSelector : noop}
                disabled={disabledSelector}
                height={inputHeight}
                paddingRight={disabledSelector && 16}
              >
                {this.renderSelector()}
                {selectorOptionsCount > 1 && <SelectorChevron name="selector" />}
              </Selector>}
              {showLeftAddon &&
              <TouchableWithoutFeedback onPress={this.onMultilineInputFieldPress}>
                <LeftSideWrapper>
                  {(innerImageURI || fallbackSource) && <Image
                    source={imageSource}
                    fallbackSource={fallbackSource}
                    style={{ marginRight: 9 }}
                  />}
                  <AddonBigText>{leftSideSymbol}</AddonBigText>
                  {!!leftSideText && <AddonRegularText>{leftSideText}</AddonRegularText>}
                </LeftSideWrapper>
              </TouchableWithoutFeedback>}
              {!fullWidthSelector &&
              <InputField
                {...inputProps}
                innerRef={(input) => {
                  if (getInputRef) getInputRef(input);
                  this.multilineInputField = input;
                }}
                onChange={this.handleChange}
                onBlur={this.handleBlur}
                onEndEditing={this.handleBlur}
                onFocus={this.handleFocus}
                onSubmitEditing={this.handleSubmit}
                value={textInputValue}
                autoCorrect={autoCorrect}
                style={[defaultInputStyle, customStyle, additionalStyle, !editable && { color: colors.accent }]}
                onLayout={onLayout}
                placeholderTextColor={colors.accent}
                alignTextOnRight={!!numeric}
                smallPadding={!!onRightAddonPress}
              />}
              {showRightAddon &&
              <RightSideWrapper onPress={onRightAddonPress} disabled={!onRightAddonPress}>
                {!!rightPlaceholder &&
                  <PlaceholderRight color={colors.accent} addMargin={!!iconProps}>{rightPlaceholder}</PlaceholderRight>}
                {!!iconProps && <IconButton color={colors.primary} {...iconProps} />}
                {!!loading && <Spinner width={30} height={30} />}
              </RightSideWrapper>}
              {!!buttonProps &&
              <ButtonWrapper>
                <Button {...buttonProps} />
              </ButtonWrapper>}
            </Item>
            {Platform.OS === 'ios' && <IosFocusInput
              caretHidden
              autoCorrect={false}
              innerRef={(ref) => { this.rnInput = ref; }}
              onFocus={this.handleRNFocus}
            />}
          </ItemHolder>
        </InputBorder>
        {errorBottom &&
        <InputFooter>
          <ErrorMessage style={errorMessageStyle}>{errorMessage}</ErrorMessage>
        </InputFooter>}
        <SelectorOptions
          isVisible={showOptionsSelector}
          onHide={this.closeSelector}
          title={selectorModalTitle}
          options={options}
          optionTabs={optionTabs}
          searchPlaceholder={optionsSearchPlaceholder}
          optionKeyExtractor={this.optionKeyExtractor}
          onOptionSelect={this.selectValue}
          renderOption={renderOption}
          horizontalOptionsData={horizontalOptions}
        />
      </View>
    );
  }
}

export default withTheme(TextInput);
