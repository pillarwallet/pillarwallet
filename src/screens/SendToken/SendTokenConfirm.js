// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { KeyboardAvoidingView as RNKeyboardAvoidingView } from 'react-native';
import { connect } from 'react-redux';
import FastImage from 'react-native-fast-image';
import { Container, Wrapper } from 'components/Layout';
import TransactionSentModal from 'components/TransactionSentModal';
import { SubTitle } from 'components/Typography';
import Button from 'components/Button';
import ModalScreenHeader from 'components/ModalScreenHeader';
import { baseColors, fontSizes } from 'utils/variables';
import type { NavigationScreenProp } from 'react-navigation';
import type { TransactionPayload } from 'models/Transaction';
import { sendAssetAction } from 'actions/assetsActions';
import { utils } from 'ethers';

const imageSend = require('assets/images/confirm-send.png');

type Props = {
  navigation: NavigationScreenProp<*>,
  sendAsset: Function,
}

type State = {
  transactionPayload: Object,
  assetData: Object,
  isSubmitted: boolean,
}

const KeyboardAvoidingView = styled(RNKeyboardAvoidingView)`
  flex: 1;
  position: absolute;
  bottom: 40;
  left: 0;
  width: 100%;
`;

const FooterWrapper = styled.View`
  flexDirection: row;
  justify-content: center;
  align-items: center;
  padding: 0 20px;
  width: 100%;
`;

const LabeledRow = styled.View`
  margin: 10px 0;
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

const Image = styled(FastImage)`
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
    };
  }

  handleFormSubmit = () => {
    this.props.sendAsset(this.state.transactionPayload);
    this.setState({
      isSubmitted: true,
    });
  };

  handleBackNavigation = () => {
    this.props.navigation.dismiss();
  };

  render() {
    const {
      assetData,
      transactionPayload: {
        amount,
        to,
        txFeeInWei,
      },
      isSubmitted,
    } = this.state;
    return (
      <React.Fragment>
        <ModalScreenHeader
          onBack={this.props.navigation.goBack}
          onClose={this.props.navigation.dismiss}
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
        <KeyboardAvoidingView behavior="position" keyboardVerticalOffset={40}>
          <FooterWrapper>
            <Button onPress={this.handleFormSubmit} title="Confirm Transaction" />
          </FooterWrapper>
        </KeyboardAvoidingView>
        <TransactionSentModal isVisible={isSubmitted} onModalHide={this.props.navigation.dismiss} />
      </React.Fragment>
    );
  }
}

const mapDispatchToProps = (dispatch) => ({
  sendAsset: (transaction: TransactionPayload) => dispatch(sendAssetAction(transaction)),
});

export default connect(null, mapDispatchToProps)(SendTokenContacts);
