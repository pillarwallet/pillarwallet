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
  tag: any,
};

type State = {
  active: boolean,
  animateActive: any,
};

export default class Checkbox extends React.Component<Props, State> {
  state = {
    active: false,
    animateActive: new Animated.Value(0),
  }

  toggleCheckBox = () => {
    this.setState({
      active: !this.state.active,
    });

    Animated.spring(this.state.animateActive, {
      toValue: 12,
      duration: 300,
    }).start(this.finishedAnimating);
  };

  finishedAnimating = () => {
    this.props.toggleCheckbox(this.props.tag);
  }

  render() {
    const { animateActive } = this.state;
    return (
      <TouchableHighlight onPress={this.toggleCheckBox} underlayColor="transparent" >
        <Animated.View style={[styles.checkBox, this.state.active &&
          [{ borderWidth: animateActive }, styles.checkBoxActive]]}
        />
      </TouchableHighlight>
    );
  }
}
