// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { Item, Input, Label } from 'native-base';
import { fontSizes, fontWeights, baseColors } from 'utils/variables';
import ButtonIcon from 'components/ButtonIcon';
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
  label: string,
  id?: string,
  iconColor?: string,
  errorMessage?: string,
  onIconPress?: Function,
  inputProps: inputPropsType,
  inputType: string,
  trim: boolean,
  footerAddonText?: string,
  footerAddonAction?: Function,
}

type State = {
  value: ?string
}

type EventLike = {
  nativeEvent: Object,
}

const inputTypes = {
  default: {
    fontSize: fontSizes.medium,
    fontWeight: fontWeights.book,
    textAlign: 'left',
  },
  amount: {
    fontSize: fontSizes.extraExtraLarge,
    fontWeight: fontWeights.bold,
    textAlign: 'right',
  },
};

const FloatingButton = styled(ButtonIcon)`
  position:absolute;
  right: 0;
  top: 20px;
  justify-content: center;
  width: 60px;
  height: 60px;
  margin: 0;
  padding: 0;
`;

const ErrorMessage = styled.Text`
  color: tomato;
  flex: 1;
`;

const PostFix = styled.Text`
  font-weight: 900;
  line-height: 22px;
  margin-top: 8px;
`;

const InputField = styled(Input)`
  font-size: ${props => props.inputType.fontSize};
  font-weight: ${props => props.inputType.fontWeight};
  text-align: ${props => props.inputType.textAlign};
`;

const InputFooter = styled(View)`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 6px;
  margin-top: 6px;
`;

const AddonText = styled.Text`
  color: ${baseColors.clearBlue};
  width: 100%;
  text-align: right;
`;

class TextInput extends React.Component<Props, State> {
  state = {
    value: '',
  };

  static defaultProps = {
    inputType: 'default',
    trim: true,
  };

  static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    if (nextProps.inputProps && nextProps.inputProps.value !== prevState.value) {
      return {
        value: nextProps.inputProps.value,
      };
    }
    return null;
  }

  handleBlur = (e: EventLike) => {
    if (Platform.OS === 'android' && e.nativeEvent.text === undefined) {
      return;
    }

    const { inputProps: { onBlur }, trim } = this.props;
    const value = trim ? e.nativeEvent.text.trim() : e.nativeEvent.text;
    this.setState({ value }, () => {
      if (onBlur) {
        onBlur(value);
      }
    });
  };

  handleChange = (e: EventLike) => {
    const { inputProps: { onChange } } = this.props;
    const value = e.nativeEvent.text;
    this.setState({ value }, () => {
      if (onChange) {
        onChange(value);
      }
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
    } = this.props;
    const { value } = this.state;
    const inputType = inputTypes[this.props.inputType] || inputTypes.default;

    return (
      <View style={{ paddingBottom: 10 }}>
        <Item
          inlineLabel={inlineLabel}
          stackedLabel={!inlineLabel}
          error={!!errorMessage}
          style={inputProps.multiline && { height: 112 }}
        >
          <Label>{label}</Label>
          <InputField
            {...inputProps}
            onChange={this.handleChange}
            onBlur={this.handleBlur}
            onEndEditing={() => this.handleBlur}
            value={value}
            inputType={inputType}
            style={{ fontSize: 22 }}
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
