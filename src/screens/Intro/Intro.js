// @flow
import * as React from 'react';
import type { NavigationScreenProp } from 'react-navigation';
import { Text, View, TouchableHighlight, Image } from 'react-native';
import { connect } from 'react-redux';
import { checkIfWalletExistsAction } from '../../actions/walletActions';
import { EMPTY } from '../../constants/walletConstants';
import styles from './styles';

const introImage = require('../../assets/images/logo_pillar_intro.png');

type Props = {
  navigation: NavigationScreenProp<*>,
  checkIfWalletExists: () => Function,
  wallet: Object,
};

class Intro extends React.Component<Props> {
  componentWillMount() {
    const { checkIfWalletExists } = this.props;
    checkIfWalletExists();
  }

  setBackground = (btn: number) => {
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
      backgroundColor: '',
    };

    if (btn === 0) {
      obj.backgroundColor = '#48BBEC';
    } else if (btn === 1) {
      obj.backgroundColor = '#E77AAE';
    } else {
      obj.backgroundColor = '#758BF4';
    }

    return obj;
  };

  createNewWallet = () => {
    this.props.navigation.navigate('NewWallet');
  };

  unlockExistingWallet = () => {
    this.props.navigation.navigate('Login');
  };

  importOldWallet = () => {
    this.props.navigation.navigate('Import');
  };

  render() {
    const { wallet: { walletState } } = this.props;

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
          style={[this.setBackground(1), walletState === EMPTY && { backgroundColor: 'lightgray' }]}
          underlayColor="white"
          onPress={this.unlockExistingWallet}
          disabled={walletState === EMPTY}
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

const mapStateToProps = ({ wallet }) => ({ wallet });

const mapDispatchToProps = (dispatch: Function) => ({
  checkIfWalletExists: () => dispatch(checkIfWalletExistsAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(Intro);
