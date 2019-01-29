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
import type { NavigationScreenProp } from 'react-navigation';
import { View, TouchableOpacity } from 'react-native';

// components
import { Container, Wrapper } from 'components/Layout';
import { Paragraph, BoldText } from 'components/Typography';
import Title from 'components/Title';
import Button from 'components/Button';
import Animation from 'components/Animation';

// utils
import { baseColors, fontSizes } from 'utils/variables';

// constants
import { SEND_TOKEN_CONFIRM } from 'constants/navigationConstants';
import { connect } from 'react-redux';
import { sendTxNoteByContactAction } from '../../actions/txNoteActions';

type Props = {
  navigation: NavigationScreenProp<*>,
  contacts: Object,
  sendTxNoteByContact: Function,
}

type State = {
  noteSent: boolean,
}

const animationSuccess = require('assets/animations/transactionSentConfirmationAnimation.json');
const animationFailure = require('assets/animations/transactionFailureAnimation.json');

const transactionSuccessText =
  'It will be settled in a few moments, depending on your gas price settings and Ethereum network load';

const getTransactionErrorMessage = (error: string): string => {
  const TRANSACTION_ERRORS = {
    'transaction underpriced': 'Not enough gas to cover the transaction fee. Top up your ETH balance',
    'replacement transaction underpriced': 'Not enough gas to cover the transaction fee. Top up your ETH balance',
  };
  const transactionFailureText = 'Something went wrong';
  return TRANSACTION_ERRORS[error] || transactionFailureText;
};

const CancelText = styled(BoldText)`
  color: ${baseColors.burningFire};
  font-size: ${fontSizes.small};
`;

class SendTokenTransaction extends React.Component<Props, State> {
  state = {
    noteSent: false,
  };

  sendNote(cb, note, txHash, toUser) {
    this.setState({
      noteSent: true,
    }, async () => {
      await cb(toUser.username, { text: note, txHash });
    });
  }

  componentDidUpdate() {
    const {
      navigation, sendTxNoteByContact, contacts,
    } = this.props;
    const {
      isSuccess, note, to, txHash,
    } = navigation.state.params;
    if (isSuccess && note && note !== '') {
      const toUser = contacts.find(x => { return x.ethAddress === to; });
      if (toUser && !this.state.noteSent) {
        this.sendNote(sendTxNoteByContact, note, txHash, toUser);
      }
    }
  }

  handleDismissal = () => {
    const { navigation } = this.props;
    navigation.dismiss();
  };

  handleNavigationBack = () => {
    const { navigation } = this.props;
    navigation.navigate(SEND_TOKEN_CONFIRM);
  };

  render() {
    const { navigation } = this.props;
    const { isSuccess, error } = navigation.state.params;
    const animationSource = isSuccess ? animationSuccess : animationFailure;
    const transactionStatusText = isSuccess ? transactionSuccessText : getTransactionErrorMessage(error);
    const transactionStatusTitle = isSuccess ? 'Tokens are on their way' : 'Transaction failed';
    return (
      <Container>
        <Wrapper flex={1} center regularPadding>
          <Animation source={animationSource} />
          <Title fullWidth title={transactionStatusTitle} align="center" noBlueDot />
          <Paragraph small light center style={{ marginBottom: 40 }}>{transactionStatusText}</Paragraph>
          {isSuccess ?
            <Button marginBottom="20px" onPress={this.handleDismissal} title="Magic!" /> :
            <View style={{ justifyContent: 'center', display: 'flex', alignItems: 'center' }}>
              <Button marginBottom="20px" onPress={this.handleNavigationBack} title="Retry" />
              <TouchableOpacity onPress={this.handleDismissal}>
                <CancelText>Cancel</CancelText>
              </TouchableOpacity>
            </View>
          }
        </Wrapper>
        {/*
        {isSuccess &&
          <Footer>
            <ShareSocial label="Share the love" facebook instagram twitter />
          </Footer>
        }
        */}
      </Container>
    );
  }
}

const mapStateToProps = ({
  contacts: { data: contacts },
}) => ({
  contacts,
});

const mapDispatchToProps = (dispatch) => ({
  sendTxNoteByContact: (username: string, message: Object) => {
    dispatch(sendTxNoteByContactAction(username, message));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(SendTokenTransaction);
