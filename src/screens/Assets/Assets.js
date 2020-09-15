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
import { availableStakeSelector, PPNIncomingTransactionsSelector } from 'selectors/paymentNetwork';
import { withTheme } from 'styled-components/native';
import t from 'translations/translate';

// components
import { BaseText } from 'components/Typography';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Spinner from 'components/Spinner';
import Button from 'components/Button';
import { Container } from 'components/Layout';

// types
import type { Assets } from 'models/Asset';
import type { Collectible } from 'models/Collectible';
import type { Badges } from 'models/Badge';
import type { SmartWalletStatus } from 'models/SmartWalletStatus';
import type { Accounts, Account } from 'models/Account';
import type { Transaction } from 'models/Transaction';
import type { Theme } from 'models/Theme';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';

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
import { ACCOUNTS, RECOVERY_SETTINGS, WALLET_SETTINGS } from 'constants/navigationConstants';

// utils
import { getAccountName } from 'utils/accounts';
import { getSmartWalletStatus, isDeployingSmartWallet, getDeploymentHash } from 'utils/smartWallet';
import { getThemeColors } from 'utils/themes';
import { getSupportedBiometryType } from 'utils/keychain';

// selectors
import { accountCollectiblesSelector } from 'selectors/collectibles';
import { accountAssetsSelector } from 'selectors/assets';
import { activeAccountSelector } from 'selectors';

// local components
import PPNView from 'screens/Assets/PPNView';
import WalletView from 'screens/Assets/WalletView';
import WalletActivation from 'screens/Assets/WalletActivation';

type Props = {
  fetchInitialAssets: () => void,
  assets: Assets,
  collectibles: Collectible[],
  assetsState: ?string,
  navigation: NavigationScreenProp<*>,
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
  theme: Theme,
};

type State = {
  showKeyWalletInsight: boolean,
  showSmartWalletInsight: boolean,
  supportsBiometrics: boolean,
};

const VIEWS = {
  KEY_WALLET_VIEW: 'KEY_WALLET_VIEW',
  SMART_WALLET_VIEW: 'SMART_WALLET_VIEW',
  PPN_VIEW: 'PPN_VIEW',
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

    getSupportedBiometryType(biometryType => this.setState({ supportsBiometrics: !!biometryType }));
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
      theme,
    } = this.props;
    const colors = getThemeColors(theme);

    const { type: walletType } = activeAccount || {};
    const activeBNetwork = blockchainNetworks.find((network) => network.isActive) || { id: '', translationKey: '' };
    const { id: activeBNetworkId, translationKey } = activeBNetwork;
    const activeBNetworkTitle = t(translationKey);

    switch (activeBNetworkId) {
      case BLOCKCHAIN_NETWORK_TYPES.ETHEREUM:
        return {
          label: getAccountName(walletType),
          action: () => navigation.navigate(ACCOUNTS),
          screenView: walletType === ACCOUNT_TYPES.KEY_BASED ? VIEWS.KEY_WALLET_VIEW : VIEWS.SMART_WALLET_VIEW,
          customHeaderButtonProps: {
            backgroundColor: walletType === ACCOUNT_TYPES.KEY_BASED ? colors.legacyWallet : colors.smartWallet,
          },
        };

      default:
        const hasUnsettledTx = PPNTransactions.some(({ stateInPPN }) => stateInPPN === PAYMENT_COMPLETED);
        return {
          label: activeBNetworkTitle,
          action: () => navigation.navigate(ACCOUNTS),
          screenView: VIEWS.PPN_VIEW,
          customHeaderButtonProps: { isActive: availableStake > 0 || hasUnsettledTx },
        };
    }
  };

  getInsightsList = () => {
    const {
      backupStatus,
      navigation,
      useBiometrics,
    } = this.props;
    const { supportsBiometrics } = this.state;

    const isBackedUp = backupStatus.isImported || backupStatus.isBackedUp;

    const keyWalletInsights = [
      {
        key: 'backup',
        title: t('insight.keyWalletIntro.description.backupWallet'),
        status: isBackedUp,
        onPress: !isBackedUp
          ? () => navigation.navigate(RECOVERY_SETTINGS)
          : null,
      },
      {
        key: 'pinCode',
        title: t('insight.keyWalletIntro.description.setPinCode'),
        status: true,
      },
    ];

    if (supportsBiometrics) {
      const biometricsInsight = {
        key: 'biometric',
        title: t('insight.keyWalletIntro.description.enableBiometrics'),
        status: useBiometrics,
        onPress: !useBiometrics
          ? () => navigation.navigate(WALLET_SETTINGS)
          : null,
      };
      return [...keyWalletInsights, biometricsInsight];
    }

    return keyWalletInsights;
  };

  renderView = (viewType: string, onScroll: Object => void) => {
    const {
      assets,
      assetsState,
      fetchInitialAssets,
      accounts,
      smartWalletState,
    } = this.props;
    const { showKeyWalletInsight, showSmartWalletInsight } = this.state;

    const smartWalletStatus: SmartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);

    const isDeploying = isDeployingSmartWallet(smartWalletState, accounts);

    if (!Object.keys(assets).length && assetsState === FETCHED) {
      return (
        <Container center inset={{ bottom: 0 }}>
          <BaseText style={{ marginBottom: 20 }}>{t('label.loadingDefaultAssets')}</BaseText>
          {assetsState !== FETCH_INITIAL_FAILED && (
            <Spinner />
          )}
          {assetsState === FETCH_INITIAL_FAILED && (
            <Button title={t('button.tryAgain')} onPress={() => fetchInitialAssets()} />
          )}
        </Container>
      );
    }

    if (isDeploying && viewType === VIEWS.SMART_WALLET_VIEW) {
      const deploymentHash = getDeploymentHash(smartWalletState);

      if (deploymentHash) {
        return (
          <WalletActivation deploymentHash={deploymentHash} />
        );
      }
    }

    switch (viewType) {
      case VIEWS.PPN_VIEW:
        return <PPNView onScroll={onScroll} />;
      case VIEWS.SMART_WALLET_VIEW:
        return (
          <WalletView
            showInsight={showSmartWalletInsight}
            hideInsight={() => this.hideWalletInsight('SMART')}
            showDeploySmartWallet={smartWalletStatus.status === SMART_WALLET_UPGRADE_STATUSES.ACCOUNT_CREATED}
            onScroll={onScroll}
          />);
      case VIEWS.KEY_WALLET_VIEW:
        return (
          <WalletView
            showInsight={showKeyWalletInsight}
            hideInsight={() => this.hideWalletInsight('KEY')}
            insightList={this.getInsightsList()}
            insightsTitle={t('insight.keyWalletIntro.title')}
            onScroll={onScroll}
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
      customHeaderButtonProps,
    } = screenInfo;

    return (
      <ContainerWithHeader
        headerProps={{
          rightItems: [{
            actionButton: {
              key: 'manageAccounts',
              label: headerButtonLabel,
              hasChevron: true,
              onPress: headerButtonAction,
              ...customHeaderButtonProps,
            },
          }],
          leftItems: [{
            title: t('title.assets'),
          }],
          noBack: true,
        }}
        inset={{ bottom: 0 }}
        tab
      >
        {onScroll => this.renderView(screenView, onScroll)}
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  accounts: { data: accounts },
  wallet: { backupStatus },
  assets: { assetsState },
  appSettings: { data: { useBiometrics } },
  badges: { data: badges },
  smartWallet: smartWalletState,
  blockchainNetwork: { data: blockchainNetworks },
}: RootReducerState): $Shape<Props> => ({
  backupStatus,
  accounts,
  assetsState,
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
  PPNTransactions: PPNIncomingTransactionsSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchInitialAssets: () => dispatch(fetchInitialAssetsAction()),
  logScreenView: (view: string, screen: string) => dispatch(logScreenViewAction(view, screen)),
  fetchAllCollectiblesData: () => dispatch(fetchAllCollectiblesDataAction()),
});

export default withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(AssetsScreen));
