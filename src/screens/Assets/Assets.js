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
import { availableStakeSelector } from 'selectors/paymentNetwork';
import TouchID from 'react-native-touch-id';

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

// actions
import {
  updateAssetsAction,
  fetchInitialAssetsAction,
  startAssetsSearchAction,
  searchAssetsAction,
  resetSearchAssetsResultAction,
  addAssetAction,
  removeAssetAction,
} from 'actions/assetsActions';
import { logScreenViewAction } from 'actions/analyticsActions';
import { fetchAllCollectiblesDataAction } from 'actions/collectiblesActions';

// constants
import {
  FETCH_INITIAL_FAILED,
  FETCHED,
} from 'constants/assetsConstants';
import { SMART_WALLET_UPGRADE_STATUSES } from 'constants/smartWalletConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';
import { ACCOUNTS, SETTINGS, WALLET_SETTINGS, WALLETS_LIST } from 'constants/navigationConstants';

// utils
import { baseColors } from 'utils/variables';
import { getSmartWalletStatus } from 'utils/smartWallet';

// selectors
import { accountCollectiblesSelector } from 'selectors/collectibles';
import { activeAccountSelector } from 'selectors';

// local components
import PPNView from './PPNView';
import WalletView from './WalletView';

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
  updateAssets: Function,
  startAssetsSearch: Function,
  searchAssets: Function,
  resetSearchAssetsResult: Function,
  assetsSearchResults: Asset[],
  assetsSearchState: string,
  addAsset: Function,
  removeAsset: Function,
  badges: Badges,
  accounts: Accounts,
  smartWalletState: Object,
  blockchainNetworks: Object[],
  activeAccount: Account,
  logScreenView: (view: string, screen: string) => void,
  fetchAllCollectiblesData: Function,
  useBiometrics: boolean,
  backupStatus: Object,
  availableStake: number,
  ppnFeatureEnabled: boolean,
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
};

class AssetsScreen extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      showKeyWalletInsight: true,
      showSmartWalletInsight: false,
      supportsBiometrics: false,
    };
  }

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

    TouchID.isSupported({})
      .then(() => this.setState({ supportsBiometrics: true }))
      .catch(() => null);
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    const isFocused = this.props.navigation.isFocused();
    if (!isFocused) {
      return false;
    }
    const isEq = isEqual(this.props, nextProps) && isEqual(this.state, nextState);
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
      ppnFeatureEnabled,
    } = this.props;

    const { type: walletType } = activeAccount;
    const activeBNetwork = blockchainNetworks.find((network) => network.isActive) || { id: '', title: '' };
    const { id: activeBNetworkId, title: activeBNetworkTitle } = activeBNetwork;

    switch (activeBNetworkId) {
      case BLOCKCHAIN_NETWORK_TYPES.ETHEREUM:
        return {
          label: walletType === ACCOUNT_TYPES.KEY_BASED ? 'Key wallet' : 'Smart wallet',
          action: ppnFeatureEnabled ? () => navigation.navigate(ACCOUNTS) : () => navigation.navigate(WALLETS_LIST),
          screenView: walletType === ACCOUNT_TYPES.KEY_BASED ? VIEWS.KEY_WALLET_VIEW : VIEWS.SMART_WALLET_VIEW,
          customHeaderProps: { background: baseColors.jellyBean, light: true },
          customHeaderButtonProps: {},
        };
      default:
        if (!ppnFeatureEnabled) return {};
        return {
          label: activeBNetworkTitle,
          action: () => navigation.navigate(ACCOUNTS),
          screenView: VIEWS.PPN_VIEW,
          customHeaderProps: {},
          customHeaderButtonProps: { isActive: availableStake > 0 },
        };
    }
  };

  renderView = (viewType: string) => {
    const {
      assets,
      assetsState,
      fetchInitialAssets,
      accounts,
      smartWalletState,
      backupStatus,
      navigation,
      useBiometrics,
    } = this.props;
    const {
      showKeyWalletInsight,
      showSmartWalletInsight,
      supportsBiometrics,
    } = this.state;

    const isBackedUp = backupStatus.isImported || backupStatus.isBackedUp;
    const keyBasedWallet = accounts.find((item) => item.type === ACCOUNT_TYPES.KEY_BASED);

    const keyWalletInsights = [
      {
        key: 'backup',
        title: 'Backup wallet',
        status: isBackedUp,
        onPress: !isBackedUp
          ? () => navigation.navigate(WALLET_SETTINGS, { wallet: keyBasedWallet })
          : null,
      },
      {
        key: 'pinCode',
        title: 'Set PIN code',
        status: true,
      },
    ];

    const visibleKeyWalletInsights = supportsBiometrics
      ? [...keyWalletInsights, {
        key: 'biometric',
        title: 'Enable biometric login',
        status: useBiometrics,
        onPress: !useBiometrics
          ? () => navigation.navigate(SETTINGS)
          : null,
      }]
      : keyWalletInsights;

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
            insightList={visibleKeyWalletInsights}
            insightsTitle="Never lose your funds"
          />);
      default:
        return null;
    }
  };

  render() {
    // HEADER PROPS
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
    data: assets,
    assetsState,
    assetsSearchState,
    assetsSearchResults,
  },
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency, appearanceSettings: { assetsLayout }, useBiometrics = false } },
  badges: { data: badges },
  smartWallet: smartWalletState,
  blockchainNetwork: { data: blockchainNetworks },
  featureFlags: { data: { PPN_ENABLED: ppnFeatureEnabled } },
}) => ({
  wallet,
  backupStatus,
  accounts,
  assets,
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
  ppnFeatureEnabled,
});

const structuredSelector = createStructuredSelector({
  collectibles: accountCollectiblesSelector,
  activeAccount: activeAccountSelector,
  availableStake: availableStakeSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Function) => ({
  fetchInitialAssets: () => dispatch(fetchInitialAssetsAction()),
  updateAssets: (assets: Assets, assetsToExclude: string[]) => dispatch(updateAssetsAction(assets, assetsToExclude)),
  startAssetsSearch: () => dispatch(startAssetsSearchAction()),
  searchAssets: (query: string) => dispatch(searchAssetsAction(query)),
  resetSearchAssetsResult: () => dispatch(resetSearchAssetsResultAction()),
  addAsset: (asset: Asset) => dispatch(addAssetAction(asset)),
  removeAsset: (asset: Asset) => dispatch(removeAssetAction(asset)),
  logScreenView: (view: string, screen: string) => dispatch(logScreenViewAction(view, screen)),
  fetchAllCollectiblesData: () => dispatch(fetchAllCollectiblesDataAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(AssetsScreen);
