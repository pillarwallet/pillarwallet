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
import Separator from 'components/Separator';
import { SEND_TOKEN_AMOUNT, SEND_COLLECTIBLE_CONFIRM } from 'constants/navigationConstants';
import { COLLECTIBLES } from 'constants/assetsConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import t from 'tcomb-form-native';
import { baseColors, fontSizes, spacing, UIColors } from 'utils/variables';
import { Container, Footer } from 'components/Layout';
import Button from 'components/Button';
import SingleInput from 'components/TextInput/SingleInput';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import type { NavigationScreenProp } from 'react-navigation';
import QRCodeScanner from 'components/QRCodeScanner';
import Header from 'components/Header';
import { navigateToSendTokenAmountAction } from 'actions/smartWalletActions';
import { isValidETHAddress } from 'utils/validators';
import { pipe, decodeETHAddress } from 'utils/common';
import { getAccountAddress } from 'utils/accounts';
import type { Accounts, AccountTypes } from 'models/Account';

type Props = {
  navigation: NavigationScreenProp<*>,
  accounts: Accounts,
  localContacts: Object[],
  wallet: Object,
  smartWalletFeatureEnabled: boolean,
  navigateToSendTokenAmount: Function,
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
  padding: 0 ${spacing.rhythm}px;
  margin-bottom: ${spacing.medium}px;
  margin-top: -20px;
`;

const HeaderWrapper = styled.View`
  background-color: ${baseColors.white};
  border-bottom-color: ${baseColors.mediumLightGray};
  border-bottom-width: 1px;
`;

const ContactCardList = styled.FlatList`
  background-color: ${UIColors.defaultBackgroundColor};
`;

// make Dynamic once more tokens supported
const ETHValidator = (address: string): Function => pipe(decodeETHAddress, isValidETHAddress)(address);
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
    fontSize: fontSizes.small,
    fontWeight: 300,
  };
  return (
    <SingleInput
      errorMessage={errorMessage}
      outterIconText="SCAN"
      outterIcon={qrCode}
      id="address"
      onPress={onIconPress}
      inputProps={inputProps}
      fontSize={fontSizes.small}
      marginTop={30}
    />
  );
}

const getFormStructure = (ownAddress: string) => {
  const Address = t.refinement(t.String, (address): boolean => {
    return address.length && isValidETHAddress(address) && ownAddress !== address;
  });

  Address.getValidationErrorMessage = (address): string => {
    if (ownAddress === address) {
      return 'You are not allowed to make transaction to yourself';
    }
    if (!isValidETHAddress(address)) {
      return 'Invalid Ethereum Address.';
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

class SendTokenContacts extends React.Component<Props, State> {
  _form: t.form;
  assetData: Object;

  constructor(props: Props) {
    super(props);
    this.assetData = this.props.navigation.getParam('assetData', {});
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

  renderContact = ({ item: user }) => {
    return (
      <ListItemWithImage
        onPress={() => this.setUsersEthAddress(user.ethAddress)}
        label={user.username}
        avatarUrl={user.profileImage}
      />
    );
  };

  setUsersEthAddress = (ethAddress: string) => {
    this.setState({ value: { ...this.state.value, address: ethAddress } }, () => {
      this.navigateToNextScreen(ethAddress);
    });
  };

  navigateToNextScreen(ethAddress) {
    if (this.assetData.tokenType === COLLECTIBLES) {
      this.props.navigation.navigate(SEND_COLLECTIBLE_CONFIRM, {
        assetData: this.assetData,
        receiver: ethAddress,
        source: 'Contact',
      });
      return;
    }
    this.props.navigateToSendTokenAmount({
      assetData: this.assetData,
      receiver: ethAddress,
      source: 'Contact',
    });
  }

  getAccountName(accountType: AccountTypes): string {
    switch (accountType) {
      case ACCOUNT_TYPES.SMART_WALLET:
        return 'Smart Wallet';
      case ACCOUNT_TYPES.KEY_BASED:
        return 'Key Based account';
      default:
        return '';
    }
  }

  getUserAccounts() {
    const { accounts = [], smartWalletFeatureEnabled } = this.props;
    if (!smartWalletFeatureEnabled) return [];
    const accountsWithoutActive = accounts.filter(({ isActive }) => !isActive);
    return accountsWithoutActive.map(account => ({
      ethAddress: getAccountAddress(account),
      username: this.getAccountName(account.type),
    }));
  }

  render() {
    const { localContacts = [] } = this.props;
    const { isScanning, formStructure, value } = this.state;

    const formOptions = generateFormOptions({ onIconPress: this.handleQRScannerOpen });
    const userAccounts = this.getUserAccounts();
    const allContacts = [...userAccounts, ...localContacts];
    let contactsToRender = [...allContacts];
    if (value && value.address.length) {
      const searchStr = value.address.toLowerCase();
      contactsToRender = allContacts.filter(({ username, ethAddress }) => {
        const usernameFound = username.toLowerCase().includes(searchStr);
        if (value.address.length < 3) return usernameFound;
        return usernameFound || ethAddress.toLowerCase().startsWith(searchStr);
      });
    }

    const tokenName = this.assetData.tokenType === COLLECTIBLES ? this.assetData.name : this.assetData.token;
    return (
      <Container inset={{ bottom: 0 }} color={baseColors.white}>
        <HeaderWrapper>
          <Header onBack={this.props.navigation.dismiss} title={`send ${tokenName}`} centerTitle />
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
        </HeaderWrapper>
        {!!contactsToRender.length &&
          <ContactCardList
            data={contactsToRender}
            renderItem={this.renderContact}
            keyExtractor={({ username }) => username}
            ItemSeparatorComponent={() => <Separator spaceOnLeft={82} />}
            contentContainerStyle={{ paddingTop: 10, paddingBottom: 40 }}
          />
        }
        <QRCodeScanner
          validator={ETHValidator}
          dataFormatter={decodeETHAddress}
          isActive={isScanning}
          onDismiss={this.handleQRScannerClose}
          onRead={this.handleQRRead}
        />
        {!!value && !!value.address.length &&
          <Footer keyboardVerticalOffset={35} backgroundColor={UIColors.defaultBackgroundColor}>
            <Button flexRight small disabled={!value.address.length} title="Next" onPress={this.handleFormSubmit} />
          </Footer>
        }
      </Container>
    );
  }
}

const mapStateToProps = ({
  accounts: { data: accounts },
  contacts: { data: localContacts },
  wallet: { data: wallet },
  featureFlags: { data: { SMART_WALLET_ENABLED: smartWalletFeatureEnabled } },
}) => ({
  accounts,
  localContacts,
  wallet,
  smartWalletFeatureEnabled,
});

const mapDispatchToProps = (dispatch) => ({
  navigateToSendTokenAmount: (options) => dispatch(navigateToSendTokenAmountAction(options)),
});

export default connect(mapStateToProps, mapDispatchToProps)(SendTokenContacts);
