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
import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import { createStructuredSelector } from 'reselect';
import t from 'translations/translate';
import { useNavigation, useNavigationParam } from 'react-navigation-hooks';

// components
import AssetButtons from 'components/AssetButtons';
import ActivityFeed from 'components/ActivityFeed';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import HistoryList from 'components/HistoryList';
import { ScrollWrapper } from 'components/Layout';
import AssetPattern from 'components/AssetPattern';
import { BaseText, MediumText } from 'components/Typography';
import RefreshControl from 'components/RefreshControl';
import SWActivationCard from 'components/SWActivationCard';
import AddFundsModal from 'components/AddFundsModal';
import Modal from 'components/Modal';

// actions
import { fetchAssetsBalancesAction } from 'actions/assetsActions';

// constants
import { EXCHANGE, SEND_TOKEN_FROM_ASSET_FLOW } from 'constants/navigationConstants';
import { defaultFiatCurrency } from 'constants/assetsConstants';
import { PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL } from 'constants/paymentNetworkConstants';

// utils
import { spacing, fontStyles } from 'utils/variables';
import { getColorByTheme } from 'utils/themes';
import { formatFiat } from 'utils/common';
import { getAssetsAsList, getBalance } from 'utils/assets';
import { getArchanovaWalletStatus } from 'utils/archanova';
import { isArchanovaAccountAddress } from 'utils/feedData';
import { isAaveTransactionTag } from 'utils/aave';
import {
  getHistoryEventsFromTransactions,
  getTokenTransactionsFromHistory,
} from 'utils/history';
import { isArchanovaAccount, isEtherspotAccount } from 'utils/accounts';
import { getRate } from 'utils/rates';

// configs
import assetsConfig from 'configs/assetsConfig';

// selectors
import {
  activeAccountAddressSelector,
  activeAccountSelector,
  supportedAssetsPerChainSelector,
  useChainRates,
} from 'selectors';
import { accountAssetsBalancesSelector } from 'selectors/balances';
import { accountHistorySelector } from 'selectors/history';
import { accountAssetsPerChainSelector } from 'selectors/assets';

// models, types
import type { AssetByAddress, AssetsPerChain, AssetDataNavigationParam } from 'models/Asset';
import type { ArchanovaWalletStatus } from 'models/ArchanovaWalletStatus';
import type { Account } from 'models/Account';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { AccountAssetBalances } from 'models/Balances';
import type { Transaction } from 'models/Transaction';
import type { ChainRecord } from 'models/Chain';
import type { Currency } from 'models/Rates';


type Props = {
  fetchAssetsBalances: () => void,
  accountAssetsPerChain: ChainRecord<AssetByAddress>,
  accountAssetsBalances: AccountAssetBalances,
  baseFiatCurrency: ?Currency,
  smartWalletState: Object,
  accounts: Account[],
  activeAccount: ?Account,
  accountHistory: ChainRecord<Transaction[]>,
  activeAccountAddress: string,
  supportedAssetsPerChain: AssetsPerChain,
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
  color: ${({ theme }) => theme.colors.basic010};
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

const AssetScreen = ({
  activeAccountAddress,
  fetchAssetsBalances,
  baseFiatCurrency,
  smartWalletState,
  accounts,
  accountHistory,
  accountAssetsBalances,
  activeAccount,
  accountAssetsPerChain,
  supportedAssetsPerChain,
}: Props) => {
  const navigation = useNavigation();

  const assetData: AssetDataNavigationParam = useNavigationParam('assetData');
  const { token, contractAddress, chain } = assetData;

  const chainRates = useChainRates(chain);

  const tokenTransactions = useMemo(
    () => getTokenTransactionsFromHistory(accountHistory[chain] ?? [], accounts, contractAddress),
    [accountHistory, accounts, contractAddress, chain],
  );

  const transactions = useMemo(
    () => {
      const chainSupportedAssets = supportedAssetsPerChain[chain] ?? [];
      const chainAccountAssets = accountAssetsPerChain[chain] ?? {};

      if (isArchanovaAccount(activeAccount)) {
        return tokenTransactions.filter(({
          isPPNTransaction = false,
          from,
          to,
          tag,
        }) => {
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
          chain,
          activeAccountAddress,
          getAssetsAsList(chainAccountAssets),
          chainSupportedAssets,
        );
      }

      return [];
    },
    [
      tokenTransactions,
      chain,
      accounts,
      activeAccount,
      accountAssetsPerChain,
      activeAccountAddress,
      supportedAssetsPerChain,
    ],
  );

  const goToSendTokenFlow = () => navigation.navigate(SEND_TOKEN_FROM_ASSET_FLOW, { assetData });

  const goToExchangeFlow = () => {
    navigation.navigate(EXCHANGE, { fromAssetCode: token });
  };

  const openAddFundsModal = () => Modal.open(() => (
    <AddFundsModal
      token={token}
      receiveAddress={activeAccountAddress}
    />
  ));

  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
  const tokenRate = getRate(chainRates, contractAddress, fiatCurrency);
  const walletBalances = accountAssetsBalances[chain]?.wallet ?? {};
  const balance = getBalance(walletBalances, contractAddress);
  const isWalletEmpty = balance <= 0;
  const totalInFiat = isWalletEmpty ? 0 : (balance * tokenRate);
  const fiatAmount = formatFiat(totalInFiat, baseFiatCurrency);

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
            <TokenValue>{t('tokenValue', { value: balance, token })}</TokenValue>
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
            onPressExchange={goToExchangeFlow}
            noBalance={isWalletEmpty}
            isSendDisabled={!isSendActive}
            isReceiveDisabled={!isReceiveActive}
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
            {isEtherspotAccount(activeAccount) && <HistoryList items={transactions} chain={chain} />}
          </>
        )}
      </ScrollWrapper>
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  appSettings: { data: { baseFiatCurrency } },
  smartWallet: smartWalletState,
  accounts: { data: accounts },
}: RootReducerState): $Shape<Props> => ({
  baseFiatCurrency,
  smartWalletState,
  accounts,
});

const structuredSelector = createStructuredSelector({
  accountAssetsBalances: accountAssetsBalancesSelector,
  accountHistory: accountHistorySelector,
  accountAssetsPerChain: accountAssetsPerChainSelector,
  activeAccount: activeAccountSelector,
  activeAccountAddress: activeAccountAddressSelector,
  supportedAssetsPerChain: supportedAssetsPerChainSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchAssetsBalances: () => dispatch(fetchAssetsBalancesAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(AssetScreen);
