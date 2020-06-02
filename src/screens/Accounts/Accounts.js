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
import styled, { withTheme } from 'styled-components/native';
import { FlatList } from 'react-native';
import isEqual from 'lodash.isequal';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { CachedImage } from 'react-native-cached-image';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import CheckAuth from 'components/CheckAuth';
import SettingsItemCarded from 'components/ListItem/SettingsItemCarded';
import { BaseText } from 'components/Typography';
import CollapsibleListItem from 'components/ListItem/CollapsibleListItem';
import { ScrollWrapper } from 'components/Layout';

// configs
import { PPN_TOKEN } from 'configs/assetsConfig';

// utils
import { getAccountName, getActiveAccount, getActiveAccountType, hasLegacyAccountBalance } from 'utils/accounts';
import { formatFiat, formatMoney, noop } from 'utils/common';
import { userHasSmartWallet } from 'utils/smartWallet';
import { spacing } from 'utils/variables';
import { calculateBalanceInFiat } from 'utils/assets';
import { themedColors } from 'utils/themes';
import { calculateBitcoinBalanceInFiat } from 'utils/bitcoin';
import { images } from 'utils/images';

// types
import type { NavigationScreenProp } from 'react-navigation';
import type { Assets, Balances, BalancesStore, Rates } from 'models/Asset';
import type { Account, Accounts } from 'models/Account';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { BlockchainNetwork } from 'models/BlockchainNetwork';
import type { BitcoinAddress, BitcoinBalance } from 'models/Bitcoin';
import type { EthereumWallet } from 'models/Wallet';
import type { Theme } from 'models/Theme';
import type { User } from 'models/User';

// constants
import {
  ASSETS,
  // PILLAR_NETWORK_INTRO,
  SMART_WALLET_INTRO,
} from 'constants/navigationConstants';
import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';
import { defaultFiatCurrency } from 'constants/assetsConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

// actions
import { setActiveBlockchainNetworkAction } from 'actions/blockchainNetworkActions';
import { switchAccountAction } from 'actions/accountsActions';
import { resetIncorrectPasswordAction } from 'actions/authActions';
import { initializeBitcoinWalletAction, refreshBitcoinBalanceAction } from 'actions/bitcoinActions';
import { fetchAllAccountsBalancesAction } from 'actions/assetsActions';

// selectors
import { availableStakeSelector } from 'selectors/paymentNetwork';
import { accountAssetsSelector } from 'selectors/assets';

const NEW_SMART_WALLET = 'NEW_SMART_WALLET';

type commonItemsParams = {|
  id: string,
  title: string,
  balance: ?string,
  isInitialised: boolean,
  mainAction: ?() => Promise<void> | ?() => void,
  initialiseAction: ?() => void,
  isActive: boolean,
  iconSource: string,
|};

type NetworkItem = {|
  type: 'NETWORK',
  ...commonItemsParams,
|};

type NewItem = {|
  type: 'NEW_SMART_WALLET',
  isSmartWallet: boolean,
  ...commonItemsParams,
|};

type AccountItem = {|
  type: 'ACCOUNT',
  isSmartWallet: boolean,
  ...commonItemsParams,
|};

type WalletsListItem = AccountItem | NewItem;
type ListItem = WalletsListItem | NetworkItem;

type ListElement = {| item: ListItem |};

type Props = {|
  navigation: NavigationScreenProp<*>,
  setActiveBlockchainNetwork: (id: string) => void,
  blockchainNetworks: BlockchainNetwork[],
  assets: Assets,
  baseFiatCurrency: ?string,
  smartWalletFeatureEnabled: boolean,
  bitcoinFeatureEnabled: boolean,
  availableStake: number,
  isTankInitialised: boolean,
  accounts: Accounts,
  resetIncorrectPassword: () => void,
  switchAccount: (accountId: string) => void,
  balances: BalancesStore,
  rates: Rates,
  user: User,
  bitcoinAddresses: BitcoinAddress[],
  bitcoinBalances: BitcoinBalance,
  refreshBitcoinBalance: () => void,
  initializeBitcoinWallet: (wallet: EthereumWallet) => void;
  theme: Theme,
  fetchAllAccountsBalances: () => void,
|};

type State = {|
  showPinModal: boolean,
  isLegacyWalletVisible: boolean,
  onPinValidAction: ?(_: string, wallet: EthereumWallet) => Promise<void>,
  switchingToWalletId: ?string,
|};

const IconImage = styled(CachedImage)`
  height: 52px;
  width: 52px;
`;

const ToggleText = styled(BaseText)`
  margin-right: -10px;
  color: ${themedColors.secondaryText};
`;

const bitcoinNetworkIcon = require('assets/icons/icon_BTC.png');

class AccountsScreen extends React.Component<Props, State> {
  switchToWallet: ?Account = null;
  forceRender = false;

  constructor(props) {
    super(props);
    const isActiveKeyWallet = getActiveAccountType(props.accounts) === ACCOUNT_TYPES.KEY_BASED;
    const hasLegacyBalance = hasLegacyAccountBalance(props.accounts, props.balances);
    const { user } = props;
    const forceShowLegacyWallet =
        (!user.isLegacyUser && isActiveKeyWallet) || hasLegacyBalance;
    this.state = {
      showPinModal: false,
      isLegacyWalletVisible: forceShowLegacyWallet,
      onPinValidAction: null,
      switchingToWalletId: null,
    };
  }

  componentDidMount() {
    const { fetchAllAccountsBalances } = this.props;
    fetchAllAccountsBalances();
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    const isEq = isEqual(this.props, nextProps) && isEqual(this.state, nextState);
    const isFocused = this.props.navigation.isFocused();

    if (!isFocused) {
      if (!isEq) this.forceRender = true;
      return false;
    }

    if (this.forceRender) {
      this.forceRender = false;
      return true;
    }

    return !isEq;
  }

  handleCheckPinModalClose = () => {
    const { resetIncorrectPassword } = this.props;
    resetIncorrectPassword();
    this.setState({
      showPinModal: false,
    });
  };

  setPPNAsActiveNetwork = async () => {
    const {
      setActiveBlockchainNetwork,
      navigation,
      accounts,
      switchAccount,
    } = this.props;
    const activeAccount = getActiveAccount(accounts) || { type: '' };

    if (activeAccount.type !== ACCOUNT_TYPES.SMART_WALLET) {
      const smartAccount = (accounts.find((acc) => acc.type === ACCOUNT_TYPES.SMART_WALLET) || { id: '' });
      await switchAccount(smartAccount.id);
    }
    setActiveBlockchainNetwork(BLOCKCHAIN_NETWORK_TYPES.PILLAR_NETWORK);
    navigation.navigate(ASSETS);
  };

  switchWallet = async (wallet: Account) => {
    const { switchAccount, navigation } = this.props;
    await switchAccount(wallet.id);
    navigation.navigate(ASSETS);
  };

  initialisePPN = () => {
    // this.props.navigation.navigate(PILLAR_NETWORK_INTRO);
    this.setPPNAsActiveNetwork();
  };

  renderListItem = ({ item }: ListElement) => {
    const {
      title,
      balance,
      isInitialised,
      mainAction,
      initialiseAction,
      isActive,
      iconSource,
      id,
    } = item;
    return (
      <SettingsItemCarded
        isSwitching={id === this.state.switchingToWalletId}
        title={title}
        subtitle={balance}
        onMainPress={() => {
          this.setState({ switchingToWalletId: id }, isInitialised ?
            mainAction || noop :
            initialiseAction || noop,
          );
        }}
        isActive={isActive}
        customIcon={<IconImage source={iconSource} />}
      />
    );
  };

  visibleAccounts(accounts: Accounts, smartWalletFeatureEnabled: boolean): Accounts {
    if (smartWalletFeatureEnabled) {
      return accounts;
    }

    return accounts.filter(({ type }) => type !== ACCOUNT_TYPES.SMART_WALLET);
  }

  wallets(activeNetwork?: BlockchainNetwork): WalletsListItem[] {
    const {
      accounts,
      navigation,
      balances,
      rates,
      smartWalletFeatureEnabled,
      baseFiatCurrency,
      theme,
    } = this.props;

    const { smartWalletIcon, keyWalletIcon } = images(theme);

    const visibleAccounts = this.visibleAccounts(accounts, smartWalletFeatureEnabled);

    const hasAccount = userHasSmartWallet(accounts);
    const showSmartWalletInitButton = !hasAccount && smartWalletFeatureEnabled;
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;

    const isEthereumActive = !!activeNetwork && (
      activeNetwork.id === BLOCKCHAIN_NETWORK_TYPES.ETHEREUM
    );

    const wallets = visibleAccounts.map((account: Account): WalletsListItem => {
      const { id, isActive, type } = account;
      const accountBalances: Balances = balances[id];
      const isActiveWallet = !!isActive && isEthereumActive;
      const isSmartWallet = type === ACCOUNT_TYPES.SMART_WALLET;
      let walletBalance;
      if (accountBalances) {
        const thisAccountBalance = calculateBalanceInFiat(rates, accountBalances, fiatCurrency);
        walletBalance = formatFiat(thisAccountBalance, baseFiatCurrency);
      }
      return {
        id: `ACCOUNT_${id}`,
        type: 'ACCOUNT',
        title: getAccountName(type),
        balance: walletBalance,
        isInitialised: true,
        mainAction: () => this.switchWallet(account),
        initialiseAction: null,
        isActive: isActiveWallet,
        iconSource: isSmartWallet ? smartWalletIcon : keyWalletIcon,
        isSmartWallet,
      };
    });

    if (showSmartWalletInitButton) {
      wallets.push({
        id: NEW_SMART_WALLET,
        type: NEW_SMART_WALLET,
        title: getAccountName(ACCOUNT_TYPES.SMART_WALLET),
        balance: null,
        isInitialised: false,
        mainAction: null,
        initialiseAction: () => { navigation.navigate(SMART_WALLET_INTRO); },
        isActive: false,
        iconSource: smartWalletIcon,
        isSmartWallet: true,
      });
    }

    return wallets;
  }

  setBTCAsActiveNetwork = () => {
    const {
      navigation,
      setActiveBlockchainNetwork,
      refreshBitcoinBalance,
    } = this.props;
    setActiveBlockchainNetwork(BLOCKCHAIN_NETWORK_TYPES.BITCOIN);
    refreshBitcoinBalance();
    navigation.navigate(ASSETS);
  };

  startBTCInit = () => {
    this.setState({ showPinModal: true, onPinValidAction: this.initialiseBTC });
  };

  initialiseBTC = async (_: string, wallet: EthereumWallet) => {
    const { navigation, setActiveBlockchainNetwork, initializeBitcoinWallet } = this.props;
    this.setState({ showPinModal: false });
    await initializeBitcoinWallet(wallet);
    setActiveBlockchainNetwork(BLOCKCHAIN_NETWORK_TYPES.BITCOIN);
    navigation.navigate(ASSETS);
  };

  networks(): NetworkItem[] {
    const networks: NetworkItem[] = [];

    const {
      blockchainNetworks,
      availableStake,
      isTankInitialised,
      smartWalletFeatureEnabled,
      bitcoinFeatureEnabled,
      accounts,
      bitcoinAddresses,
      baseFiatCurrency,
      rates,
      bitcoinBalances,
      theme,
    } = this.props;

    const { PPNIcon } = images(theme);

    const ppnNetwork = blockchainNetworks.find(
      (network) => network.id === BLOCKCHAIN_NETWORK_TYPES.PILLAR_NETWORK,
    );
    const hasAccount = userHasSmartWallet(accounts);
    const hasSmartWallet = hasAccount && smartWalletFeatureEnabled;

    if (smartWalletFeatureEnabled && ppnNetwork) {
      const { title, isActive } = ppnNetwork;
      const availableStakeFormattedAmount = formatMoney(availableStake);

      networks.push({
        id: `NETWORK_${ppnNetwork.id}`,
        type: 'NETWORK',
        title,
        balance: hasSmartWallet ? `${availableStakeFormattedAmount} ${PPN_TOKEN}` : 'N/A',
        isInitialised: isTankInitialised,
        mainAction: this.setPPNAsActiveNetwork,
        initialiseAction: this.initialisePPN,
        isActive,
        iconSource: PPNIcon,
      });
    }

    if (bitcoinFeatureEnabled) {
      const bitcoinNetwork = blockchainNetworks.find(
        ({ id }) => id === BLOCKCHAIN_NETWORK_TYPES.BITCOIN,
      );

      const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
      const bitcoinBalance = calculateBitcoinBalanceInFiat(rates, bitcoinBalances, fiatCurrency);
      const formattedBitcoinBalance = formatFiat(bitcoinBalance, fiatCurrency);

      if (bitcoinNetwork) {
        networks.push({
          id: 'NETWORK_BTC',
          type: 'NETWORK',
          title: 'Bitcoin wallet',
          isInitialised: bitcoinAddresses.length > 0,
          isActive: bitcoinNetwork.isActive,
          balance: formattedBitcoinBalance,
          iconSource: bitcoinNetworkIcon,
          mainAction: this.setBTCAsActiveNetwork,
          initialiseAction: this.startBTCInit,
        });
      }
    }

    return networks;
  }

  renderKeyWallet = (item, isLegacyWalletVisible) => {
    const {
      title,
      balance,
      mainAction,
      isActive,
      iconSource,
    } = item;

    return (
      <CollapsibleListItem
        open={isLegacyWalletVisible}
        onPress={() => this.setState({ isLegacyWalletVisible: !isLegacyWalletVisible })}
        customToggle={(
          <ToggleText>
            Legacy wallet (advanced)
          </ToggleText>
        )}
        toggleWrapperStyle={{
          justifyContent: 'flex-start',
          paddingHorizontal: spacing.large,
          paddingTop: spacing.large,
          paddingBottom: 4,
        }}
        collapseWrapperStyle={{ padding: spacing.large, paddingTop: 10 }}
        wrapperStyle={{ marginTop: -spacing.mediumLarge }}
        noPadding
        noRipple
        collapseContent={
          <SettingsItemCarded
            title={title}
            subtitle={balance}
            isSwitching={this.state.switchingToWalletId === item.id}
            onMainPress={() => { this.setState({ switchingToWalletId: item.id }, mainAction || noop); }}
            isActive={isActive}
            sidePaddingsForWidth={40}
            customIcon={<IconImage source={iconSource} />}
          />
        }
      />
    );
  };

  render() {
    const { showPinModal, isLegacyWalletVisible, onPinValidAction } = this.state;
    const { blockchainNetworks, user } = this.props;
    const { isLegacyUser } = user;

    const activeNetwork = blockchainNetworks.find((net) => net.isActive);
    const walletsToShow = this.wallets(activeNetwork);
    const networksToShow = this.networks();

    const smartAccountCard = walletsToShow
      .find(({ type, isSmartWallet }) => !!isSmartWallet || type === NEW_SMART_WALLET);
    const legacyAccountCard = walletsToShow.find(({ isSmartWallet }) => !isSmartWallet);

    const walletsInList = (isLegacyUser || !smartAccountCard) ? walletsToShow : [smartAccountCard];

    const accountsList = [...walletsInList, ...networksToShow];

    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [{ title: 'Accounts' }],
          leftItems: [{ close: true, dismiss: true }],
        }}
      >
        <ScrollWrapper
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <FlatList
            data={accountsList}
            keyExtractor={(item) => item.id || item.type}
            style={{ width: '100%', flexGrow: 0 }}
            contentContainerStyle={{ width: '100%', padding: spacing.large }}
            renderItem={this.renderListItem}
          />
          {!isLegacyUser && legacyAccountCard && this.renderKeyWallet(legacyAccountCard, isLegacyWalletVisible)}
        </ScrollWrapper>

        <CheckAuth
          onPinValid={onPinValidAction}
          revealMnemonic
          hideLoader
          modalProps={{
            isVisible: showPinModal,
            onModalHide: this.handleCheckPinModalClose,
          }}
        />
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  accounts: { data: accounts },
  blockchainNetwork: { data: blockchainNetworks },
  paymentNetwork: { isTankInitialised },
  featureFlags: {
    data: {
      SMART_WALLET_ENABLED: smartWalletFeatureEnabled,
      BITCOIN_ENABLED: bitcoinFeatureEnabled,
    },
  },
  appSettings: { data: { baseFiatCurrency } },
  balances: { data: balances },
  rates: { data: rates },
  user: { data: user },
  bitcoin: { data: { addresses: bitcoinAddresses, balances: bitcoinBalances } },
}: RootReducerState): $Shape<Props> => ({
  accounts,
  blockchainNetworks,
  isTankInitialised,
  smartWalletFeatureEnabled,
  bitcoinFeatureEnabled,
  baseFiatCurrency,
  balances,
  rates,
  user,
  bitcoinAddresses,
  bitcoinBalances,
});

const structuredSelector = createStructuredSelector({
  availableStake: availableStakeSelector,
  assets: accountAssetsSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  setActiveBlockchainNetwork: (id: string) => dispatch(setActiveBlockchainNetworkAction(id)),
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
  switchAccount: (accountId: string) => dispatch(switchAccountAction(accountId)),
  refreshBitcoinBalance: () => dispatch(refreshBitcoinBalanceAction(false)),
  initializeBitcoinWallet: (wallet: EthereumWallet) => dispatch(initializeBitcoinWalletAction(wallet)),
  fetchAllAccountsBalances: () => dispatch(fetchAllAccountsBalancesAction()),
});

export default withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(AccountsScreen));
