// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { KeyboardAvoidingView as RNKeyboardAvoidingView, Image as RNImage } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { utils } from 'ethers';
import { Container, Wrapper } from 'components/Layout';
import TransactionSentModal from 'components/TransactionSentModal';
import { SubTitle } from 'components/Typography';
import Button from 'components/Button';
import ModalScreenHeader from 'components/ModalScreenHeader';
import SlideModal from 'components/Modals/SlideModal';
import CheckPin from 'components/CheckPin';
import type { TransactionPayload } from 'models/Transaction';
import { sendAssetAction, fetchTransactionsHistoryAction } from 'actions/assetsActions';
import { resetIncorrectPasswordAction } from 'actions/authActions';
import { baseColors, fontSizes } from 'utils/variables';

const imageSend = require('assets/images/confirm-send.png');

type Props = {
  navigation: NavigationScreenProp<*>,
  sendAsset: Function,
  appSettings: Object,
  resetIncorrectPassword: () => Function,
  fetchTransactionsHistory: (walletAddress: string, asset: string) => Function,
  wallet: Object,
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


// EXTRA TO TYPOGRAPHY ONCE ALL AGREED
const Label = styled.Text`
  color: ${baseColors.darkGray};
  font-size: ${fontSizes.extraSmall};
  letter-spacing: 0.5;
  font-weight: 600;
  line-height: 24px;
`;

const Value = styled.Text`
  font-weight: 700;
  font-size: ${fontSizes.medium}
`;

const Image = styled(RNImage)`
  width: 100px;
  height: 100px;
`;

const ImageHolder = styled.View`
  display: flex;
  justify-content: center;
  flex-direction: row;
  margin: 20px 0;
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

  handlePendingNotifcationOpen = () => {
    const { isSubmitted } = this.state;
    if (!isSubmitted) return;
    this.setState({ showTransactionPendingModal: true });
  };

  handleCheckPinModalClose = () => {
    const { resetIncorrectPassword } = this.props;
    resetIncorrectPassword();
    this.setState({ showCheckPinModal: false });
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
    return (
      <React.Fragment>
        <ModalScreenHeader
          onBack={this.props.navigation.goBack}
          onClose={this.handleModalDismissal}
          title="send"
          rightLabelText="step 3 of 3"
        />
        <Container>
          <Wrapper regularPadding>
            <SubTitle>Review and confirm</SubTitle>
            <ImageHolder>
              <Image source={imageSend} />
            </ImageHolder>
            <LabeledRow>
              <Label>AMOUNT</Label>
              <Value>{amount} {assetData.token}</Value>
            </LabeledRow>
            <LabeledRow>
              <Label>RECIPIENT</Label>
              <Value>{to}</Value>
            </LabeledRow>
            <LabeledRow>
              <Label>TRANSACTION FEE</Label>
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
          title="confirm"
          onModalHide={this.handlePendingNotifcationOpen}
          fullScreenComponent={(
            <Container>
              <ModalScreenHeader onClose={this.handleCheckPinModalClose} />
              <CheckPin onPinValid={this.makeTransaction} />
            </Container>
          )}
        />

      </React.Fragment>
    );
  }
}

const mapStateToProps = ({
  appSettings: { data: appSettings },
  wallet: { data: wallet },
}) => ({
  appSettings,
  wallet,
});

const mapDispatchToProps = (dispatch) => ({
  sendAsset: (transaction: TransactionPayload) => dispatch(sendAssetAction(transaction)),
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
  fetchTransactionsHistory: (walletAddress, asset) => {
    dispatch(fetchTransactionsHistoryAction(walletAddress, asset));
  },
});


export default connect(mapStateToProps, mapDispatchToProps)(SendTokenContacts);
