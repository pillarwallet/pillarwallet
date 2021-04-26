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
import get from 'lodash.get';
import t from 'translations/translate';

import IconButton from 'components/IconButton';
import { BaseText, MediumText } from 'components/Typography';
import Spinner from 'components/Spinner';
import Icon from 'components/Icon';
import Image from 'components/Image';
import Button from 'components/Button';
import Input from 'components/Input';
import ButtonText from 'components/ButtonText';
import SelectorOptions from 'components/SelectorOptions';
import Tooltip from 'components/Tooltip';
import Modal from 'components/Modal';

import { fontSizes, fontStyles } from 'utils/variables';
import { getColorByTheme, getThemeColors } from 'utils/themes';
import { noop } from 'utils/common';
import { images } from 'utils/images';
import { resolveAssetSource, getFontFamily, getLineHeight, getFontSize } from 'utils/textInput';

import type { Theme } from 'models/Theme';
import type { Props as ButtonProps } from 'components/Button';
import type { Props as IconButtonProps } from 'components/IconButton';
import type { InputPropsType, SelectorOptions as SelectorOptionsType } from 'models/TextInput';
import type { Option } from 'models/Selector';

type Props = {
  errorMessage?: string,
  inputProps: InputPropsType,
  trim?: boolean,
  autoCorrect?: boolean,
  keyboardAvoidance?: boolean,
  loading?: boolean,
  onLayout?: () => void,
  additionalStyle?: Object,
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
  inputWrapperStyle?: Object,
  rightPlaceholder?: string,
  fallbackToGenericToken?: boolean,
  renderOption?: (item: Option, selectOption: (option: Option) => void) => React.Node,
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
};

type EventLike = {
  nativeEvent: Object,
};

const InputField = styled(Input)`
  color: ${({ theme }) => theme.colors.basic010};
  ${({ smallPadding }) => `padding: 0 ${smallPadding ? 6 : 14}px`};
  align-self: stretch;
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
  border-color: ${({ error, theme }) => error ? theme.colors.secondaryAccent240 : 'transparent'};
`;

const ItemHolder = styled.View`
  position: relative;
  background-color: ${({ theme }) => theme.colors.inputField};
  border-radius: 4px;
`;

const ButtonWrapper = styled.View`
  padding: 4px;
`;

const LeftSideWrapper = styled.View`
  padding-left: 14px;
  flex-direction: row;
  align-items: center;
`;

const RightSideWrapper = styled.TouchableOpacity`
  padding-right: 14px;
  flex-direction: row;
  align-items: center;
`;

const StyledImage = styled(Image)`
  height: 24px;
  width: 24px;
  resize-mode: contain;
  ${({ source, theme }) => !source && `tint-color: ${theme.colors.basic010};`}
`;

const AddonRegularText = styled(BaseText)`
  color: ${({ theme }) => theme.colors.basic030};
  flex-wrap: wrap;
  max-width: 80px;
`;

const AddonIcon = styled(Icon)`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.basic010};
  padding-right: 9px;
`;

const Selector = styled.TouchableOpacity`
  height: ${({ height }) => height}px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-left: 16px;
  padding-right: ${({ paddingRight }) => paddingRight || 10}px;
  background-color: ${({ theme }) => theme.colors.basic050};
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
  border: 1px solid ${getColorByTheme({ lightKey: 'basic060', darkKey: 'basic050' })};
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

const PlaceholderRight = styled(MediumText)`
  ${fontStyles.big};
  ${({ addMargin }) => !!addMargin && 'margin-right: 8px;'}
`;

const SelectorValue = styled(MediumText)`
  ${fontStyles.big};
  color: ${({ theme }) => theme.colors.basic010};
  margin-left: 8px;
`;

const SelectorChevron = styled(Icon)`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.basic020};
  margin-left: 15px;
`;

const InputLabel = styled(MediumText)`
  margin-bottom: 8px;
`;


class TextInput extends React.Component<Props, State> {
  multilineInputField: Input;
  searchInput: React.ElementRef<typeof RNInput>;
  rnInput: Object;

  static defaultProps = {
    autoCorrect: false,
    trim: true,
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      isFocused: false,
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
    const {
      selectorOptions = {},
      renderOption,
    } = this.props;

    const {
      options = [],
      selectorModalTitle,
      optionsSearchPlaceholder,
    } = selectorOptions;

    Keyboard.dismiss();
    Modal.open(() => (
      <SelectorOptions
        onHide={this.props.inputProps.onSelectorClose}
        title={selectorModalTitle}
        options={options}
        searchPlaceholder={optionsSearchPlaceholder}
        optionKeyExtractor={this.optionKeyExtractor}
        onOptionSelect={this.selectValue}
        renderOption={renderOption}
        onOpen={this.props.inputProps.onSelectorOpen}
      />
    ));
  };

  selectValue = (selectedValue: Option) => {
    const { inputProps: { onChange, selectorValue } } = this.props;
    const { input } = selectorValue;
    if (onChange) onChange({ selector: (selectedValue: $FlowFixMe), input });
  };

  focusInput = () => {
    if (this.searchInput) this.searchInput.focus();
  };

  focusMultilineInput = () => {
    if (this.multilineInputField) this.multilineInputField.focus();
  }

  onMultilineInputFieldPress = () => {
    const { onLeftSideTextPress } = this.props;
    if (onLeftSideTextPress) onLeftSideTextPress();
    this.focusMultilineInput();
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
          {shouldDisplaySpinner && <Spinner size={30} trackWidth={3} style={{ paddingLeft: 15 }} />}
        </View>
      );
    }

    if (shouldDisplaySpinner) {
      return <Spinner size={30} trackWidth={3} />;
    }

    const optionImageSource = resolveAssetSource(selectedOptionIcon);
    return (
      <ValueWrapper>
        <StyledImage
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
      <View
        style={[
          {
            flexDirection: 'row',
            width: '100%',
            justifyContent,
          },
          inputHeaderStyle,
        ]}
      >
        {customLabel}
        {!!label && <InputLabel>{label}</InputLabel>}
        {!!rightLabel && (
          <ButtonText buttonText={rightLabel} onPress={onPressRightLabel} fontSize={fontSizes.regular} />
        )}
        {customRightLabel}
      </View>
    );
  };

  getSelectorOptionsCount = (selectorOptions?: SelectorOptionsType): number => {
    return selectorOptions?.options?.length ?? 0;
  }

  render() {
    const { isFocused } = this.state;
    const {
      inputProps,
      errorMessage,
      autoCorrect,
      loading,
      onLayout,
      additionalStyle,
      getInputRef,
      innerImageURI,
      fallbackToGenericToken,
      buttonProps,
      theme,
      leftSideText,
      numeric,
      iconProps,
      rightPlaceholder,
      selectorOptions = {},
      customInputHeight,
      inputWrapperStyle = {},
      itemHolderStyle,
      leftSideSymbol,
      onRightAddonPress,
    } = this.props;
    let { fallbackSource, hasError } = this.props;

    hasError = hasError ?? (!!errorMessage);

    const colors = getThemeColors(theme);
    const {
      value = '', selectorValue = {}, multiline, editable = true,
    } = inputProps;
    const { input: inputValue } = selectorValue;
    const textInputValue = inputValue || value;
    const { genericToken } = images(theme);
    if (fallbackToGenericToken) fallbackSource = genericToken;

    let inputHeight = 62;
    if (customInputHeight) {
      inputHeight = customInputHeight;
    } else if (multiline) {
      inputHeight = Platform.OS === 'ios' ? 120 : 100;
    }

    const customStyle = multiline ? { paddingTop: 10 } : {};

    const { fullWidth: fullWidthSelector } = selectorOptions;

    const showLeftAddon = (innerImageURI || fallbackSource) || !!leftSideText || !!leftSideSymbol;
    const showRightAddon = !!iconProps || loading || rightPlaceholder;

    const selectorOptionsCount = this.getSelectorOptionsCount(selectorOptions);

    const imageSource = resolveAssetSource(innerImageURI);

    const disabledSelector = selectorOptionsCount <= 1;

    const defaultInputStyle = {
      fontSize: getFontSize(value, numeric),
      lineHeight: multiline ? getLineHeight(value, numeric) : null,
      fontFamily: getFontFamily(value, numeric),
      textAlignVertical: multiline ? 'top' : 'center', // eslint-disable-line i18next/no-literal-string
      height: inputHeight,
      flex: 1,
      color: hasError ? colors.secondaryAccent240 : colors.basic010,
    };

    return (
      <View style={[{ paddingBottom: 10, flexDirection: 'column' }, inputWrapperStyle]}>
        {this.renderInputHeader()}
        <InputBorder error={hasError} style={itemHolderStyle}>
          <Tooltip
            body={errorMessage || ''}
            isVisible={!!hasError}
          >
            <ItemHolder error={hasError} style={itemHolderStyle} >
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
                    {!!leftSideSymbol && <AddonIcon name={leftSideSymbol} />}
                    {!!leftSideText && <AddonRegularText>{leftSideText}</AddonRegularText>}
                  </LeftSideWrapper>
                </TouchableWithoutFeedback>}
                {!fullWidthSelector && (
                /* $FlowFixMe: incorrect RN flow types */
                <TouchableWithoutFeedback style={{ flex: 1 }} onPress={this.focusMultilineInput}>
                  <View style={{ flex: 1 }}>

                    <InputField
                      {...inputProps}
                      ref={(input) => {
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
                      style={[
                          defaultInputStyle,
                          customStyle,
                          additionalStyle,
                          !editable && { color: colors.basic010 },
                        ]}
                      onLayout={onLayout}
                      placeholderTextColor={colors.basic030}
                      alignTextOnRight={!!numeric}
                      smallPadding={!!onRightAddonPress}
                      autoFocus
                    />
                  </View>
                </TouchableWithoutFeedback>
                )}
                {showRightAddon &&
                <RightSideWrapper onPress={onRightAddonPress} disabled={!onRightAddonPress}>
                  {!!rightPlaceholder &&
                  <PlaceholderRight color={colors.basic030} addMargin={!!iconProps}>
                    {rightPlaceholder}
                  </PlaceholderRight>
                }
                  {!!iconProps && <IconButton color={colors.basic000} {...iconProps} />}
                  {!!loading && <Spinner size={30} trackWidth={3} style={{ marginLeft: 6 }} />}
                </RightSideWrapper>}
                {!!buttonProps &&
                <ButtonWrapper>
                  <Button {...buttonProps} block={false} />
                </ButtonWrapper>}
              </Item>
              {Platform.OS === 'ios' && <IosFocusInput
                caretHidden
                autoCorrect={false}
                ref={(ref) => { this.rnInput = ref; }}
                onFocus={this.handleRNFocus}
              />}
            </ItemHolder>
          </Tooltip>
        </InputBorder>
      </View>
    );
  }
}

export default withTheme(TextInput);
