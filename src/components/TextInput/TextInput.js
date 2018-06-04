// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { Item, Input, Label } from 'native-base';
import { fontSizes, fontWeights } from 'utils/variables';
import ButtonIcon from 'components/ButtonIcon';

type inputPropsType = {
  placeholder?: string,
  onChange?: Function,
  onBlur?: Function,
  value?: ?string
}

type Props = {
  icon?: string,
  inlineLabel?: boolean,
  alignRight?: boolean,
  postfix?: string,
  label: string,
  id: string,
  iconColor?: string,
  errorMessage?: string,
  onIconPress?: Function,
  inputProps: inputPropsType,
  inputType: string,
  trim: boolean,
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
  right: -15px;
  top: 20px;
  justifyContent: center;
  width: 60px;
  margin: 0;
  padding: 0;
`;

const Error = styled.Text`
  color: tomato;
  position: absolute;
  left: 0;
  bottom: -25px;
`;

const PostFix = styled.Text`
  fontWeight: 900;
  position: absolute;
  bottom: 0;
  right: 0;
`;

const InputField = styled(Input)`
  font-size: ${props => props.inputType.fontSize};
  font-weight: ${props => props.inputType.fontWeight};
  text-align: ${props => props.inputType.textAlign};
`;

class TextInput extends React.Component<Props, State> {
  state = {
    value: '',
  }

  static defaultProps = {
    inputType: 'default',
    trim: true,
  };

  static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    if (nextProps.inputProps.value !== prevState.value) {
      return {
        value: nextProps.inputProps.value,
      };
    }
    return null;
  }

  handleBlur = (e: EventLike) => {
    const { inputProps: { onBlur }, trim } = this.props;
    const value = trim ? e.nativeEvent.text.trim() : e.nativeEvent.text;
    this.setState({ value }, () => {
      if (onBlur) {
        onBlur(value);
      }
    });
  }

  handleChange = (e: EventLike) => {
    const { inputProps: { onChange } } = this.props;
    const value = e.nativeEvent.text;
    this.setState({ value }, () => {
      if (onChange) {
        onChange(value);
      }
    });
  }

  render() {
    const {
      icon,
      postfix,
      label,
      onIconPress,
      iconColor = '#2077FD',
      inputProps,
      errorMessage,
      inlineLabel,
    } = this.props;
    const { value } = this.state;
    const inputType = inputTypes[this.props.inputType] || inputTypes.default;

    return (
      <Item inlineLabel={inlineLabel} stackedLabel={!inlineLabel} style={{ marginBottom: 20 }} error={!!errorMessage}>
        <Label>{label}</Label>
        <InputField
          {...inputProps}
          onChange={this.handleChange}
          onBlur={this.handleBlur}
          value={value}
          inputType={inputType}
        />
        {!!icon && <FloatingButton onPress={onIconPress} icon={icon} color={iconColor} fontSize={30} />}
        {!!postfix && <PostFix>{postfix}</PostFix>}
        {!!errorMessage && <Error>{errorMessage}</Error>}
      </Item>
    );
  }
}

export default TextInput;
