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
import { FlatList, Platform } from 'react-native';
import isEqual from 'lodash.isequal';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { NetworkListCard } from 'components/ListItem/NetworkListCard';
import SlideModal from 'components/Modals/SlideModal';
import CheckPin from 'components/CheckPin';
import Loader from 'components/Loader';
import { SettingsItemCarded } from 'components/ListItem/SettingsItemCarded';

// configs
import { PPN_TOKEN } from 'configs/assetsConfig';

// utils
import { getActiveAccount } from 'utils/accounts';
import { formatFiat, formatMoney } from 'utils/common';
import { userHasSmartWallet } from 'utils/smartWallet';
import { responsiveSize } from 'utils/ui';
import { baseColors, spacing } from 'utils/variables';
import { calculateBalanceInFiat } from 'utils/assets';

// types
import type { NavigationScreenProp } from 'react-navigation';
import type { Assets, BalancesStore, Balances, Rates } from 'models/Asset';
import type { Accounts, Account } from 'models/Account';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { BlockchainNetwork } from 'models/BlockchainNetwork';

// constants
import {
  PILLAR_NETWORK_INTRO,
  ASSETS,
  SMART_WALLET_INTRO,
  WALLET_SETTINGS,
} from 'constants/navigationConstants';
import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';
import { defaultFiatCurrency } from 'constants/assetsConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

// actions
import { setActiveBlockchainNetworkAction } from 'actions/blockchainNetworkActions';
import { switchAccountAction } from 'actions/accountsActions';
import { resetIncorrectPasswordAction } from 'actions/authActions';

// selectors
import { availableStakeSelector } from 'selectors/paymentNetwork';

type NetworkItem = {|
  id: string,
  type: 'NETWORK',
  network: BlockchainNetwork,
  isInitialised: boolean,
  action: () => void,
  initialiseAction: () => void,
  noteText: string,
  noteIcon: string,
  iconSource: string,
  isInitialised: boolean,
  formattedStakeAmount: string,
|};

type AccountInteraction = {|
  isActiveWallet: boolean,
  isSmartWallet: boolean,
  walletBalance: number,
  onMainPress: () => void,
  onSettingsPress?: () => void,
  isInitButton?: boolean,
|};

type NewItem = {| type: 'NEW_SMART_WALLET', interaction: AccountInteraction |};

type AccountItem = {|
  id: string,
  type: 'ACCOUNT',
  interaction: AccountInteraction,
  account: Account,
|};

type ListItem = NetworkItem | AccountItem | NewItem;

type ListElement = {| item: ListItem |};

type Props = {|
  navigation: NavigationScreenProp<*>,
  setActiveBlockchainNetwork: Function,
  blockchainNetworks: BlockchainNetwork[],
  assets: Assets,
  baseFiatCurrency: string,
  smartWalletFeatureEnabled: boolean,
  availableStake: number,
  isTankInitialised: boolean,
  accounts: Accounts,
  resetIncorrectPassword: Function,
  switchAccount: Function,
  balances: BalancesStore,
  rates: Rates,
|};

type State = {|
  showPinModal: boolean,
  changingAccount: boolean,
|};

const Wrapper = styled.View`
  flex: 1;
  position: relative;
  margin: 5px 20px 20px;
  padding-top: ${Platform.select({
    ios: '20px',
    android: '14px',
  })};
  justify-content: center;
  align-items: center;
`;

const iconRadius = responsiveSize(52);
const IconWrapper = styled.View`
  height: ${iconRadius}px;
  width: ${iconRadius}px;
  border-radius: ${iconRadius / 2}px;
  background-color: ${baseColors.zircon};
  margin-right: ${spacing.medium}px;
  align-items: center;
  justify-content: center;
`;

const iconSide = responsiveSize(20);
const WalletIcon = styled.View`
  background-color: ${baseColors.electricBlueIntense};
  ${props => props.isSmart
    ? `height: ${iconSide}px;
        width: ${iconSide}px;
        border-top-right-radius: 6px;
        border-bottom-left-radius: 6px;`
    : `height: ${iconSide}px;
        width: ${iconSide}px;`}
`;

const pillarNetworkIcon = require('assets/icons/icon_PPN.png');

class AccountsScreen extends React.Component<Props, State> {
  switchToWallet: ?Account = null;

  state = {
    showPinModal: false,
    changingAccount: false,
  };

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    const isFocused = this.props.navigation.isFocused();
    if (!isFocused) {
      return false;
    }
    const isEq = isEqual(this.props, nextProps) && isEqual(this.state, nextState);
    return !isEq;
  }

  handleCheckPinModalClose = () => {
    const { resetIncorrectPassword } = this.props;
    resetIncorrectPassword();
    this.setState({
      showPinModal: false,
    });
  };

  setPPNAsActiveNetwork = () => {
    const { setActiveBlockchainNetwork, navigation, accounts } = this.props;
    const activeAccount = getActiveAccount(accounts) || { type: '' };

    if (activeAccount.type === ACCOUNT_TYPES.SMART_WALLET) {
      setActiveBlockchainNetwork(BLOCKCHAIN_NETWORK_TYPES.PILLAR_NETWORK);
      navigation.navigate(ASSETS);
    } else {
      this.setState({ showPinModal: true });
    }
  };

  switchToSmartWalletAndGoToPPN = async (_: string, wallet: Object) => {
    const {
      accounts,
      setActiveBlockchainNetwork,
      switchAccount,
      navigation,
    } = this.props;
    this.setState({ showPinModal: false, changingAccount: true });
    const smartAccount = (accounts.find((acc) => acc.type === ACCOUNT_TYPES.SMART_WALLET) || { id: '' });
    await switchAccount(smartAccount.id, wallet.privateKey);

    setActiveBlockchainNetwork(BLOCKCHAIN_NETWORK_TYPES.PILLAR_NETWORK);
    this.setState({ changingAccount: false });
    navigation.navigate(ASSETS);
  };

  switchWallet = (wallet: Account) => {
    const {
      switchAccount,
      navigation,
      accounts,
      setActiveBlockchainNetwork,
    } = this.props;
    const activeAccount = getActiveAccount(accounts) || { type: '' };
    setActiveBlockchainNetwork(BLOCKCHAIN_NETWORK_TYPES.ETHEREUM);

    if (wallet.type === ACCOUNT_TYPES.SMART_WALLET) {
      if (activeAccount.type === ACCOUNT_TYPES.SMART_WALLET) {
        navigation.navigate(ASSETS);
      } else {
        this.switchToWallet = wallet;
        this.setState({ showPinModal: true });
      }
    } else if (wallet.type === ACCOUNT_TYPES.KEY_BASED) {
      switchAccount(wallet.id);
      navigation.navigate(ASSETS);
    }
  };

  switchToSmartWalletAccount = async (_: string, wallet: Object) => {
    this.setState({ showPinModal: false, changingAccount: true });
    const { navigation, switchAccount } = this.props;
    if (!this.switchToWallet) return;
    await switchAccount(this.switchToWallet.id, wallet.privateKey);
    this.switchToWallet = null;
    this.setState({ changingAccount: false });
    navigation.navigate(ASSETS);
  };

  initialisePPN = () => {
    this.props.navigation.navigate(PILLAR_NETWORK_INTRO);
  };

  renderNetwork(item: NetworkItem) {
    const {
      network: { isActive, title },
      action,
      initialiseAction,
      formattedStakeAmount,
      noteText,
      noteIcon,
      iconSource,
      isInitialised,
    } = item;

    return (
      <NetworkListCard
        title={title}
        subtitle={`Balance: ${formattedStakeAmount}`}
        noteText={noteText}
        noteIcon={noteIcon}
        iconSource={iconSource}
        isActive={isActive}
        isInitialised={isInitialised}
        action={action}
        initialiseAction={initialiseAction}
      />
    );
  }

  accountSettings = (wallet: Account) => {
    const { navigation } = this.props;

    navigation.navigate(WALLET_SETTINGS, { wallet });
  }

  renderAccount(interaction: AccountInteraction) {
    const {
      walletBalance,
      onMainPress,
      onSettingsPress,
      isActiveWallet,
      isSmartWallet,
      isInitButton,
    } = interaction;

    const { baseFiatCurrency } = this.props;
    const balance = isInitButton ? null : formatFiat(walletBalance, baseFiatCurrency);

    return (
      <SettingsItemCarded
        title={isSmartWallet ? 'Ethereum Smart Wallet' : 'Ethereum Key Wallet'}
        subtitle={balance}
        onMainPress={onMainPress}
        onSettingsPress={onSettingsPress}
        isActive={isActiveWallet}
        customIcon={(
          <IconWrapper>
            <WalletIcon isSmart={isSmartWallet} />
          </IconWrapper>
        )}
      />
    );
  }

  renderListItem = ({ item }: ListElement) => {
    switch (item.type) {
      case 'NETWORK':
        return this.renderNetwork(item);

      case 'ACCOUNT':
      case 'NEW_SMART_WALLET':
        return this.renderAccount(item.interaction);

      default:
        return null;
    }
  };

  visibleAccounts(accounts: Accounts, smartWalletFeatureEnabled: boolean): Accounts {
    if (smartWalletFeatureEnabled) {
      return accounts;
    }

    return accounts.filter(({ type }) => type !== ACCOUNT_TYPES.SMART_WALLET);
  }

  wallets(activeNetwork?: BlockchainNetwork): ListItem[] {
    const {
      accounts,
      navigation,
      balances,
      rates,
      smartWalletFeatureEnabled,
      baseFiatCurrency,
    } = this.props;

    const visibleAccounts = this.visibleAccounts(accounts, smartWalletFeatureEnabled);
    const hasAccount = userHasSmartWallet(accounts);
    const showSmartWalletInitButton = !hasAccount && smartWalletFeatureEnabled;
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;

    const isEthereumActive = !!activeNetwork && (
      activeNetwork.id === BLOCKCHAIN_NETWORK_TYPES.ETHEREUM
    );

    const wallets = visibleAccounts.map((account: Account): ListItem => {
      const { id, isActive, type } = account;
      const accountBalances: Balances = balances[id];
      const isActiveWallet = !!isActive && isEthereumActive;
      const isSmartWallet = type === ACCOUNT_TYPES.SMART_WALLET;
      let walletBalance = 0;

      if (accountBalances) {
        walletBalance = calculateBalanceInFiat(rates, accountBalances, fiatCurrency);
      }

      const accountItem = {
        id: `ACCOUNT_${id}`,
        account,
        type: 'ACCOUNT',
        interaction: {
          walletBalance,
          onMainPress: () => this.switchWallet(account),
          onSettingsPress: () => this.accountSettings(account),
          isActiveWallet,
          isSmartWallet,
        },
      };

      return accountItem;
    });

    if (showSmartWalletInitButton) {
      wallets.push({
        type: 'NEW_SMART_WALLET',
        interaction: {
          isSmartWallet: true,
          walletBalance: 0,
          isActiveWallet: false,
          onMainPress: () => { navigation.navigate(SMART_WALLET_INTRO); },
          isInitButton: true,
        },
      });
    }

    return wallets;
  }

  networks(): ListItem[] {
    const networks: ListItem[] = [];

    const {
      blockchainNetworks,
      availableStake,
      isTankInitialised,
      smartWalletFeatureEnabled,
      accounts,
    } = this.props;

    const ppnNetwork = blockchainNetworks.find((network) => network.id === BLOCKCHAIN_NETWORK_TYPES.PILLAR_NETWORK);
    const availableStakeFormattedAmount = formatMoney(availableStake);
    const hasAccount = userHasSmartWallet(accounts);
    const hasSmartWallet = hasAccount && smartWalletFeatureEnabled;

    if (smartWalletFeatureEnabled && ppnNetwork) {
      networks.push({
        id: `NETWORK_${ppnNetwork.id}`,
        type: 'NETWORK',
        isInitialised: isTankInitialised,
        network: ppnNetwork,
        formattedStakeAmount: hasSmartWallet ? `${availableStakeFormattedAmount} ${PPN_TOKEN}` : 'N/A',
        noteText: 'Instant, free and private transactions',
        noteIcon: 'sunglasses',
        iconSource: pillarNetworkIcon,
        action: this.setPPNAsActiveNetwork,
        initialiseAction: this.initialisePPN,
      });
    }

    return networks;
  }

  render() {
    const { showPinModal, changingAccount } = this.state;
    const { blockchainNetworks } = this.props;

    const activeNetwork = blockchainNetworks.find((net) => net.isActive);
    const walletsToShow = this.wallets(activeNetwork);
    const networksToShow = this.networks();

    return (
      <ContainerWithHeader
        headerProps={{
          leftItems: [
            { userIcon: true },
            { title: 'Accounts' },
          ],
          rightItems: [{ close: true, dismiss: true }],
        }}
      >
        {!changingAccount &&
        <FlatList
          data={[...walletsToShow, ...networksToShow]}
          keyExtractor={(item) => item.id || item.type}
          style={{ width: '100%' }}
          contentContainerStyle={{ width: '100%', padding: 20 }}
          renderItem={this.renderListItem}
        />}

        {changingAccount &&
        <Wrapper>
          <Loader noMessages />
        </Wrapper>}

        <SlideModal
          isVisible={showPinModal}
          onModalHide={this.handleCheckPinModalClose}
          title="Enter pincode"
          centerTitle
          fullScreen
          showHeader
        >
          <Wrapper>
            <CheckPin
              onPinValid={this.switchToWallet ? this.switchToSmartWalletAccount : this.switchToSmartWalletAndGoToPPN}
            />
          </Wrapper>
        </SlideModal>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  accounts: { data: accounts },
  blockchainNetwork: { data: blockchainNetworks },
  paymentNetwork: { isTankInitialised },
  featureFlags: { data: { SMART_WALLET_ENABLED: smartWalletFeatureEnabled } },
  appSettings: { data: { baseFiatCurrency } },
  balances: { data: balances },
  rates: { data: rates },
}: RootReducerState) => ({
  accounts,
  blockchainNetworks,
  isTankInitialised,
  smartWalletFeatureEnabled,
  baseFiatCurrency,
  balances,
  rates,
});

const structuredSelector = createStructuredSelector({
  availableStake: availableStakeSelector,
});

const combinedMapStateToProps = (state: RootReducerState) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  setActiveBlockchainNetwork: (id: string) => dispatch(setActiveBlockchainNetworkAction(id)),
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
  switchAccount: (accountId: string, privateKey?: string) => dispatch(switchAccountAction(accountId, privateKey)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(AccountsScreen);
