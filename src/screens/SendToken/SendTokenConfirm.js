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
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';

type Props = {
  navigation: NavigationScreenProp<*>,
  sendAsset: Function,
  session: Object,
  contacts: Object[],
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

class SendTokenContacts extends React.Component<Props, {}> {
  handleFormSubmit = () => {
    const { navigation } = this.props;
    const transactionPayload = navigation.getParam('transactionPayload', {});
    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, {
      transactionPayload,
    });
  };

  render() {
    const { contacts, session, navigation } = this.props;
    const {
      amount,
      to,
      txFeeInWei,
      symbol,
    } = navigation.getParam('transactionPayload', {});

    const contact = contacts.find(({ ethAddress }) => to.toUpperCase() === ethAddress.toUpperCase());
    const recipientUsername = getUserName(contact);
    return (
      <React.Fragment>
        <Container>
          <Header
            onBack={() => this.props.navigation.goBack(null)}
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
            <Button disabled={!session.isOnline} onPress={this.handleFormSubmit} title="Confirm Transaction" />
          </FooterWrapper>
        </KeyboardAvoidingView>
      </React.Fragment>
    );
  }
}

const mapStateToProps = ({
  contacts: { data: contacts },
  session: { data: session },
}) => ({
  contacts,
  session,
});

const mapDispatchToProps = (dispatch) => ({
  sendAsset: (transaction: TransactionPayload, navigate) => dispatch(sendAssetAction(transaction, navigate)),
});

export default connect(mapStateToProps, mapDispatchToProps)(SendTokenContacts);
