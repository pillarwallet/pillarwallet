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
import DeploymentView from 'components/DeploymentView';

// actions
import { fetchAssetsBalancesAction } from 'actions/assetsActions';
import { fetchAssetTransactionsAction } from 'actions/historyActions';
import { logScreenViewAction } from 'actions/analyticsActions';
import { getExchangeSupportedAssetsAction } from 'actions/exchangeActions';

// constants
import { EXCHANGE, SEND_TOKEN_FROM_ASSET_FLOW, SMART_WALLET_INTRO } from 'constants/navigationConstants';
import { defaultFiatCurrency, SYNTHETIC, NONSYNTHETIC } from 'constants/assetsConstants';
import { TRANSACTION_EVENT } from 'constants/historyConstants';
import { PAYMENT_NETWORK_TX_SETTLEMENT } from 'constants/paymentNetworkConstants';

// utils
import { checkIfSmartWalletAccount } from 'utils/accounts';
import { baseColors, spacing, fontSizes, fontStyles } from 'utils/variables';
import { formatMoney, formatFiat } from 'utils/common';
import { getBalance, getRate } from 'utils/assets';
import { getSmartWalletStatus } from 'utils/smartWallet';
import { mapTransactionsHistory } from 'utils/feedData';

// configs
import assetsConfig from 'configs/assetsConfig';

// selectors
import { activeAccountSelector } from 'selectors';
import { accountBalancesSelector } from 'selectors/balances';
import { accountHistorySelector } from 'selectors/history';
import {
  availableStakeSelector,
  paymentNetworkAccountBalancesSelector,
} from 'selectors/paymentNetwork';
import { accountAssetsSelector } from 'selectors/assets';

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
  fetchAssetsBalances: () => Function,
  fetchAssetTransactions: (asset: string, indexFrom?: number) => Function,
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
  background-color: ${baseColors.surface};
  border-top-width: 1px;
  border-bottom-width: 1px;
  border-color: ${baseColors.border};
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
  color: ${props => props.isSynthetic ? baseColors.primary : baseColors.text};
`;

const ValueInFiat = styled(BaseText)`
  ${fontStyles.small};
  text-align: center;
  color: ${baseColors.secondaryText};
`;

const Disclaimer = styled(BaseText)`
  ${fontStyles.regular};
  text-align: center;
  color: ${baseColors.negative};
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
`;

const lightningIcon = require('assets/icons/icon_lightning.png');

class AssetScreen extends React.Component<Props, State> {
  forceRender = false;
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
    } = this.props;
    const { assetData: { token }, resetHideRemoval } = navigation.state.params;
    fetchAssetTransactions(token);
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
    const tokenTransactions = mappedTransactions.filter(({ asset, tag = '', extra = [] }) =>
      asset === token || (tag === PAYMENT_NETWORK_TX_SETTLEMENT && extra.find(({ symbol }) => symbol === token)));
    const mainnetTransactions = tokenTransactions.filter(({ isPPNTransaction = false, tag = '' }) => {
      return !isPPNTransaction || tag === PAYMENT_NETWORK_TX_SETTLEMENT;
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
        }}
        backgroundColor={baseColors.card}
        inset={{ bottom: 0 }}
      >
        <ScrollWrapper
          onScrollEndDrag={this.handleScrollWrapperEndDrag}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                fetchAssetsBalances();
                fetchAssetTransactions(token);
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
            {!isSendActive &&
            <DeploymentView
              message={sendingBlockedMessage}
              buttonLabel="Deploy Smart Wallet"
              buttonAction={() => navigation.navigate(SMART_WALLET_INTRO, { deploy: true })}
            />
            }
          </AssetCardWrapper>
          {!!relatedTransactions.length &&
          <ActivityFeed
            feedTitle="Transactions"
            navigation={navigation}
            backgroundColor={baseColors.card}
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
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
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
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(AssetScreen);
