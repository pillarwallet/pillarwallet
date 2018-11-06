// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { Platform, BackHandler, Keyboard, Dimensions, Text } from 'react-native';
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
import { Container, ScrollWrapper, Footer } from 'components/Layout';
import { Paragraph } from 'components/Typography';
import Header from 'components/Header';
import TextInput from 'components/TextInput';
import QRCodeScanner from 'components/QRCodeScanner';
import IconButton from 'components/IconButton';
import WalletTabs from 'components/Tabs/WalletTabs';
import { fontSizes, baseColors, UIColors, spacing } from 'utils/variables';

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
  errorMessage: string,
  errorField: string,
  isScanning: boolean,
  activeTab: string,
  inputEnabled: boolean,
};

const window = Dimensions.get('window');

const InputWrapper = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: -20px;
`;

const FooterWrapper = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0 20px;
  width: 100%;
`;

const ButtonWrapper = styled.View`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-left: 14px;
  margin-top: ${props => props.error ? 32 : 50}px;
`;

class ImportWallet extends React.Component<Props, State> {
  state = {
    privateKey: '',
    tWordsPhrase: '',
    errorMessage: '',
    errorField: '',
    isScanning: false,
    activeTab: TWORDSPHRASE,
    inputEnabled: false,
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
    const { privateKey, tWordsPhrase, activeTab } = this.state;

    if (activeTab === PRIVATEKEY) {
      importWalletFromPrivateKey(privateKey);
    } else if (activeTab === TWORDSPHRASE) {
      const trimmedPhrase = tWordsPhrase.split(' ').filter(Boolean).join(' ');
      importWalletFromTWordsPhrase(trimmedPhrase);
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

  render() {
    const {
      privateKey,
      tWordsPhrase,
      isScanning,
      activeTab,
    } = this.state;

    const restoreWalletTabs = [
      {
        id: TWORDSPHRASE,
        name: '12 word',
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
        textStart: 'Restore your ERC-20 compatible Ethereum wallet using your ',
        textAttention: '12 word backup phrase',
        textEnd: '.',
        inputLabel: 'Backup phrase',
        changeName: 'tWordsPhrase',
        value: tWordsPhrase,
        errorMessage: this.getError(IMPORT_WALLET_TWORDS_PHRASE),
      },
      PRIVATEKEY: {
        textStart: 'Don\'t have your backup phrase? Use your ',
        textAttention: 'private key',
        textEnd: ' instead.',
        inputLabel: 'Private key',
        changeName: 'privateKey',
        value: privateKey,
        errorMessage: this.getError(IMPORT_WALLET_PRIVATE_KEY),
      },
    };

    return (
      <Container>
        <Header onBack={this.handleBackAction} title="restore wallet" />
        <ScrollWrapper regularPadding>
          <WalletTabs title="restore wallet" tabs={restoreWalletTabs} />
          <Paragraph small light>{tabsInfo[activeTab].textStart}
            <Text style={{ color: UIColors.defaultTextColor }}>
              {tabsInfo[activeTab].textAttention}
            </Text>
            {tabsInfo[activeTab].textEnd}
          </Paragraph>
          <InputWrapper>
            <TextInput
              label={tabsInfo[activeTab].inputLabel}
              inputProps={{
                onChange: this.handleValueChange(tabsInfo[activeTab].changeName),
                value: tabsInfo[activeTab].value,
                autoCapitalize: 'none',
                multiline: activeTab === TWORDSPHRASE,
                numberOfLines: 3,
              }}
              errorMessage={tabsInfo[activeTab].errorMessage}
              viewWidth={activeTab === TWORDSPHRASE ? (window.width - (spacing.rhythm * 2) - 2) : window.width - 95}
              inputType="secondary"
              lowerCase
              labelBigger
              noBorder
            />
            {activeTab === PRIVATEKEY &&
              <ButtonWrapper error={!!tabsInfo[activeTab].errorMessage}>
                <IconButton
                  icon="scan"
                  color={baseColors.electricBlue}
                  fontSize={fontSizes.extraLarge}
                  onPress={this.handleQRScannerOpen}
                  iconText="SCAN"
                  style={{
                    marginLeft: 5,
                    marginBottom: 3,
                    alignItems: 'center',
                  }}
                />
              </ButtonWrapper>
            }
          </InputWrapper>
        </ScrollWrapper>
        <Footer>
          <FooterWrapper>
            <Button title="Restore wallet" onPress={() => this.props.navigation.state.params.handleImportSubmit()} />
          </FooterWrapper>
        </Footer>
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
