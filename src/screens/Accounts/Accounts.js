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
import { CachedImage } from 'react-native-cached-image';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import SlideModal from 'components/Modals/SlideModal';
import CheckPin from 'components/CheckPin';
import Loader from 'components/Loader';
import { SettingsItemCarded } from 'components/ListItem/SettingsItemCarded';
import { BaseText } from 'components/Typography';
import CollapsibleListItem from 'components/ListItem/CollapsibleListItem';
import { ScrollWrapper } from 'components/Layout';

// configs
import { PPN_TOKEN } from 'configs/assetsConfig';

// utils
import { getAccountName, getActiveAccount, getActiveAccountType } from 'utils/accounts';
import { formatFiat, formatMoney } from 'utils/common';
import { userHasSmartWallet } from 'utils/smartWallet';
import { baseColors, fontStyles, spacing } from 'utils/variables';
import { calculateBalanceInFiat } from 'utils/assets';

// types
import type { NavigationScreenProp } from 'react-navigation';
import type { Assets, Balances, BalancesStore, Rates } from 'models/Asset';
import type { Account, Accounts } from 'models/Account';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { BlockchainNetwork } from 'models/BlockchainNetwork';

// constants
import {
  ASSETS,
  BITCOIN_NETWORK_INTRO,
  PILLAR_NETWORK_INTRO,
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
import { accountAssetsSelector } from 'selectors/assets';

const NEW_SMART_WALLET = 'NEW_SMART_WALLET';

type commonItemsParams = {|
  id: string,
  title: string,
  balance: ?string,
  isInitialised: boolean,
  mainAction: ?() => void,
  initialiseAction: ?() => void,
  isActive: boolean,
  iconSource: string,
  onSettingsPress: ?() => void,
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
  setActiveBlockchainNetwork: Function,
  blockchainNetworks: BlockchainNetwork[],
  assets: Assets,
  baseFiatCurrency: ?string,
  smartWalletFeatureEnabled: boolean,
  availableStake: number,
  isTankInitialised: boolean,
  accounts: Accounts,
  resetIncorrectPassword: Function,
  switchAccount: Function,
  balances: BalancesStore,
  rates: Rates,
  user: Object,
|};

type State = {|
  showPinModal: boolean,
  changingAccount: boolean,
  isLegacyWalletVisible: boolean,
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

const IconImage = styled(CachedImage)`
  height: 52px;
  width: 52px;
`;

const FooterWrapper = styled.View`
  flex-grow: 1;
  padding: 40px; ${spacing.large}px;
  align-items: center;
  justify-content: flex-end;
`;

const FooterParagraph = styled(BaseText)`
  ${fontStyles.regular};
  text-align: center;
  color: ${baseColors.coolGrey};
`;

const pillarNetworkIcon = require('assets/icons/icon_PPN.png');
const bitcoinNetworkIcon = require('assets/icons/icon_BTC.png');
const ethereumWalletIcon = require('assets/icons/icon_ethereum_network.png');
const smartWalletIcon = require('assets/icons/icon_smart_wallet.png');

class AccountsScreen extends React.Component<Props, State> {
  switchToWallet: ?Account = null;
  forceRender = false;

  constructor(props) {
    super(props);
    const isActiveKeyWallet = getActiveAccountType(props.accounts) === ACCOUNT_TYPES.KEY_BASED;
    const { user } = props;
    const forceShowLegacyWallet = !user.isLegacyUser && isActiveKeyWallet;
    this.state = {
      showPinModal: false,
      changingAccount: false,
      isLegacyWalletVisible: forceShowLegacyWallet,
    };
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

  accountSettings = (account: Account) => {
    const { navigation } = this.props;
    navigation.navigate(WALLET_SETTINGS, { accountId: account.id });
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
      onSettingsPress,
    } = item;
    return (
      <SettingsItemCarded
        title={title}
        subtitle={balance}
        onMainPress={isInitialised ? mainAction : initialiseAction}
        onSettingsPress={onSettingsPress}
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
    } = this.props;

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
        title: isSmartWallet ? 'Smart wallet' : getAccountName(ACCOUNT_TYPES.KEY_BASED, accounts),
        balance: walletBalance,
        isInitialised: true,
        mainAction: () => this.switchWallet(account),
        initialiseAction: null,
        isActive: isActiveWallet,
        iconSource: isSmartWallet ? smartWalletIcon : ethereumWalletIcon,
        onSettingsPress: () => this.accountSettings(account),
        isSmartWallet,
      };
    });

    if (showSmartWalletInitButton) {
      wallets.push({
        id: NEW_SMART_WALLET,
        type: NEW_SMART_WALLET,
        title: 'Smart Wallet',
        balance: null,
        isInitialised: false,
        mainAction: null,
        initialiseAction: () => { navigation.navigate(SMART_WALLET_INTRO); },
        isActive: false,
        iconSource: smartWalletIcon,
        onSettingsPress: null,
        isSmartWallet: true,
      });
    }

    return wallets;
  }

  setBTCAsActiveNetwork() {
    // const { setActiveBlockchainNetwork, navigation, accounts } = this.props;
    // const activeAccount = getActiveAccount(accounts) || { type: '' };
    //
    // if (activeAccount.type === ACCOUNT_TYPES.BITCOIN_WALLET) {
    //   setActiveBlockchainNetwork(BLOCKCHAIN_NETWORK_TYPES.BITCOIN);
    //   navigation.navigate(ASSETS);
    // } else {
    //   this.setState({ showPinModal: true });
    // }
  }

  initialiseBTC = () => {
    this.props.navigation.navigate(BITCOIN_NETWORK_INTRO);
  }

  networks(): NetworkItem[] {
    const networks: NetworkItem[] = [];

    const {
      blockchainNetworks,
      availableStake,
      isTankInitialised,
      smartWalletFeatureEnabled,
      accounts,
      baseFiatCurrency,
    } = this.props;

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
        iconSource: pillarNetworkIcon,
        onSettingsPress: null,
      });
    }

    const bitcoinNetwork = blockchainNetworks.find(
      (network) => network.isAvailable && network.id === BLOCKCHAIN_NETWORK_TYPES.BITCOIN,
    );

    if (bitcoinNetwork) {
      // TODO: calculate balance
      const formattedBitcoinBalance = formatFiat(0, baseFiatCurrency);

      networks.push({
        id: 'NETWORK_BTC',
        type: 'NETWORK',
        title: bitcoinNetwork.title,
        isInitialised: false,
        isActive: bitcoinNetwork.isActive,
        balance: formattedBitcoinBalance,
        iconSource: bitcoinNetworkIcon,
        mainAction: this.setBTCAsActiveNetwork,
        initialiseAction: this.initialiseBTC,
        onSettingsPress: null,
      });
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
      onSettingsPress,
    } = item;

    return (
      <CollapsibleListItem
        open={isLegacyWalletVisible}
        onPress={() => this.setState({ isLegacyWalletVisible: !isLegacyWalletVisible })}
        customToggle={(
          <BaseText style={{ marginRight: -10, color: baseColors.coolGrey }}>
            Legacy wallet (advanced)
          </BaseText>
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
            onMainPress={mainAction}
            onSettingsPress={onSettingsPress}
            isActive={isActive}
            sidePaddingsForWidth={40}
            customIcon={<IconImage source={iconSource} />}
          />
        }
      />
    );
  };

  render() {
    const { showPinModal, changingAccount, isLegacyWalletVisible } = this.state;
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
        {!changingAccount &&
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
          <FooterWrapper>
            <FooterParagraph>
              {'Bitcoin, Binance Coin, Ripple \n and more coming soon'}
            </FooterParagraph>
          </FooterWrapper>
        </ScrollWrapper>}

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
  user: { data: user },
}: RootReducerState): $Shape<Props> => ({
  accounts,
  blockchainNetworks,
  isTankInitialised,
  smartWalletFeatureEnabled,
  baseFiatCurrency,
  balances,
  rates,
  user,
});

const structuredSelector = createStructuredSelector({
  availableStake: availableStakeSelector,
  assets: accountAssetsSelector,
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
