// @flow
import * as React from 'react';
import { StyleSheet } from 'react-native';
import { Input, Icon, Button } from 'native-base';
import styled from 'styled-components/native';

type Props = {
  icon: string,
  color?: string,
  onPress?: Function,
  fontSize?: number,
  style?: StyleSheet.Styles
}

export default function ButtonIcon(props: Props) {
  const { icon,
    onPress,
    fontSize,
    color,
    style
  } = props;
  return (
    <Button transparent onPress={onPress} style={style}>
      <Icon active={false} name={icon} style={{ fontSize, color }} />
    </Button>
  );
}
