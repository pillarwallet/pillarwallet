// @flow
import * as React from 'react';
import { View } from 'react-native';
import { ActionSheet } from 'native-base';
import Toast from 'components/Toast';

type Props = {
  children: React.Node,
}

const Root = (props: Props) => (
  <View {...props} style={{ flex: 1 }}>
    {props.children}
    <Toast
      ref={c => {
        if (c && !Toast.toastInstances.includes(c)) Toast.toastInstances.push(c);
      }}
    />
    <ActionSheet
      ref={c => {
        if (c) ActionSheet.actionsheetInstance = c;
      }}
    />
  </View>
);

export default Root;
