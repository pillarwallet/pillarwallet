// @flow
import * as React from 'react';
import { StyleSheet } from 'react-native';
import { Icon, Button } from 'native-base';

type Props = {
  icon: string,
  color?: string,
  onPress?: Function,
  fontSize?: number,
  style?: StyleSheet.Styles,
}

const ButtonIcon = (props: Props) => {
  const {
    icon,
    onPress,
    fontSize,
    color,
    style,
  } = props;
  return (
    <Button transparent onPress={onPress} style={style}>
      <Icon active={false} name={icon} style={{ fontSize, color }} />
    </Button>
  );
};

export default ButtonIcon;
