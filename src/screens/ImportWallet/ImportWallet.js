// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { Platform, BackHandler, Keyboard, Dimensions } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';
import {
  importWalletFromTWordsPhraseAction,
  importWalletFromPrivateKeyAction,
  resetWalletErrorAction,
} from 'actions/walletActions';
import {
  WALLET_ERROR,
  IMPORT_ERROR,
  IMPORT_WALLET_PRIVATE_KEY,
  IMPORT_WALLET_TWORDS_PHRASE,
  TWORDSPHRASE,
  PRIVATEKEY,
} from 'constants/walletConstants';
import Button from 'components/Button';
import { Container, ScrollWrapper } from 'components/Layout';
import { Paragraph, BaseText } from 'components/Typography';
import Header from 'components/Header';
import TextInput from 'components/TextInput';
import QRCodeScanner from 'components/QRCodeScanner';
import IconButton from 'components/IconButton';
import Title from 'components/Title';
import Tabs from 'components/Tabs';
import { fontSizes, baseColors } from 'utils/variables';

type Props = {
  importWalletFromTWordsPhrase: (tWordsPhrase: string) => Function,
  importWalletFromPrivateKey: (privateKey: string) => Function,
  wallet: Object,
  navigation: NavigationScreenProp<*>,
  resetWalletError: Function,
};

type State = {
  privateKey: string,
  tWordsPhrase: string,
  tWordsCount: number,
  errorMessage: string,
  errorField: string,
  isScanning: boolean,
  activeTab: string,
};

const window = Dimensions.get('window');

const InputWrapper = styled.View`
  flex-direction: row;
  align-items: center;
`;

const InputButton = styled.TouchableOpacity`
  align-items: center;
  margin-left: 10px;
`;

const ButtonText = styled(BaseText)`
  color: ${baseColors.electricBlue};
  font-size: ${fontSizes.small};
`;

class ImportWallet extends React.Component<Props, State> {
  state = {
    privateKey: '',
    tWordsPhrase: '',
    tWordsCount: 1,
    errorMessage: '',
    errorField: '',
    isScanning: false,
    activeTab: TWORDSPHRASE,
    tWordsPhraseFull: '',
  };

  constructor(props: Props) {
    super(props);
    props.navigation.setParams({
      handleImportSubmit: this.handleImportSubmit,
    });
  }

  physicalBackAction = () => {
    this.handleBackAction();
    return true;
  };

  componentDidMount() {
    const { navigation } = this.props;
    const navigateTo = navigation.getParam('navigateTo', null);
    if (Platform.OS === 'android' && navigateTo) {
      BackHandler.addEventListener('hardwareBackPress', this.physicalBackAction);
    }
  }

  componentWillUnmount() {
    if (Platform.OS === 'android') {
      BackHandler.removeEventListener('hardwareBackPress', this.physicalBackAction);
    }
  }

  static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    const { walletState, error } = nextProps.wallet;

    if (walletState === WALLET_ERROR && error.code === IMPORT_ERROR) {
      return {
        ...prevState,
        errorMessage: error.message,
        errorField: error.field,
      };
    } else if (walletState !== WALLET_ERROR) {
      return {
        ...prevState,
        errorMessage: '',
        errorField: '',
      };
    }
    return null;
  }

  handleImportSubmit = () => {
    const { importWalletFromTWordsPhrase, importWalletFromPrivateKey } = this.props;
    const { privateKey, tWordsPhrase } = this.state;

    if (privateKey) {
      importWalletFromPrivateKey(privateKey);
    } else if (tWordsPhrase) {
      importWalletFromTWordsPhrase(tWordsPhrase);
    } else {
      this.setState({ errorField: '' });
    }
  };

  handleQRScannerOpen = async () => {
    this.setState({ isScanning: !this.state.isScanning },
      () => {
        if (this.state.isScanning) {
          Keyboard.dismiss();
        }
      });
  };

  handleQRScannerClose = () => {
    this.setState({ isScanning: false });
  };

  handleQRRead = (privateKey: string) => {
    this.setState({ privateKey, isScanning: false });
  };

  getError = (errorField: string) => {
    if (errorField === this.state.errorField) {
      return this.state.errorMessage;
    }
    return '';
  };

  handleBackAction = () => {
    const { navigation, resetWalletError } = this.props;
    resetWalletError();
    const navigateTo = navigation.getParam('navigateTo', null);
    if (navigateTo) {
      navigation.navigate(navigateTo);
    } else {
      navigation.goBack(null);
    }
  };

  handleValueChange = (field) => (value) => {
    console.log('field', field);
    this.setState({
      [field]: value,
    });
    this.props.resetWalletError();
  };

  setActiveTab = (activeTab) => {
    this.setState({
      activeTab,
    });
  };

  addWord = () => {
    console.log('add-word');
    console.log('word-count', this.state.tWordsCount);
    this.setState({
      tWordsCount: this.state.tWordsCount + 1,
      tWordsPhraseFull: `${this.state.tWordsPhraseFull} ${this.state.tWordsPhrase}`,
    });
  };

  render() {
    const { privateKey, tWordsPhrase, isScanning, activeTab, tWordsCount, tWordsPhraseFull } = this.state;
    // const errorMessageTWordsPhrase = this.getError(IMPORT_WALLET_TWORDS_PHRASE);
    // const errorMessagePrivateKey = this.getError(IMPORT_WALLET_PRIVATE_KEY);
    // console.log(privateKey);
    console.log('tWordsPhrase', tWordsPhrase);
    console.log('tWordsPhraseFull', tWordsPhraseFull);

    const restoreWalletTabs = [
      {
        id: TWORDSPHRASE,
        name: '12 words',
        onPress: () => this.setActiveTab(TWORDSPHRASE),
      },
      {
        id: PRIVATEKEY,
        name: 'Private key',
        onPress: () => this.setActiveTab(PRIVATEKEY),
      },
    ];

    const tabsInfo = {
      TWORDSPHRASE: {
        paragraphText: 'Restore your ERC-20 compatible Ethereum wallet using your 12 word backup phrase.',
        inputLabel: `Word #${tWordsCount}`,
        changeName: 'tWordsPhrase',
        value: tWordsPhrase,
        errorMessage: this.getError(IMPORT_WALLET_TWORDS_PHRASE),
        buttonText: 'Next',
        buttonPress: this.addWord,
      },
      PRIVATEKEY: {
        paragraphText: 'Don&#39;t have your backup phrase? Use your private key instead.',
        inputLabel: 'Private key',
        changeName: 'privateKey',
        value: privateKey,
        errorMessage: this.getError(IMPORT_WALLET_PRIVATE_KEY),
        buttonText: 'Scan',
        buttonPress: this.handleQRScannerOpen,
      },
    };

    return (
      <Container>
        <Header onBack={this.handleBackAction} />
        <ScrollWrapper regularPadding>
          <Title noMargin title="restore wallet" dotColor={baseColors.freshEucalyptus} />
          <Tabs tabs={restoreWalletTabs} />
          <Paragraph>{tabsInfo[activeTab].paragraphText}</Paragraph>
          <InputWrapper>
            <TextInput
              label={tabsInfo[activeTab].inputLabel}
              inputProps={{
                onChange: this.handleValueChange(tabsInfo[activeTab].changeName),
                value: tabsInfo[activeTab].value,
                autoCapitalize: 'none',
              }}
              errorMessage={tabsInfo[activeTab].errorMessage}
              underlineColorAndroid="transparent"
              viewWidth={window.width - 95}
            />
            <InputButton onPress={tabsInfo[activeTab].buttonPress}>
              {activeTab === 'PRIVATEKEY' &&
              <IconButton
                icon="qrcode"
                color={baseColors.electricBlue}
                fontSize={fontSizes.extraLarge}
                onPress={tabsInfo[activeTab].buttonPress}
              />
              }
              <ButtonText>{tabsInfo[activeTab].buttonText}</ButtonText>
            </InputButton>
          </InputWrapper>
          <Button title="Import" onPress={() => this.props.navigation.state.params.handleImportSubmit()} />
        </ScrollWrapper>
        <QRCodeScanner
          isActive={isScanning}
          onDismiss={this.handleQRScannerClose}
          onRead={this.handleQRRead}
        />
      </Container>
    );
  }
}

const mapStateToProps = ({ wallet }) => ({ wallet });

const mapDispatchToProps = (dispatch: Function) => ({
  importWalletFromTWordsPhrase: (tWordsPhrase) => {
    dispatch(importWalletFromTWordsPhraseAction(tWordsPhrase));
  },
  importWalletFromPrivateKey: (privateKey) => {
    dispatch(importWalletFromPrivateKeyAction(privateKey));
  },
  resetWalletError: () => {
    dispatch(resetWalletErrorAction());
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(ImportWallet);
