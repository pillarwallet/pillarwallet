// @flow
import * as React from 'react';
import {
  Animated,
  TouchableHighlight,
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
    borderColor: '#01bbff',
  },
});

type Props = {
  toggleCheckbox: Function,
};

type State = {
  checked: boolean,
  animateActive: any,
};

export default class Checkbox extends React.Component<Props, State> {
  state = {
    checked: false,
    animateActive: new Animated.Value(0),
  }

  checkStatus = () => {
    return this.state.checked;
  }

  toggleCheckBox = () => {
    this.setState({
      checked: !this.state.checked,
    });

    Animated.spring(this.state.animateActive, {
      toValue: 12,
      duration: 60,
    }).start();

    this.props.toggleCheckbox(!this.state.checked);
  };

  render() {
    const { animateActive } = this.state;
    return (
      <TouchableHighlight onPress={this.toggleCheckBox} underlayColor="transparent" >
        <Animated.View style={[styles.checkBox, this.state.checked &&
          [{ borderWidth: animateActive }, styles.checkBoxActive]]}
        />
      </TouchableHighlight>
    );
  }
}
