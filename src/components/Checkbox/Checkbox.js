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
  checked: boolean,
  tag: any,
};

type State = {
  checked: boolean,
  animateActive: any,
};

export default class Checkbox extends React.Component<Props, State> {
  constructor(props: any) {
    super();
    this.state = {
      checked: props.checked,
      animateActive: new Animated.Value(0),
    };
  }

  componentWillReceiveProps(nextProps: any) {
    if (nextProps.checked !== this.props.checked) {
      this.setState({
        checked: nextProps.checked,
      });
    }
  }

  shouldComponentUpdate(nextProps: any) {
    return nextProps.checked !== this.props.checked;
  }

  toggleCheckBox = () => {
    this.setState({
      checked: !this.state.checked,
    });

    Animated.spring(this.state.animateActive, {
      toValue: 12,
      duration: 60,
    }).start();

    if (this.state.checked === true) {
      this.setState({
        animateActive: new Animated.Value(0),
      });
    }

    this.props.toggleCheckbox(!this.state.checked, this.props.tag);
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
