// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { Item as NBItem, Input, Label } from 'native-base';
import { fontSizes, fontWeights, baseColors, UIColors } from 'utils/variables';
import IconButton from 'components/IconButton';
import { BaseText, BoldText } from 'components/Typography';
import { View, TouchableOpacity, Platform } from 'react-native';

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
  position:absolute;
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
  margin-bottom: 6px;
  margin-top: 6px;
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

class TextInput extends React.Component<Props, State> {
  state = {
    isFocused: false,
  };

  static defaultProps = {
    inputType: 'default',
    autoCorrect: false,
    trim: true,
  };

  handleBlur = (e: EventLike) => {
    if (Platform.OS === 'android' && e.nativeEvent.text === undefined) {
      return;
    }

    const { inputProps: { onBlur }, trim } = this.props;
    const value = trim ? e.nativeEvent.text.trim() : e.nativeEvent.text;
    if (onBlur) {
      onBlur(value);
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
      viewWidth = 'auto',
      noBorder,
      lowerCase,
      labelBigger,
    } = this.props;
    const { value = '' } = inputProps;
    const { isFocused } = this.state;
    const inputType = inputTypes[this.props.inputType] || inputTypes.default;
    return (
      <View style={{ paddingBottom: 10 }}>
        <Item
          inlineLabel={inlineLabel}
          stackedLabel={!inlineLabel}
          error={!!errorMessage}
          style={inputProps.multiline && { height: 160 }}
          isFocused={isFocused}
          noBorder={noBorder}
        >
          {!!label && <CustomLabel labelBigger={labelBigger}>{lowerCase ? label : label.toUpperCase()}</CustomLabel>}
          <InputField
            {...inputProps}
            onChange={this.handleChange}
            onBlur={this.handleBlur}
            onEndEditing={() => this.handleBlur}
            onFocus={this.handleFocus}
            value={value}
            inputType={inputType}
            autoCorrect={autoCorrect}
            style={{ 
              fontSize: inputType.fontSize, 
              width: viewWidth, 
              lineHeight: inputProps.multiline ? 30 : 20,
              paddingRight: inputProps.multiline ? 50 : 0,
            }}
          />
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
