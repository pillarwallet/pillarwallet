// @flow
import * as React from 'react';
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

type Props = {
  title: string,
  onPress: Function,
};

export default function DefaultButton(props: Props) {
  return (
    <TouchableHighlight style={styles.defaultBtn} onPress={props.onPress}>
      <Text style={styles.defaultBtnTitle}>{props.title}</Text>
    </TouchableHighlight>
  );
}
