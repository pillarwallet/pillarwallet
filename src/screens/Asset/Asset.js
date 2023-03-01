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
import { BackHandler } from 'react-native';
import styled from 'styled-components/native';
import { createStructuredSelector } from 'reselect';
import t from 'translations/translate';
import { useNavigation, useNavigationParam, useFocusEffect } from 'react-navigation-hooks';

// Components
import { Container, Content } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import FloatingButtons from 'components/FloatingButtons';
import ActivityFeed from 'components/legacy/ActivityFeed';
import HistoryList from 'components/HistoryList';
import AssetPattern from 'components/AssetPattern';
import { BaseText, MediumText } from 'components/legacy/Typography';
import RefreshControl from 'components/RefreshControl';
import SWActivationCard from 'components/SWActivationCard';

// Actions
import { fetchAssetsBalancesAction } from 'actions/assetsActions';

// Constants
import { BRIDGE_TAB, SEND_TOKEN_FROM_ASSET_FLOW, HOME } from 'constants/navigationConstants';
import { defaultFiatCurrency } from 'constants/assetsConstants';
import { PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL } from 'constants/paymentNetworkConstants';

// Utils
import { spacing, fontStyles } from 'utils/variables';
import { formatFiat } from 'utils/common';
import { getBalance } from 'utils/assets';
import { getArchanovaWalletStatus } from 'utils/archanova';
import { isArchanovaAccountAddress } from 'utils/feedData';
import { getHistoryEventsFromTransactions, getTokenTransactionsFromHistory } from 'utils/history';
import { isArchanovaAccount, isEtherspotAccount, isKeyBasedAccount } from 'utils/accounts';
import { getAssetRateInFiat } from 'utils/rates';

// Configs
import assetsConfig from 'configs/assetsConfig';

// Selectors
import {
  activeAccountAddressSelector,
  activeAccountSelector,
  supportedAssetsPerChainSelector,
  useChainRates,
} from 'selectors';
import { accountAssetsBalancesSelector } from 'selectors/balances';
import { accountHistorySelector } from 'selectors/history';

// models, types
import type { AssetsPerChain, AssetDataNavigationParam } from 'models/Asset';
import type { ArchanovaWalletStatus } from 'models/ArchanovaWalletStatus';
import type { Account } from 'models/Account';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { AccountAssetBalances } from 'models/Balances';
import type { Transaction } from 'models/Transaction';
import type { ChainRecord } from 'models/Chain';
import type { Currency } from 'models/Rates';

type Props = {
  fetchAssetsBalances: () => void,
  accountAssetsBalances: AccountAssetBalances,
  baseFiatCurrency: ?Currency,
  smartWalletState: Object,
  accounts: Account[],
  activeAccount: ?Account,
  accountHistory: ChainRecord<Transaction[]>,
  activeAccountAddress: string,
  supportedAssetsPerChain: AssetsPerChain,
};

const AssetScreen = ({
  activeAccountAddress,
  fetchAssetsBalances,
  baseFiatCurrency,
  smartWalletState,
  accounts,
  accountHistory,
  accountAssetsBalances,
  activeAccount,
  supportedAssetsPerChain,
}: Props) => {
  const navigation = useNavigation();

  const assetData: AssetDataNavigationParam = useNavigationParam('assetData');
  const isNavigateToHome: boolean = useNavigationParam('isNavigateToHome');
  const { token, contractAddress, chain } = assetData;

  const chainRates = useChainRates(chain);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        isNavigateToHome ? navigation.navigate(HOME) : navigation.pop();
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [isNavigateToHome, navigation]),
  );

  const tokenTransactions = useMemo(
    () => getTokenTransactionsFromHistory(accountHistory[chain] ?? [], accounts, contractAddress),
    [accountHistory, accounts, contractAddress, chain],
  );

  const transactions = useMemo(() => {
    const chainSupportedAssets = supportedAssetsPerChain[chain] ?? [];

    if (isArchanovaAccount(activeAccount)) {
      return tokenTransactions.filter(({ isPPNTransaction = false, from, to, tag }) => {
        const isBetweenArchanovaAccounts =
          isArchanovaAccountAddress(from, accounts) && isArchanovaAccountAddress(to, accounts);

        return (
          tag !== PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL &&
          (!isPPNTransaction || (isPPNTransaction && isBetweenArchanovaAccounts))
        );
      });
    }

    if (isEtherspotAccount(activeAccount)) {
      return getHistoryEventsFromTransactions(tokenTransactions, chain, activeAccountAddress, chainSupportedAssets);
    }

    return [];
  }, [tokenTransactions, chain, accounts, activeAccount, activeAccountAddress, supportedAssetsPerChain]);

  const buttons = [
    !isArchanovaAccount(activeAccount) &&
    !isKeyBasedAccount(activeAccount) && {
      title: t('button.swap'),
      iconName: 'exchange',
      onPress: () => navigation.navigate(BRIDGE_TAB, { fromAssetAddress: contractAddress, chain }),
    },
    {
      title: t('button.send'),
      iconName: 'send',
      onPress: () => navigation.navigate(SEND_TOKEN_FROM_ASSET_FLOW, { assetData }),
    },
  ];

  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
  const tokenRate = getAssetRateInFiat(chainRates, contractAddress, fiatCurrency);
  const walletBalances = accountAssetsBalances[chain]?.wallet ?? {};
  const balance = getBalance(walletBalances, contractAddress);
  const isWalletEmpty = balance <= 0;
  const totalInFiat = isWalletEmpty ? 0 : balance * tokenRate;
  const fiatAmount = formatFiat(totalInFiat, baseFiatCurrency);

  const { listed: isListed = true, send: isAssetConfigSendActive = true, disclaimer } = assetsConfig[token] || {};

  const archanovaWalletStatus: ArchanovaWalletStatus = getArchanovaWalletStatus(accounts, smartWalletState);
  const sendingBlockedMessage = archanovaWalletStatus.sendingBlockedMessage || {};
  const isSendActive = isAssetConfigSendActive && !Object.keys(sendingBlockedMessage).length;

  return (
    <Container>
      <HeaderBlock
        centerItems={[{ title: assetData.name }]}
        customOnBack={() => (isNavigateToHome ? navigation.navigate(HOME) : navigation.pop())}
        noPaddingTop
      />
      <Content
        contentContainerStyle={{ paddingBottom: FloatingButtons.SCROLL_VIEW_BOTTOM_INSET }}
        paddingHorizontal={0}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              fetchAssetsBalances();
            }}
          />
        }
      >
        <AssetPattern token={assetData.token} icon={assetData.patternIcon} isListed={isListed} />
        <DataWrapper>
          <ValueWrapper>
            <TokenValue>{t('tokenValue', { value: balance, token })}</TokenValue>
          </ValueWrapper>
          {!!isListed && (
            <ValuesWrapper>
              <ValueInFiat>{fiatAmount}</ValueInFiat>
            </ValuesWrapper>
          )}
          {!isListed && <Disclaimer>{disclaimer}</Disclaimer>}
        </DataWrapper>
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
      </Content>
      <FloatingButtons items={buttons} />
      {!isSendActive && isArchanovaAccount(activeAccount) && <SWActivationCard />}
    </Container>
  );
};

const mapStateToProps = ({
  appSettings: {
    data: { baseFiatCurrency },
  },
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
