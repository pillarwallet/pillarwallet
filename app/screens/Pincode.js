import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  NavigatorIOS,
  Button,
  ActivityIndicator,
  Image,
  Row,
} from 'react-native';

export default class Pincode extends Component {
    
    static defaultProps = {
        pageHeading: 'Enter Passcode',
        pageInstructions: 'Setup your Passcode'
    }

    state = {
        passCode: [],
        passCodeLength: 6,
    }

    handleKeyPress = (key) => {

        if (this.state.passCode.length === this.state.passCodeLength) {
            return
        }

        this.setState({
            passCode: [ ...this.state.passCode, key]
        }, () => {
            if (this.state.passCode.length === this.state.passCodeLength) {
                this.props.onPinSubmit(this.state.passCode.join(''));
            }
        })

        
    };

    handleKeyPressDelete = () => {
        const { passCode } = this.state
        this.setState({passCode: passCode.slice(0, -1) });
    };

    handleKeyPressForgot = () => {
      console.log('Need to Reset Wallet');
    }

    //Verify Pincode
    verifyPin = () =>{    
      console.log('Verify Pin');
      var array = [];
      this.setState({passCode: array });
    }
    

    render() {
      const { passCode, passCodeLength } = this.state
      const { pageHeading, pageInstructions} = this.props

      const pinCodeDots = Array.apply(null, { length: this.state.passCodeLength })
        .map((num, i) =>(
            <View key={i} style={[styles.inactivePinDot, passCode[i] && styles.activePinDot ]}></View>
        ))

      //SETUP PINPAD INPUTS
      const keyInputs = Array.apply(null, { length: 9 })
        .map((num, i) =>(
            <View style={styles.inputKey} key={i + 1}>
            <Button title={`${i + 1}`} onPress={() => {
                this.handleKeyPress(`${i + 1}`)}}/>
            </View>
        ))

        keyInputs.push(
            <View style={styles.inputKey} key={'Forgot'}>
            <Button title={'Forgot?'} onPress={() => {
                this.handleKeyPressForgot()}}/>
            </View>,

            <View style={styles.inputKey} key={0}>
            <Button title={'0'} onPress={() => {
                this.handleKeyPress('0')}}/>
            </View>,

            <View style={styles.inputKey} key={'⌫'}>
            <Button title={'⌫'} onPress={() => {
                this.handleKeyPressDelete()}}/>
            </View>
        )

      return (
        
        <View style={styles.container}>
            <View style={styles.textContainer}>
                <Text style={styles.header}> {pageHeading } </Text>
                <Text style={styles.paragraph}> {pageInstructions } </Text>
            </View>

            <View style={styles.pinContainer}>
                { pinCodeDots }
            </View>

            <View style={styles.inputKeyContainer}>
                { keyInputs } 
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
      alignItems: 'center'
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
        width:12,
        height:12,
        backgroundColor: 'gray',
        borderRadius: 12/2,
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
        width:120,
        height:55,
    }, 

  });