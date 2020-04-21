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
import { RefreshControl, ScrollView, View } from 'react-native';
import styled, { withTheme } from 'styled-components/native';
import { createStructuredSelector } from 'reselect';
import { withNavigation } from 'react-navigation';
import get from 'lodash.get';
import type { NavigationScreenProp } from 'react-navigation';

// actions
import { fetchVirtualAccountBalanceAction } from 'actions/smartWalletActions';
import { dismissPPNInsightAction } from 'actions/insightsActions';
import { fetchTransactionsHistoryAction } from 'actions/historyActions';

// components
import { BaseText, MediumText } from 'components/Typography';
import CircleButton from 'components/CircleButton';
import { ListItemChevron } from 'components/ListItem/ListItemChevron';
import Tabs from 'components/Tabs';
import Button from 'components/Button';
import ActivityFeed from 'components/ActivityFeed';
import InsightWithButton from 'components/InsightWithButton';
import SWActivationCard from 'components/SWActivationCard';

// constants
import { defaultFiatCurrency, ETH, PLR } from 'constants/assetsConstants';
import { TRANSACTION_EVENT } from 'constants/historyConstants';
import {
  FUND_TANK,
  SETTLE_BALANCE,
  UNSETTLED_ASSETS,
  TANK_WITHDRAWAL,
  SEND_SYNTHETIC_ASSET, EXCHANGE,
} from 'constants/navigationConstants';
import {
  PAYMENT_COMPLETED,
  PAYMENT_PROCESSED,
  SMART_WALLET_UPGRADE_STATUSES,
} from 'constants/smartWalletConstants';

// types
import type { Accounts } from 'models/Account';
import type { ApiUser, ContactSmartAddressData } from 'models/Contacts';
import type { SmartWalletStatus } from 'models/SmartWalletStatus';
import type { Transaction } from 'models/Transaction';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Theme } from 'models/Theme';
import type { Balances, BalancesStore } from 'models/Asset';

// utils
import { getRate } from 'utils/assets';
import { formatMoney, formatFiat } from 'utils/common';
import { mapTransactionsHistory } from 'utils/feedData';
import { getSmartWalletStatus, isHiddenUnsettledTransaction } from 'utils/smartWallet';
import { fontSizes, fontStyles, spacing } from 'utils/variables';
import { getThemeColors, themedColors } from 'utils/themes';
import { findFirstSmartAccount, getAccountId } from 'utils/accounts';

// selectors
import {
  availableStakeSelector,
  paymentNetworkNonZeroBalancesSelector,
  PPNTransactionsSelector,
} from 'selectors/paymentNetwork';
import { accountHistorySelector } from 'selectors/history';


type Props = {
  baseFiatCurrency: ?string,
  rates: Object,
  navigation: NavigationScreenProp<*>,
  availableStake: number,
  assetsOnNetwork: Object,
  fetchVirtualAccountBalance: () => void,
  accounts: Accounts,
  smartWalletState: Object,
  PPNTransactions: Transaction[],
  contacts: ApiUser[],
  contactsSmartAddresses: ContactSmartAddressData[],
  history: Object[],
  fetchTransactionsHistory: () => void,
  theme: Theme,
  dismissPPNInsight: () => void,
  PPNInsightDismissed: boolean,
  onScroll: (event: Object) => void,
  balances: BalancesStore,
}

type State = {
  activeTab: string,
}

const AssetButtonsWrapper = styled.View`
  flex-direction: row;
  justify-content: center;
`;

const TopPartWrapper = styled.View`
  padding: ${spacing.large}px ${spacing.layoutSides}px;
  border-bottom-width: 1;
  border-color: ${themedColors.border};
`;

const SectionTitle = styled(MediumText)`
  ${fontStyles.regular};
  color: ${themedColors.accent};
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

const UNSETTLED = 'UNSETTLED';
const SETTLED = 'SETTLED';
const insightItemsList = [
  'Instant, gas-free and private transactions',
  'A single token experience including the ability to send/spend tokens you don’t already own through real-time swaps.',
];

class PPNView extends React.Component<Props, State> {
  state = {
    activeTab: UNSETTLED,
  };

  setActiveTab = (activeTab) => {
    this.setState({ activeTab });
  };

  navigateToBuyPillar = () => {
    const { navigation, baseFiatCurrency } = this.props;
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    navigation.navigate(EXCHANGE, { fromAssetCode: fiatCurrency, toAssetCode: PLR });
  };

  navigateToFundTank = () => {
    const { navigation } = this.props;
    navigation.navigate(FUND_TANK);
  };

  renderInsight = (isSmartWalletInitialised) => {
    const {
      dismissPPNInsight,
      availableStake,
      PPNInsightDismissed,
      accounts,
      balances,
    } = this.props;

    const smartWalletAccount = findFirstSmartAccount(accounts);

    if (isSmartWalletInitialised && smartWalletAccount) {
      const smartWalletAccountId = getAccountId(smartWalletAccount);
      const accountBalances: Balances = balances[smartWalletAccountId];
      const hasPLRInSmartWallet = parseInt(get(accountBalances, `[${PLR}].balance`, 0), 10) > 0;

      if (!availableStake) {
        if (!hasPLRInSmartWallet) {
          return (
            <InsightWithButton
              title="Activate Pillar Network"
              description="To send any token you need to top up Pillar Tank with PLR first"
              buttonTitle="Not enough PLR"
              buttonProps={{ disabled: true, secondary: true }}
              footerChildren={(
                <Button title="Buy PLR" small marginTop={12} onPress={this.navigateToBuyPillar} regularText />
              )}
            />
          );
        }
        return (
          <InsightWithButton
            title="Activate Pillar Network"
            description="To send any token you need to top up Pillar Tank with PLR first"
            buttonTitle="Top up PLR Tank"
            onButtonPress={this.navigateToFundTank}
          />
        );
      }
    } else {
      if (PPNInsightDismissed) {
        return (
          <SWActivationCard
            message="To use Pillar Network you need to activate Smart Wallet"
          />
        );
      }

      return (
        <InsightWithButton
          title="Unique benefits of Pillar Payment Network for PLR users"
          itemsList={insightItemsList}
          buttonTitle="Activate Pillar Network"
          onButtonPress={dismissPPNInsight}
        />
      );
    }
    return null;
  };

  render() {
    const { activeTab } = this.state;
    const {
      availableStake,
      assetsOnNetwork,
      fetchVirtualAccountBalance,
      navigation,
      accounts,
      smartWalletState,
      PPNTransactions,
      contacts,
      contactsSmartAddresses,
      baseFiatCurrency,
      rates,
      history,
      fetchTransactionsHistory,
      theme,
      onScroll,
    } = this.props;
    const colors = getThemeColors(theme);

    let incomingBalanceInFiat = 0;
    const assetsOnNetworkArray = Object.values(assetsOnNetwork);
    if (assetsOnNetworkArray.length) {
      incomingBalanceInFiat = assetsOnNetworkArray.reduce((totalInFiat, incomingAsset) => {
        const tokenSymbol = get(incomingAsset, 'symbol', ETH);
        const tokenBalance = parseFloat(get(incomingAsset, 'balance', '0'));
        const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
        const tokenRate = getRate(rates, tokenSymbol, fiatCurrency);
        return totalInFiat + (tokenBalance * tokenRate);
      }, 0);
    }

    const availableFormattedAmount = formatMoney(availableStake, 4);
    const smartWalletStatus: SmartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);
    const { upgrade: { status: smartWalletUpgradeStatus } } = smartWalletState;
    const sendingBlockedMessage = smartWalletUpgradeStatus === SMART_WALLET_UPGRADE_STATUSES.ACCOUNT_CREATED
      ? {
        title: 'To top up PLR Tank or Settle transactions, activate Smart Wallet first',
        message: 'You will have to pay a small fee',
      }
      : smartWalletStatus.sendingBlockedMessage || {};
    const disableTopUpAndSettle = Object.keys(sendingBlockedMessage).length;

    const PPNTransactionsMapped = mapTransactionsHistory(
      PPNTransactions,
      contacts,
      contactsSmartAddresses,
      accounts,
      TRANSACTION_EVENT,
    );

    const PPNTransactionsGrouped = PPNTransactionsMapped.reduce((filtered, transaction) => {
      const { stateInPPN, hash } = transaction;
      const { settled, unsettled } = filtered;
      switch (stateInPPN) {
        case PAYMENT_PROCESSED:
          filtered.settled = settled.concat(transaction);
          break;
        case PAYMENT_COMPLETED:
          if (!isHiddenUnsettledTransaction(hash, history)) filtered.unsettled = unsettled.concat(transaction);
          break;
        default:
          break;
      }
      return filtered;
    }, { settled: [], unsettled: [] });

    const historyTabs = [
      {
        id: UNSETTLED,
        name: 'Unsettled',
        onPress: () => this.setActiveTab(UNSETTLED),
        data: PPNTransactionsGrouped.unsettled,
        emptyState: {
          title: 'No unsettled transactions',
        },
      },
      {
        id: SETTLED,
        name: 'Settled',
        onPress: () => this.setActiveTab(SETTLED),
        data: PPNTransactionsGrouped.settled,
        emptyState: {
          title: 'No settled transactions',
        },
      },
    ];

    const showSettleButton = activeTab !== SETTLED && !!PPNTransactionsGrouped.unsettled.length;

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
              onRefresh={() => {
                fetchTransactionsHistory();
                fetchVirtualAccountBalance();
              }}
            />
          }
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {this.renderInsight(!disableTopUpAndSettle)}
          <TopPartWrapper>
            <SectionTitle>PLR Tank</SectionTitle>
            <TankBalanceWrapper>
              <TankBalance>
                {`${availableFormattedAmount} PLR`}
              </TankBalance>
            </TankBalanceWrapper>
            <AssetButtonsWrapper>
              <CircleButton
                label="Top up"
                onPress={this.navigateToFundTank}
                fontIcon="plus"
                fontIconStyle={{ fontSize: fontSizes.big }}
                disabled={!!disableTopUpAndSettle}
              />
              <CircleButton
                label="Withdraw"
                fontIcon="up-arrow"
                fontIconStyle={{ fontSize: fontSizes.big }}
                onPress={() => navigation.navigate(TANK_WITHDRAWAL)}
                disabled={availableStake <= 0}
              />
              <CircleButton
                label="Send"
                fontIcon="paperPlane"
                onPress={() => navigation.navigate(SEND_SYNTHETIC_ASSET)}
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
            }}
            chevronStyle={{ color: colors.secondaryText }}
            label="Incoming balance"
            rightAddon={(<BlueText>{formatFiat(incomingBalanceInFiat, baseFiatCurrency)}</BlueText>)}
            onPress={() => navigation.navigate(UNSETTLED_ASSETS)}
            color={colors.text}
            bordered
          />}
          {(!!PPNTransactionsMapped.length || availableStake > 0) &&
          <Tabs
            tabs={historyTabs}
            wrapperStyle={{ paddingTop: 16 }}
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
          />
          }
        </ScrollView>
        {showSettleButton &&
          <FloatingButtonView>
            <Button
              style={{ paddingLeft: spacing.rhythm, paddingRight: spacing.rhythm }}
              width="auto"
              title="Settle transactions"
              onPress={() => navigation.navigate(SETTLE_BALANCE)}
            />
          </FloatingButtonView>
        }
      </View>
    );
  }
}

const mapStateToProps = ({
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
  smartWallet: smartWalletState,
  accounts: { data: accounts },
  contacts: { data: contacts, contactsSmartAddresses: { addresses: contactsSmartAddresses } },
  insights: { PPNInsightDismissed },
  balances: { data: balances },
}: RootReducerState): $Shape<Props> => ({
  rates,
  baseFiatCurrency,
  smartWalletState,
  accounts,
  contacts,
  contactsSmartAddresses,
  PPNInsightDismissed,
  balances,
});

const structuredSelector = createStructuredSelector({
  assetsOnNetwork: paymentNetworkNonZeroBalancesSelector,
  availableStake: availableStakeSelector,
  PPNTransactions: PPNTransactionsSelector,
  history: accountHistorySelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchVirtualAccountBalance: () => dispatch(fetchVirtualAccountBalanceAction()),
  fetchTransactionsHistory: () => dispatch(fetchTransactionsHistoryAction()),
  dismissPPNInsight: () => dispatch(dismissPPNInsightAction()),
});

export default withTheme(withNavigation(connect(combinedMapStateToProps, mapDispatchToProps)(PPNView)));
