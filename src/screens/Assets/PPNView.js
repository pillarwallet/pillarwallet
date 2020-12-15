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
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { RefreshControl, ScrollView, View } from 'react-native';
import styled, { withTheme } from 'styled-components/native';
import { createStructuredSelector } from 'reselect';
import { withNavigation } from 'react-navigation';
import get from 'lodash.get';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';

// actions
import { fetchTransactionsHistoryAction } from 'actions/historyActions';
import {
  fetchAccountDepositBalanceAction,
  fetchAccountPaymentChannelsAction,
} from 'actions/etherspotActions';

// components
import { BaseText } from 'components/Typography';
import CircleButton from 'components/CircleButton';
import { ListItemChevron } from 'components/ListItem/ListItemChevron';
import Tabs from 'components/Tabs';
import Button from 'components/Button';
import ActivityFeed from 'components/ActivityFeed';
import InsightWithButton from 'components/InsightWithButton';

// constants
import { defaultFiatCurrency, ETH } from 'constants/assetsConstants';
import { TRANSACTION_EVENT } from 'constants/historyConstants';
import {
  FUND_TANK,
  SETTLE_BALANCE,
  UNSETTLED_ASSETS,
  TANK_WITHDRAWAL,
  SERVICES,
  PPN_SEND_TOKEN_AMOUNT,
} from 'constants/navigationConstants';
import {
  PAYMENT_COMPLETED,
} from 'constants/smartWalletConstants';
import {
  PAYMENT_NETWORK_ACCOUNT_TOPUP,
  PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL,
  PAYMENT_NETWORK_TX_SETTLEMENT,
} from 'constants/paymentNetworkConstants';
import { PPN_TOKEN } from 'configs/assetsConfig';

// types
import type { Accounts } from 'models/Account';
import type { Transaction } from 'models/Transaction';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Theme } from 'models/Theme';
import type { Balances, BalancesStore, Rates } from 'models/Asset';

// utils
import {
  addressesEqual,
  getRate,
} from 'utils/assets';
import { formatMoney, formatFiat } from 'utils/common';
import { mapTransactionsHistory } from 'utils/feedData';
import { isHiddenUnsettledTransaction } from 'utils/smartWallet';
import { fontSizes, fontStyles, spacing } from 'utils/variables';
import { getThemeColors, themedColors } from 'utils/themes';
import { findFirstEtherspotAccount, getAccountId } from 'utils/accounts';

// selectors
import {
  availableStakeSelector,
  PPNTransactionsSelector,
} from 'selectors/paymentNetwork';
import { accountHistorySelector } from 'selectors/history';
import { activeAccountAddressSelector } from 'selectors';


type Props = {
  baseFiatCurrency: ?string,
  rates: Rates,
  navigation: NavigationScreenProp<*>,
  availableStake: number,
  fetchAccountDepositBalance: () => void,
  accounts: Accounts,
  PPNTransactions: Transaction[],
  history: Object[],
  fetchTransactionsHistory: () => void,
  theme: Theme,
  onScroll: (event: Object) => void,
  activeAccountAddress: string,
  balances: BalancesStore,
  fetchAccountPaymentChannels: () => void,
};

const AssetButtonsWrapper = styled.View`
  flex-direction: row;
  justify-content: center;
`;

const TopPartWrapper = styled.View`
  padding: ${spacing.large}px ${spacing.layoutSides}px;
`;

const TankBalanceWrapper = styled.View`
  padding: ${spacing.large}px 40px;
  align-items: center;
`;

const TankBalance = styled(BaseText)`
  font-size: ${fontSizes.giant}px;
`;

const BlueText = styled(BaseText)`
  color: ${themedColors.primary};
  ${fontStyles.regular};
  margin-right: ${spacing.medium}px;
`;

const FloatingButtonView = styled.View`
  position: absolute;
  bottom: ${spacing.rhythm}px;
  align-items: center;
  justify-content: center;
  width: 100%;
`;

const INCOMING = 'INCOMING';
const SENT = 'SENT';
const SETTLED = 'SETTLED';

const PPNView = ({
  navigation,
  availableStake,
  accounts,
  balances,
  rates,
  fetchAccountDepositBalance,
  PPNTransactions,
  baseFiatCurrency,
  history,
  fetchTransactionsHistory,
  theme,
  onScroll,
  activeAccountAddress,
  fetchAccountPaymentChannels,
}: Props) => {
  const refreshData = () => {
    fetchTransactionsHistory();
    fetchAccountDepositBalance();
    fetchAccountPaymentChannels();
  };

  // initial
  useEffect(() => { refreshData(); }, []);

  const [activeTab, setActiveTab] = useState(INCOMING);

  const navigateToBuyPillar = () => navigation.navigate(SERVICES);
  const navigateToFundTank = () => navigation.navigate(FUND_TANK);

  const renderInsight = () => {
    const etherspotAccount = findFirstEtherspotAccount(accounts);
    if (!etherspotAccount) return null;

    const etherspotAccountId = getAccountId(etherspotAccount);
    const accountBalances: Balances = balances[etherspotAccountId];
    const hasPLRInSmartWallet = parseInt(get(accountBalances, `[${PPN_TOKEN}].balance`, 0), 10) > 0;

    if (!availableStake) {
      const insightProps = {};
      if (!hasPLRInSmartWallet) {
        insightProps.buttonTitle = t('button.notEnoughToken', { token: PPN_TOKEN });
        insightProps.buttonProps = { disabled: true, secondary: true };
        insightProps.footerChildren = (
          <Button
            title={t('button.buyToken', { token: PPN_TOKEN })}
            small
            marginTop={12}
            onPress={navigateToBuyPillar}
          />);
      } else {
        insightProps.buttonTitle = t('button.topUpTokenTank', { token: PPN_TOKEN });
        insightProps.onButtonPress = navigateToFundTank;
      }
      return (
        <InsightWithButton
          title={t('insight.pillarNetworkActivate.hasNoPPNBalance.title')}
          description={
            t('insight.pillarNetworkActivate.hasNoPPNBalance.description.activationBenefit', {
              token: PPN_TOKEN,
            })
          }
          {...insightProps}
        />
      );
    }

    return null;
  };

  const colors = getThemeColors(theme);

  const availableFormattedAmount = formatMoney(availableStake, 4);

  const PPNTransactionsMapped = mapTransactionsHistory(
    PPNTransactions,
    accounts,
    TRANSACTION_EVENT,
  );

  const PPNTransactionsGrouped = PPNTransactionsMapped.reduce((filtered, transaction) => {
    const {
      stateInPPN, hash, tag, from, to,
    } = transaction;
    const {
      settled, incoming, sent,
    } = filtered;
    switch (tag) {
      case PAYMENT_NETWORK_ACCOUNT_TOPUP:
        filtered.incoming = incoming.concat(transaction);
        break;
      case PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL:
        filtered.sent = sent.concat(transaction);
        break;
      case PAYMENT_NETWORK_TX_SETTLEMENT:
        filtered.settled = settled.concat(transaction);
        break;
      default:
        if (addressesEqual(from, activeAccountAddress) && !addressesEqual(to, activeAccountAddress)) {
          filtered.sent = sent.concat(transaction);
        } else if (stateInPPN === PAYMENT_COMPLETED && !isHiddenUnsettledTransaction(hash, history)) {
          filtered.incoming = incoming.concat(transaction);
          filtered.unsettledCount += 1;
        }
    }
    return filtered;
  }, {
    settled: [],
    incoming: [],
    sent: [],
    unsettledCount: 0,
  });

  const incomingBalanceInFiat = PPNTransactionsGrouped.incoming.reduce((totalInFiat, incomingAsset) => {
    // const tokenSymbol = get(incomingAsset, 'symbol', ETH);
    // const tokenBalance = parseFloat(get(incomingAsset, 'balance', '0'));
    // const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    // const tokenRate = getRate(rates, tokenSymbol, fiatCurrency);
    return totalInFiat + 1; //(tokenBalance * tokenRate);
  }, 0);

  const historyTabs = [
    {
      id: INCOMING,
      name: t('ppnContent.tabs.incoming.title'),
      onPress: () => setActiveTab(INCOMING),
      data: PPNTransactionsGrouped.incoming,
      emptyState: {
        title: t('ppnContent.tabs.incoming.emptyState.title'),
      },
    },
    {
      id: SENT,
      name: t('ppnContent.tabs.sent.title'),
      onPress: () => setActiveTab(SENT),
      data: PPNTransactionsGrouped.sent,
      emptyState: {
        title: t('ppnContent.tabs.sent.emptyState.title'),
      },
    },
    {
      id: SETTLED,
      name: t('ppnContent.tabs.settled.title'),
      onPress: () => setActiveTab(SETTLED),
      data: PPNTransactionsGrouped.settled,
      emptyState: {
        title: t('ppnContent.tabs.settled.emptyState.title'),
      },
    },
  ];

  const showSettleButton = activeTab === INCOMING && !!PPNTransactionsGrouped.unsettledCount;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: showSettleButton ? (56 + spacing.rhythm) : 0,
        }}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refreshData}
          />
        }
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {renderInsight()}
        <TopPartWrapper>
          <TankBalanceWrapper>
            <TankBalance>
              {t('tokenValue', { value: availableFormattedAmount, token: PPN_TOKEN })}
            </TankBalance>
          </TankBalanceWrapper>
          <AssetButtonsWrapper>
            <CircleButton
              label={t('button.topUp')}
              onPress={navigateToFundTank}
              fontIcon="plus"
              fontIconStyle={{ fontSize: fontSizes.big }}
            />
            <CircleButton
              label={t('button.withdraw')}
              fontIcon="up-arrow"
              fontIconStyle={{ fontSize: fontSizes.big }}
              onPress={() => navigation.navigate(TANK_WITHDRAWAL)}
              disabled={availableStake <= 0}
            />
            <CircleButton
              label={t('button.send')}
              fontIcon="paperPlane"
              onPress={() => navigation.navigate(PPN_SEND_TOKEN_AMOUNT)}
              disabled={availableStake <= 0}
            />
          </AssetButtonsWrapper>
        </TopPartWrapper>
        {incomingBalanceInFiat > 0 &&
        <ListItemChevron
          wrapperStyle={{
            borderTopWidth: 0,
            borderBottomWidth: 1,
            borderColor: colors.border,
            opacity: 1,
          }}
          chevronStyle={{ color: colors.secondaryText }}
          label={t('label.incomingBalance')}
          rightAddon={(<BlueText>{formatFiat(incomingBalanceInFiat, baseFiatCurrency)}</BlueText>)}
          onPress={() => navigation.navigate(UNSETTLED_ASSETS)}
          color={colors.text}
          bordered
        />}
        {(!!PPNTransactionsMapped.length || availableStake > 0) &&
        <Tabs
          tabs={historyTabs}
          wrapperStyle={{ paddingTop: 30, paddingBottom: 26 }}
          activeTab={activeTab}
        />
        }
        {(!!PPNTransactionsMapped.length || availableStake > 0) &&
        <ActivityFeed
          navigation={navigation}
          tabs={historyTabs}
          activeTab={activeTab}
          hideTabs
          initialNumToRender={6}
          wrapperStyle={{ flexGrow: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          isPPNView
        />
        }
      </ScrollView>
      {showSettleButton &&
        <FloatingButtonView>
          <Button
            style={{ paddingLeft: spacing.rhythm, paddingRight: spacing.rhythm }}
            block={false}
            title={t('button.settleTransactions')}
            onPress={() => navigation.navigate(SETTLE_BALANCE)}
          />
        </FloatingButtonView>
      }
    </View>
  );
};

const mapStateToProps = ({
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
  accounts: { data: accounts },
  balances: { data: balances },
  paymentNetwork: { paymentChannels },
}: RootReducerState): $Shape<Props> => ({
  rates,
  baseFiatCurrency,
  accounts,
  balances,
  paymentChannels,
});

const structuredSelector = createStructuredSelector({
  availableStake: availableStakeSelector,
  PPNTransactions: PPNTransactionsSelector,
  history: accountHistorySelector,
  activeAccountAddress: activeAccountAddressSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchAccountDepositBalance: () => dispatch(fetchAccountDepositBalanceAction()),
  fetchTransactionsHistory: () => dispatch(fetchTransactionsHistoryAction()),
  fetchAccountPaymentChannels: () => dispatch(fetchAccountPaymentChannelsAction()),
});

export default withTheme(withNavigation(connect(combinedMapStateToProps, mapDispatchToProps)(PPNView)));
