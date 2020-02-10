// @flow
import * as React from 'react';
import { View } from 'react-native';

const style = {
  main: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
};

type Props = {
  children: React.Node,
}

export default function CenterView({ children }: Props) {
  return <View style={style.main}>{children}</View>;
}
