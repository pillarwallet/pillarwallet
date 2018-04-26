// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { Item, Input, Label } from 'native-base';
import ButtonIcon from 'components/ButtonIcon';
import { EventTargetLike } from 'rxjs/observable/FromEventObservable';

type inputProps = {
  placeholder?: string,
  onChange: Function,
  onBlur: Function
}

type Props = {
  icon?: string,
  label: string,
  id: string,
  iconColor?: string,
  errorMessage?: string,
  onIconPress?: Function,
  inputProps: inputProps
}

const FloatingButton = styled(ButtonIcon) `
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

class TextInput extends React.Component<Props> {

  handleBlur = (e: EventTargetLike) => {
    const { inputProps: { onBlur }} = this.props;
    onBlur && onBlur(e.nativeEvent.text);
  }


  handleChange = (e: EventTargetLike) => {
    const { inputProps: { onChange }} = this.props;
    onChange && onChange(e.nativeEvent.text);
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
    return (
      <Item stackedLabel style={{ marginBottom: 20 }} error={!!errorMessage}>
        <Label>{label}</Label>
        <Input {...inputProps} onChange={this.handleChange} onBlur={this.handleBlur}/>
        {icon && <FloatingButton onPress={onIconPress} icon={icon} color={iconColor} fontSize={30} />}
        {errorMessage && <Error>{errorMessage}</Error>}
      </Item>
    );
  }
}

export default TextInput;
