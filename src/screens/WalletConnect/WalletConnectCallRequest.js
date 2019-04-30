// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import * as React from 'react';
import styled from 'styled-components/native';
import { Keyboard } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { utils } from 'ethers';
import { CachedImage } from 'react-native-cached-image';
import { Container, Footer, ScrollWrapper } from 'components/Layout';
import { Label, BoldText } from 'components/Typography';
import type { Asset } from 'models/Asset';
import Button from 'components/Button';
import Header from 'components/Header';
import TextInput from 'components/TextInput';
import type { JsonRpcRequest } from 'models/JsonRpc';
import type { TokenTransactionPayload } from 'models/Transaction';
import { onWalletConnectRejectCallRequest } from 'actions/walletConnectActions';
import { spacing, fontSizes } from 'utils/variables';
import { getUserName } from 'utils/contacts';
import { TOKEN_TRANSFER } from 'constants/callRequestConstants';
import { WALLETCONNECT_PIN_CONFIRM_SCREEN } from 'constants/navigationConstants';

type Props = {
  navigation: NavigationScreenProp<*>,
  rejectCallRequest: (peerId: string, callId: string) => Function,
  session: Object,
  contacts: Object[],
  supportedAssets: Asset[],
};

type State = {
  note: ?string,
};

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
  font-size: ${fontSizes.medium};
`;

const genericToken = require('assets/images/tokens/genericToken.png');

class WalletConnectCallRequestScreen extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = {
      note: null,
    };
  }

  getTokenTransactionPayload = (payload: JsonRpcRequest): TokenTransactionPayload => {
    const { supportedAssets } = this.props;

    const {
      to, gasPrice, gasLimit, value, data,
    } = payload.params[0];

    let symbol = 'ETH';
    let asset = null;
    let amount = utils.bigNumberify(value).mul(utils.bigNumberify('10').pow(18));

    const isTokenTransfer = data.toLowerCase() !== '0x' && data.toLowerCase().startsWith(TOKEN_TRANSFER);

    if (isTokenTransfer) {
      const matchingAssets = supportedAssets.filter(a => a.address === to);
      if (matchingAssets && matchingAssets.length) {
        asset = matchingAssets[0]; // eslint-disable-line
        symbol = asset.symbol; // eslint-disable-line
        amount = utils.bigNumberify(data.substring(73)).mul(utils.bigNumberify('10').pow(asset.decimals));
      }
    }

    const txFeeInWei = utils
      .bigNumberify(gasLimit)
      .mul(utils.bigNumberify(gasPrice))
      .toNumber();

    const transactionPayload = {
      gasLimit: utils.bigNumberify(gasLimit).toNumber(),
      amount: utils.bigNumberify(amount).toNumber(),
      to,
      gasPrice: utils.bigNumberify(gasPrice).toNumber(),
      txFeeInWei: utils.bigNumberify(txFeeInWei).toNumber(),
      symbol,
      contractAddress: asset ? asset.address : '',
      decimals: asset ? asset.decimals : 18,
      node: this.state.note,
    };

    return transactionPayload;
  };

  handleFormSubmit = () => {
    Keyboard.dismiss();
    const { navigation } = this.props;
    const payload = navigation.getParam('payload', {});
    const peerId = navigation.getParam('peerId', {});

    switch (payload.method) {
      case 'eth_sendTransaction':
      case 'eth_signTransaction':
        const transactionPayload = this.getTokenTransactionPayload(payload);

        navigation.navigate(WALLETCONNECT_PIN_CONFIRM_SCREEN, {
          peerId,
          payload,
          transactionPayload,
        });

        break;
      case 'eth_sign':
      case 'personal_sign':
        navigation.navigate(WALLETCONNECT_PIN_CONFIRM_SCREEN, {
          peerId,
          payload,
          transactionPayload: null,
        });

        break;
      default:
        break;
    }
  };

  handleNoteChange(text) {
    this.setState({ note: text });
  }

  handleDismissal = () => {
    const { navigation, rejectCallRequest } = this.props;
    navigation.dismiss();
    const peerId = navigation.getParam('peerId', {});
    const payload = navigation.getParam('payload', {});
    rejectCallRequest(peerId, payload.id);
  };

  render() {
    const { contacts, session, navigation } = this.props;

    const payload = navigation.getParam('payload', {});

    const { icon, name } = navigation.getParam('peerMeta', {});

    let type = 'Call';
    let body = null;

    switch (payload.method) {
      case 'eth_sendTransaction':
      case 'eth_signTransaction':
        const { to, data } = payload.params[0];

        type = 'Transaction';

        const {
          amount, symbol, txFeeInWei, contractAddress,
        } = this.getTokenTransactionPayload(payload);

        const txFee = utils.formatEther(txFeeInWei.toString());

        const contact = contacts.find(({ ethAddress }) => to.toUpperCase() === ethAddress.toUpperCase());
        const recipientUsername = getUserName(contact);

        body = (
          <ScrollWrapper regularPadding>
            <LabeledRow>
              <Label>Request From</Label>
              <Value>{name}</Value>
            </LabeledRow>
            {!!icon && (
              <CachedImage
                key={name}
                style={{
                  height: 55,
                  width: 55,
                  marginBottom: spacing.mediumLarge,
                }}
                source={{ uri: icon }}
                fallbackSource={genericToken}
                resizeMode="contain"
              />
            )}
            <LabeledRow>
              <Label>Amount</Label>
              <Value>
                {amount} {symbol}
              </Value>
            </LabeledRow>
            {!!recipientUsername && (
              <LabeledRow>
                <Label>Recipient Username</Label>
                <Value>{recipientUsername}</Value>
              </LabeledRow>
            )}
            <LabeledRow>
              <Label>Recipient Address</Label>
              <Value>{to}</Value>
            </LabeledRow>
            <LabeledRow>
              <Label>Est. Network Fee</Label>
              <Value>{txFee} ETH</Value>
            </LabeledRow>
            {data.toLowerCase() !== '0x' && !contractAddress && (
              <LabeledRow>
                <Label>Data</Label>
                <Value>{data}</Value>
              </LabeledRow>
            )}
            {!!recipientUsername && (
              <TextInput
                inputProps={{
                  onChange: text => this.handleNoteChange(text),
                  value: this.state.note,
                  autoCapitalize: 'none',
                  multiline: true,
                  numberOfLines: 3,
                  placeholder: 'Add a note to this transaction',
                }}
                inputType="secondary"
                labelBigger
                noBorder
                keyboardAvoidance
              />
            )}
          </ScrollWrapper>
        );
        break;
      case 'eth_sign':
      case 'personal_sign':
        type = 'Message';

        const address = payload.params[0];
        const message = payload.method === 'eth_sign' ? payload.params[1] : utils.toUtf8String(payload.params[1]);
        body = (
          <ScrollWrapper regularPadding>
            <LabeledRow>
              <Label>Address</Label>
              <Value>{address}</Value>
            </LabeledRow>
            <LabeledRow>
              <Label>Message</Label>
              <Value>{message}</Value>
            </LabeledRow>
          </ScrollWrapper>
        );
        break;
      default:
        break;
    }

    return (
      <React.Fragment>
        <Container>
          <Header onBack={this.handleDismissal} title={`${type} Request`} />
          {body}
          <Footer keyboardVerticalOffset={40}>
            <FooterWrapper>
              <Button disabled={!session.isOnline} onPress={this.handleFormSubmit} title={`Confirm ${type}`} />
            </FooterWrapper>
          </Footer>
        </Container>
      </React.Fragment>
    );
  }
}

const mapStateToProps = ({
  assets: { supportedAssets },
  contacts: { data: contacts },
  session: { data: session },
}) => ({
  contacts,
  session,
  supportedAssets,
});

const mapDispatchToProps = dispatch => ({
  rejectCallRequest: (peerId: string, callId: string) => {
    dispatch(onWalletConnectRejectCallRequest(peerId, callId));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(WalletConnectCallRequestScreen);
