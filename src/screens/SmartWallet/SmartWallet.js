// @flow
import * as React from 'react';
import { Platform } from 'react-native';
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import { SMART_WALLET_UNLOCK } from 'constants/navigationConstants';
import { baseColors, fontSizes } from 'utils/variables';
import InMemoryStorage from 'services/inMemoryStorage';
import {
  getSmartWalletAccountsAction,
  deploySmartWalletAction,
  connectSmartWalletAccountAction,
} from 'actions/walletActions';
import { Container, ScrollWrapper } from 'components/Layout';
import Header from 'components/Header';
import { BaseText, BoldText } from 'components/Typography';
import { ButtonMini } from 'components/Button';
import type { SmartWalletAccount } from 'models/SmartWalletAccount';

type Props = {
  navigation: NavigationScreenProp<*>,
  sdkInitialized: boolean,
  getSmartWalletAccounts: Function,
  deploySmartWallet: Function,
  connectSmartWalletAccount: Function,
  sdkInitialized: boolean,
  smartWalletAccounts: SmartWalletAccount[],
  connectedAccount: Object,
};

const Wrapper = styled.View`
  position: relative;
  margin: 5px 20px 20px;
  padding-top: ${Platform.select({
    ios: '20px',
    android: '14px',
  })};
`;

const TextRow = styled(BaseText)`
  padding-bottom: 10px;
  font-size: ${fontSizes.small}px;
  color: ${baseColors.darkGray};
`;

class SmartWallet extends React.Component<Props, *> {
  sdk: Object;
  storage: Object;

  componentDidMount() {
    this.storage = new InMemoryStorage({}, true);
  }

  onInitSdk = () => {
    const { navigation } = this.props;
    navigation.navigate(SMART_WALLET_UNLOCK);
  };

  onGetAccounts = async () => {
    const { getSmartWalletAccounts } = this.props;
    await getSmartWalletAccounts();
  };

  onConnectAccount = () => {
    const {
      connectSmartWalletAccount,
      smartWalletAccounts,
    } = this.props;
    connectSmartWalletAccount(smartWalletAccounts[0]);
  };

  onDeploy = () => {
    const { deploySmartWallet } = this.props;
    deploySmartWallet();
  };

  render() {
    const {
      navigation,
      sdkInitialized,
      connectedAccount,
      smartWalletAccounts,
    } = this.props;
    return (
      <Container inset={{ bottom: 0 }}>
        <Header
          title="Smart Wallet"
          onBack={() => navigation.goBack(null)}
        />
        <ScrollWrapper>
          <Wrapper>
            {!sdkInitialized && <ButtonMini title="Init SDK" onPress={this.onInitSdk} />}
            {sdkInitialized && (
              <TextRow>
                SDK Initialized: <BoldText>{sdkInitialized.toString()}</BoldText>
              </TextRow>
            )}
            {sdkInitialized && !smartWalletAccounts.length && (
              <ButtonMini title="Get Accounts" onPress={this.onGetAccounts} />
            )}
            {!!smartWalletAccounts.length && (
              <React.Fragment>
                <TextRow>Smart Wallet accounts:</TextRow>
                <TextRow><BoldText>{JSON.stringify(smartWalletAccounts)}</BoldText></TextRow>
              </React.Fragment>
            )}
            {sdkInitialized && !!smartWalletAccounts.length
              && (!connectedAccount || !Object.keys(connectedAccount).length) && (
              <ButtonMini title="Connect Account" onPress={this.onConnectAccount} />
            )}
            {sdkInitialized && !!smartWalletAccounts.length && !!connectedAccount
              && !!Object.keys(connectedAccount).length && (
                (connectedAccount.state.toLowerCase() !== 'deployed'
                  && <ButtonMini title="Deploy" onPress={this.onDeploy} />)
                || (
                  <TextRow>
                    Account state: <BoldText>{connectedAccount.state}</BoldText>
                  </TextRow>
                )
            )}
          </Wrapper>
        </ScrollWrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({
  smartWallet: {
    sdkInitialized,
    connectedAccount,
    accounts: smartWalletAccounts,
  },
}) => ({
  sdkInitialized,
  connectedAccount,
  smartWalletAccounts,
});

const mapDispatchToProps = (dispatch) => ({
  getSmartWalletAccounts: () => dispatch(getSmartWalletAccountsAction()),
  connectSmartWalletAccount: accountAddress => dispatch(connectSmartWalletAccountAction(accountAddress)),
  deploySmartWallet: () => dispatch(deploySmartWalletAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(SmartWallet);
