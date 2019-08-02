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

// constants
import {
  FETCH_INITIAL_FAILED,
  FETCHED,
} from 'constants/assetsConstants';
import { SMART_WALLET_UPGRADE_STATUSES } from 'constants/smartWalletConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';
import { ACCOUNTS } from 'constants/navigationConstants';

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
  smartWalletFeatureEnabled: boolean,
  blockchainNetworks: Object[],
  activeAccount: Account,
  logScreenView: (view: string, screen: string) => void,
}

type State = {
  showKeyWalletInsight: boolean,
  showSmartWalletInsight: boolean,
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
    };
  }

  componentDidMount() {
    const {
      fetchInitialAssets,
      assets,
      logScreenView,
    } = this.props;

    logScreenView('View assets list', 'Assets');

    if (!Object.keys(assets).length) {
      fetchInitialAssets();
    }
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
    } = this.props;

    const { type: walletType } = activeAccount;
    const activeBNetwork = blockchainNetworks.find((network) => network.isActive) || { id: '', title: '' };
    const { id: activeBNetworkId, title: activeBNetworkTitle } = activeBNetwork;

    switch (activeBNetworkId) {
      case BLOCKCHAIN_NETWORK_TYPES.ETHEREUM:
        return {
          label: walletType === ACCOUNT_TYPES.KEY_BASED ? 'Key wallet' : 'Smart wallet',
          action: () => navigation.navigate(ACCOUNTS),
          screenView: walletType === ACCOUNT_TYPES.KEY_BASED ? VIEWS.KEY_WALLET_VIEW : VIEWS.SMART_WALLET_VIEW,
          customHeaderProps: { background: baseColors.jellyBean, light: true },
          customHeaderButtonProps: {},
        };
      default:
        return {
          label: activeBNetworkTitle,
          action: () => navigation.navigate(ACCOUNTS),
          screenView: VIEWS.PPN_VIEW,
          customHeaderProps: {},
          customHeaderButtonProps: { isActive: true }, // TODO: pass in PPN activity status
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
    } = this.props;
    const {
      showKeyWalletInsight,
      showSmartWalletInsight,
    } = this.state;

    const keyWalletInsights = [
      {
        key: 'backup',
        title: 'Backup wallet',
        status: true,
      },
      {
        key: 'pinCode',
        title: 'Set PIN code',
        status: true,
      },
      {
        key: 'biometric',
        title: 'Enable biometric login',
        status: false,
      },
    ];

    // NOT YET RELEVANT
    // const smartWalletInsights = [
      // {
      //   key: 'install',
      //   title: 'Install wallet',
      //   status: true,
      // },
      // {
      //   key: 'recoveryAgents',
      //   title: 'Assign at least 2 recovery agents',
      //   status: false,
      // },
      // {
      //   key: 'dailyLimits',
      //   title: 'Set daily spending limits',
      //   status: false,
      // },
      // {
      //   key: 'monthlyLimits',
      //   title: 'Set monthly spending limits',
      //   status: false,
      // },
    // ];

    const smartWalletStatus: SmartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);
    const sendingBlockedMessage = smartWalletStatus.sendingBlockedMessage || {};
    const blockAssetsView = !!Object.keys(sendingBlockedMessage).length
      && smartWalletStatus.status !== SMART_WALLET_UPGRADE_STATUSES.ACCOUNT_CREATED;

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
            blockAssetsView={blockAssetsView}
            sendingBlockedMessage={sendingBlockedMessage}
            showInsight={showSmartWalletInsight}
            hideInsight={() => this.hideWalletInsight('SMART')}
            // insightList={smartWalletInsights}
            // insightsTitle="Get most of Pillar Smart wallet"
          />);
      case VIEWS.KEY_WALLET_VIEW:
        return (
          <WalletView
            showInsight={showKeyWalletInsight}
            hideInsight={() => this.hideWalletInsight('KEY')}
            insightList={keyWalletInsights}
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
              action: headerButtonAction,
              ...customHeaderButtonProps,
            },
          }],
        }}
      >
        {this.renderView(screenView)}
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  accounts: { data: accounts },
  wallet: { data: wallet },
  assets: {
    data: assets,
    assetsState,
    assetsSearchState,
    assetsSearchResults,
  },
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency, appearanceSettings: { assetsLayout } } },
  badges: { data: badges },
  smartWallet: smartWalletState,
  featureFlags: { data: { SMART_WALLET_ENABLED: smartWalletFeatureEnabled } },
  blockchainNetwork: { data: blockchainNetworks },
}) => ({
  wallet,
  accounts,
  assets,
  assetsState,
  assetsSearchState,
  assetsSearchResults,
  rates,
  baseFiatCurrency,
  assetsLayout,
  badges,
  smartWalletState,
  smartWalletFeatureEnabled,
  blockchainNetworks,
});

const structuredSelector = createStructuredSelector({
  collectibles: accountCollectiblesSelector,
  activeAccount: activeAccountSelector,
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
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(AssetsScreen);
