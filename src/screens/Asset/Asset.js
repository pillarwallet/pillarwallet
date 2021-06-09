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
import React, { useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { RefreshControl } from 'react-native';
import isEmpty from 'lodash.isempty';
import styled from 'styled-components/native';
import { createStructuredSelector } from 'reselect';
import t from 'translations/translate';
import { useNavigation, useNavigationParam } from 'react-navigation-hooks';

// components
import AssetButtons from 'components/AssetButtons';
import ActivityFeed from 'components/ActivityFeed';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Image from 'components/Image';
import HistoryList from 'components/HistoryList';
import { ScrollWrapper } from 'components/Layout';
import AssetPattern from 'components/AssetPattern';
import { BaseText, MediumText } from 'components/Typography';
import SWActivationCard from 'components/SWActivationCard';
import AddFundsModal from 'components/AddFundsModal';
import Modal from 'components/Modal';
import RetryGraphQueryBox from 'components/RetryGraphQueryBox';

// actions
import { fetchAssetsBalancesAction } from 'actions/assetsActions';
import { getExchangeSupportedAssetsAction } from 'actions/exchangeActions';

// constants
import { EXCHANGE, SEND_TOKEN_FROM_ASSET_FLOW } from 'constants/navigationConstants';
import { defaultFiatCurrency } from 'constants/assetsConstants';
import { PAYMENT_NETWORK_TX_SETTLEMENT, PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL } from 'constants/paymentNetworkConstants';

// utils
import { spacing, fontStyles } from 'utils/variables';
import { getColorByTheme } from 'utils/themes';
import { formatFiat } from 'utils/common';
import {
  getAssetsAsList,
  getBalance,
  getRate,
} from 'utils/assets';
import { getArchanovaWalletStatus } from 'utils/archanova';
import { isArchanovaAccountAddress } from 'utils/feedData';
import { isAaveTransactionTag } from 'utils/aave';
import {
  getHistoryEventsFromTransactions,
  getTokenTransactionsFromHistory,
} from 'utils/history';
import { isArchanovaAccount, isEtherspotAccount } from 'utils/accounts';

// configs
import assetsConfig from 'configs/assetsConfig';

// selectors
import {
  activeAccountAddressSelector,
  activeAccountSelector,
  supportedAssetsSelector,
} from 'selectors';
import { accountAssetsBalancesSelector } from 'selectors/balances';
import { accountHistorySelector } from 'selectors/history';
import { availableStakeSelector, paymentNetworkAccountBalancesSelector } from 'selectors/paymentNetwork';
import { accountAssetsSelector } from 'selectors/assets';

// models, types
import type { Assets, Asset, Rates } from 'models/Asset';
import type { ArchanovaWalletStatus } from 'models/ArchanovaWalletStatus';
import type { Account } from 'models/Account';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { CategoryBalancesPerChain, WalletAssetsBalances } from 'models/Balances';
import type { Transaction } from 'models/Transaction';


type Props = {
  fetchAssetsBalances: () => void,
  accountAssets: Assets,
  accountAssetsBalances: CategoryBalancesPerChain,
  rates: Rates,
  baseFiatCurrency: ?string,
  smartWalletState: Object,
  accounts: Account[],
  activeAccount: ?Account,
  paymentNetworkBalances: WalletAssetsBalances,
  history: Transaction[],
  availableStake: number,
  getExchangeSupportedAssets: () => void,
  exchangeSupportedAssets: Asset[],
  isFetchingUniswapTokens: boolean,
  uniswapTokensGraphQueryFailed: boolean,
  activeAccountAddress: string,
  supportedAssets: Asset[],
};

const AssetCardWrapper = styled.View`
  flex: 1;
  justify-content: flex-start;
  padding-top: 10px;
  padding-bottom: 30px;
  border-top-width: 1px;
  border-bottom-width: 1px;
  border-color: ${getColorByTheme({ lightKey: 'basic060', darkKey: 'basic080' })};
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
  color: ${({ isSynthetic, theme }) => isSynthetic ? theme.colors.basic000 : theme.colors.basic010};
`;

const ValueInFiat = styled(BaseText)`
  ${fontStyles.small};
  text-align: center;
`;

const Disclaimer = styled(BaseText)`
  ${fontStyles.regular};
  text-align: center;
  color: ${({ theme }) => theme.colors.secondaryAccent240};
  margin-top: 5px;
`;

const ValuesWrapper = styled.View`
  flex-direction: row;
`;

const SyntheticAssetIcon = styled(Image)`
  width: 12px;
  height: 24px;
  margin-right: 4px;
  margin-top: 1px;
  tint-color: ${({ theme }) => theme.colors.basic000};
`;

const lightningIcon = require('assets/icons/icon_lightning.png');

const AssetScreen = ({
  getExchangeSupportedAssets,
  exchangeSupportedAssets,
  activeAccountAddress,
  rates,
  paymentNetworkBalances,
  fetchAssetsBalances,
  baseFiatCurrency,
  smartWalletState,
  accounts,
  history,
  availableStake,
  isFetchingUniswapTokens,
  uniswapTokensGraphQueryFailed,
  accountAssetsBalances,
  activeAccount,
  accountAssets,
  supportedAssets,
}: Props) => {
  const navigation = useNavigation();

  useEffect(() => {
    if (isEmpty(exchangeSupportedAssets)) getExchangeSupportedAssets();
  }, []);

  const assetData = useNavigationParam('assetData');
  const { token, chain, isSynthetic = false } = assetData;

  const isSupportedByExchange = useMemo(
    () => exchangeSupportedAssets.some(({ symbol }) => symbol === token),
    [exchangeSupportedAssets, token],
  );

  const tokenTransactions = useMemo(
    () => getTokenTransactionsFromHistory(history, accounts, token),
    [history, accounts, token],
  );

  const transactions = useMemo(
    () => {
      if (isArchanovaAccount(activeAccount)) {
        return tokenTransactions.filter(({
          isPPNTransaction = false,
          from,
          to,
          tag,
        }) => {
          if (isSynthetic) return isPPNTransaction || tag === PAYMENT_NETWORK_TX_SETTLEMENT;

          const isBetweenArchanovaAccounts = isArchanovaAccountAddress(from, accounts)
            && isArchanovaAccountAddress(to, accounts);

          return tag !== PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL
            && (!isPPNTransaction || (isPPNTransaction && isBetweenArchanovaAccounts))
            && !isAaveTransactionTag(tag);
        });
      }

      if (isEtherspotAccount(activeAccount)) {
        return getHistoryEventsFromTransactions(
          tokenTransactions,
          activeAccountAddress,
          getAssetsAsList(accountAssets),
          supportedAssets,
        );
      }

      return [];
    },
    [
      tokenTransactions,
      accounts,
      isSynthetic,
      activeAccount,
      accountAssets,
      activeAccountAddress,
      supportedAssets,
    ],
  );

  const goToSendTokenFlow = () => navigation.navigate(SEND_TOKEN_FROM_ASSET_FLOW, { assetData });

  const goToExchangeFlowIfAvailable = () => {
    if (!isSupportedByExchange) return;
    navigation.navigate(EXCHANGE, { fromAssetCode: token });
  };

  const openAddFundsModal = () => Modal.open(() => (
    <AddFundsModal
      token={token}
      receiveAddress={activeAccountAddress}
    />
  ));

  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
  const tokenRate = getRate(rates, token, fiatCurrency);
  const walletBalances = accountAssetsBalances[chain]?.wallet ?? {};
  const balance = getBalance(walletBalances, token);
  const paymentNetworkBalance = getBalance(paymentNetworkBalances, token);
  const isWalletEmpty = !isSynthetic
    ? balance <= 0
    : (paymentNetworkBalance <= 0 && availableStake < 0);
  const totalInFiat = isWalletEmpty ? 0 : (balance * tokenRate);
  const displayAmount = !isSynthetic
    ? balance
    : paymentNetworkBalance;
  const fiatAmount = !isSynthetic ? formatFiat(totalInFiat, baseFiatCurrency) : paymentNetworkBalance * tokenRate;

  const {
    listed: isListed = true,
    send: isAssetConfigSendActive = true,
    receive: isReceiveActive = true,
    disclaimer,
  } = assetsConfig[token] || {};

  const archanovaWalletStatus: ArchanovaWalletStatus = getArchanovaWalletStatus(accounts, smartWalletState);
  const sendingBlockedMessage = archanovaWalletStatus.sendingBlockedMessage || {};
  const isSendActive = isAssetConfigSendActive && !Object.keys(sendingBlockedMessage).length;

  return (
    <ContainerWithHeader
      navigation={navigation}
      headerProps={{
        centerItems: [{ title: assetData.name }],
      }}
      inset={{ bottom: 0 }}
    >
      <ScrollWrapper
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => { fetchAssetsBalances(); }}
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
              {t('tokenValue', { value: displayAmount, token })}
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
            onPressReceive={openAddFundsModal}
            onPressSend={goToSendTokenFlow}
            onPressExchange={goToExchangeFlowIfAvailable}
            noBalance={isWalletEmpty}
            isSendDisabled={!isSendActive}
            isReceiveDisabled={!isReceiveActive}
            showButtons={isSynthetic ? ['receive'] : undefined} // eslint-disable-line i18next/no-literal-string
          />
          {!isSendActive && <SWActivationCard />}
        </AssetCardWrapper>
        {!!transactions.length && (
          <>
            {isArchanovaAccount(activeAccount) && (
              <ActivityFeed
                feedTitle={t('title.transactions')}
                navigation={navigation}
                feedData={transactions}
                isAssetView
              />
            )}
            {/* $FlowFixMe: should be fine after Archanova history mappings are discarded */}
            {isEtherspotAccount(activeAccount) && <HistoryList items={transactions} />}
          </>
        )}
      </ScrollWrapper>
      <RetryGraphQueryBox
        message={t('error.theGraphQueryFailed.isTokenSupportedByUniswap')}
        hasFailed={!isSupportedByExchange && uniswapTokensGraphQueryFailed}
        isFetching={isFetchingUniswapTokens}
        onRetry={getExchangeSupportedAssets}
      />
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
  smartWallet: smartWalletState,
  accounts: { data: accounts },
  exchange: {
    exchangeSupportedAssets,
    isFetchingUniswapTokens,
    uniswapTokensGraphQueryFailed,
  },
}: RootReducerState): $Shape<Props> => ({
  rates,
  baseFiatCurrency,
  smartWalletState,
  accounts,
  exchangeSupportedAssets,
  isFetchingUniswapTokens,
  uniswapTokensGraphQueryFailed,
});

const structuredSelector = createStructuredSelector({
  accountAssetsBalances: accountAssetsBalancesSelector,
  paymentNetworkBalances: paymentNetworkAccountBalancesSelector,
  history: accountHistorySelector,
  availableStake: availableStakeSelector,
  accountAssets: accountAssetsSelector,
  activeAccount: activeAccountSelector,
  activeAccountAddress: activeAccountAddressSelector,
  supportedAssets: supportedAssetsSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchAssetsBalances: () => dispatch(fetchAssetsBalancesAction()),
  getExchangeSupportedAssets: () => dispatch(getExchangeSupportedAssetsAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(AssetScreen);
