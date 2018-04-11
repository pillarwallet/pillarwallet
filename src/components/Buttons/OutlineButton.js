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
    borderColor: 'white',
    borderWidth: 2,
  },

  defaultBtnTitle: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default function OutlineButton() {
  return (
    <TouchableHighlight style={styles.defaultBtn} onPress={this.props.onPress}>
      <Text style={styles.defaultBtnTitle}>{this.props.title}</Text>
    </TouchableHighlight>
  );
}
