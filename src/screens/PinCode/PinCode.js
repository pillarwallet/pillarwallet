import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Button,
} from 'react-native';

const PASS_CODE_LENGTH = 6;

export default class PinCode extends Component {
  static defaultProps = {
    pageHeading: 'Enter Passcode',
    pageInstructions: 'Setup your Passcode',
  };

  state = {
    passCode: [],
  };

  handleKeyPress = (key) => {
    if (this.state.passCode.length === PASS_CODE_LENGTH) {
      return;
    }

    this.setState({
      passCode: [...this.state.passCode, key],
    }, () => {
      if (this.state.passCode.length === PASS_CODE_LENGTH) {
        // TODO: Handle callback for pin submit
        // this.props.onPinSubmit(this.state.passCode.join(''));
      }
    });
  };

  handleKeyPressDelete = () => {
    const {passCode} = this.state;
    this.setState({passCode: passCode.slice(0, -1)});
  };

  handleKeyPressForgot = () => {
    console.log('Need to Reset Wallet');
  };

  verifyPin = () => {
    console.log('Verify Pin');
    const array = [];
    this.setState({passCode: array});
  };

  createPinDot(i, passCode) {
    return (
      <View key={i} style={[styles.inactivePinDot, passCode[i] && styles.activePinDot]}/>
    );
  }

  createPinButton(key, title, callback) {
    return (
      <View style={styles.inputKey} key={key}>
        <Button title={title} onPress={callback}/>
      </View>
    );
  }

  generatePinInputs() {
    const keyInputs = Array(...{length: 9})
      .map((num, i) => {
        const key = i + 1;
        const title = key.toString();
        const callback = () => this.handleKeyPress(`${i + 1}`);
        return this.createPinButton(key, title, callback);
      });

    keyInputs.push(
      this.createPinButton('Forgot', 'Forgot?', () => this.handleKeyPressForgot()),
      this.createPinButton(0, '0', () => this.handleKeyPress('0')),
      this.createPinButton('⌫', '⌫', () => this.handleKeyPressDelete()),
    );

    return keyInputs;
  }

  render() {
    const {passCode} = this.state;
    const {pageHeading, pageInstructions} = this.props;

    const pinCodeDots = Array(...{length: PASS_CODE_LENGTH})
      .map((num, i) => this.createPinDot(i, passCode));

    const keyInputs = this.generatePinInputs();

    return (
      <View style={styles.container}>
        <View style={styles.textContainer}>
          <Text style={styles.header}> {pageHeading} </Text>
          <Text style={styles.paragraph}> {pageInstructions} </Text>
        </View>

        <View style={styles.pinContainer}>
          {pinCodeDots}
        </View>

        <View style={styles.inputKeyContainer}>
          {keyInputs}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: 'white',
  },

  textContainer: {
    flex: 0.25,
    justifyContent: 'flex-start',
  },

  header: {
    fontSize: 32,
    marginTop: 10,
    alignItems: 'center',
  },

  paragraph: {
    paddingTop: 10,
    fontSize: 16,
    color: 'grey',
  },

  pinContainer: {
    flex: 0.65,
    flexWrap: 'wrap',
    flexDirection: 'row',
    alignSelf: 'center',
    width: 140,
    justifyContent: 'space-between',
  },

  inactivePinDot: {
    width: 12,
    height: 12,
    backgroundColor: 'gray',
    borderRadius: 12 / 2,
    opacity: 0.5,
  },

  activePinDot: {
    opacity: 1,
  },

  inputKeyContainer: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    alignSelf: 'center',
    width: 360,
    justifyContent: 'flex-end',
  },

  inputKey: {
    justifyContent: 'center',
    width: 120,
    height: 55,
  },

});
