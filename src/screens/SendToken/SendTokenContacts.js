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
import styled, { withTheme } from 'styled-components/native';
import { Keyboard, Alert, FlatList } from 'react-native';
import isEmpty from 'lodash.isempty';
import t from 'tcomb-form-native';
import { createStructuredSelector } from 'reselect';
import { CachedImage } from 'react-native-cached-image';
import type { NavigationScreenProp } from 'react-navigation';

// components
import Separator from 'components/Separator';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { Container, Footer } from 'components/Layout';
import Button from 'components/Button';
import TextInput from 'components/TextInput';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import AddressScanner from 'components/QRCodeScanner/AddressScanner';
import Spinner from 'components/Spinner';

// constants
import { COLLECTIBLES, BTC } from 'constants/assetsConstants';
import { ACCOUNTS, SEND_COLLECTIBLE_CONFIRM } from 'constants/navigationConstants';
import { CHAT } from 'constants/chatConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

// actions
import { navigateToSendTokenAmountAction } from 'actions/smartWalletActions';
import { syncContactsSmartAddressesAction } from 'actions/contactsActions';

// utils
import { addressValidator, isEnsName } from 'utils/validators';
import { resolveEnsName, isCaseInsensitiveMatch } from 'utils/common';
import { isPillarPaymentNetworkActive } from 'utils/blockchainNetworks';
import { fontSizes, spacing } from 'utils/variables';
import { getAccountAddress, getAccountName, getInactiveUserAccounts } from 'utils/accounts';
import { themedColors, getThemeColors } from 'utils/themes';

// selectors
import { activeAccountSelector } from 'selectors';

// models, types
import type { Account, Accounts } from 'models/Account';
import type { ContactSmartAddressData } from 'models/Contacts';
import type { BlockchainNetwork } from 'models/BlockchainNetwork';
import type { SendNavigateOptions } from 'models/Navigation';
import type { AssetData } from 'models/Asset';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Theme } from 'models/Theme';

type Props = {
  navigation: NavigationScreenProp<*>,
  accounts: Accounts,
  localContacts: Object[],
  wallet: Object,
  navigateToSendTokenAmount: (options: SendNavigateOptions) => void,
  contactsSmartAddressesSynced: boolean,
  syncContactsSmartAddresses: () => void,
  contactsSmartAddresses: ContactSmartAddressData[],
  isOnline: boolean,
  blockchainNetworks: BlockchainNetwork[],
  activeAccount: ?Account,
  theme: Theme,
};

type State = {
  isScanning: boolean,
  isValidatingEns: boolean,
  value: {
    address: string,
  },
  formStructure: t.struct,
  formOptions: Object,
};

const keyWalletIcon = require('assets/icons/icon_ethereum_network.png');
const smartWalletIcon = require('assets/icons/icon_smart_wallet.png');
const lightningIcon = require('assets/icons/icon_lightning_sm.png');

const FormWrapper = styled.View`
  padding: ${spacing.mediumLarge}px ${spacing.large}px 6px;
  background-color: ${themedColors.card};
  border-bottom-color: ${themedColors.border};
  border-bottom-width: 1px;
`;

const ImageIcon = styled(CachedImage)`
  width: 6px;
  height: 12px;
  tint-color: ${themedColors.primary};
`;

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
    maxLength: 42,
    letterSpacing: 0.1,
    fontSize: fontSizes.medium,
    autoCapitalize: 'none',
  };

  return (
    <TextInput
      errorMessage={errorMessage}
      inputProps={inputProps}
      iconProps={{
        icon: 'qrcode',
        fontSize: 20,
        onPress: onIconPress,
      }}
    />
  );
}

const getFormStructure = (ownAddress: string, token: string) => {
  const { validator, message } = addressValidator(token);

  const Address = t.refinement(t.String, (address): boolean => {
    return address.length && validator(address) && ownAddress !== address;
  });

  Address.getValidationErrorMessage = (address): string => {
    if (address === '') {
      return 'Address must be provided.';
    }

    if (ownAddress === address) {
      return 'You are not allowed to make transaction to yourself';
    }

    return message;
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
  assetData: AssetData;
  isPPNTransaction: boolean;

  constructor(props: Props) {
    super(props);
    const { navigation, blockchainNetworks } = this.props;
    this.assetData = navigation.getParam('assetData', {});
    this.isPPNTransaction = isPillarPaymentNetworkActive(blockchainNetworks);
    const { token } = this.assetData;

    this.state = {
      isScanning: false,
      isValidatingEns: false,
      value: { address: '' },
      formStructure: getFormStructure(this.props.wallet.address, token),
      formOptions: generateFormOptions({ onIconPress: this.handleQRScannerOpen }),
    };
  }

  componentDidMount() {
    const { isOnline, syncContactsSmartAddresses } = this.props;
    if (isOnline) {
      syncContactsSmartAddresses();
    }
  }

  handleChange = (value: Object) => {
    this.setState({ value });
  };

  validateAndNavigate = async (address: string) => {
    const { token } = this.assetData;
    let ensName = '';
    let receiverAddress = address;

    if (isEnsName(address) && token !== BTC) {
      this.setState({ isValidatingEns: true });
      const resolvedAddress = await resolveEnsName(address);
      if (!resolvedAddress) {
        this.setInvalidEns();
        return;
      }
      ensName = address;
      receiverAddress = resolvedAddress;
    }

    this.setState({ isValidatingEns: false }, () => this.navigateToNextScreen(receiverAddress, ensName));
  };

  handleFormSubmit = () => {
    const value = this._form.getValue();
    if (!value) return;

    this.validateAndNavigate(value.address);
  };

  setInvalidEns = () => {
    const options = t.update(this.state.formOptions, {
      fields: {
        address: {
          hasError: { $set: true },
          error: { $set: 'Address not found' },
        },
      },
    });
    this.setState({ isValidatingEns: false, formOptions: options });
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
      this.validateAndNavigate(address);
    });
  };

  onContactPress = (user) => {
    const { navigation } = this.props;
    const {
      username,
      hasSmartWallet,
      ethAddress,
    } = user;
    if (this.isPPNTransaction && !hasSmartWallet) {
      Alert.alert(
        'This user is not on Pillar Network',
        'You both should be connected to Pillar Network in order to be able to send instant transactions for free',
        [
          { text: 'Open Chat', onPress: () => navigation.navigate(CHAT, { username }) },
          { text: 'Switch to Ethereum Mainnet', onPress: () => navigation.navigate(ACCOUNTS) },
          { text: 'Cancel', style: 'cancel' },
        ],
        { cancelable: true },
      );
      return;
    }
    this.navigateToNextScreen(ethAddress);
  };

  renderContact = ({ item: user }) => {
    const {
      username,
      hasSmartWallet,
      profileImage,
      isUserAccount,
      type,
    } = user;

    const customProps = {};
    if (isUserAccount) {
      customProps.itemImageSource = type === ACCOUNT_TYPES.KEY_BASED ? keyWalletIcon : smartWalletIcon;
      customProps.noImageBorder = true;
    } else {
      customProps.avatarUrl = profileImage;
    }

    return (
      <ListItemWithImage
        onPress={() => this.onContactPress(user)}
        wrapperOpacity={this.isPPNTransaction && !hasSmartWallet ? 0.3 : 1}
        label={username}
        {...customProps}
      />
    );
  };

  navigateToNextScreen(receiverAddress: string, receiverEnsName?: string) {
    const { navigation, navigateToSendTokenAmount } = this.props;

    if (this.assetData.tokenType === COLLECTIBLES) {
      navigation.navigate(SEND_COLLECTIBLE_CONFIRM, {
        assetData: this.assetData,
        receiver: receiverAddress,
        source: 'Contact',
        receiverEnsName,
      });
      return;
    }
    navigateToSendTokenAmount({
      assetData: this.assetData,
      receiver: receiverAddress,
      source: 'Contact',
      receiverEnsName,
    });
  }

  renderContacts() {
    const {
      localContacts = [],
      contactsSmartAddresses,
      accounts,
    } = this.props;
    const { value } = this.state;

    const isSearchQueryProvided = !!(value && value.address.length);
    const userAccounts = getInactiveUserAccounts(accounts).map(account => ({
      ...account,
      ethAddress: getAccountAddress(account),
      username: getAccountName(account.type, accounts),
      sortToTop: true,
      isUserAccount: true,
    }));

    let contactsToRender = this.isPPNTransaction
      ? [...localContacts]
      : [...userAccounts, ...localContacts];

    if (isSearchQueryProvided) {
      const searchStr = value.address.toLowerCase();
      contactsToRender = contactsToRender.filter(({ username, ethAddress }) => {
        // $FlowFixMe
        const usernameFound = username.toLowerCase().includes(searchStr);
        if (value.address.length < 3) return usernameFound;
        return usernameFound || ethAddress.toLowerCase().startsWith(searchStr);
      });
    }

    if (contactsSmartAddresses) {
      contactsToRender = contactsToRender
        .map(contact => {
          const { smartWallets = [] } = contactsSmartAddresses.find(
            ({ userId }) => contact.id && isCaseInsensitiveMatch(userId, contact.id),
          ) || {};
          return {
            ...contact,
            ethAddress: smartWallets[0] || contact.ethAddress,
            hasSmartWallet: !!smartWallets.length,
          };
        })
        .sort((a, b) => {
          // keep as it is
          if (a.hasSmartWallet === b.hasSmartWallet
            || (a.sortToTop && a.sortToTop === b.sortToTop)) return 0;
          // sort user accounts to top
          if (a.sortToTop || b.sortToTop) return 1;
          // sort smart wallet contacts to top
          return a.hasSmartWallet ? -1 : 1;
        });
    }

    if (!contactsToRender.length) {
      return null;
    }

    return (
      <FlatList
        data={contactsToRender}
        renderItem={this.renderContact}
        keyExtractor={({ username }) => username}
        ItemSeparatorComponent={() => <Separator spaceOnLeft={82} />}
        contentContainerStyle={{ paddingTop: spacing.mediumLarge, paddingBottom: 40 }}
      />
    );
  }

  render() {
    const {
      localContacts = [],
      contactsSmartAddressesSynced,
      isOnline,
      theme,
    } = this.props;
    const {
      isScanning,
      isValidatingEns,
      formStructure,
      formOptions,
      value,
    } = this.state;

    const { tokenType, name, token } = this.assetData;
    const isCollectible = tokenType === COLLECTIBLES;
    const isSearchQueryProvided = !!(value && value.address.length);

    const showContacts = isCollectible || token !== BTC;
    const tokenName = (isCollectible ? (name || token) : token) || 'asset';

    const colors = getThemeColors(theme);

    const headerTitleItems = this.isPPNTransaction
      ? [
        { title: 'Send' },
        { custom: <ImageIcon source={lightningIcon} />, style: { marginHorizontal: 5 } },
        { title: tokenName, color: colors.primary },
      ]
      : [{ title: `Send ${tokenName}` }];

    const showSpinner = isOnline && !contactsSmartAddressesSynced && !isEmpty(localContacts);
    const submitDisabled = !value.address.length || isValidatingEns;

    return (
      <ContainerWithHeader
        headerProps={{ centerItems: headerTitleItems }}
        inset={{ bottom: 0 }}
      >
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
        {showContacts && this.renderContacts()}
        <AddressScanner
          isActive={isScanning}
          onCancel={this.handleQRScannerClose}
          onRead={this.handleQRRead}
        />
        {isSearchQueryProvided &&
          <Footer keyboardVerticalOffset={35}>
            <Button flexRight small disabled={submitDisabled} title="Next" onPress={this.handleFormSubmit} />
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
}: RootReducerState): $Shape<Props> => ({
  accounts,
  localContacts,
  wallet,
  contactsSmartAddresses,
  contactsSmartAddressesSynced,
  isOnline,
  blockchainNetworks,
});

const structuredSelector = createStructuredSelector({
  activeAccount: activeAccountSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  navigateToSendTokenAmount: (options: SendNavigateOptions) => dispatch(navigateToSendTokenAmountAction(options)),
  syncContactsSmartAddresses: () => dispatch(syncContactsSmartAddressesAction()),
});

export default withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(SendTokenContacts));
