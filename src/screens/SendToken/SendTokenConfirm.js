// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { KeyboardAvoidingView as RNKeyboardAvoidingView } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { utils } from 'ethers';
import { Container, Wrapper } from 'components/Layout';
import { Label, BoldText } from 'components/Typography';
import Title from 'components/Title';
import Button from 'components/Button';
import Header from 'components/Header';
import type { TransactionPayload } from 'models/Transaction';
import { sendAssetAction } from 'actions/assetsActions';
import { fontSizes } from 'utils/variables';
import { getUserName } from 'utils/contacts';
import { SEND_TOKEN_PIN_CONFIRM, SEND_TOKEN_TRANSACTION } from 'constants/navigationConstants';

type Props = {
  navigation: NavigationScreenProp<*>,
  sendAsset: Function,
  appSettings: Object,
  session: Object,
  wallet: Object,
  contacts: Object[],
}

type State = {
  transactionPayload: Object,
  isLoading: boolean,
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

const Value = styled(BoldText)`
  font-size: ${fontSizes.medium}
`;

class SendTokenContacts extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    const transactionPayload = this.props.navigation.getParam('transactionPayload', {});
    this.state = {
      transactionPayload,
      isLoading: false,
    };
  }

  handleFormSubmit = () => {
    const {
      appSettings: {
        requestPinForTransaction = true,
      },
      sendAsset,
      navigation,
    } = this.props;
    const { transactionPayload } = this.state;
    if (!requestPinForTransaction) {
      this.setState({
        isLoading: true,
      }, () => sendAsset(transactionPayload, this.handleNavigationToTransactionState));
      return;
    }
    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, {
      transactionPayload,
    });
  };

  handleNavigationToTransactionState = (params: ?Object) => {
    const { navigation } = this.props;
    navigation.navigate(SEND_TOKEN_TRANSACTION, { ...params });
  }

  handleModalDismissal = () => {
    const { navigation } = this.props;
    navigation.dismiss();
  };

  render() {
    const { contacts, session } = this.props;
    const {
      transactionPayload: {
        amount,
        to,
        txFeeInWei,
        symbol,
      },
      isLoading,
    } = this.state;

    const contact = contacts.find(({ ethAddress }) => to.toUpperCase() === ethAddress.toUpperCase());
    const recipientUsername = getUserName(contact);
    const buttonTitle = isLoading ? 'Transaction in progress...' : 'Confirm Transaction';
    return (
      <React.Fragment>
        <Container>
          <Header
            onBack={() => this.props.navigation.goBack(null)}
            onClose={this.handleModalDismissal}
            title="send"
          />
          <Wrapper regularPadding>
            <Title subtitle title="Review and Confirm" />
            <LabeledRow>
              <Label>Amount</Label>
              <Value>{amount} {symbol}</Value>
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
              <Label>Est. Network Fee</Label>
              <Value>{utils.formatEther(txFeeInWei.toString())} ETH</Value>
            </LabeledRow>
          </Wrapper>
        </Container>
        <KeyboardAvoidingView behavior="position" keyboardVerticalOffset={30}>
          <FooterWrapper>
            <Button disabled={!session.isOnline || isLoading} onPress={this.handleFormSubmit} title={buttonTitle} />
          </FooterWrapper>
        </KeyboardAvoidingView>
      </React.Fragment>
    );
  }
}

const mapStateToProps = ({
  appSettings: { data: appSettings },
  wallet: { data: wallet },
  contacts: { data: contacts },
  session: { data: session },
}) => ({
  appSettings,
  wallet,
  contacts,
  session,
});

const mapDispatchToProps = (dispatch) => ({
  sendAsset: (transaction: TransactionPayload, navigate) => dispatch(sendAssetAction(transaction, navigate)),
});

export default connect(mapStateToProps, mapDispatchToProps)(SendTokenContacts);
