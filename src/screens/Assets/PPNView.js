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
import { fetchTransactionsHistoryAction } from 'actions/historyActions';

// components
import { BaseText } from 'components/Typography';
import CircleButton from 'components/CircleButton';
import { ListItemChevron } from 'components/ListItem/ListItemChevron';
import Tabs from 'components/Tabs';
import Button from 'components/Button';
import ActivityFeed from 'components/ActivityFeed';
import InsightWithButton from 'components/InsightWithButton';
import SWActivationModal from 'components/SWActivationModal';

// constants
import { defaultFiatCurrency, ETH, PLR } from 'constants/assetsConstants';
import { TRANSACTION_EVENT } from 'constants/historyConstants';
import {
  FUND_TANK,
  SETTLE_BALANCE,
  UNSETTLED_ASSETS,
  TANK_WITHDRAWAL,
  SERVICES,
  SEND_SYNTHETIC_AMOUNT,
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
import type { SmartWalletStatus } from 'models/SmartWalletStatus';
import type { Transaction } from 'models/Transaction';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Theme } from 'models/Theme';
import type { Balances, BalancesStore, Rates } from 'models/Asset';

// utils
import { getRate, addressesEqual } from 'utils/assets';
import { formatMoney, formatFiat } from 'utils/common';
import { mapTransactionsHistory } from 'utils/feedData';
import { getSmartWalletStatus, isDeployingSmartWallet, isHiddenUnsettledTransaction } from 'utils/smartWallet';
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
import { activeAccountAddressSelector } from 'selectors';


type Props = {
  baseFiatCurrency: ?string,
  rates: Rates,
  navigation: NavigationScreenProp<*>,
  availableStake: number,
  assetsOnNetwork: Object,
  fetchVirtualAccountBalance: () => void,
  accounts: Accounts,
  smartWalletState: Object,
  PPNTransactions: Transaction[],
  history: Object[],
  fetchTransactionsHistory: () => void,
  theme: Theme,
  onScroll: (event: Object) => void,
  activeAccountAddress: string,
  balances: BalancesStore,
};

type State = {
  activeTab: string,
  isInitSmartWalletModalVisible: boolean,
};

const AssetButtonsWrapper = styled.View`
  flex-direction: row;
  justify-content: center;
`;

const TopPartWrapper = styled.View`
  padding: ${spacing.large}px ${spacing.layoutSides}px;
  border-bottom-width: 1;
  border-color: ${themedColors.border};
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
  'Instant, gas-free and private transactions.',
  'A single token experience including the ability to send/spend tokens you don’t already own through real-time swaps.',
];

class PPNView extends React.Component<Props, State> {
  state = {
    activeTab: INCOMING,
    isInitSmartWalletModalVisible: false,
  };

  setActiveTab = (activeTab) => {
    this.setState({ activeTab });
  };

  navigateToBuyPillar = () => {
    const { navigation } = this.props;
    navigation.navigate(SERVICES);
  };

  navigateToFundTank = () => {
    const { navigation } = this.props;
    navigation.navigate(FUND_TANK);
  };

  renderInsight = () => {
    const {
      availableStake,
      accounts,
      balances,
      smartWalletState,
    } = this.props;
    const smartWalletAccount = findFirstSmartAccount(accounts);

    const isDeploying = isDeployingSmartWallet(smartWalletState, accounts);
    if (isDeploying) {
      return (
        <InsightWithButton
          spinner
          footerChildren={
            <BaseText
              medium
              center
              style={{ marginTop: 20 }}
            >
              Activating your Smart Wallet. It will be ready shortly
            </BaseText>
          }
        />
      );
    }

    const smartWalletStatus: SmartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);

    if (smartWalletAccount && smartWalletStatus.status === SMART_WALLET_UPGRADE_STATUSES.DEPLOYMENT_COMPLETE) {
      const smartWalletAccountId = getAccountId(smartWalletAccount);
      const accountBalances: Balances = balances[smartWalletAccountId];
      const hasPLRInSmartWallet = parseInt(get(accountBalances, `[${PLR}].balance`, 0), 10) > 0;

      if (!availableStake) {
        const insightProps = {};
        if (!hasPLRInSmartWallet) {
          insightProps.buttonTitle = 'Not enough PLR';
          insightProps.buttonProps = { disabled: true, secondary: true };
          insightProps.footerChildren = (
            <Button
              title="Buy PLR"
              small
              marginTop={12}
              onPress={this.navigateToBuyPillar}
              regularText
            />);
        } else {
          insightProps.buttonTitle = 'Top up PLR Tank';
          insightProps.onButtonPress = this.navigateToFundTank;
        }
        return (
          <InsightWithButton
            title="Activate Pillar Network"
            description="To send any token you need to top up Pillar Tank with PLR first"
            {...insightProps}
          />
        );
      }

      return null;
    } else if (smartWalletStatus.status === SMART_WALLET_UPGRADE_STATUSES.ACCOUNT_CREATED) {
      return (
        <InsightWithButton
          title="Unique benefits of Pillar Payment Network for PLR users"
          itemsList={insightItemsList}
          buttonTitle="Activate Pillar Network"
          onButtonPress={() => this.setState({ isInitSmartWalletModalVisible: true })}
        />
      );
    }

    return null;
  };

  closeSmartWalletModal = () => {
    this.setState({ isInitSmartWalletModalVisible: false });
  };

  render() {
    const { activeTab, isInitSmartWalletModalVisible } = this.state;
    const {
      availableStake,
      assetsOnNetwork,
      fetchVirtualAccountBalance,
      navigation,
      accounts,
      smartWalletState,
      PPNTransactions,
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
          {this.renderInsight()}
          <TopPartWrapper>
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
                onPress={() => navigation.navigate(SEND_SYNTHETIC_AMOUNT)}
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
              opacity: disableTopUpAndSettle ? 0.5 : 1,
            }}
            chevronStyle={{ color: colors.secondaryText }}
            label="Incoming balance"
            rightAddon={(<BlueText>{formatFiat(incomingBalanceInFiat, baseFiatCurrency)}</BlueText>)}
            onPress={() => navigation.navigate(UNSETTLED_ASSETS)}
            color={colors.text}
            bordered
            disabled={!!disableTopUpAndSettle}
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
              disabled={disableTopUpAndSettle}
            />
          </FloatingButtonView>
        }
        <SWActivationModal
          navigation={navigation}
          isVisible={isInitSmartWalletModalVisible}
          onClose={this.closeSmartWalletModal}
        />
      </View>
    );
  }
}

const mapStateToProps = ({
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
  smartWallet: smartWalletState,
  accounts: { data: accounts },
  balances: { data: balances },
}: RootReducerState): $Shape<Props> => ({
  rates,
  baseFiatCurrency,
  smartWalletState,
  accounts,
  balances,
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
});

export default withTheme(withNavigation(connect(combinedMapStateToProps, mapDispatchToProps)(PPNView)));
