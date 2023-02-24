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
import { View, Platform, TextInput as RNInput, TouchableWithoutFeedback } from 'react-native';

import IconButton from 'components/IconButton';
import { BaseText, MediumText } from 'components/legacy/Typography';
import Spinner from 'components/Spinner';
import Icon from 'components/legacy/Icon';
import Image from 'components/Image';
import Button from 'components/legacy/Button';
import Input from 'components/Input';
import ButtonText from 'components/legacy/ButtonText';
import Tooltip from 'components/Tooltip';

import { fontSizes, fontStyles } from 'utils/variables';
import { getThemeColors } from 'utils/themes';
import { images } from 'utils/images';
import { resolveAssetSource, getFontFamily, getLineHeight, getFontSize } from 'utils/textInput';

import type { ChangeEvent } from 'utils/types/react-native';
import type { Theme } from 'models/Theme';
import type { Props as ButtonProps } from 'components/legacy/Button';
import type { Props as IconButtonProps } from 'components/IconButton';
import type { InputPropsType } from 'models/TextInput';

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
  inputWrapperStyle?: Object,
  rightPlaceholder?: string,
  fallbackToGenericToken?: boolean,
  hasError?: boolean,
  customInputHeight?: number,
  onLeftSideTextPress?: () => void,
  onRightAddonPress?: () => void,
  leftSideSymbol?: string,
  inputError?: boolean,
  avoidAutoFocus?: boolean,
  disableSelection?: boolean
};

type State = {
  isFocused: boolean,
  selectionStart: Object,
};

/**
 * @deprecated This component is considered legacy and should not be used in new code
 *
 * Use: components/inputs/TextInput instead
 */
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
      selectionStart: { start: 0, end: 0 },
    };
  }

  handleBlur = () => {
    const {
      inputProps: { onBlur, selectorValue = {}, value },
      trim,
    } = this.props;
    const { selector } = selectorValue;
    const trimmedValue = trim ? value?.toString().trim() : value;
    if (onBlur) {
      if (selector) {
        onBlur({ selector, input: trimmedValue });
      } else {
        onBlur(trimmedValue ?? '');
      }
    }

    if (Platform.OS === 'ios' && this.props.inputProps.multiline && this.props.keyboardAvoidance) {
      this.setState({
        isFocused: false,
      });
    }
    this.setState({
      selectionStart: {
        start: 0,
        end: 0,
      },
    });
  };

  handleChange = (e: ChangeEvent) => {
    const {
      inputProps: { onChange, selectorValue = {} },
    } = this.props;
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
    const {
      inputProps: { multiline, onFocus, value },
      keyboardAvoidance,
    } = this.props;
    if (Platform.OS === 'ios' && multiline && keyboardAvoidance) {
      this.handleMultilineFocus();
      return;
    }
    this.setState(
      {
        isFocused: true,
        selectionStart: {
          start: value?.toString().length ?? 0,
          end: value?.toString().length ?? 0,
        },
      },
      () => {
        this.setState({ selectionStart: null });
      },
    );

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

  focusInput = () => {
    if (this.searchInput) this.searchInput.focus();
  };

  focusMultilineInput = () => {
    if (this.multilineInputField) this.multilineInputField.focus();
  };

  onMultilineInputFieldPress = () => {
    const { onLeftSideTextPress } = this.props;
    if (onLeftSideTextPress) onLeftSideTextPress();
    this.focusMultilineInput();
  };

  renderInputHeader = () => {
    const { inputProps } = this.props;
    const { label, onPressRightLabel, rightLabel, inputHeaderStyle = {}, customLabel, customRightLabel } = inputProps;

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

  render() {
    const { isFocused, selectionStart } = this.state;
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
      customInputHeight,
      inputWrapperStyle = {},
      itemHolderStyle,
      leftSideSymbol,
      onRightAddonPress,
      inputError = false,
      avoidAutoFocus = false,
      disableSelection,
    } = this.props;
    let { fallbackSource, hasError } = this.props;

    hasError = hasError ?? !!errorMessage;

    const colors = getThemeColors(theme);
    const { value = '', selectorValue = {}, multiline, editable = true } = inputProps;
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

    const showLeftAddon = innerImageURI || fallbackSource || !!leftSideText || !!leftSideSymbol;
    const showRightAddon = !!iconProps || !!loading || !!rightPlaceholder;

    const imageSource: any = resolveAssetSource(innerImageURI);

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
          <Tooltip body={errorMessage || ''} isVisible={!!hasError}>
            <ItemHolder error={hasError} style={itemHolderStyle}>
              <Item isFocused={isFocused} height={inputHeight}>
                {showLeftAddon && (
                  <TouchableWithoutFeedback onPress={this.onMultilineInputFieldPress}>
                    <LeftSideWrapper>
                      {(innerImageURI || fallbackSource) && (
                        <Image source={imageSource} fallbackSource={fallbackSource} style={{ marginRight: 9 }} />
                      )}
                      {!!leftSideSymbol && <AddonIcon name={leftSideSymbol} />}
                      {!!leftSideText && <AddonRegularText>{leftSideText}</AddonRegularText>}
                    </LeftSideWrapper>
                  </TouchableWithoutFeedback>
                )}
                {/* $FlowFixMe: incorrect RN flow types */}
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
                        inputError && { color: colors.secondaryAccent240 },
                      ]}
                      onLayout={onLayout}
                      placeholderTextColor={colors.basic030}
                      alignTextOnRight={!!numeric}
                      smallPadding={!!onRightAddonPress}
                      autoFocus={!avoidAutoFocus}
                      selection={disableSelection ? undefined : selectionStart}
                    />
                  </View>
                </TouchableWithoutFeedback>
                {showRightAddon && (
                  <RightSideWrapper onPress={onRightAddonPress} disabled={!onRightAddonPress}>
                    {!!rightPlaceholder && (
                      <PlaceholderRight color={colors.basic030} addMargin={!!iconProps}>
                        {rightPlaceholder}
                      </PlaceholderRight>
                    )}
                    {!!iconProps && <IconButton color={colors.basic000} {...iconProps} />}
                    {!!loading && <Spinner size={30} trackWidth={3} style={{ marginLeft: 6 }} />}
                  </RightSideWrapper>
                )}
                {!!buttonProps && (
                  <ButtonWrapper>
                    <Button {...buttonProps} block={false} />
                  </ButtonWrapper>
                )}
              </Item>
              {Platform.OS === 'ios' && (
                <IosFocusInput
                  caretHidden
                  autoCorrect={false}
                  ref={(ref) => {
                    this.rnInput = ref;
                  }}
                  onFocus={this.handleRNFocus}
                />
              )}
            </ItemHolder>
          </Tooltip>
        </InputBorder>
      </View>
    );
  }
}

export default withTheme(TextInput);

const InputField = styled(Input)`
  color: ${({ theme }) => theme.colors.basic010};
  ${({ smallPadding }) => `padding: 0 ${smallPadding ? 6 : 14}px`};
  align-self: stretch;
  margin: 0;
  text-align: ${({ alignTextOnRight }) => (alignTextOnRight ? 'right' : 'auto')};
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
  border-color: ${({ error, theme }) => (error ? theme.colors.secondaryAccent240 : 'transparent')};
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

const AddonRegularText = styled(BaseText)`
  color: ${({ theme }) => theme.colors.basic030};
  flex-wrap: wrap;
  max-width: 80px;
`;

const AddonIcon = styled(Icon)`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.basic010};
  margin-right: 9px;
`;

const PlaceholderRight = styled(MediumText)`
  ${fontStyles.big};
  ${({ addMargin }) => !!addMargin && 'margin-right: 8px;'}
`;

const InputLabel = styled(MediumText)`
  margin-bottom: 8px;
`;
