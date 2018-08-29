// @flow
import React from 'react';
import { View } from 'react-native';
import { ActionSheet } from 'native-base';
import Toast from 'components/Toast';

class Root extends React.Component {
  render() {
    return (
      <View {...this.props} style={{ flex: 1 }}>
        {this.props.children}
        <Toast
          ref={c => {
            if (c && Toast.toastInstances.indexOf(c) < 0) Toast.toastInstances.push(c);
          }}
        />
        <ActionSheet
          ref={c => {
            if (c) ActionSheet.actionsheetInstance = c;
          }}
        />
      </View>
    );
  }
}

export default Root;
