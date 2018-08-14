// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { KeyboardAvoidingView as RNKeyboardAvoidingView } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { utils } from 'ethers';
import { Container, Wrapper } from 'components/Layout';
import TransactionSentModal from 'components/TransactionSentModal';
import { Label, BoldText } from 'components/Typography';
import Title from 'components/Title';
import Button from 'components/Button';
import Header from 'components/Header';
import SlideModal from 'components/Modals/SlideModal';
import CheckPin from 'components/CheckPin';
import WarningBanner from 'components/WarningBanner';
import type { TransactionPayload } from 'models/Transaction';
import { sendAssetAction } from 'actions/assetsActions';
import { fetchTransactionsHistoryAction } from 'actions/historyActions';
import { resetIncorrectPasswordAction } from 'actions/authActions';
import { fontSizes } from 'utils/variables';
import { getUserName } from 'utils/contacts';

type Props = {
  navigation: NavigationScreenProp<*>,
  sendAsset: Function,
  appSettings: Object,
  resetIncorrectPassword: () => Function,
  fetchTransactionsHistory: (walletAddress: string, asset: string) => Function,
  wallet: Object,
  contacts: Object[],
}

type State = {
  transactionPayload: Object,
  assetData: Object,
  isSubmitted: boolean,
  showCheckPinModal: boolean,
  showTransactionPendingModal: boolean,
}

const KeyboardAvoidingView = styled(RNKeyboardAvoidingView)`
  flex: 1;
  position: absolute;
  bottom: 40;
  left: 0;
  width: 100%;
`;

const FooterWrapper = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0 20px;
  width: 100%;
`;

const LabeledRow = styled.View`
  margin: 10px 0;
`;

const CheckPinModal = styled(SlideModal)`
  align-items: flex-start;
`;

const Value = styled(BoldText)`
  font-size: ${fontSizes.medium}
`;

class SendTokenContacts extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    const transactionPayload = this.props.navigation.getParam('transactionPayload', {});
    const assetData = this.props.navigation.getParam('assetData', {});
    this.state = {
      transactionPayload,
      assetData,
      isSubmitted: false,
      showCheckPinModal: false,
      showTransactionPendingModal: false,
    };
  }

  handleFormSubmit = () => {
    const needToCheckPinCode = this.isNeedToCheckPinCode(this.props.appSettings);
    if (!needToCheckPinCode) {
      this.makeTransaction();
      this.setState({
        showTransactionPendingModal: true,
        isSubmitted: true,
      });
      return;
    }
    this.setState({ showCheckPinModal: true });
  };

  isNeedToCheckPinCode(appSettings: Object): boolean {
    const { requestPinForTransaction = true } = appSettings;
    return requestPinForTransaction;
  }

  handleModalDismissal = () => {
    const { navigation } = this.props;
    navigation.dismiss();
  };

  handlePendingNotificationOpen = () => {
    const { isSubmitted } = this.state;
    if (!isSubmitted) {
      this.handleCheckPinModalClose();
      return;
    }
    this.setState({ showTransactionPendingModal: true });
  };

  handleCheckPinModalClose = () => {
    const { resetIncorrectPassword } = this.props;
    resetIncorrectPassword();
  };

  makeTransaction = () => {
    const { transactionPayload, assetData: { token } } = this.state;
    this.props.sendAsset({ ...transactionPayload, symbol: token });
    this.setState({
      showCheckPinModal: false,
      isSubmitted: true,
    });
  };

  render() {
    const { contacts } = this.props;
    const {
      assetData,
      transactionPayload: {
        amount,
        to,
        txFeeInWei,
      },
      showCheckPinModal,
      showTransactionPendingModal,
    } = this.state;

    const contact = contacts.find(({ ethAddress }) => to.toUpperCase() === ethAddress.toUpperCase());
    const recipientUsername = getUserName(contact);

    return (
      <React.Fragment>
        <Container>
          <Header
            onBack={() => this.props.navigation.goBack(null)}
            onClose={this.handleModalDismissal}
            title="send"
            onCloseText="Step 3 of 3"
          />
          <WarningBanner />
          <Wrapper regularPadding>
            <Title subtitle title="Review and Confirm" />
            <LabeledRow>
              <Label>Amount</Label>
              <Value>{amount} {assetData.token}</Value>
            </LabeledRow>
            {!!recipientUsername &&
            <LabeledRow>
              <Label>Recipient Username</Label>
              <Value>{recipientUsername}</Value>
            </LabeledRow>
            }
            <LabeledRow>
              <Label>Recipient Address</Label>
              <Value>{to}</Value>
            </LabeledRow>
            <LabeledRow>
              <Label>Transaction Fee</Label>
              <Value>{utils.formatEther(txFeeInWei.toString())} ETH</Value>
            </LabeledRow>
          </Wrapper>
        </Container>
        <KeyboardAvoidingView behavior="position" keyboardVerticalOffset={30}>
          <FooterWrapper>
            <Button onPress={this.handleFormSubmit} title="Confirm Transaction" />
          </FooterWrapper>
        </KeyboardAvoidingView>
        <TransactionSentModal isVisible={showTransactionPendingModal} onModalHide={this.handleModalDismissal} />
        <CheckPinModal
          isVisible={showCheckPinModal}
          onModalHidden={this.handlePendingNotificationOpen}
          fullScreen
        >
          <CheckPin onPinValid={this.makeTransaction} />
        </CheckPinModal>
      </React.Fragment>
    );
  }
}

const mapStateToProps = ({
  appSettings: { data: appSettings },
  wallet: { data: wallet },
  contacts: { data: contacts },
}) => ({
  appSettings,
  wallet,
  contacts,
});

const mapDispatchToProps = (dispatch) => ({
  sendAsset: (transaction: TransactionPayload) => dispatch(sendAssetAction(transaction)),
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
  fetchTransactionsHistory: (walletAddress, asset) => {
    dispatch(fetchTransactionsHistoryAction(walletAddress, asset));
  },
});


export default connect(mapStateToProps, mapDispatchToProps)(SendTokenContacts);
