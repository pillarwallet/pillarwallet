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
import { defaultFiatCurrency, ETH } from 'constants/assetsConstants';
import { TRANSACTION_EVENT } from 'constants/historyConstants';
import {
  FUND_TANK,
  SETTLE_BALANCE,
  UNSETTLED_ASSETS,
  TANK_WITHDRAWAL,
  SEND_SYNTHETIC_ASSET,
} from 'constants/navigationConstants';
import {
  PAYMENT_COMPLETED,
  SMART_WALLET_UPGRADE_STATUSES,
} from 'constants/smartWalletConstants';
import {
  PAYMENT_NETWORK_ACCOUNT_TOPUP,
  PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL,
  PAYMENT_NETWORK_TX_SETTLEMENT,
} from 'constants/paymentNetworkConstants';

// types
import type { Accounts } from 'models/Account';
import type { ApiUser, ContactSmartAddressData } from 'models/Contacts';
import type { SmartWalletStatus } from 'models/SmartWalletStatus';
import type { Transaction } from 'models/Transaction';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Theme } from 'models/Theme';

// utils
import { getRate, addressesEqual } from 'utils/assets';
import { formatMoney, formatFiat } from 'utils/common';
import { mapTransactionsHistory } from 'utils/feedData';
import { getSmartWalletStatus, isHiddenUnsettledTransaction } from 'utils/smartWallet';
import { fontSizes, fontStyles, spacing } from 'utils/variables';
import { getThemeColors, themedColors } from 'utils/themes';

// selectors
import {
  availableStakeSelector,
  paymentNetworkNonZeroBalancesSelector,
  PPNTransactionsSelector,
} from 'selectors/paymentNetwork';
import { accountHistorySelector } from 'selectors/history';
import { fetchTransactionsHistoryAction } from 'actions/historyActions';
import { activeAccountAddressSelector } from 'selectors';


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
  activeAccountAddress: string,
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

const INCOMING = 'INCOMING';
const SENT = 'SENT';
const SETTLED = 'SETTLED';

const insightItemsList = [
  'Free transactions',
  'Instant transactions',
  'Send tokens you don’t actually own. Wait, what?',
];

class PPNView extends React.Component<Props, State> {
  state = {
    activeTab: INCOMING,
  };

  setActiveTab = (activeTab) => {
    this.setState({ activeTab });
  };

  renderInsight = (disableTopUpAndSettle) => {
    const {
      dismissPPNInsight, availableStake, navigation, PPNInsightDismissed,
    } = this.props;
    if (disableTopUpAndSettle) {
      if (PPNInsightDismissed) {
        return (
          <SWActivationCard
            message="To use Pillar Network you need to activate Smart Wallet"
          />
        );
      }
      return (
        <InsightWithButton
          title="It’s hard to believe what you can do with Pillar Network"
          itemsList={insightItemsList}
          buttonTitle="Enable Pillar Network"
          onButtonPress={dismissPPNInsight}
        />
      );
    }
    if (availableStake <= 0) {
      return (
        <InsightWithButton
          description="To send any token you need to top up Pillar Tank with PLR first"
          buttonTitle="Top up Pillar Tank"
          buttonProps={{ positive: true }}
          onButtonPress={() => navigation.navigate(FUND_TANK)}
        />
      );
    }
    return null;
  }

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
      activeAccountAddress,
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
      const {
        stateInPPN, hash, tag, from,
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
          if (addressesEqual(from, activeAccountAddress)) {
            filtered.sent = sent.concat(transaction);
          } else if (stateInPPN === PAYMENT_COMPLETED && !isHiddenUnsettledTransaction(hash, history)) {
            filtered.incoming = incoming.concat(transaction);
            filtered.unsettledCount += 1;
          }
      }
      return filtered;
    }, {
      settled: [], incoming: [], sent: [], unsettledCount: 0,
    });

    const historyTabs = [
      {
        id: INCOMING,
        name: 'Incoming',
        onPress: () => this.setActiveTab(INCOMING),
        data: PPNTransactionsGrouped.incoming,
        emptyState: {
          title: 'No incoming transactions',
        },
      },
      {
        id: SENT,
        name: 'Sent',
        onPress: () => this.setActiveTab(SENT),
        data: PPNTransactionsGrouped.sent,
        emptyState: {
          title: 'No sent transactions',
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
              onRefresh={() => {
                fetchTransactionsHistory();
                fetchVirtualAccountBalance();
              }}
            />
          }
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {this.renderInsight(disableTopUpAndSettle)}
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
                onPress={() => navigation.navigate(FUND_TANK)}
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
            isPPNView
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
}: RootReducerState): $Shape<Props> => ({
  rates,
  baseFiatCurrency,
  smartWalletState,
  accounts,
  contacts,
  contactsSmartAddresses,
  PPNInsightDismissed,
});

const structuredSelector = createStructuredSelector({
  assetsOnNetwork: paymentNetworkNonZeroBalancesSelector,
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
  fetchVirtualAccountBalance: () => dispatch(fetchVirtualAccountBalanceAction()),
  fetchTransactionsHistory: () => dispatch(fetchTransactionsHistoryAction()),
  dismissPPNInsight: () => dispatch(dismissPPNInsightAction()),
});

export default withTheme(withNavigation(connect(combinedMapStateToProps, mapDispatchToProps)(PPNView)));
