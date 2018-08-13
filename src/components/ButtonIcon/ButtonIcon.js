// @flow
import * as React from 'react';
import { StyleSheet } from 'react-native';
import { Button } from 'native-base';
import Icon from 'components/Icon';

type Props = {
  icon: string,
  color?: string,
  onPress?: Function,
  fontSize?: number,
  style?: StyleSheet.Styles,
  iconStyle?: StyleSheet.Styles,
  type?: string,
  margin?: number,
}

const ButtonIcon = (props: Props) => {
  const {
    icon,
    onPress,
    fontSize,
    color,
    style,
    margin,
    type,
  } = props;
  const iconParams = {
    active: false,
    name: icon,
    style: {
      paddingTop: 0,
      fontSize,
      color,
      marginLeft: margin,
      marginRight: margin,
      marginTop: margin,
      marginBottom: margin,
    },
    type,
  };
  return (
    <Button transparent iconLeft={0} onPress={onPress} style={style}>
      <Icon {...iconParams} />
    </Button>
  );
};

export default ButtonIcon;
