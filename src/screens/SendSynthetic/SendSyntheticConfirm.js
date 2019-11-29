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
import { View } from 'react-native';
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import { SYNTHETICS_CONTRACT_ADDRESS } from 'react-native-dotenv';
import { createStructuredSelector } from 'reselect';
import type { NavigationScreenProp } from 'react-navigation';

// components
import { Footer, ScrollWrapper } from 'components/Layout';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Button from 'components/Button';
import { Label, MediumText, Paragraph } from 'components/Typography';
import TextInput from 'components/TextInput';

// constants
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';

// util
import { baseColors, fontSizes, spacing, UIColors } from 'utils/variables';
import { findMatchingContact, getUserName } from 'utils/contacts';

// selectors
import { availableStakeSelector } from 'selectors/paymentNetwork';

// models, types
import type { Asset } from 'models/Asset';
import type { SyntheticTransaction } from 'models/Transaction';
import type { ApiUser, ContactSmartAddressData } from 'models/Contacts';
import type { RootReducerState } from 'reducers/rootReducer';

type Props = {
  navigation: NavigationScreenProp<*>,
  isOnline: boolean,
  baseFiatCurrency: ?string,
  supportedAssets: Asset[],
  availableStake: number,
  contacts: ApiUser[],
  contactsSmartAddresses: ContactSmartAddressData[],
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

const Value = styled(MediumText)`
  font-size: ${fontSizes.big}px;
`;

const WarningMessage = styled(Paragraph)`
  text-align: center;
  color: ${baseColors.fireEngineRed};
  padding-bottom: ${spacing.rhythm}px;
`;

class SendSyntheticConfirm extends React.Component<Props, State> {
  syntheticTransaction: SyntheticTransaction;
  assetData: Asset;
  state: State = { note: null };

  constructor(props: Props) {
    super(props);
    const { navigation } = props;
    this.syntheticTransaction = navigation.getParam('syntheticTransaction');
    this.assetData = navigation.getParam('assetData', {});
  }

  onConfirmPress = () => {
    const { note } = this.state;
    const { fromAmount } = this.syntheticTransaction;
    const { symbol, decimals, address: contractAddress } = this.assetData;
    const syntheticTransaction = { ...this.syntheticTransaction };
    const transactionPayload = {
      amount: fromAmount,
      to: SYNTHETICS_CONTRACT_ADDRESS,
      symbol,
      contractAddress,
      decimals,
      note,
      usePPN: true,
      extra: { syntheticTransaction },
    };
    this.props.navigation.navigate(SEND_TOKEN_PIN_CONFIRM, {
      transactionPayload,
      goBackDismiss: true,
    });
  };


  handleBack = () => {
    this.props.navigation.goBack();
  };

  handleNoteChange(text) {
    this.setState({ note: text });
  }

  render() {
    const {
      isOnline,
      availableStake,
      contacts,
      contactsSmartAddresses,
    } = this.props;

    const {
      fromAmount,
      toAmount,
      toAssetCode,
      toAddress,
    } = this.syntheticTransaction;

    let errorMessage;
    if (availableStake < fromAmount) errorMessage = 'Not enough PLR in tank';
    else if (!isOnline) errorMessage = 'Cannot send while offline';

    const contact = findMatchingContact(toAddress, contacts, contactsSmartAddresses);
    const recipientUsername = getUserName(contact);

    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [{ title: 'Review and confirm' }],
          customOnBack: this.handleBack,
        }}
      >
        <ScrollWrapper regularPadding color={UIColors.defaultBackgroundColor}>
          <View>
            {!!recipientUsername &&
            <LabeledRow>
              <Label>Recipient Username</Label>
              <Value>{recipientUsername}</Value>
            </LabeledRow>
            }
            <LabeledRow>
              <Label>Recipient Address</Label>
              <Value>{toAddress}</Value>
            </LabeledRow>
            <LabeledRow>
              <Label>Recipient will get</Label>
              <Value>{`${toAmount} ${toAssetCode}`}</Value>
            </LabeledRow>
            <LabeledRow>
              <Label>You will pay</Label>
              <Value>{`${fromAmount} PLR`}</Value>
            </LabeledRow>
          </View>
          <LabeledRow>
            <Label>Est. Network Fee</Label>
            <Value>free</Value>
          </LabeledRow>
          {isOnline && !!recipientUsername &&
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
            />
          }
        </ScrollWrapper>
        <Footer keyboardVerticalOffset={40} backgroundColor={UIColors.defaultBackgroundColor}>
          {!!errorMessage && <WarningMessage small>{errorMessage}</WarningMessage>}
          <FooterWrapper>
            <Button
              disabled={!!errorMessage}
              onPress={this.onConfirmPress}
              title="Confirm"
            />
          </FooterWrapper>
        </Footer>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  session: { data: { isOnline } },
  appSettings: { data: { baseFiatCurrency } },
  assets: { supportedAssets },
  contacts: { data: contacts, contactsSmartAddresses: { addresses: contactsSmartAddresses } },
}: RootReducerState): $Shape<Props> => ({
  isOnline,
  baseFiatCurrency,
  supportedAssets,
  contacts,
  contactsSmartAddresses,
});

const structuredSelector = createStructuredSelector({
  availableStake: availableStakeSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(SendSyntheticConfirm);
