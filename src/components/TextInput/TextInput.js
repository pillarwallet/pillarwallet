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
import { View, TouchableOpacity, Platform, TextInput as RNInput } from 'react-native';
import IconButton from 'components/IconButton';
import { BaseText, BoldText } from 'components/Typography';
import Spinner from 'components/Spinner';
import Icon from 'components/Icon';
import { fontSizes, baseColors, UIColors, spacing, fontStyles, appFont } from 'utils/variables';
import { themedColors } from 'utils/themes';
import type { Theme } from 'models/Theme';

type inputPropsType = {
  placeholder?: string,
  onChange: Function,
  onBlur?: Function,
  value: ?string,
  multiline?: boolean,
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
  inputProps: inputPropsType,
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
  theme: Theme,
}

type State = {
  isFocused: boolean,
}

type EventLike = {
  nativeEvent: Object,
}

const inputStyleProps = {
  default: {
    fontSize: fontSizes.big,
    textAlign: 'left',
  },
  bigText: {
    borderBottomWidth: 0,
    borderRadius: 6,
    fontSize: fontSizes.large,
    lineHeight: Platform.OS === 'ios' ? 34 : fontSizes.large,
    padding: '0 20px',
    inputHeight: Platform.OS === 'ios' ? 80 : 70,
  },
  bigTextNoBackground: {
    borderBottomWidth: 0,
    fontSize: fontSizes.large,
    lineHeight: Platform.OS === 'ios' ? 34 : fontSizes.large,
    padding: '0 20px',
    inputHeight: Platform.OS === 'ios' ? 80 : 70,
  },
  noBackground: {
    borderBottomWidth: 0,
    fontSize: fontSizes.big,
    lineHeight: Platform.OS === 'ios' ? 34 : fontSizes.large,
  },
  amount: {
    fontSize: fontSizes.giant,
    textAlign: 'right',
  },
  secondary: {
    borderBottomWidth: 0,
    borderRadius: 6,
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
  color: ${baseColors.fireEngineRed};
  flex: 1;
`;

const PostFix = styled(BoldText)`
  line-height: 22px;
  margin-top: 8px;
`;

const InputField = styled(Input)`
  ${({ customInputStyle }) => customInputStyle.textAlign ? `text-align: ${customInputStyle.textAlign};` : ''}
  background-color: ${themedColors.tertiary};
  ${({ customInputStyle }) => customInputStyle.borderRadius ? `border-radius: ${customInputStyle.borderRadius};` : ''}
  color: ${themedColors.text};
  ${({ customInputStyle }) => customInputStyle.lineHeight ? `line-height: ${customInputStyle.lineHeight};` : ''}
  padding: ${({ customInputStyle }) => customInputStyle.padding || 0};
  font-family: ${appFont.medium};
`;

const Item = styled(NBItem)`
  border-bottom-color: ${props => props.isFocused ? baseColors.electricBlue : baseColors.mediumGray};
  ${props => props.noBorder ? 'border-bottom-width: 0;' : ''}
  height: ${props => props.height}px;
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
  color: ${baseColors.electricBlue};
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

const AbsoluteSpinner = styled(Spinner)`
  position: absolute;
  right: ${spacing.mediumLarge}px;
  top: 50%;
  margin-top: -20px;
`;

const AbsoluteIcon = styled(Icon)`
  position: absolute;
  right: ${spacing.mediumLarge}px;
  top: 50%;
  margin-top: -13px;
  font-size: ${fontSizes.regular}px;
  color: ${props => props.color || baseColors.electricBlue};
`;

class TextInput extends React.Component<Props, State> {
  multilineInputField: Object;
  rnInput: Object;

  state = {
    isFocused: false,
  };

  static defaultProps = {
    inputType: 'default',
    autoCorrect: false,
    trim: true,
  };

  constructor(props: Props) {
    super(props);
    this.rnInput = React.createRef();
    this.multilineInputField = React.createRef();
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
      viewWidth = '100%',
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
      theme,
      inputType,
    } = this.props;
    const { value = '' } = inputProps;
    const { isFocused } = this.state;
    const customInputStyle = inputStyleProps[this.props.inputType] || inputStyleProps.default;
    const additionalRightPadding = loading || statusIcon ? 36 : 0;
    const variableFocus = Platform.OS === 'ios' && inputProps.multiline && this.props.keyboardAvoidance ?
      this.handleMultilineFocus : this.handleFocus;
    const defaultInputHeight = Platform.OS === 'ios' ? 65 : 55;
    let inputHeight = customInputStyle.inputHeight || defaultInputHeight;

    if (inputProps.multiline) {
      inputHeight = Platform.OS === 'ios' ? 120 : 100;
    }

    const updatedColors = {};
    if (inputType === 'bigTextNoBackground' || inputType === 'noBackground') {
      updatedColors.tertiary = 'transparent';
    }
    const updatedTheme = { ...theme, colors: { ...theme.colors, ...updatedColors } };

    const customStyle = inputProps.multiline ? { paddingTop: 10 } : {};
    return (
      <View style={{ paddingBottom: 10 }}>
        <Item
          inlineLabel={inlineLabel}
          stackedLabel={!inlineLabel}
          error={!!errorMessage}
          isFocused={isFocused}
          noBorder={noBorder}
          height={inputHeight}
        >
          {!!label &&
          <CustomLabel
            labelBigger={labelBigger}
            style={labelStyle}
          >
            {lowerCase ? label : label.toUpperCase()}
          </CustomLabel>
          }
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
            customInputStyle={customInputStyle}
            autoCorrect={autoCorrect}
            style={[{
              fontSize: customInputStyle.fontSize,
              width: viewWidth,
              paddingRight: (inputProps.multiline ? 58 : 14) + additionalRightPadding,
              textAlignVertical: inputProps.multiline ? 'top' : 'center',
              marginBottom: 10,
              height: inputHeight,
            }, customStyle,
              additionalStyle,
            ]}
            onLayout={onLayout}
            theme={updatedTheme}
          />
          {Platform.OS === 'ios' && <RNInput
            caretHidden
            autoCorrect={false}
            ref={this.rnInput}
            onFocus={this.handleRNFocus}
            style={{ marginTop: -10 }}
          />}
          {!!loading && <AbsoluteSpinner width={30} height={30} />}
          {!!statusIcon && <AbsoluteIcon name={statusIcon} color={statusIconColor} />}
          {!!icon && <FloatingButton onPress={onIconPress} icon={icon} color={iconColor} fontSize={30} />}
          {!!postfix && <PostFix>{postfix}</PostFix>}
        </Item>
        <InputFooter>
          {errorMessage ? <ErrorMessage style={errorMessageStyle}>{errorMessage}</ErrorMessage> : <View />}
          {!!footerAddonText &&
          <TouchableOpacity onPress={footerAddonAction}>
            <AddonText>{footerAddonText}</AddonText>
          </TouchableOpacity>}
        </InputFooter>
      </View>
    );
  }
}

export default withTheme(TextInput);
