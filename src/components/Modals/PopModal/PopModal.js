// @flow
import * as React from 'react';
import {
  Animated,
  Button,
  Text,
  Image,
  View,
} from 'react-native';

import styles from './styles';

type Props = {
  title: string,
  message: string,
  actionTitle: string,
  modalImage: string,
  onDismiss: Function,
  onAccept: Function,
  children?: React.Node,
  isVisible: boolean,
};

type State = {
  animFadeInBackground: any,
  animModalPopUp: any,
  animModalPopUpOpacity: any,
  isVisible: boolean,
};

export default class PopModal extends React.Component<Props, State> {
  static defaultProps = {
    onDismiss: () => {},
  }

  static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    if (nextProps.isVisible !== prevState.isVisible) {
      return {
        ...prevState,
        isVisible: nextProps.isVisible,
        animFadeInBackground: new Animated.Value(0),
        animModalPopUp: new Animated.Value(100),
        animModalPopUpOpacity: new Animated.Value(0),
      };
    }
    return null;
  }

  constructor(props: Props) {
    super(props);
    this.state = {
      animFadeInBackground: new Animated.Value(0),
      animModalPopUp: new Animated.Value(100),
      animModalPopUpOpacity: new Animated.Value(0),
      isVisible: props.isVisible,
    };
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (prevState.isVisible === this.state.isVisible) return;
    Animated.parallel([
      Animated.spring(this.state.animFadeInBackground, {
        toValue: 0.5,
      }),
      Animated.spring(this.state.animModalPopUp, {
        toValue: 0,
      }),
      Animated.spring(this.state.animModalPopUpOpacity, {
        toValue: 1,
      }),
    ]).start();
  }

  handleAnimationDismiss = () => {
    const { onDismiss } = this.props;
    Animated.parallel([
      Animated.timing(this.state.animFadeInBackground, {
        toValue: 0,
      }),
      Animated.timing(this.state.animModalPopUp, {
        toValue: 40,
        duration: 200,
      }),
      Animated.spring(this.state.animModalPopUpOpacity, {
        toValue: 0,
      }),
    ]).start(onDismiss);
  };

  render() {
    const {
      animFadeInBackground,
      animModalPopUp,
      animModalPopUpOpacity,
      isVisible,
    } = this.state;
    const { message, title } = this.props;
    if (!isVisible) return null;
    return (
      <View style={styles.modalContainer}>
        <Animated.View style={[styles.dismissOverlay, { opacity: animFadeInBackground }]} />

        <View style={styles.modalWrapper}>

          <Animated.View style={[styles.modalContent, { marginTop: animModalPopUp, opacity: animModalPopUpOpacity }]}>

            <View style={styles.sliderHeaderContainer}>
              <Button title="✖️" onPress={this.handleAnimationDismiss} />
            </View>

            <View style={styles.modalMessageWrapper}>
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Image
                  style={{
                  width: 80,
                  height: 80,
                  marginBottom: 20,
                }}
                />

                <Text style={styles.sliderHeader}>{title}</Text>
                <Text style={{ color: 'gray' }}>{ message }</Text>
              </View>

              <Button title={this.props.actionTitle} onPress={this.props.onAccept} />
            </View>

          </Animated.View>
        </View>

      </View>
    );
  }
}
