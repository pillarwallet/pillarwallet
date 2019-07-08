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
import { Share } from 'react-native';
import isEqual from 'lodash.isequal';
import type { NavigationScreenProp } from 'react-navigation';
import { createStructuredSelector } from 'reselect';
import AssetView from 'screens/Asset/AssetView';

// actions
import { fetchAssetsBalancesAction } from 'actions/assetsActions';
import { fetchTransactionsHistoryAction } from 'actions/historyActions';
import { deploySmartWalletAction } from 'actions/smartWalletActions';
import { logScreenViewAction } from 'actions/analyticsActions';

// models
import type { Transaction } from 'models/Transaction';
import type { Assets, Balances } from 'models/Asset';
import type { SmartWalletStatus } from 'models/SmartWalletStatus';
import type { Accounts } from 'models/Account';

// constants
import { EXCHANGE, SEND_TOKEN_FROM_ASSET_FLOW } from 'constants/navigationConstants';
import { defaultFiatCurrency } from 'constants/assetsConstants';
import { SMART_WALLET_UPGRADE_STATUSES } from 'constants/smartWalletConstants';
import { MAIN_NETWORK, PILLAR_NETWORK } from 'constants/tabsConstants';
import { TRANSACTION_EVENT } from 'constants/historyConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

// utils
import { formatMoney, getCurrencySymbol } from 'utils/common';
import { getBalance, getRate } from 'utils/assets';
import { getSmartWalletStatus } from 'utils/smartWallet';
import { mapTransactionsHistory } from 'utils/feedData';
import { getActiveAccountType } from 'utils/accounts';

// configs
import assetsConfig from 'configs/assetsConfig';

// selectors
import { accountBalancesSelector } from 'selectors/balances';
import { accountHistorySelector } from 'selectors/history';
import { paymentNetworkAccountBalancesSelector } from 'selectors/paymentNetwork';

const RECEIVE = 'RECEIVE';

const activeModalResetState = {
  type: null,
  opts: {
    address: '',
    token: '',
    tokenName: '',
  },
};

type Props = {
  fetchAssetsBalances: (assets: Assets) => Function,
  fetchTransactionsHistory: (asset: string, indexFrom?: number) => Function,
  history: Transaction[],
  assets: Assets,
  balances: Balances,
  rates: Object,
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: ?string,
  contacts: Object[],
  resetHideRemoval: Function,
  smartWalletState: Object,
  accounts: Accounts,
  paymentNetworkBalances: Balances,
  smartWalletFeatureEnabled: boolean,
  history: Array<*>,
  deploySmartWallet: Function,
  logScreenView: (contentName: string, contentType: string, contentId: string) => void,
};

type State = {
  activeModal: {
    type: string | null,
    opts: {
      address?: string,
      token?: string,
      tokenName?: string,
      formValues?: Object,
    },
  },
  showDescriptionModal: boolean,
  activeTab: string,
};

class AssetScreen extends React.Component<Props, State> {
  state = {
    activeModal: activeModalResetState,
    showDescriptionModal: false,
    activeTab: MAIN_NETWORK,
  };

  componentDidMount() {
    const { fetchTransactionsHistory, navigation, logScreenView } = this.props;
    const { assetData: { token }, resetHideRemoval } = navigation.state.params;
    fetchTransactionsHistory(token);

    logScreenView('View asset', 'Asset', `asset-${token}`);

    resetHideRemoval();
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    const isFocused = this.props.navigation.isFocused();
    if (!isFocused) {
      return false;
    }
    const isEq = isEqual(this.props, nextProps) && isEqual(this.state, nextState);
    return !isEq;
  }

  handleCardTap = () => {
    this.props.navigation.goBack();
  };

  handleOpenShareDialog = (address: string) => {
    Share.share({ title: 'Public address', message: address });
  };

  goToSendTokenFlow = (assetData: Object) => {
    this.props.navigation.navigate(SEND_TOKEN_FROM_ASSET_FLOW, { assetData });
  };

  goToExchangeFlow = (fromAssetCode: string) => {
    this.props.navigation.navigate(EXCHANGE, { fromAssetCode });
  };

  openReceiveTokenModal = assetData => {
    this.setState({
      activeModal: {
        type: RECEIVE,
        opts: { address: assetData.address },
      },
    });
  };

  setActiveTab = (activeTab) => {
    this.setState({ activeTab });
  };

  render() {
    const {
      assets,
      rates,
      balances,
      paymentNetworkBalances,
      fetchAssetsBalances,
      fetchTransactionsHistory,
      baseFiatCurrency,
      navigation,
      smartWalletState,
      accounts,
      history,
      contacts,
      smartWalletFeatureEnabled,
      deploySmartWallet,
    } = this.props;

    const { showDescriptionModal, activeTab } = this.state;
    const { assetData } = navigation.state.params;
    const { token } = assetData;
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const tokenRate = getRate(rates, token, fiatCurrency);
    const balance = getBalance(balances, token);
    const isWalletEmpty = balance <= 0;
    const totalInFiat = isWalletEmpty ? 0 : (balance * tokenRate);
    const formattedBalanceInFiat = formatMoney(totalInFiat);
    const paymentNetworkBalance = getBalance(paymentNetworkBalances, token);
    const paymentNetworkBalanceFormatted = formatMoney(paymentNetworkBalance, 4);
    const paymentNetworkBalanceInFiat = paymentNetworkBalance * tokenRate;
    const formattedPaymentNetworkBalanceInFiat = formatMoney(paymentNetworkBalanceInFiat);
    const displayAmount = formatMoney(balance, 4);
    const currencySymbol = getCurrencySymbol(fiatCurrency);

    const {
      listed: isListed = true,
      send: isAssetConfigSendActive = true,
      receive: isReceiveActive = true,
      disclaimer,
    } = assetsConfig[assetData.token] || {};

    const activeAccountType = getActiveAccountType(accounts);
    const smartWalletStatus: SmartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);
    const sendingBlockedMessage = smartWalletStatus.sendingBlockedMessage || {};
    const isSendActive = isAssetConfigSendActive && !Object.keys(sendingBlockedMessage).length;
    const isSmartWallet = smartWalletFeatureEnabled && activeAccountType === ACCOUNT_TYPES.SMART_WALLET;

    const tokenTxHistory = history.filter(({ tranType }) => tranType !== 'collectible');
    const mainNetworkTransactions = mapTransactionsHistory(tokenTxHistory, contacts, TRANSACTION_EVENT);
    const tokenTransactionsOnMainNetwork = mainNetworkTransactions.filter(({ asset }) => asset === assetData.token);

    const transactionsTabs = [
      {
        id: MAIN_NETWORK,
        name: 'Main network',
        onPress: () => this.setActiveTab(MAIN_NETWORK),
        data: tokenTransactionsOnMainNetwork,
        emptyState: {
          title: 'Make your first step',
          body: isSmartWallet
            ? 'Your transactions on Main network will appear here.'
            : 'Your transactions will appear here.',
        },
      },
    ];

    const pillarNetworkTab = {
      id: PILLAR_NETWORK,
      name: 'Pillar network',
      onPress: () => this.setActiveTab(PILLAR_NETWORK),
      data: [],
      emptyState: {
        title: 'Make your first step',
        body: 'Your transactions on Pillar network will appear here.',
      },
    };

    if (isSmartWallet) transactionsTabs.push(pillarNetworkTab);

    return (
      <AssetView
        assetIsListed={isListed}
        navigation={navigation}
        fiatSymbol={currencySymbol}
        displayAmount={displayAmount}
        balanceInFiatFormatted={formattedBalanceInFiat}
        assetIcon={assetData.iconColor}
        assetSymbol={assetData.token}
        assetName={assetData.name}
        assetDescription={assetData.description}
        assetDisclaimer={disclaimer}
        receiveAddress={assetData.address}
        contractAddress={assetData.contractAddress}
        showDescriptionModal={showDescriptionModal}
        onDescriptionModalHide={() => this.setState({ showDescriptionModal: false })}
        onPressInfo={() => { this.setState({ showDescriptionModal: true }); }}
        onPressBack={this.handleCardTap}
        onPressReceive={() => this.openReceiveTokenModal({ ...assetData, balance })}
        onPressSend={() => this.goToSendTokenFlow(assetData)}
        onPressExchange={() => this.goToExchangeFlow(assetData.token)}
        noBalance={isWalletEmpty}
        isSendDisabled={!isSendActive}
        sendingBlockedTitle={sendingBlockedMessage.title}
        sendingBlockedMessage={sendingBlockedMessage.message}
        sendingBlockedShowButton={
          smartWalletStatus.status === SMART_WALLET_UPGRADE_STATUSES.ACCOUNT_CREATED
        }
        sendingBlockedButtonText="Deploy Smart Wallet"
        sendingBlockedButtonIsDisabled={
          smartWalletStatus.status === SMART_WALLET_UPGRADE_STATUSES.DEPLOYING
        }
        sendingBlockedOnPressButton={() => deploySmartWallet()}
        isReceiveDisabled={!isReceiveActive}
        isReceiveModalVisible={this.state.activeModal.type === RECEIVE}
        onReceiveModalHide={() => {
          this.setState({ activeModal: activeModalResetState });
        }}
        onOpenShareDialog={() => this.handleOpenShareDialog(assetData.address)}
        paymentNetworkBalanceFormatted={paymentNetworkBalanceFormatted}
        paymentNetworkBalanceInFiatFormatted={formattedPaymentNetworkBalanceInFiat}
        historyTabs={transactionsTabs}
        historyActiveTab={activeTab}
        onRefresh={() => {
          fetchAssetsBalances(assets);
          fetchTransactionsHistory(assetData.token);
        }}
      />
    );
  }
}

const mapStateToProps = ({
  contacts: { data: contacts },
  assets: { data: assets },
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
  smartWallet: smartWalletState,
  accounts: { data: accounts },
  featureFlags: {
    data: {
      SMART_WALLET_ENABLED: smartWalletFeatureEnabled,
    },
  },
}) => ({
  contacts,
  assets,
  rates,
  baseFiatCurrency,
  smartWalletState,
  accounts,
  smartWalletFeatureEnabled,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  paymentNetworkBalances: paymentNetworkAccountBalancesSelector,
  history: accountHistorySelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Function) => ({
  fetchAssetsBalances: (assets) => {
    dispatch(fetchAssetsBalancesAction(assets));
  },
  fetchTransactionsHistory: (asset, indexFrom) => {
    dispatch(fetchTransactionsHistoryAction(asset, indexFrom));
  },
  deploySmartWallet: () => dispatch(deploySmartWalletAction()),
  logScreenView: (contentName: string, contentType: string, contentId: string) => {
    dispatch(logScreenViewAction(contentName, contentType, contentId));
  },
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(AssetScreen);
