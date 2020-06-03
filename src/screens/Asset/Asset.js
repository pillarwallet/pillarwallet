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
import { RefreshControl } from 'react-native';
import isEqual from 'lodash.isequal';
import isEmpty from 'lodash.isempty';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';
import { createStructuredSelector } from 'reselect';
import { CachedImage } from 'react-native-cached-image';

// components
import AssetButtons from 'components/AssetButtons';
import ActivityFeed from 'components/ActivityFeed';
import SlideModal from 'components/Modals/SlideModal';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ScrollWrapper } from 'components/Layout';
import AssetPattern from 'components/AssetPattern';
import { BaseText, Paragraph, MediumText } from 'components/Typography';
import SWActivationCard from 'components/SWActivationCard';
import Button from 'components/Button';
import BTCView from 'screens/Assets/BTCView';

// actions
import { fetchAssetsBalancesAction } from 'actions/assetsActions';
import { fetchAssetTransactionsAction } from 'actions/historyActions';
import { logScreenViewAction } from 'actions/analyticsActions';
import { getExchangeSupportedAssetsAction } from 'actions/exchangeActions';
import { fetchReferralRewardsIssuerAddressesAction } from 'actions/referralsActions';

// constants
import { EXCHANGE, SEND_TOKEN_FROM_ASSET_FLOW } from 'constants/navigationConstants';
import { defaultFiatCurrency, BTC } from 'constants/assetsConstants';
import { TRANSACTION_EVENT } from 'constants/historyConstants';
import {
  PAYMENT_NETWORK_TX_SETTLEMENT,
  PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL,
  PAYMENT_NETWORK_ACCOUNT_DEPLOYMENT,
} from 'constants/paymentNetworkConstants';

// utils
import { checkIfSmartWalletAccount } from 'utils/accounts';
import { spacing, fontSizes, fontStyles } from 'utils/variables';
import { themedColors } from 'utils/themes';
import { formatMoney, formatFiat } from 'utils/common';
import { getBalance, getRate } from 'utils/assets';
import { getSmartWalletStatus } from 'utils/smartWallet';
import { isSWAddress, mapTransactionsHistory } from 'utils/feedData';

// configs
import assetsConfig from 'configs/assetsConfig';

// selectors
import { activeAccountSelector } from 'selectors';
import { accountBalancesSelector } from 'selectors/balances';
import { accountHistorySelector } from 'selectors/history';
import { availableStakeSelector, paymentNetworkAccountBalancesSelector } from 'selectors/paymentNetwork';
import { accountAssetsSelector } from 'selectors/assets';
import { isActiveAccountSmartWalletSelector } from 'selectors/smartWallet';

// models, types
import type { Assets, Balances, Asset } from 'models/Asset';
import type { SmartWalletStatus } from 'models/SmartWalletStatus';
import type { Account, Accounts } from 'models/Account';
import type { ContactSmartAddressData } from 'models/Contacts';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';

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
  fetchAssetsBalances: () => void,
  fetchAssetTransactions: (asset: string, indexFrom?: number) => void,
  assets: Assets,
  balances: Balances,
  rates: Object,
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: ?string,
  contacts: Object[],
  resetHideRemoval?: Function,
  smartWalletState: Object,
  accounts: Accounts,
  activeAccount: ?Account,
  paymentNetworkBalances: Balances,
  smartWalletFeatureEnabled: boolean,
  history: Object[],
  logScreenView: (contentName: string, contentType: string, contentId: string) => void,
  availableStake: number,
  contactsSmartAddresses: ContactSmartAddressData[],
  getExchangeSupportedAssets: () => void,
  exchangeSupportedAssets: Asset[],
  fetchReferralRewardsIssuerAddresses: () => void,
  isActiveAccountSmartWallet: boolean,
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
  border-top-width: 1px;
  border-bottom-width: 1px;
  border-color: ${themedColors.border};
  margin-top: 4px;
`;

const DataWrapper = styled.View`
  margin: 0 ${spacing.large}px ${spacing.large}px;
  justify-content: center;
  align-items: center;
  padding-bottom: 8px;
`;

const ValueWrapper = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

const TokenValue = styled(MediumText)`
  ${fontStyles.giant};
  text-align: center;
  color: ${({ isSynthetic, theme }) => isSynthetic ? theme.colors.primary : theme.colors.text};
`;

const ValueInFiat = styled(BaseText)`
  ${fontStyles.small};
  text-align: center;
  color: ${themedColors.text};
`;

const Disclaimer = styled(BaseText)`
  ${fontStyles.regular};
  text-align: center;
  color: ${themedColors.negative};
  margin-top: 5px;
`;

const Description = styled(Paragraph)`
  padding-bottom: 80px;
`;

const ValuesWrapper = styled.View`
  flex-direction: row;
`;

const SyntheticAssetIcon = styled(CachedImage)`
  width: 12px;
  height: 24px;
  margin-right: 4px;
  margin-top: 1px;
  tint-color: ${themedColors.primary};
`;

const TransferButtonWrapper = styled.View`
  padding: 35px ${spacing.large}px 0;
`;

const lightningIcon = require('assets/icons/icon_lightning.png');

class AssetScreen extends React.Component<Props, State> {
  forceRender = false;
  isNavigatingToExchangeFlow = false;

  state = {
    activeModal: activeModalResetState,
    showDescriptionModal: false,
  };

  componentDidMount() {
    const {
      fetchAssetTransactions,
      navigation,
      logScreenView,
      getExchangeSupportedAssets,
      exchangeSupportedAssets,
      fetchReferralRewardsIssuerAddresses,
    } = this.props;
    const { assetData: { token }, resetHideRemoval } = navigation.state.params;
    fetchAssetTransactions(token);
    fetchReferralRewardsIssuerAddresses();
    if (resetHideRemoval) resetHideRemoval();
    if (isEmpty(exchangeSupportedAssets)) getExchangeSupportedAssets();
    logScreenView('View asset', 'Asset', `asset-${token}`);
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

  goToSendTokenFlow = (assetData: Object) => {
    this.props.navigation.navigate(SEND_TOKEN_FROM_ASSET_FLOW, { assetData });
  };

  goToExchangeFlow = (fromAssetCode: string, toAssetCode?: string) => {
    this.props.navigation.navigate(EXCHANGE, { fromAssetCode, toAssetCode });
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
    const { fetchAssetTransactions, history, activeAccount } = this.props;
    if (!activeAccount || checkIfSmartWalletAccount(activeAccount)) return;

    const { assetData: { token } } = this.props.navigation.state.params;
    const layoutHeight = e.nativeEvent.layoutMeasurement.height;
    const contentHeight = e.nativeEvent.contentSize.height;
    const offsetY = e.nativeEvent.contentOffset.y;
    const indexFrom = history.filter(({ asset }) => asset === token).length;

    if (layoutHeight + offsetY + 200 >= contentHeight) {
      fetchAssetTransactions(token, indexFrom);
    }
  };

  handleBuyTokens = () => {
    // wait for the modal to be completely hidden and then navigate to exchange
    // navigating while the modal is hiding leads to keyboard flickering etc.
    this.isNavigatingToExchangeFlow = true;
    this.setState({ activeModal: activeModalResetState });
  };

  handleModalHidden = () => {
    if (this.isNavigatingToExchangeFlow) {
      this.isNavigatingToExchangeFlow = false;
      const fiatCurrency = this.props.baseFiatCurrency || defaultFiatCurrency;
      const { assetData: { token } } = this.props.navigation.state.params;
      this.goToExchangeFlow(fiatCurrency, token);
    }
  }

  render() {
    const {
      rates,
      balances,
      paymentNetworkBalances,
      fetchAssetsBalances,
      fetchAssetTransactions,
      baseFiatCurrency,
      navigation,
      smartWalletState,
      accounts,
      history,
      contacts,
      availableStake,
      contactsSmartAddresses,
      exchangeSupportedAssets,
      fetchReferralRewardsIssuerAddresses,
      isActiveAccountSmartWallet,
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
    const fiatAmount = !isSynthetic ? formatFiat(totalInFiat, baseFiatCurrency) : paymentNetworkBalance * tokenRate;

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
    const mappedTransactions = mapTransactionsHistory(
      tokenTxHistory,
      contacts,
      contactsSmartAddresses,
      accounts,
      TRANSACTION_EVENT,
    );
    const tokenTransactions = mappedTransactions
      .filter(({ asset, tag = '', extra = [] }) => (asset === token && tag !== PAYMENT_NETWORK_ACCOUNT_DEPLOYMENT)
        || (tag === PAYMENT_NETWORK_TX_SETTLEMENT && extra.find(({ symbol }) => symbol === token)));

    const mainnetTransactions = tokenTransactions
      .filter(({
        isPPNTransaction = false,
        from,
        to,
        tag,
      }) => {
        return tag !== PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL
        && (!isPPNTransaction || (isPPNTransaction && (isSWAddress(from, accounts) && isSWAddress(to, accounts))));
      });

    const ppnTransactions = tokenTransactions.filter(({ isPPNTransaction = false, tag = '' }) => {
      return isPPNTransaction || tag === PAYMENT_NETWORK_TX_SETTLEMENT;
    });
    const relatedTransactions = isSynthetic ? ppnTransactions : mainnetTransactions;
    const isSupportedByExchange = exchangeSupportedAssets.some(({ symbol }) => symbol === token);

    return (
      <ContainerWithHeader
        navigation={navigation}
        headerProps={{
          centerItems: [{ title: assetData.name }],
          rightItems: [
            {
              icon: 'info-circle-inverse',
              onPress: () => { this.setState({ showDescriptionModal: true }); },
            },
          ],
          rightIconsSize: fontSizes.large,
          customOnBack: navigation.state.params.onBackPress,
        }}
        inset={{ bottom: 0 }}
      >
        {token !== BTC &&
        <ScrollWrapper
          onScrollEndDrag={this.handleScrollWrapperEndDrag}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                fetchAssetsBalances();
                fetchAssetTransactions(token);
                fetchReferralRewardsIssuerAddresses();
              }}
            />
          }
        >
          <AssetPattern
            token={assetData.token}
            icon={assetData.patternIcon}
            isListed={isListed}
          />
          <DataWrapper>
            <ValueWrapper>
              {!!isSynthetic &&
              <SyntheticAssetIcon source={lightningIcon} />
              }
              <TokenValue isSynthetic={isSynthetic}>
                {`${displayAmount} ${token}`}
              </TokenValue>
            </ValueWrapper>
            {!!isListed &&
            <ValuesWrapper>
              <ValueInFiat>
                {fiatAmount}
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
              onPressExchange={isSupportedByExchange ? () => this.goToExchangeFlow(token) : null}
              noBalance={isWalletEmpty}
              isSendDisabled={!isSendActive}
              isReceiveDisabled={!isReceiveActive}
              showButtons={isSynthetic ? ['receive'] : undefined}
            />
            {!isActiveAccountSmartWallet &&
              <TransferButtonWrapper>
                <Button
                  title="Transfer to Smart Wallet"
                  onPress={() => this.goToSendTokenFlow(assetData)}
                  disabled={!isSendActive || isWalletEmpty}
                  secondary
                  regularText
            />
              </TransferButtonWrapper>
            }
            {!isSendActive && <SWActivationCard />}
          </AssetCardWrapper>
          {!!relatedTransactions.length &&
          <ActivityFeed
            feedTitle="Transactions"
            navigation={navigation}
            noBorder
            feedData={relatedTransactions}
            isAssetView
          />}
        </ScrollWrapper>
        }
        {token === BTC &&
          <BTCView />
        }
        <ReceiveModal
          isVisible={this.state.activeModal.type === RECEIVE}
          onModalHide={() => {
            this.setState({ activeModal: activeModalResetState });
          }}
          address={assetData.address}
          token={assetData.token}
          tokenName={assetData.name}
          showBuyTokensButton
          handleBuyTokens={this.handleBuyTokens}
          onModalHidden={this.handleModalHidden}
          showErc20Note
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
  contacts: { data: contacts, contactsSmartAddresses: { addresses: contactsSmartAddresses } },
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
  smartWallet: smartWalletState,
  accounts: { data: accounts },
  featureFlags: {
    data: {
      SMART_WALLET_ENABLED: smartWalletFeatureEnabled,
    },
  },
  exchange: { exchangeSupportedAssets },
}: RootReducerState): $Shape<Props> => ({
  contacts,
  rates,
  baseFiatCurrency,
  smartWalletState,
  accounts,
  smartWalletFeatureEnabled,
  contactsSmartAddresses,
  exchangeSupportedAssets,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  paymentNetworkBalances: paymentNetworkAccountBalancesSelector,
  history: accountHistorySelector,
  availableStake: availableStakeSelector,
  assets: accountAssetsSelector,
  activeAccount: activeAccountSelector,
  isActiveAccountSmartWallet: isActiveAccountSmartWalletSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchAssetsBalances: () => {
    dispatch(fetchAssetsBalancesAction());
  },
  fetchAssetTransactions: (asset, indexFrom) => {
    dispatch(fetchAssetTransactionsAction(asset, indexFrom));
  },
  logScreenView: (contentName: string, contentType: string, contentId: string) => {
    dispatch(logScreenViewAction(contentName, contentType, contentId));
  },
  getExchangeSupportedAssets: () => dispatch(getExchangeSupportedAssetsAction()),
  fetchReferralRewardsIssuerAddresses: () => dispatch(fetchReferralRewardsIssuerAddressesAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(AssetScreen);
