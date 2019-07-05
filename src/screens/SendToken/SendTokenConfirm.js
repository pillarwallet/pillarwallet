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
import { Keyboard, Platform } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { utils } from 'ethers';
import { Container, Footer, ScrollWrapper } from 'components/Layout';
import { Label, BoldText } from 'components/Typography';
import Title from 'components/Title';
import Button from 'components/Button';
import Header from 'components/Header';
import TextInput from 'components/TextInput';
import { fontSizes } from 'utils/variables';
import { getUserName } from 'utils/contacts';
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';

type Props = {
  navigation: NavigationScreenProp<*>,
  session: Object,
  contacts: Object[],
};

type State = {
  note: ?string,
  scrollPos: number,
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
  font-size: ${fontSizes.medium}
`;

class SendTokenContacts extends React.Component<Props, State> {
  scroll: Object;
  source: string;

  constructor(props) {
    super(props);
    this.scroll = React.createRef();
    this.source = this.props.navigation.getParam('source', '');
    this.state = {
      note: null,
      scrollPos: 0,
    };
  }

  handleFormSubmit = () => {
    Keyboard.dismiss();
    const { navigation } = this.props;
    const transactionPayload = { ...navigation.getParam('transactionPayload', {}), note: this.state.note };
    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, {
      transactionPayload,
      source: this.source,
    });
  };

  handleNoteChange(text) {
    this.setState({ note: text });
  }

  render() {
    const { scrollPos } = this.state;
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
      <Container>
        <Header
          onBack={() => this.props.navigation.goBack(null)}
          title="send"
          white
        />
        <ScrollWrapper
          regularPadding
          disableAutomaticScroll={Platform.OS === 'android'}
          innerRef={ref => { this.scroll = ref; }}
          onKeyboardWillShow={() => {
            if (Platform.OS === 'android') {
              this.scroll.scrollToPosition(0, scrollPos);
            }
          }}
        >
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
          {!!recipientUsername &&
          <TextInput
            inputProps={{
              onChange: (text) => this.handleNoteChange(text),
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
            onLayout={(e) => {
              const scrollPosition = e.nativeEvent.layout.y + 180;
              this.setState({ scrollPos: scrollPosition });
              }
            }
          />
          }
        </ScrollWrapper>
        <Footer keyboardVerticalOffset={40}>
          <FooterWrapper>
            <Button disabled={!session.isOnline} onPress={this.handleFormSubmit} title="Confirm Transaction" />
          </FooterWrapper>
        </Footer>
      </Container>
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

export default connect(mapStateToProps)(SendTokenContacts);
