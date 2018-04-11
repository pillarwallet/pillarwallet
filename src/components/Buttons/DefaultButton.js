import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableHighlight,
} from 'react-native';

const styles = StyleSheet.create({
  defaultBtn: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 10 * 2,
    backgroundColor: '#01bbff',
    width: '80%',
  },

  defaultBtnTitle: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default function DefaultButton() {
  return (
    <TouchableHighlight style={styles.defaultBtn} onPress={this.props.onPress}>
      <Text style={styles.defaultBtnTitle}>{this.props.title}</Text>
    </TouchableHighlight>
  );
}
