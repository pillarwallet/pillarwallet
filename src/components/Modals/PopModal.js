import React, { Component } from 'react';
import {
  Animated,
  Easing,
  View,
  Text,
  TouchableHighlight,
} from 'react-native';
import styles from './styles';
import OutlineButton from '../Buttons/OutlineButton';

export default class PopModal extends Component {
  //
    state = {
      showPopAnimation: new Animated.Value(0),
      verticalBounce: new Animated.Value(10),
    }

    componentDidMount() {
      Animated.parallel([

        Animated.timing(this.state.showPopAnimation, {
          toValue: 1,
          duration: 250,
        }),
        Animated.sequence([
          Animated.timing(this.state.verticalBounce, {
            toValue: -20,
            easing: Easing.in(),
            duration: 250,
          }),
          Animated.timing(this.state.verticalBounce, {
            toValue: 5,
            duration: 100,
          }),
          Animated.timing(this.state.verticalBounce, {
            toValue: -2,
            duration: 40,
          }),
          Animated.timing(this.state.verticalBounce, {
            toValue: 0,
            duration: 30,
          }),
        ]),
      ]).start();
    }

    dismissAnimation = () => {
      // Animated.timing(
      //   this.state.showPopAnimation, {
      //     toValue: 0,
      //     duration: 120,
      // }).start();
      //  TODO: Make this happen after the animation completes
      this.props.popModalHandleDismiss();
    }

    render() {
      const { showPopAnimation, verticalBounce } = this.state;

      return (
        <Animated.View style={[styles.popOverContainer, { opacity: showPopAnimation }]}>

          <TouchableHighlight style={styles.popOverContainerBG} onPress={this.props.popModalHandleDismiss}>
            <View />
          </TouchableHighlight>

          <Animated.View style={[styles.popOverBackground, { top: verticalBounce }]}>

            <View style={styles.popOverHeader}>
              <Text style={styles.popOverHeaderText}>{this.props.title}</Text>
            </View>

            <View style={styles.popOverContent}>
              <Text style={styles.popOverContentText}>{this.props.message}</Text>
            </View>

            <View style={styles.popOverActions}>
              <OutlineButton title={this.props.actionPrimary} onPress={this.dismissAnimation} />
            </View>

          </Animated.View>
        </Animated.View>
      );
    }
}

