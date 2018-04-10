// PURPOSE: this screen is used to display the 12-word 
// backup phrase for the wallet.
import React, { Component } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
  Button,
  TouchableHighlight,
} from 'react-native';

import ethers from 'ethers';

import DefaultButton from '../../components/Buttons/DefaultButton';
import PopModal from '../../components/Modals/PopModal';

const mneumonicPhrase = ethers.HDNode.entropyToMnemonic(ethers.utils.randomBytes(16));
const mneumonicList = mneumonicPhrase.split(" ");

export default class BackupPhrase extends Component {

  createListItem(i, list) {
    return (
      <Text style={styles.listItem} key={{i}+list[i]}>{ list[i] }</Text>
    );
  }

  popModalHandlePrimary(){
    console.log('tap')
  }

  popModalHandleDismiss(){
    console.log('tap')
  }

  render() {

    const wordList = Array(...{length: mneumonicList.length})
      .map((num, i) => this.createListItem(i, mneumonicList));

    return (
      <View style={styles.container}>
        <View style={styles.textContainer}>
          <Text style={styles.header}>Write Down Your Backup Phrase</Text>
          <Text style={styles.paragraph}>This is your unique 12-word backup phrase. Write down your backup phrase in the exact sequence.</Text>
        </View>
        
        <View style={styles.mneumonicContainer}>
        { wordList }
        </View>

        <View style={styles.confirmContainer}>
          <Text style={styles.paragraphSmall}>Did your write down your backup phrase?</Text>
          <DefaultButton title="I've Written it Down" onPress={this.handleNext}></DefaultButton>
        </View>

        <PopModal
          style={{opacity: 0}}
          title = 'Be Advised'
          message = 'To protect your assets, write down your backup phrase and passcode on paper.'
          actionPrimary = 'I got it'
          showCloseBtn = 'true'
          popModalHandlePrimary={this.popModalHandlePrimary}
          popModalHandleDismiss={this.popModalHandleDismiss}/>

      </View>

    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },

  textContainer: {
    justifyContent: 'flex-start',
    paddingLeft: 10,
    paddingRight: 10,
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

  paragraphSmall: {
    fontSize:12,
    padding: 10,
    color: 'grey',
  },

  mneumonicContainer: {
    marginLeft: -10,
    marginRight: -10,
    marginTop: 20,
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#f2f2f2',
    flexWrap: 'wrap',
    flexDirection: 'row',

    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#d6d7da',
  },

  listItem: {
    fontWeight: 'bold',
    marginRight: 10,
    marginBottom: 2,
    fontSize: 12,
  },

  confirmContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  }

});
