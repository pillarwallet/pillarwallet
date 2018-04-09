// @flow
import * as React from 'react';
import { StyleSheet, Text, View, TouchableHighlight, Image } from 'react-native';

const introImage = require('../../assets/images/logo_pillar_intro.png');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 18,
    color: '#111',
    alignSelf: 'center',
  },
  image: {
    alignSelf: 'center',
    height: 150,
    width: 150,
    marginBottom: 50,
  },
});

export default class Intro extends React.Component<{}> {
  componentDidMount() {
    // empty
  }
  setBackground = (btn) => {
    const obj = {
      height: 45,
      flexDirection: 'row',
      borderColor: 'white',
      borderWidth: 1,
      borderRadius: 8,
      marginBottom: 10,
      marginTop: 10,
      alignSelf: 'stretch',
      justifyContent: 'center',
    };

    if (btn === 0) {
      obj.backgroundColor = '#48BBEC';
    } else if (btn === 1) {
      obj.backgroundColor = '#E77AAE';
    } else {
      obj.backgroundColor = '#758BF4';
    }

    return obj;
  }

  createNewWallet = () => {
    this.props.navigation.navigate('NewWallet');
  };

  unlockExistingWallet = () => {
    this.props.navigation.navigate('Login');
  };

  importOldWallet = () => {

  };

  render() {
    return (
      <View style={styles.container}>
        <Image
          source={introImage}
          style={styles.image}
        />
        <TouchableHighlight
          style={this.setBackground(0)}
          underlayColor="white"
          onPress={this.createNewWallet}
        >
          <Text style={styles.buttonText}>Create new wallet</Text>
        </TouchableHighlight>
        <TouchableHighlight
          style={this.setBackground(1)}
          underlayColor="white"
          onPress={this.unlockExistingWallet}
        >
          <Text style={styles.buttonText}>Unlock existing</Text>
        </TouchableHighlight>
        <TouchableHighlight
          style={this.setBackground(2)}
          underlayColor="white"
          onPress={this.importOldWallet}
        >
          <Text style={styles.buttonText}>Import old wallet</Text>
        </TouchableHighlight>
      </View>
    );
  }
}
