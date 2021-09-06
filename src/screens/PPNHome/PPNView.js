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
import { ScrollView, View } from 'react-native';
import styled, { withTheme } from 'styled-components/native';
import { createStructuredSelector } from 'reselect';
import { withNavigation } from 'react-navigation';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';

// actions
import { fetchVirtualAccountBalanceAction } from 'actions/smartWalletActions';
import { fetchTransactionsHistoryAction } from 'actions/historyActions';

// components
import { BaseText } from 'components/legacy/Typography';
import CircleButton from 'components/CircleButton';
import { ListItemChevron } from 'components/legacy/ListItem/ListItemChevron';
import Tabs from 'components/legacy/Tabs';
import Button from 'components/legacy/Button';
import ActivityFeed from 'components/legacy/ActivityFeed';
import InsightWithButton from 'components/InsightWithButton';
import RefreshControl from 'components/RefreshControl';
import SWActivationModal from 'components/SWActivationModal';
import Modal from 'components/Modal';

// constants
import { defaultFiatCurrency, PLR } from 'constants/assetsConstants';
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
  ARCHANOVA_PPN_PAYMENT_COMPLETED,
  ARCHANOVA_WALLET_UPGRADE_STATUSES,
} from 'constants/archanovaConstants';
import {
  PAYMENT_NETWORK_ACCOUNT_TOPUP,
  PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL,
  PAYMENT_NETWORK_TX_SETTLEMENT,
} from 'constants/paymentNetworkConstants';
import { CHAIN } from 'constants/chainConstants';

// types
import type { Account } from 'models/Account';
import type { ArchanovaWalletStatus } from 'models/ArchanovaWalletStatus';
import type { Transaction } from 'models/Transaction';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Theme } from 'models/Theme';
import type { WalletAssetsBalances } from 'models/Balances';
import type { Currency, RatesPerChain } from 'models/Rates';

// utils
import { addressesEqual } from 'utils/assets';
import { formatMoney, formatFiat } from 'utils/common';
import { mapTransactionsHistory } from 'utils/feedData';
import { getArchanovaWalletStatus, isDeployingArchanovaWallet, isHiddenUnsettledTransaction } from 'utils/archanova';
import { fontSizes, fontStyles, spacing } from 'utils/variables';
import { getThemeColors, themedColors } from 'utils/themes';
import { findFirstArchanovaAccount } from 'utils/accounts';
import { nativeAssetPerChain } from 'utils/chains';
import { getAssetRateInFiat } from 'utils/rates';

// selectors
import {
  availableStakeSelector,
  paymentNetworkNonZeroBalancesSelector,
  PPNTransactionsSelector,
} from 'selectors/paymentNetwork';
import { archanovaAccountEthereumHistorySelector } from 'selectors/history';
import { activeAccountAddressSelector } from 'selectors';
import { accountEthereumWalletAssetsBalancesSelector } from 'selectors/balances';


type Props = {
  baseFiatCurrency: ?Currency,
  ratesPerChain: RatesPerChain,
  navigation: NavigationScreenProp<*>,
  availableStake: number,
  assetsOnNetwork: Object,
  fetchVirtualAccountBalance: () => void,
  accounts: Account[],
  smartWalletState: Object,
  PPNTransactions: Transaction[],
  history: Transaction[],
  fetchTransactionsHistory: () => void,
  theme: Theme,
  onScroll: (event: Object) => void,
  activeAccountAddress: string,
  balances: WalletAssetsBalances,
};

type State = {
  activeTab: string,
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

/**
 * This is legacy PPN Home screen extracted from legacy Assets screen.
 */
class PPNView extends React.Component<Props, State> {
  state = {
    activeTab: INCOMING,
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
    const archanovaAccount = findFirstArchanovaAccount(accounts);

    const isDeploying = isDeployingArchanovaWallet(smartWalletState, accounts);
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
              {t('insight.pillarNetworkActivate.deploying.description.smartWalletActivatingStatusCard')}
            </BaseText>
          }
        />
      );
    }

    const archanovaWalletStatus: ArchanovaWalletStatus = getArchanovaWalletStatus(accounts, smartWalletState);

    if (archanovaAccount && archanovaWalletStatus.status === ARCHANOVA_WALLET_UPGRADE_STATUSES.DEPLOYMENT_COMPLETE) {
      const hasPLRInArchanovaWallet = parseInt(balances?.[PLR]?.balance ?? 0, 10) > 0;

      if (!availableStake) {
        const insightProps = {};
        if (!hasPLRInArchanovaWallet) {
          insightProps.buttonTitle = t('button.notEnoughPLR');
          insightProps.buttonProps = { disabled: true, secondary: true };
          insightProps.footerChildren = (
            <Button
              title={t('button.buyPLR')}
              small
              marginTop={12}
              onPress={this.navigateToBuyPillar}
            />);
        } else {
          insightProps.buttonTitle = t('button.topUpPLRTank');
          insightProps.onButtonPress = this.navigateToFundTank;
        }
        return (
          <InsightWithButton
            title={t('insight.pillarNetworkActivate.hasNoPPNBalance.title')}
            description={t('insight.pillarNetworkActivate.hasNoPPNBalance.description.activationBenefit')}
            {...insightProps}
          />
        );
      }

      return null;
    } else if (archanovaWalletStatus.status === ARCHANOVA_WALLET_UPGRADE_STATUSES.ACCOUNT_CREATED) {
      return (
        <InsightWithButton
          title={t('insight.pillarNetworkActivate.smartWalletIsNotActivated.title')}
          itemsList={[
            t('insight.pillarNetworkActivate.smartWalletIsNotActivated.description.instantTransactions'),
            t('insight.pillarNetworkActivate.smartWalletIsNotActivated.description.singleTokenExperience')]}
          buttonTitle={t('insight.pillarNetworkActivate.smartWalletIsNotActivated.button.activatePPN')}
          onButtonPress={this.openArchanovaActivationModal}
        />
      );
    }

    return null;
  };

  openArchanovaActivationModal = () => Modal.open(() => <SWActivationModal navigation={this.props.navigation} />);

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
      baseFiatCurrency,
      ratesPerChain,
      history,
      fetchTransactionsHistory,
      theme,
      onScroll,
      activeAccountAddress,
    } = this.props;
    const colors = getThemeColors(theme);
    const ethereumRates = ratesPerChain[CHAIN.ETHEREUM] ?? {};

    let incomingBalanceInFiat = 0;
    const assetsOnNetworkArray = Object.values(assetsOnNetwork);
    if (assetsOnNetworkArray.length) {
      incomingBalanceInFiat = assetsOnNetworkArray.reduce((totalInFiat, incomingAsset) => {
        // $FlowFixMe: legacy screen
        const assetAddress = incomingAsset?.address || nativeAssetPerChain.ethereum.address;
        // $FlowFixMe: legacy screen
        const assetBalance = incomingAsset?.balance ?? 0;
        const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
        const tokenRate = getAssetRateInFiat(ethereumRates, assetAddress, fiatCurrency);
        return totalInFiat + (+assetBalance * tokenRate);
      }, 0);
    }

    const availableFormattedAmount = formatMoney(availableStake, 4);
    const archanovaWalletStatus: ArchanovaWalletStatus = getArchanovaWalletStatus(accounts, smartWalletState);
    const { upgrade: { status: smartWalletUpgradeStatus } } = smartWalletState;
    const sendingBlockedMessage = smartWalletUpgradeStatus === ARCHANOVA_WALLET_UPGRADE_STATUSES.ACCOUNT_CREATED
      ? {
        title: t('insight.smartWalletActivate.default.title'),
        message: t('insight.smartWalletActivate.default.description'),
      }
      : archanovaWalletStatus.sendingBlockedMessage || {};
    const disableTopUpAndSettle = !!Object.keys(sendingBlockedMessage).length;

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
          } else if (stateInPPN === ARCHANOVA_PPN_PAYMENT_COMPLETED && !isHiddenUnsettledTransaction(hash, history)) {
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
        name: t('ppnContent.tabs.incoming.title'),
        onPress: () => this.setActiveTab(INCOMING),
        data: PPNTransactionsGrouped.incoming,
        emptyState: {
          title: t('ppnContent.tabs.incoming.emptyState.title'),
        },
      },
      {
        id: SENT,
        name: t('ppnContent.tabs.sent.title'),
        onPress: () => this.setActiveTab(SENT),
        data: PPNTransactionsGrouped.sent,
        emptyState: {
          title: t('ppnContent.tabs.sent.emptyState.title'),
        },
      },
      {
        id: SETTLED,
        name: t('ppnContent.tabs.settled.title'),
        onPress: () => this.setActiveTab(SETTLED),
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
                {t('tokenValue', { value: availableFormattedAmount, token: 'PLR' })}
              </TankBalance>
            </TankBalanceWrapper>
            <AssetButtonsWrapper>
              <CircleButton
                label={t('button.topUp')}
                onPress={this.navigateToFundTank}
                fontIcon="plus"
                fontIconStyle={{ fontSize: fontSizes.big }}
                disabled={disableTopUpAndSettle}
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
            label={t('label.incomingBalance')}
            rightAddon={(<BlueText>{formatFiat(incomingBalanceInFiat, baseFiatCurrency)}</BlueText>)}
            onPress={() => { navigation.navigate(UNSETTLED_ASSETS); }}
            color={colors.text}
            bordered
            disabled={disableTopUpAndSettle}
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
              disabled={disableTopUpAndSettle}
            />
          </FloatingButtonView>
        }
      </View>
    );
  }
}

const mapStateToProps = ({
  rates: { data: ratesPerChain },
  appSettings: { data: { baseFiatCurrency } },
  smartWallet: smartWalletState,
  accounts: { data: accounts },
}: RootReducerState): $Shape<Props> => ({
  ratesPerChain,
  baseFiatCurrency,
  smartWalletState,
  accounts,
});

const structuredSelector = createStructuredSelector({
  assetsOnNetwork: paymentNetworkNonZeroBalancesSelector,
  availableStake: availableStakeSelector,
  PPNTransactions: PPNTransactionsSelector,
  history: archanovaAccountEthereumHistorySelector,
  activeAccountAddress: activeAccountAddressSelector,
  balances: accountEthereumWalletAssetsBalancesSelector,
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
