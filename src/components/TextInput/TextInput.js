// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { Item, Input } from 'native-base';
import { Label } from 'components/Typography';
import ButtonIcon from 'components/ButtonIcon';

type inputPropsType = {
  placeholder?: string,
  onChange: Function,
  onBlur: Function,
  value: ?string
}

type Props = {
  icon?: string,
  style?: Object,
  label: string,
  id: string,
  iconColor?: string,
  errorMessage?: string,
  onIconPress?: Function,
  inputProps: inputPropsType
}

type State = {
  value: ?string
}

type EventLike = {
  nativeEvent: Object,
}

const FloatingButton = styled(ButtonIcon)`
  position:absolute;
  right: 5px;
  top: 20px;
  justifyContent: center;
`;

const Error = styled.Text`
  color: tomato;
  position: absolute;
  left: 0;
  bottom: -25px;
`;

class TextInput extends React.Component<Props, State> {
  state = {
    value: '',
  }

  static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    if (nextProps.inputProps.value !== prevState.value) {
      return {
        value: nextProps.inputProps.value,
      };
    }
    return null;
  }

  handleBlur = (e: EventLike) => {
    const { inputProps: { onBlur } } = this.props;
    const value = e.nativeEvent.text;
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
      label,
      onIconPress,
      iconColor = '#2077FD',
      inputProps,
      errorMessage,
    } = this.props;
    const { value } = this.state;

    return (
      <Item stackedLabel style={[this.props.style, { marginBottom: 20 }]} error={!!errorMessage}>
        <Label>{label}</Label>
        <Input {...inputProps} onChange={this.handleChange} onBlur={this.handleBlur} value={value} />
        {icon && <FloatingButton onPress={onIconPress} icon={icon} color={iconColor} fontSize={30} />}
        {errorMessage && <Error>{errorMessage}</Error>}
      </Item>
    );
  }
}

export default TextInput;
