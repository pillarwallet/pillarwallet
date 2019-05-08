// @flow
import * as React from 'react';
import { Platform } from 'react-native';
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

// actions
import { switchAccountAction } from 'actions/accountsActions';
import { resetIncorrectPasswordAction } from 'actions/authActions';
import {
  connectSmartWalletAccountAction,
  deploySmartWalletAction,
  initSmartWalletSdkAction,
  loadSmartWalletAccountsAction,
} from 'actions/smartWalletActions';

// constants
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

// components
import { Container, ScrollWrapper } from 'components/Layout';
import Header from 'components/Header';
import { BaseText, BoldText } from 'components/Typography';
import { ButtonMini } from 'components/Button';
import SlideModal from 'components/Modals/SlideModal';
import CheckPin from 'components/CheckPin';

// models
import type { SmartWalletAccount } from 'models/SmartWalletAccount';
import type { Account, Accounts } from 'models/Account';
import type { Balances } from 'models/Asset';

// selectors
import { accountBalancesSelector } from 'selectors/balances';

// services
import InMemoryStorage from 'services/inMemoryStorage';

// utils
import { baseColors, fontSizes } from 'utils/variables';


type Props = {
  sdkInitialized: boolean,
  loadSmartWalletAccounts: Function,
  deploySmartWallet: Function,
  connectSmartWalletAccount: Function,
  switchAccount: Function,
  sdkInitialized: boolean,
  smartWalletAccounts: SmartWalletAccount[],
  connectedAccount: Object,
  accounts: Accounts,
  balances: Balances,
  resetIncorrectPassword: Function,
  initSmartWalletSdk: Function,
};

type State = {
  showCheckPinModal1: boolean,
  showCheckPinModal2: boolean,
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

const Row = styled.View`
  padding-bottom: 10px;
`;

class SmartWallet extends React.Component<Props, State> {
  sdk: Object;
  storage: Object;
  switchToAccount: ?Account = null;

  state = {
    showCheckPinModal1: false,
    showCheckPinModal2: false,
  };

  componentDidMount() {
    this.storage = new InMemoryStorage({}, true);
    console.log('all accounts', this.props.accounts);
    console.log('all balances', this.props.balances);
  }

  onInitSdk = () => {
    this.setState({ showCheckPinModal2: true });
  };

  initSdk = (_: string, wallet: Object) => {
    this.props.initSmartWalletSdk(wallet.privateKey);
    this.setState({ showCheckPinModal2: false });
  };

  onGetAccounts = () => {
    const { loadSmartWalletAccounts } = this.props;
    loadSmartWalletAccounts();
  };

  onConnectAccount = () => {
    const {
      connectSmartWalletAccount,
      smartWalletAccounts,
    } = this.props;
    connectSmartWalletAccount(smartWalletAccounts[0].address);
  };

  onDeploy = () => {
    const { deploySmartWallet } = this.props;
    deploySmartWallet();
  };

  handleCheckPinModalClose1 = () => {
    const { resetIncorrectPassword } = this.props;
    resetIncorrectPassword();
    this.setState({ showCheckPinModal1: false });
  };

  handleCheckPinModalClose2 = () => {
    const { resetIncorrectPassword } = this.props;
    resetIncorrectPassword();
    this.setState({ showCheckPinModal2: false });
  };

  onSwitchAccount = () => {
    const { accounts, switchAccount } = this.props;
    const inactiveAccount = accounts.find(({ isActive }) => !isActive);
    if (!inactiveAccount) return;

    if (inactiveAccount.type === ACCOUNT_TYPES.SMART_WALLET) {
      this.switchToAccount = inactiveAccount;
      this.setState({ showCheckPinModal1: true });
    } else if (inactiveAccount.type === ACCOUNT_TYPES.KEY_BASED) {
      switchAccount(inactiveAccount.id);
    }
  };

  switchToSmartWalletAccount = (_: string, wallet: Object) => {
    if (!this.switchToAccount) return;
    this.props.switchAccount(this.switchToAccount.id, wallet.privateKey);
    this.switchToAccount = null;
    this.setState({ showCheckPinModal1: false });
  };

  render() {
    const {
      sdkInitialized,
      connectedAccount,
      smartWalletAccounts,
      accounts,
    } = this.props;
    const { showCheckPinModal1, showCheckPinModal2 } = this.state;
    const activeAccount = accounts.find(({ isActive }) => isActive);
    return (
      <Container inset={{ bottom: 0 }}>
        <Header title="smart wallet" />
        <ScrollWrapper>
          <Wrapper>
            {activeAccount && (
              <React.Fragment>
                <TextRow>
                  Active Account: <BoldText>{activeAccount.type}</BoldText>
                </TextRow>
                {accounts.length > 1 && (
                  <Row>
                    <ButtonMini title="Switch" onPress={this.onSwitchAccount} />
                  </Row>
                )}
              </React.Fragment>
            )}
            {!sdkInitialized && (
              <Row>
                <ButtonMini title="Init SDK" onPress={this.onInitSdk} />
              </Row>
            )}
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
            {sdkInitialized
            && !!smartWalletAccounts.length
            && (!connectedAccount || !Object.keys(connectedAccount).length)
            && (
              <ButtonMini title="Connect Account" onPress={this.onConnectAccount} />
            )}
            {sdkInitialized
            && !!smartWalletAccounts.length
            && !!connectedAccount
            && !!Object.keys(connectedAccount).length
            && (
                (connectedAccount.state.toLowerCase() !== 'deployed'
                  && <ButtonMini title="Deploy" onPress={this.onDeploy} />
                ) || (
                  <TextRow>
                    Account state: <BoldText>{connectedAccount.state}</BoldText>
                  </TextRow>
                )
            )}
          </Wrapper>
        </ScrollWrapper>
        <SlideModal
          isVisible={showCheckPinModal1}
          onModalHide={this.handleCheckPinModalClose1}
          title="enter pincode"
          centerTitle
          fullScreen
          showHeader
        >
          <Wrapper flex={1}>
            <CheckPin onPinValid={this.switchToSmartWalletAccount} />
          </Wrapper>
        </SlideModal>
        <SlideModal
          isVisible={showCheckPinModal2}
          onModalHide={this.handleCheckPinModalClose2}
          title="enter pincode"
          centerTitle
          fullScreen
          showHeader
        >
          <Wrapper flex={1}>
            <CheckPin onPinValid={this.initSdk} />
          </Wrapper>
        </SlideModal>
      </Container>
    );
  }
}

const mapStateToProps = ({
  accounts: { data: accounts },
  smartWallet: {
    sdkInitialized,
    connectedAccount,
    accounts: smartWalletAccounts,
  },
}) => ({
  sdkInitialized,
  connectedAccount,
  smartWalletAccounts,
  accounts,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch) => ({
  loadSmartWalletAccounts: () => dispatch(loadSmartWalletAccountsAction()),
  connectSmartWalletAccount: (accountId) => dispatch(connectSmartWalletAccountAction(accountId)),
  switchAccount: (accountId: string, privateKey?: string) => dispatch(switchAccountAction(accountId, privateKey)),
  deploySmartWallet: () => dispatch(deploySmartWalletAction()),
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
  initSmartWalletSdk: (privateKey: string) => dispatch(initSmartWalletSdkAction(privateKey)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(SmartWallet);
