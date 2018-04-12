// @flow
import * as React from 'react';
import {
  TouchableHighlight,
  View,
  StyleSheet,
} from 'react-native';

const styles = StyleSheet.create({
  checkBox: {
    width: 30,
    height: 30,
    borderRadius: 30 * 2,
    borderWidth: 2,
    borderColor: 'grey',
  },

  checkBoxActive: {
    borderWidth: (30 / 2) - 4,
    borderColor: '#01bbff',
  },
});

type Props = {
  toggleCheckbox: Function,
  tag: any,
};

type State = {
  active: boolean
};


export default class Checkbox extends React.Component<Props, State> {
  state = {
    active: false,
  }

  toggleCheckBox = () => {
    this.setState({
      active: !this.state.active,
    });

    this.props.toggleCheckbox(this.props.tag);
  };

  render() {
    return (
      <TouchableHighlight
        style={[styles.checkBox, this.state.active && styles.checkBoxActive]}
        onPress={this.toggleCheckBox}
        underlayColor="transparent"
      >
        <View />
      </TouchableHighlight>
    );
  }
}
