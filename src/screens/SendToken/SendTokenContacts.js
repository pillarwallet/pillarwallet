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
import { Keyboard, Alert } from 'react-native';
import isEmpty from 'lodash.isempty';
import t from 'tcomb-form-native';
import { createStructuredSelector } from 'reselect';
import Separator from 'components/Separator';
import { ACCOUNTS, SEND_COLLECTIBLE_CONFIRM } from 'constants/navigationConstants';
import { COLLECTIBLES } from 'constants/assetsConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { CHAT } from 'constants/chatConstants';
import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';
import { baseColors, fontSizes, spacing, UIColors } from 'utils/variables';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { Container, Footer } from 'components/Layout';
import Button from 'components/Button';
import SingleInput from 'components/TextInput/SingleInput';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import type { NavigationScreenProp } from 'react-navigation';
import QRCodeScanner from 'components/QRCodeScanner';
import Spinner from 'components/Spinner';
import { navigateToSendTokenAmountAction } from 'actions/smartWalletActions';
import { syncContactsSmartAddressesAction } from 'actions/contactsActions';
import { isValidETHAddress } from 'utils/validators';
import { pipe, decodeETHAddress } from 'utils/common';
import { getAccountAddress } from 'utils/accounts';
import type { Account, Accounts, AccountTypes } from 'models/Account';
import type { ContactSmartAddresses } from 'models/Contacts';
import { activeAccountSelector } from 'selectors';

type Props = {
  navigation: NavigationScreenProp<*>,
  accounts: Accounts,
  localContacts: Object[],
  wallet: Object,
  smartWalletFeatureEnabled: boolean,
  navigateToSendTokenAmount: Function,
  contactsSmartAddressesSynced: boolean,
  syncContactsSmartAddresses: Function,
  contactsSmartAddresses: ContactSmartAddresses[],
  isOnline: boolean,
  blockchainNetworks: Object[],
  activeAccount: Account,
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

const isCaseInsensitiveMatch = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

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

  componentDidMount() {
    const { smartWalletFeatureEnabled, isOnline, syncContactsSmartAddresses } = this.props;
    if (smartWalletFeatureEnabled && isOnline) {
      syncContactsSmartAddresses();
    }
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

  setUsersEthAddress = (ethAddress: string) => {
    this.setState({ value: { ...this.state.value, address: ethAddress } }, () => {
      this.navigateToNextScreen(ethAddress);
    });
  };

  onContactPress = (user) => {
    const { navigation } = this.props;
    const isDisabled = user.isPPNTransaction
      && (!user.smartWallets || !user.smartWallets.length);
    if (isDisabled) {
      Alert.alert(
        'This user is not on Pillar Network',
        'You both should be connected to Pillar Network in order to be able to send instant transactions for free',
        [
          { text: 'Open Chat', onPress: () => navigation.navigate(CHAT, { username: user.username }) },
          { text: 'Switch to Ethereum Mainnet', onPress: () => navigation.navigate(ACCOUNTS) },
          { text: 'Cancel', style: 'cancel' },
        ],
        { cancelable: true },
      );
      return;
    }
    const address = user.isPPNTransaction
      ? user.smartWallets[0]
      : user.ethAddress;
    this.setUsersEthAddress(address);
  };

  renderContact = ({ item: user }) => {
    return (
      <ListItemWithImage
        onPress={() => this.onContactPress(user)}
        label={user.username}
        avatarUrl={user.profileImage}
      />
    );
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
    const {
      localContacts = [],
      contactsSmartAddresses,
      contactsSmartAddressesSynced,
      smartWalletFeatureEnabled,
      isOnline,
      blockchainNetworks,
    } = this.props;
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

    const activeBNetwork = blockchainNetworks.find((network) => network.isActive) || { id: '', title: '' };
    const { id: activeBNetworkId } = activeBNetwork;
    if (smartWalletFeatureEnabled
      && activeBNetworkId === BLOCKCHAIN_NETWORK_TYPES.PILLAR_NETWORK
      && contactsSmartAddresses) {
      contactsToRender = contactsToRender.map(contact => {
        const { smartWallets = [] } = contactsSmartAddresses.find(
          ({ userId }) => contact.id && isCaseInsensitiveMatch(userId, contact.id),
        ) || {};
        return {
          ...contact,
          isPPNTransaction: true,
          smartWallets,
        };
      });
    }

    const tokenName = this.assetData.tokenType === COLLECTIBLES ? this.assetData.name : this.assetData.token;
    const showSpinner = smartWalletFeatureEnabled
      && isOnline
      && !contactsSmartAddressesSynced
      && !isEmpty(localContacts);

    return (
      <ContainerWithHeader headerProps={{ centerItems: [{ title: `Send ${tokenName}` }] }}>
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
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  accounts: { data: accounts },
  contacts: { data: localContacts, contactsSmartAddresses: { addresses: contactsSmartAddresses } },
  wallet: { data: wallet },
  featureFlags: { data: { SMART_WALLET_ENABLED: smartWalletFeatureEnabled } },
  session: { data: { contactsSmartAddressesSynced, isOnline } },
  blockchainNetwork: { data: blockchainNetworks },
}) => ({
  accounts,
  localContacts,
  wallet,
  smartWalletFeatureEnabled,
  contactsSmartAddresses,
  contactsSmartAddressesSynced,
  isOnline,
  blockchainNetworks,
});

const structuredSelector = createStructuredSelector({
  activeAccount: activeAccountSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch) => ({
  navigateToSendTokenAmount: (options) => dispatch(navigateToSendTokenAmountAction(options)),
  syncContactsSmartAddresses: () => dispatch(syncContactsSmartAddressesAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(SendTokenContacts);
