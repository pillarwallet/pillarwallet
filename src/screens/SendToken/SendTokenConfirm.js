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
import { ScrollWrapper } from 'components/Layout';
import { Label, MediumText } from 'components/Typography';
import Button from 'components/Button';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import TextInput from 'components/TextInput';
import { fontSizes, spacing } from 'utils/variables';
import { findMatchingContact, getUserName } from 'utils/contacts';
import { addressesEqual } from 'utils/assets';
import { getAccountName } from 'utils/accounts';
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import type { ContactSmartAddressData } from 'models/Contacts';
import type { Accounts } from 'models/Account';

type Props = {
  navigation: NavigationScreenProp<*>,
  session: Object,
  contacts: Object[],
  contactsSmartAddresses: ContactSmartAddressData[],
  accounts: Accounts,
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
`;

const LabeledRow = styled.View`
  margin: 10px 0;
`;

const Value = styled(MediumText)`
  font-size: ${fontSizes.big}px;
`;

class SendTokenConfirm extends React.Component<Props, State> {
  source: string;

  constructor(props) {
    super(props);
    this.source = this.props.navigation.getParam('source', '');
    this.state = {
      note: null,
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
    const {
      contacts,
      session,
      navigation,
      contactsSmartAddresses,
      accounts,
    } = this.props;
    const {
      amount,
      to,
      txFeeInWei,
      symbol,
    } = navigation.getParam('transactionPayload', {});

    const contact = findMatchingContact(to, contacts, contactsSmartAddresses);

    const recipientUsername = getUserName(contact);
    const userAccount = !recipientUsername ? accounts.find(({ id }) => addressesEqual(id, to)) : null;
    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: 'Review and confirm' }] }}
        footer={(
          <FooterWrapper>
            <Button disabled={!session.isOnline} onPress={this.handleFormSubmit} title="Confirm Transaction" />
          </FooterWrapper>
        )}
      >
        <ScrollWrapper
          regularPadding
          disableAutomaticScroll
        >
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
          {!!userAccount &&
          <LabeledRow>
            <Label>Recipient</Label>
            <Value>{getAccountName(userAccount.type, accounts)}</Value>
          </LabeledRow>
          }
          <LabeledRow>
            <Label>Recipient Address</Label>
            <Value>{to}</Value>
          </LabeledRow>
          <LabeledRow>
            <Label>Est. Network Fee</Label>
            <Value>{txFeeInWei === 0 ? 'free' : `${utils.formatEther(txFeeInWei.toString())} ETH`}</Value>
          </LabeledRow>
          {session.isOnline && !!recipientUsername &&
            <TextInput
              inputProps={{
                onChange: (text) => this.handleNoteChange(text),
                value: this.state.note,
                autoCapitalize: 'none',
                multiline: true,
                numberOfLines: 3,
                placeholder: 'Add a note to this transaction',
              }}
              keyboardAvoidance
              inputWrapperStyle={{ marginTop: spacing.medium }}
            />
          }
        </ScrollWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  contacts: { data: contacts, contactsSmartAddresses: { addresses: contactsSmartAddresses } },
  session: { data: session },
  accounts: { data: accounts },
}) => ({
  contacts,
  session,
  contactsSmartAddresses,
  accounts,
});

export default connect(mapStateToProps)(SendTokenConfirm);
