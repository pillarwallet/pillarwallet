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
import isEqual from 'lodash.isequal';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { availableStakeSelector, PPNTransactionsSelector } from 'selectors/paymentNetwork';
import * as Keychain from 'react-native-keychain';

// components
import { BaseText } from 'components/Typography';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Spinner from 'components/Spinner';
import Button from 'components/Button';
import { Container } from 'components/Layout';

// types
import type { Assets, Asset } from 'models/Asset';
import type { Collectible } from 'models/Collectible';
import type { Badges } from 'models/Badge';
import type { SmartWalletStatus } from 'models/SmartWalletStatus';
import type { Accounts, Account } from 'models/Account';
import type { Transaction } from 'models/Transaction';

// actions
import { fetchInitialAssetsAction } from 'actions/assetsActions';
import { logScreenViewAction } from 'actions/analyticsActions';
import { fetchAllCollectiblesDataAction } from 'actions/collectiblesActions';

// constants
import {
  FETCH_INITIAL_FAILED,
  FETCHED,
} from 'constants/assetsConstants';
import { PAYMENT_COMPLETED, SMART_WALLET_UPGRADE_STATUSES } from 'constants/smartWalletConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';
import { ACCOUNTS, SETTINGS, WALLET_SETTINGS } from 'constants/navigationConstants';

// utils
import { findKeyBasedAccount, getAccountName } from 'utils/accounts';
import { baseColors } from 'utils/variables';
import { getSmartWalletStatus } from 'utils/smartWallet';

// selectors
import { accountCollectiblesSelector } from 'selectors/collectibles';
import { accountAssetsSelector } from 'selectors/assets';
import { activeAccountSelector } from 'selectors';

// local components
import PPNView from 'screens/Assets/PPNView';
import BTCView from 'screens/Assets/BTCView';
import WalletView from 'screens/Assets/WalletView';

type Props = {
  fetchInitialAssets: () => Function,
  assets: Assets,
  collectibles: Collectible[],
  wallet: Object,
  rates: Object,
  assetsState: ?string,
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: string,
  assetsLayout: string,
  assetsSearchResults: Asset[],
  assetsSearchState: string,
  badges: Badges,
  accounts: Accounts,
  smartWalletState: Object,
  blockchainNetworks: Object[],
  activeAccount: ?Account,
  logScreenView: (view: string, screen: string) => void,
  fetchAllCollectiblesData: () => void,
  useBiometrics: boolean,
  backupStatus: Object,
  availableStake: number,
  PPNTransactions: Transaction[],
}

type State = {
  showKeyWalletInsight: boolean,
  showSmartWalletInsight: boolean,
  supportsBiometrics: boolean,
}

const VIEWS = {
  KEY_WALLET_VIEW: 'KEY_WALLET_VIEW',
  SMART_WALLET_VIEW: 'SMART_WALLET_VIEW',
  PPN_VIEW: 'PPN_VIEW',
  BTC_VIEW: 'BTC_VIEW',
};

class AssetsScreen extends React.Component<Props, State> {
  forceRender = false;
  state = {
    showKeyWalletInsight: true,
    showSmartWalletInsight: false,
    supportsBiometrics: false,
  };

  componentDidMount() {
    const {
      fetchInitialAssets,
      fetchAllCollectiblesData,
      assets,
      logScreenView,
    } = this.props;

    logScreenView('View assets list', 'Assets');

    if (!Object.keys(assets).length) {
      fetchInitialAssets();
    }

    fetchAllCollectiblesData();

    Keychain.getSupportedBiometryType()
      .then(supported => this.setState({ supportsBiometrics: !!supported }))
      .catch(() => null);
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    const { navigation } = this.props;
    const isEq = isEqual(this.props, nextProps) && isEqual(this.state, nextState);
    const isFocused = navigation.isFocused();

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

  hideWalletInsight = (type: string) => {
    if (type === 'KEY') {
      this.setState({ showKeyWalletInsight: false });
    } else {
      this.setState({ showSmartWalletInsight: false });
    }
  };

  getScreenInfo = () => {
    const {
      navigation,
      blockchainNetworks,
      activeAccount,
      availableStake,
      PPNTransactions,
      accounts,
    } = this.props;

    const { type: walletType } = activeAccount || {};
    const activeBNetwork = blockchainNetworks.find((network) => network.isActive) || { id: '', title: '' };
    const { id: activeBNetworkId, title: activeBNetworkTitle } = activeBNetwork;

    switch (activeBNetworkId) {
      case BLOCKCHAIN_NETWORK_TYPES.ETHEREUM:
        return {
          label: getAccountName(walletType, accounts),
          action: () => navigation.navigate(ACCOUNTS),
          screenView: walletType === ACCOUNT_TYPES.KEY_BASED ? VIEWS.KEY_WALLET_VIEW : VIEWS.SMART_WALLET_VIEW,
          customHeaderProps: {
            background: walletType === ACCOUNT_TYPES.KEY_BASED ? baseColors.tomato : baseColors.neonBlue,
            light: true,
          },
          customHeaderButtonProps: {},
        };

      case BLOCKCHAIN_NETWORK_TYPES.BITCOIN:
        return {
          label: 'Bitcoin network',
          action: () => navigation.navigate(ACCOUNTS),
          screenView: VIEWS.BTC_VIEW,
          customHeaderProps: {},
          customHeaderButtonProps: {},
        };

      default:
        const hasUnsettledTx = PPNTransactions.some(({ stateInPPN }) => stateInPPN === PAYMENT_COMPLETED);
        return {
          label: activeBNetworkTitle,
          action: () => navigation.navigate(ACCOUNTS),
          screenView: VIEWS.PPN_VIEW,
          customHeaderProps: {},
          customHeaderButtonProps: { isActive: availableStake > 0 || hasUnsettledTx },
        };
    }
  };

  getInsightsList = () => {
    const {
      accounts,
      backupStatus,
      navigation,
      useBiometrics,
    } = this.props;
    const { supportsBiometrics } = this.state;

    const isBackedUp = backupStatus.isImported || backupStatus.isBackedUp;
    const keyBasedAccount = findKeyBasedAccount(accounts) || {};

    const keyWalletInsights = [
      {
        key: 'backup',
        title: 'Backup wallet',
        status: isBackedUp,
        onPress: !isBackedUp
          ? () => navigation.navigate(WALLET_SETTINGS, { accountId: keyBasedAccount.id })
          : null,
      },
      {
        key: 'pinCode',
        title: 'Set PIN code',
        status: true,
      },
    ];

    if (supportsBiometrics) {
      const biometricsInsight = {
        key: 'biometric',
        title: 'Enable biometric login (optional)',
        status: useBiometrics,
        onPress: !useBiometrics
          ? () => navigation.navigate(SETTINGS)
          : null,
      };
      return [...keyWalletInsights, biometricsInsight];
    }

    return keyWalletInsights;
  };

  renderView = (viewType: string) => {
    const {
      assets,
      assetsState,
      fetchInitialAssets,
      accounts,
      smartWalletState,
    } = this.props;
    const { showKeyWalletInsight, showSmartWalletInsight } = this.state;

    const smartWalletStatus: SmartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);

    if (!Object.keys(assets).length && assetsState === FETCHED) {
      return (
        <Container center inset={{ bottom: 0 }}>
          <BaseText style={{ marginBottom: 20 }}>Loading default assets</BaseText>
          {assetsState !== FETCH_INITIAL_FAILED && (
            <Spinner />
          )}
          {assetsState === FETCH_INITIAL_FAILED && (
            <Button title="Try again" onPress={() => fetchInitialAssets()} />
          )}
        </Container>
      );
    }

    switch (viewType) {
      case VIEWS.BTC_VIEW:
        return <BTCView />;
      case VIEWS.PPN_VIEW:
        return <PPNView />;
      case VIEWS.SMART_WALLET_VIEW:
        return (
          <WalletView
            showInsight={showSmartWalletInsight}
            hideInsight={() => this.hideWalletInsight('SMART')}
            showDeploySmartWallet={smartWalletStatus.status === SMART_WALLET_UPGRADE_STATUSES.ACCOUNT_CREATED}
          />);
      case VIEWS.KEY_WALLET_VIEW:
        return (
          <WalletView
            showInsight={showKeyWalletInsight}
            hideInsight={() => this.hideWalletInsight('KEY')}
            insightList={this.getInsightsList()}
            insightsTitle="Never lose your funds"
          />);
      default:
        return null;
    }
  };

  render() {
    const { activeAccount } = this.props;
    if (!activeAccount) return null;

    const screenInfo = this.getScreenInfo();
    const {
      label: headerButtonLabel,
      action: headerButtonAction,
      screenView,
      customHeaderProps,
      customHeaderButtonProps,
    } = screenInfo;

    return (
      <ContainerWithHeader
        backgroundColor={baseColors.white}
        headerProps={{
          ...customHeaderProps,
          leftItems: [{ user: true }],
          rightItems: [{
            actionButton: {
              key: 'manageAccounts',
              label: headerButtonLabel,
              hasChevron: true,
              onPress: headerButtonAction,
              ...customHeaderButtonProps,
            },
          }],
        }}
        inset={{ bottom: 0 }}
      >
        {this.renderView(screenView)}
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  accounts: { data: accounts },
  wallet: { data: wallet, backupStatus },
  assets: {
    assetsState,
    assetsSearchState,
    assetsSearchResults,
  },
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency, appearanceSettings: { assetsLayout }, useBiometrics = false } },
  badges: { data: badges },
  smartWallet: smartWalletState,
  blockchainNetwork: { data: blockchainNetworks },
}) => ({
  wallet,
  backupStatus,
  accounts,
  assetsState,
  assetsSearchState,
  assetsSearchResults,
  rates,
  baseFiatCurrency,
  assetsLayout,
  useBiometrics,
  badges,
  smartWalletState,
  blockchainNetworks,
});

const structuredSelector = createStructuredSelector({
  collectibles: accountCollectiblesSelector,
  assets: accountAssetsSelector,
  activeAccount: activeAccountSelector,
  availableStake: availableStakeSelector,
  PPNTransactions: PPNTransactionsSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Function) => ({
  fetchInitialAssets: () => dispatch(fetchInitialAssetsAction()),
  logScreenView: (view: string, screen: string) => dispatch(logScreenViewAction(view, screen)),
  fetchAllCollectiblesData: () => dispatch(fetchAllCollectiblesDataAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(AssetsScreen);
