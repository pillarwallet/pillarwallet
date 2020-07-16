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
import { ScrollWrapper } from 'components/Layout';

// configs
import { PPN_TOKEN } from 'configs/assetsConfig';

// utils
import { getAccountName, getActiveAccount } from 'utils/accounts';
import { formatFiat, formatMoney, noop } from 'utils/common';
import { userHasSmartWallet } from 'utils/smartWallet';
import { spacing } from 'utils/variables';
import { calculateBalanceInFiat } from 'utils/assets';
import { images } from 'utils/images';

// types
import type { NavigationScreenProp } from 'react-navigation';
import type { Assets, Balances, BalancesStore, Rates } from 'models/Asset';
import type { Account, Accounts } from 'models/Account';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { BlockchainNetwork } from 'models/BlockchainNetwork';
import type { EthereumWallet } from 'models/Wallet';
import type { Theme } from 'models/Theme';

// constants
import { ASSETS } from 'constants/navigationConstants';
import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';
import { defaultFiatCurrency } from 'constants/assetsConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

// actions
import { setActiveBlockchainNetworkAction } from 'actions/blockchainNetworkActions';
import { switchAccountAction } from 'actions/accountsActions';
import { resetIncorrectPasswordAction } from 'actions/authActions';
import { fetchAllAccountsBalancesAction } from 'actions/assetsActions';

// selectors
import { availableStakeSelector } from 'selectors/paymentNetwork';
import { accountAssetsSelector } from 'selectors/assets';


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

type WalletsListItem = {|
  type: 'ACCOUNT',
  ...commonItemsParams,
|};

type ListItem = WalletsListItem | NetworkItem;

type ListElement = {| item: ListItem |};

type Props = {|
  navigation: NavigationScreenProp<*>,
  setActiveBlockchainNetwork: (id: string) => void,
  blockchainNetworks: BlockchainNetwork[],
  assets: Assets,
  baseFiatCurrency: ?string,
  availableStake: number,
  isTankInitialised: boolean,
  accounts: Accounts,
  resetIncorrectPassword: () => void,
  switchAccount: (accountId: string) => void,
  balances: BalancesStore,
  rates: Rates,
  theme: Theme,
  fetchAllAccountsBalances: () => void,
|};

type State = {|
  showPinModal: boolean,
  onPinValidAction: ?(_: string, wallet: EthereumWallet) => Promise<void>,
  switchingToWalletId: ?string,
|};

const IconImage = styled(CachedImage)`
  height: 52px;
  width: 52px;
`;

class AccountsScreen extends React.Component<Props, State> {
  forceRender = false;
  state = {
    showPinModal: false,
    onPinValidAction: null,
    switchingToWalletId: null,
  };

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

  wallets(activeNetwork?: BlockchainNetwork): WalletsListItem[] {
    const {
      accounts,
      balances,
      rates,
      baseFiatCurrency,
      theme,
    } = this.props;

    const { smartWalletIcon } = images(theme);

    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;

    const isEthereumActive = !!activeNetwork && (
      activeNetwork.id === BLOCKCHAIN_NETWORK_TYPES.ETHEREUM
    );

    return accounts
      .filter(({ type }) => type !== ACCOUNT_TYPES.KEY_BASED)
      .map((account: Account): WalletsListItem => {
        const { id, isActive, type } = account;
        const accountBalances: Balances = balances[id];
        const isActiveWallet = !!isActive && isEthereumActive;
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
          iconSource: smartWalletIcon,
        };
      });
  }

  networks(): NetworkItem[] {
    const networks: NetworkItem[] = [];

    const {
      blockchainNetworks,
      availableStake,
      isTankInitialised,
      accounts,
      theme,
    } = this.props;

    const { PPNIcon } = images(theme);

    const ppnNetwork = blockchainNetworks.find(
      (network) => network.id === BLOCKCHAIN_NETWORK_TYPES.PILLAR_NETWORK,
    );

    if (ppnNetwork) {
      const { title, isActive } = ppnNetwork;
      const availableStakeFormattedAmount = formatMoney(availableStake);

      networks.push({
        id: `NETWORK_${ppnNetwork.id}`,
        type: 'NETWORK',
        title,
        balance: userHasSmartWallet(accounts) ? `${availableStakeFormattedAmount} ${PPN_TOKEN}` : 'N/A',
        isInitialised: isTankInitialised,
        mainAction: this.setPPNAsActiveNetwork,
        initialiseAction: this.initialisePPN,
        isActive,
        iconSource: PPNIcon,
      });
    }

    return networks;
  }

  render() {
    const { showPinModal, onPinValidAction } = this.state;
    const { blockchainNetworks } = this.props;

    const activeNetwork = blockchainNetworks.find((net) => net.isActive);
    const walletsToShow = this.wallets(activeNetwork);
    const networksToShow = this.networks();
    const accountsList = [...walletsToShow, ...networksToShow];

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
  appSettings: { data: { baseFiatCurrency } },
  balances: { data: balances },
  rates: { data: rates },
}: RootReducerState): $Shape<Props> => ({
  accounts,
  blockchainNetworks,
  isTankInitialised,
  baseFiatCurrency,
  balances,
  rates,
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
  fetchAllAccountsBalances: () => dispatch(fetchAllAccountsBalancesAction()),
});

export default withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(AccountsScreen));
