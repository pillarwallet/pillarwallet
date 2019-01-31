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
import { Item as NBItem, Input, Label } from 'native-base';
import { fontSizes, fontWeights, baseColors, UIColors, spacing } from 'utils/variables';
import IconButton from 'components/IconButton';
import { BaseText, BoldText } from 'components/Typography';
import { View, TouchableOpacity, Platform, TextInput as RNInput } from 'react-native';
import Spinner from 'components/Spinner';

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
}

type State = {
  isFocused: boolean,
}

type EventLike = {
  nativeEvent: Object,
}

const inputTypes = {
  default: {
    fontSize: fontSizes.medium,
    fontWeight: fontWeights.bold,
    textAlign: 'left',
  },
  amount: {
    fontSize: fontSizes.extraExtraLarge,
    fontWeight: fontWeights.bold,
    textAlign: 'right',
  },
  secondary: {
    backgroundColor: baseColors.lightGray,
    borderBottomWidth: 0,
    borderRadius: 6,
    color: baseColors.slateBlack,
    fontSize: fontSizes.small,
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
  font-weight: 900;
  line-height: 22px;
  margin-top: 8px;
`;

const InputField = styled(Input)`
  ${props => props.inputType.fontWeight ? `font-weight: ${props.inputType.fontWeight};` : ''}
  ${props => props.inputType.textAlign ? `text-align: ${props.inputType.textAlign};` : ''}
  ${props => props.inputType.backgroundColor ? `background-color: ${props.inputType.backgroundColor};` : ''}
  ${props => props.inputType.borderRadius ? `border-radius: ${props.inputType.borderRadius};` : ''}
  ${props => props.inputType.color ? `color: ${props.inputType.color};` : ''}
  padding: ${props => props.inputType.padding || 0};
`;

const Item = styled(NBItem)`
  border-bottom-color: ${props => props.isFocused ? baseColors.electricBlue : baseColors.mediumGray};
  ${props => props.noBorder ? 'border-bottom-width: 0;' : ''}
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
  font-size: ${props => props.labelBigger ? fontSizes.small : fontSizes.extraSmall};
  letter-spacing: 0.5;
  font-weight: ${props => props.labelBigger ? fontWeights.bold : '600'};
  line-height: 24px;
  padding-top: ${props => props.labelBigger ? '35px' : '5px'};
  padding-bottom: ${props => props.labelBigger ? '12px' : '0'};
  `;

const AbsoluteSpinner = styled(Spinner)`
  position: absolute;
  right: ${spacing.mediumLarge}px;
  top: ${Platform.select({
    ios: '11px',
    android: '12px',
  })};
`;

class TextInput extends React.Component<Props, State> {
  rnInput: Object;
  multilineInputField: Object;

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
    onChange(value);
  };

  handleFocus = () => {
    this.setState({
      isFocused: true,
    });
  };

  handleMultilineFocus = () => {
    if (!this.state.isFocused) {
      this.rnInput.current.focus();
      this.setState({
        isFocused: false,
      }, () => {
        setTimeout(() => {
          this.multilineInputField._root.focus();
          this.handleFocus();
        }, 50);
      });
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
    } = this.props;
    const { value = '' } = inputProps;
    const { isFocused } = this.state;
    const inputType = inputTypes[this.props.inputType] || inputTypes.default;
    const additionalRightPadding = loading ? 36 : 0;
    const variableFocus = Platform.OS === 'ios' && inputProps.multiline && this.props.keyboardAvoidance ?
      this.handleMultilineFocus : this.handleFocus;
    return (
      <View style={{ paddingBottom: 10 }}>
        <Item
          inlineLabel={inlineLabel}
          stackedLabel={!inlineLabel}
          error={!!errorMessage}
          style={inputProps.multiline && { height: 140 }}
          isFocused={isFocused}
          noBorder={noBorder}
        >
          {!!label && <CustomLabel labelBigger={labelBigger}>{lowerCase ? label : label.toUpperCase()}</CustomLabel>}
          <InputField
            {...inputProps}
            innerRef={(input) => { this.multilineInputField = input; }}
            onChange={this.handleChange}
            onBlur={this.handleBlur}
            onEndEditing={() => this.handleBlur}
            onFocus={variableFocus}
            value={value}
            inputType={inputType}
            autoCorrect={autoCorrect}
            style={{
              fontSize: inputType.fontSize,
              width: viewWidth,
              paddingRight: (inputProps.multiline ? 58 : 14) + additionalRightPadding,
              paddingTop: inputProps.multiline ? 10 : 0,
              textAlignVertical: inputProps.multiline ? 'top' : 'center',
              marginBottom: 10,
            }}
          />
          {Platform.OS === 'ios' &&
          <RNInput
            caretHidden
            autoCorrect={false}
            ref={this.rnInput}
            style={{ marginTop: -10 }}
          />}
          {!!loading && <AbsoluteSpinner width={30} height={30} />}
          {!!icon && <FloatingButton onPress={onIconPress} icon={icon} color={iconColor} fontSize={30} />}
          {!!postfix && <PostFix>{postfix}</PostFix>}
        </Item>
        <InputFooter>
          {errorMessage ? <ErrorMessage>{errorMessage}</ErrorMessage> : <View />}
          {!!footerAddonText &&
          <TouchableOpacity onPress={footerAddonAction}>
            <AddonText>{footerAddonText}</AddonText>
          </TouchableOpacity>}
        </InputFooter>
      </View>
    );
  }
}

export default TextInput;
