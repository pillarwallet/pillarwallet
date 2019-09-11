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
import { Keyboard, View } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { utils } from 'ethers';
import { ScrollWrapper } from 'components/Layout';
import { Label, BoldText } from 'components/Typography';
import Button from 'components/Button';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import TextInput from 'components/TextInput';
import { baseColors, fontSizes, spacing } from 'utils/variables';
import { findMatchingContact, getUserName } from 'utils/contacts';
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import type { ContactSmartAddressData } from 'models/Contacts';

type Props = {
  navigation: NavigationScreenProp<*>,
  session: Object,
  contacts: Object[],
  contactsSmartAddresses: ContactSmartAddressData[],
};

type State = {
  note: ?string,
};

const FooterWrapper = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: ${spacing.large}px;
  width: 100%;
  background-color: ${baseColors.snowWhite};
`;

const LabeledRow = styled.View`
  margin: 10px 0;
`;

const Value = styled(BoldText)`
  font-size: ${fontSizes.medium}
`;

class SendTokenContacts extends React.Component<Props, State> {
  source: string;

  constructor(props) {
    super(props);
    this.source = this.props.navigation.getParam('source', '');
    const note = this.props.navigation.getParam('defaultNote', null);
    this.state = {
      note,
    };
  }

  handleFormSubmit = () => {
    Keyboard.dismiss();
    const { navigation } = this.props;
    const transactionPayload = { ...navigation.getParam('transactionPayload', {}), note: this.state.note };
    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, {
      transactionPayload,
      goBackDismiss: !!transactionPayload.replaceTransaction,
      source: this.source,
    });
  };

  handleNoteChange(text) {
    this.setState({ note: text });
  }

  render() {
    const {
      contacts,
      session,
      navigation,
      contactsSmartAddresses,
    } = this.props;
    const {
      amount,
      to,
      txFeeInWei,
      symbol,
      replaceTransaction,
    } = navigation.getParam('transactionPayload', {});

    const contact = findMatchingContact(to, contacts, contactsSmartAddresses);
    const confirmButtonTitle = replaceTransaction
      ? 'Confirm Speed Up'
      : 'Confirm Transaction';
    const recipientUsername = getUserName(contact);
    const txtFeeFormatted = txFeeInWei === 0
      ? 'free'
      : `${utils.formatEther(txFeeInWei.toString())} ETH `;
    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: 'Review and confirm' }] }}
        keyboardAvoidFooter={(
          <FooterWrapper>
            <Button disabled={!session.isOnline} onPress={this.handleFormSubmit} title={confirmButtonTitle} />
          </FooterWrapper>
        )}
      >
        <ScrollWrapper
          regularPadding
          disableAutomaticScroll
        >
          {replaceTransaction &&
            <View>
              <LabeledRow>
                <Label>Hash of transaction to speed up</Label>
                <Value>{replaceTransaction}</Value>
              </LabeledRow>
              <LabeledRow>
                <Label>New Est. Network Fee</Label>
                <Value>{txtFeeFormatted}</Value>
              </LabeledRow>
            </View>
          }
          {!replaceTransaction &&
            <View>
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
                <Value>{txtFeeFormatted}</Value>
              </LabeledRow>
              {!!recipientUsername &&
              <TextInput
                inputProps={{
                  onChange: this.handleNoteChange,
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
              }
            </View>
          }
        </ScrollWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  contacts: { data: contacts, contactsSmartAddresses: { addresses: contactsSmartAddresses } },
  session: { data: session },
}) => ({
  contacts,
  session,
  contactsSmartAddresses,
});

export default connect(mapStateToProps)(SendTokenContacts);
