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
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import { Keyboard } from 'react-native';
import isEmpty from 'lodash.isempty';
import t from 'tcomb-form-native';

import { SEND_BITCOIN_AMOUNT } from 'constants/navigationConstants';
import Separator from 'components/Separator';
import { baseColors, fontSizes, spacing, UIColors } from 'utils/variables';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { Container, Footer } from 'components/Layout';
import Button from 'components/Button';
import SingleInput from 'components/TextInput/SingleInput';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import type { NavigationScreenProp } from 'react-navigation';
import QRCodeScanner from 'components/QRCodeScanner';
import Spinner from 'components/Spinner';
import { isValidBTCAddress } from 'utils/validators';
import { pipe, decodeBTCAddress } from 'utils/common';
import type { BlockchainNetwork } from 'models/BlockchainNetwork';

type Props = {
  navigation: NavigationScreenProp<*>,
  localContacts: Object[],
  wallet: Object,
  navigateToSendBitcoinAmount: Function,
  blockchainNetworks: BlockchainNetwork[],
};

type State = {
  isScanning: boolean,
  value: {
    address: string,
  },
  formStructure: t.struct,
};

const qrCode = require('assets/images/qr.png');

const FormWrapper = styled.View`
  padding: ${spacing.mediumLarge}px ${spacing.large}px 6px;
  background-color: ${baseColors.white};
  border-bottom-color: ${baseColors.mediumLightGray};
  border-bottom-width: 1px;
`;

const ContactCardList = styled.FlatList`
  background-color: ${UIColors.defaultBackgroundColor};
`;

// make Dynamic once more tokens supported
const BTCValidator = (address: string): boolean => pipe(decodeBTCAddress, isValidBTCAddress)(address);
const { Form } = t.form;

function AddressInputTemplate(locals) {
  const { config: { onIconPress } } = locals;
  const errorMessage = locals.error;
  const inputProps = {
    onChange: locals.onChange,
    onBlur: locals.onBlur,
    placeholder: 'Username or wallet address',
    value: locals.value,
    keyboardType: locals.keyboardType,
    textAlign: 'left',
    maxLength: 42,
    letterSpacing: 0.1,
    fontSize: fontSizes.medium,
  };
  return (
    <SingleInput
      errorMessage={errorMessage}
      outterIconText="SCAN"
      outterIcon={qrCode}
      id="address"
      onPress={onIconPress}
      inputProps={inputProps}
      fontSize={fontSizes.medium}
    />
  );
}

const getFormStructure = (ownAddress: string) => {
  const Address = t.refinement(t.String, (address): boolean => {
    return address.length && isValidBTCAddress(address) && ownAddress !== address;
  });

  Address.getValidationErrorMessage = (address): string => {
    if (ownAddress === address) {
      return 'You are not allowed to make transaction to yourself';
    }
    if (!isValidBTCAddress(address)) {
      return 'Invalid Bitcoin Address.';
    }
    return 'Address must be provided.';
  };

  return t.struct({
    address: Address,
  });
};

const generateFormOptions = (config: Object): Object => ({
  fields: {
    address: { template: AddressInputTemplate, config, label: 'To' },
  },
});

class SendBitcoinContacts extends React.Component<Props, State> {
  _form: t.form;
  assetData: Object;

  constructor(props: Props) {
    super(props);
    const { navigation } = this.props;
    this.assetData = navigation.getParam('assetData', {});
    this.state = {
      isScanning: false,
      value: { address: '' },
      formStructure: getFormStructure(this.props.wallet.address),
    };
  }

  handleChange = (value: Object) => {
    this.setState({ value });
  };

  handleFormSubmit = () => {
    const value = this._form.getValue();
    if (!value) return;
    this.navigateToNextScreen(value.address);
  };

  handleQRScannerOpen = async () => {
    this.setState({
      isScanning: !this.state.isScanning,
    }, () => {
      if (this.state.isScanning) {
        Keyboard.dismiss();
      }
    });
  };

  handleQRScannerClose = () => {
    this.setState({
      isScanning: false,
    });
  };

  handleQRRead = (address: string) => {
    this.setState({ value: { ...this.state.value, address }, isScanning: false }, () => {
      this.navigateToNextScreen(address);
    });
  };

  onContactPress = (user) => {
    const {
      btcAddress,
    } = user;
    this.navigateToNextScreen(btcAddress);
  };

  renderContact = ({ item: user }) => {
    const {
      username,
      profileImage,
      isUserAccount,
    } = user;

    const customProps = {};
    if (isUserAccount) {
      customProps.noImageBorder = true;
    } else {
      customProps.avatarUrl = profileImage;
    }

    return (
      <ListItemWithImage
        onPress={() => this.onContactPress(user)}
        wrapperOpacity={1}
        label={username}
        {...customProps}
      />
    );
  };

  navigateToNextScreen(btcAddress) {
    this.props.navigation.navigate({
      routeName: SEND_BITCOIN_AMOUNT,
      params: {
        assetData: this.assetData,
        receiver: btcAddress,
        source: 'Contact',
      },
    });
  }

  render() {
    const { isScanning, formStructure, value } = this.state;
    const isSearchQueryProvided = !!(value && value.address.length);
    const formOptions = generateFormOptions({ onIconPress: this.handleQRScannerOpen });

    // asset transfer between user accounts only in regular, but not in PPN send flow
    let contactsToRender = [];
    if (isSearchQueryProvided) {
      const searchStr = value.address.toLowerCase();
      contactsToRender = contactsToRender.filter(({ username, btcAddress }) => {
        // $FlowFixMe
        const usernameFound = username.toLowerCase().includes(searchStr);
        if (value.address.length < 3) return usernameFound;
        return usernameFound || btcAddress.toLowerCase().startsWith(searchStr);
      });
    }

    const tokenName = this.assetData.symbol;
    const showSpinner = false;

    return (
      <ContainerWithHeader headerProps={{ centerItems: [{ title: `Send ${tokenName}` }] }} inset={{ bottom: 0 }}>
        <FormWrapper>
          <Form
            ref={node => {
              this._form = node;
            }}
            type={formStructure}
            options={formOptions}
            onChange={this.handleChange}
            onBlur={this.handleChange}
            value={value}
          />
        </FormWrapper>
        {showSpinner && <Container center><Spinner /></Container>}
        {!!contactsToRender.length &&
          <ContactCardList
            data={contactsToRender}
            renderItem={this.renderContact}
            keyExtractor={({ username }) => username}
            ItemSeparatorComponent={() => <Separator spaceOnLeft={82} />}
            contentContainerStyle={{ paddingTop: spacing.mediumLarge, paddingBottom: 40 }}
          />
        }
        <QRCodeScanner
          validator={BTCValidator}
          dataFormatter={decodeBTCAddress}
          isActive={isScanning}
          onCancel={this.handleQRScannerClose}
          onRead={this.handleQRRead}
        />
        {isSearchQueryProvided &&
          <Footer keyboardVerticalOffset={35} backgroundColor={UIColors.defaultBackgroundColor}>
            <Button flexRight small disabled={!value.address.length} title="Next" onPress={this.handleFormSubmit} />
          </Footer>
        }
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  accounts: { data: accounts },
  contacts: { data: localContacts, contactsSmartAddresses: { addresses: contactsSmartAddresses } },
  wallet: { data: wallet },
  session: { data: { contactsSmartAddressesSynced, isOnline } },
  blockchainNetwork: { data: blockchainNetworks },
}) => ({
  accounts,
  localContacts,
  wallet,
  contactsSmartAddresses,
  contactsSmartAddressesSynced,
  isOnline,
  blockchainNetworks,
});

const combinedMapStateToProps = (state) => ({
  ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(SendBitcoinContacts);
