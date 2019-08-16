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
import { Share, RefreshControl } from 'react-native';
import isEqual from 'lodash.isequal';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';
import { createStructuredSelector } from 'reselect';

// components
import AssetButtons from 'components/AssetButtons';
import ActivityFeed from 'components/ActivityFeed';
import SlideModal from 'components/Modals/SlideModal';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ScrollWrapper } from 'components/Layout';
import AssetPattern from 'components/AssetPattern';
import { BoldText, BaseText, Paragraph } from 'components/Typography';
import { DeploymentView } from 'components/DeploymentView';

// actions
import { fetchAssetsBalancesAction } from 'actions/assetsActions';
import { fetchTransactionsHistoryAction } from 'actions/historyActions';
import { logScreenViewAction } from 'actions/analyticsActions';

// models
import type { Transaction } from 'models/Transaction';
import type { Assets, Balances } from 'models/Asset';
import type { SmartWalletStatus } from 'models/SmartWalletStatus';
import type { Accounts } from 'models/Account';

// constants
import { EXCHANGE, SEND_TOKEN_FROM_ASSET_FLOW, SMART_WALLET_INTRO } from 'constants/navigationConstants';
import { defaultFiatCurrency, SYNTHETIC, NONSYNTHETIC } from 'constants/assetsConstants';
import { SMART_WALLET_UPGRADE_STATUSES } from 'constants/smartWalletConstants';
import { TRANSACTION_EVENT } from 'constants/historyConstants';
import { PAYMENT_NETWORK_ACCOUNT_TOPUP, PAYMENT_NETWORK_TX_SETTLEMENT } from 'constants/paymentNetworkConstants';

// utils
import { baseColors, spacing, fontSizes } from 'utils/variables';
import { formatMoney, getCurrencySymbol } from 'utils/common';
import { getBalance, getRate } from 'utils/assets';
import { getSmartWalletStatus } from 'utils/smartWallet';
import { mapTransactionsHistory } from 'utils/feedData';

// configs
import assetsConfig from 'configs/assetsConfig';

// selectors
import { accountBalancesSelector } from 'selectors/balances';
import { accountHistorySelector } from 'selectors/history';
import {
  availableStakeSelector,
  paymentNetworkAccountBalancesSelector,
} from 'selectors/paymentNetwork';

// local components
import ReceiveModal from './ReceiveModal';


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
  resetHideRemoval?: Function,
  smartWalletState: Object,
  accounts: Accounts,
  paymentNetworkBalances: Balances,
  smartWalletFeatureEnabled: boolean,
  history: Array<*>,
  logScreenView: (contentName: string, contentType: string, contentId: string) => void,
  availableStake: number,
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
};

const AssetCardWrapper = styled.View`
  flex: 1;
  justify-content: flex-start;
  padding-top: 10px;
  padding-bottom: 30px;
  background-color: ${baseColors.snowWhite};
  border-top-width: 1px;
  border-bottom-width: 1px;
  border-color: ${baseColors.mediumLightGray};
  margin-top: 4px;
`;

const DataWrapper = styled.View`
  margin: 0 ${spacing.large}px ${spacing.large}px;
  justify-content: center;
  align-items: center;
  padding-bottom: 8px;
`;

const TokenValue = styled(BoldText)`
  font-size: ${fontSizes.semiGiant}px;
  text-align: center;
`;

const ValueInFiat = styled(BaseText)`
  font-size: ${fontSizes.extraExtraSmall}px;
  text-align: center;
  color: ${baseColors.darkGray};
  margin-top: 5px;
`;

const Disclaimer = styled(BaseText)`
  font-size: ${fontSizes.extraSmall}px;
  text-align: center;
  color: ${baseColors.burningFire};
  margin-top: 5px;
`;

const Description = styled(Paragraph)`
  padding-bottom: 80px;
  line-height: ${fontSizes.mediumLarge};
`;

const ValuesWrapper = styled.View`
  flex-direction: row;
`;

class AssetScreen extends React.Component<Props, State> {
  state = {
    activeModal: activeModalResetState,
    showDescriptionModal: false,
  };

  componentDidMount() {
    const { fetchTransactionsHistory, navigation, logScreenView } = this.props;
    const { assetData: { token }, resetHideRemoval } = navigation.state.params;
    fetchTransactionsHistory(token);
    if (resetHideRemoval) resetHideRemoval();
    logScreenView('View asset', 'Asset', `asset-${token}`);
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    const isFocused = this.props.navigation.isFocused();
    if (!isFocused) {
      return false;
    }
    const isEq = isEqual(this.props, nextProps) && isEqual(this.state, nextState);
    return !isEq;
  }

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

  handleScrollWrapperEndDrag = e => {
    const { fetchTransactionsHistory, history } = this.props;
    const {
      assetData: { token },
    } = this.props.navigation.state.params;
    const layoutHeight = e.nativeEvent.layoutMeasurement.height;
    const contentHeight = e.nativeEvent.contentSize.height;
    const offsetY = e.nativeEvent.contentOffset.y;
    const indexFrom = history.filter(({ asset }) => asset === token).length;

    if (layoutHeight + offsetY + 200 >= contentHeight) {
      fetchTransactionsHistory(token, indexFrom);
    }
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
      availableStake,
    } = this.props;
    const { showDescriptionModal } = this.state;
    const { assetData } = this.props.navigation.state.params;
    const { token, isSynthetic = false } = assetData;
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const tokenRate = getRate(rates, token, fiatCurrency);
    const balance = getBalance(balances, token);
    const paymentNetworkBalance = getBalance(paymentNetworkBalances, token);
    const isWalletEmpty = !isSynthetic
      ? balance <= 0
      : (paymentNetworkBalance <= 0 && availableStake < 0);
    const totalInFiat = isWalletEmpty ? 0 : (balance * tokenRate);
    const displayAmount = !isSynthetic ? formatMoney(balance, 4) : formatMoney(paymentNetworkBalance, 4);
    const fiatAmount = !isSynthetic ? formatMoney(totalInFiat) : paymentNetworkBalance * tokenRate;
    const currencySymbol = getCurrencySymbol(fiatCurrency);

    const {
      listed: isListed = true,
      send: isAssetConfigSendActive = true,
      receive: isReceiveActive = true,
      disclaimer,
    } = assetsConfig[token] || {};

    const smartWalletStatus: SmartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);
    const sendingBlockedMessage = smartWalletStatus.sendingBlockedMessage || {};
    const isSendActive = isAssetConfigSendActive && !Object.keys(sendingBlockedMessage).length;

    const tokenTxHistory = history.filter(({ tranType }) => tranType !== 'collectible');
    const mappedTransactions = mapTransactionsHistory(tokenTxHistory, contacts, TRANSACTION_EVENT);
    const tokenTransactions = mappedTransactions.filter(({ asset, note = '', extra = [] }) =>
      asset === token || (note === PAYMENT_NETWORK_TX_SETTLEMENT && extra.find(({ symbol }) => symbol === token)));
    const mainnetTransactions = tokenTransactions.filter(({ isPPNTransaction = false, note = '' }) => {
      return (!isPPNTransaction && note !== PAYMENT_NETWORK_ACCOUNT_TOPUP) || note === PAYMENT_NETWORK_TX_SETTLEMENT;
    });
    const ppnTransactions = tokenTransactions.filter(({ isPPNTransaction = false, note = '' }) => {
      return isPPNTransaction || note === PAYMENT_NETWORK_TX_SETTLEMENT;
    });
    const relatedTransactions = isSynthetic ? ppnTransactions : mainnetTransactions;
    const { upgrade: { deploymentStarted } } = smartWalletState;

    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [{ title: assetData.name }],
          rightItems: [
            {
              icon: 'info-circle-inverse',
              onPress: () => { this.setState({ showDescriptionModal: true }); },
            },
          ],
          rightIconsSize: fontSizes.extraLarge,
        }}
        backgroundColor={baseColors.white}
        inset={{ bottom: 0 }}
      >
        <ScrollWrapper
          onScrollEndDrag={this.handleScrollWrapperEndDrag}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                fetchAssetsBalances(assets);
                fetchTransactionsHistory(token);
              }}
            />
          }
        >
          <AssetPattern
            token={assetData.token}
            icon={assetData.patternIcon}
            contractAddress={assetData.contractAddress}
            isListed={isListed}
          />
          <DataWrapper>
            <TokenValue>
              {`${displayAmount} ${token}`}
            </TokenValue>
            {!!isListed &&
              <ValuesWrapper>
                <ValueInFiat>
                  {`${currencySymbol}${fiatAmount}`}
                </ValueInFiat>
              </ValuesWrapper>
            }
            {!isListed &&
            <Disclaimer>
              {disclaimer}
            </Disclaimer>
            }
          </DataWrapper>
          <AssetCardWrapper>
            <AssetButtons
              onPressReceive={() => this.openReceiveTokenModal({ ...assetData, balance })}
              onPressSend={() => this.goToSendTokenFlow(assetData)}
              onPressExchange={!isSynthetic ? () => this.goToExchangeFlow(token) : null}
              noBalance={isWalletEmpty}
              isSendDisabled={!isSendActive}
              isReceiveDisabled={!isReceiveActive}
            />
            {!isSendActive &&
            <DeploymentView
              message={sendingBlockedMessage}
              buttonLabel="Deploy Smart Wallet"
              buttonAction={() => navigation.navigate(SMART_WALLET_INTRO, { deploy: true })}
              isDeploying={deploymentStarted || smartWalletStatus.status === SMART_WALLET_UPGRADE_STATUSES.DEPLOYING}
            />
            }
          </AssetCardWrapper>
          {!!relatedTransactions.length &&
          <ActivityFeed
            feedTitle="transactions."
            navigation={navigation}
            backgroundColor={baseColors.white}
            showArrowsOnly
            noBorder
            feedData={relatedTransactions}
            feedType={isSynthetic ? SYNTHETIC : NONSYNTHETIC}
            asset={token}
          />}
        </ScrollWrapper>

        <ReceiveModal
          isVisible={this.state.activeModal.type === RECEIVE}
          onModalHide={() => {
            this.setState({ activeModal: activeModalResetState });
          }}
          address={assetData.address}
          token={assetData.token}
          tokenName={assetData.name}
          handleOpenShareDialog={this.handleOpenShareDialog}
        />
        <SlideModal
          title={assetData.name}
          isVisible={showDescriptionModal}
          onModalHide={() => { this.setState({ showDescriptionModal: false }); }}
        >
          <Description small light>{assetData.description}</Description>
        </SlideModal>
      </ContainerWithHeader>
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
  availableStake: availableStakeSelector,
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
  logScreenView: (contentName: string, contentType: string, contentId: string) => {
    dispatch(logScreenViewAction(contentName, contentType, contentId));
  },
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(AssetScreen);
