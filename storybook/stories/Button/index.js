// @flow
import * as React from 'react';
import { TouchableOpacity } from 'react-native';

type Props = {
  onPress?: () => void,
  children?: React.Node,
}

export default function Button({ onPress, children }: Props) {
  return <TouchableOpacity onPress={onPress}>{children}</TouchableOpacity>;
}
