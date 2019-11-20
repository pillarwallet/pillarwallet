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
import styled from 'styled-components/native';
import { SDK_PROVIDER } from 'react-native-dotenv';
import { createStructuredSelector } from 'reselect';
import { withNavigation } from 'react-navigation';
import get from 'lodash.get';
import type { NavigationScreenProp } from 'react-navigation';

// actions
import { fetchVirtualAccountBalanceAction } from 'actions/smartWalletActions';

// components
import { BaseText, MediumText } from 'components/Typography';
import DeploymentView from 'components/DeploymentView';
import CircleButton from 'components/CircleButton';
import { ListItemChevron } from 'components/ListItem/ListItemChevron';
import Tabs from 'components/Tabs';
import Button from 'components/Button';
import ActivityFeed from 'components/ActivityFeed';

// constants
import { defaultFiatCurrency, ETH, PLR } from 'constants/assetsConstants';
import { TRANSACTION_EVENT } from 'constants/historyConstants';
import {
  FUND_TANK,
  SEND_TOKEN_FROM_ASSET_FLOW,
  SETTLE_BALANCE,
  SMART_WALLET_INTRO,
  UNSETTLED_ASSETS,
  TANK_WITHDRAWAL,
} from 'constants/navigationConstants';
import { PAYMENT_COMPLETED, PAYMENT_PROCESSED, SMART_WALLET_UPGRADE_STATUSES } from 'constants/smartWalletConstants';

// models
import type { Accounts } from 'models/Account';
import type { Asset, Assets, Balances } from 'models/Asset';
import type { ApiUser, ContactSmartAddressData } from 'models/Contacts';
import type { SmartWalletStatus } from 'models/SmartWalletStatus';
import type { Transaction } from 'models/Transaction';

// utils
import { getRate } from 'utils/assets';
import { getAccountAddress } from 'utils/accounts';
import { formatMoney, formatFiat } from 'utils/common';
import { mapTransactionsHistory } from 'utils/feedData';
import { getSmartWalletStatus, isHiddenUnsettledTransaction } from 'utils/smartWallet';
import { baseColors, fontSizes, fontStyles, spacing } from 'utils/variables';

// selectors
import { activeAccountSelector } from 'selectors';
import {
  availableStakeSelector,
  paymentNetworkAccountBalancesSelector,
  paymentNetworkNonZeroBalancesSelector,
  PPNTransactionsSelector,
} from 'selectors/paymentNetwork';
import { accountAssetsSelector } from 'selectors/assets';
import { accountHistorySelector } from 'selectors/history';


type Props = {
  baseFiatCurrency: string,
  assets: Assets,
  rates: Object,
  balances: Balances,
  paymentNetworkBalances: Balances,
  activeAccount: Object,
  navigation: NavigationScreenProp<*>,
  availableStake: number,
  supportedAssets: Asset[],
  assetsOnNetwork: Object,
  fetchVirtualAccountBalance: Function,
  accounts: Accounts,
  smartWalletState: Object,
  availableToSettleTx: Object[],
  PPNTransactions: Transaction[],
  contacts: ApiUser[],
  contactsSmartAddresses: ContactSmartAddressData[],
  history: Object[],
}

type State = {
  activeTab: string,
}

const AssetButtonsWrapper = styled.View`
  flex-direction: row;
  justify-content: center;
`;

const TopPartWrapper = styled.View`
  padding: ${spacing.large}px;
  background-color: ${baseColors.surface};
  border-bottom-width: 1;
  border-color: ${baseColors.border};
`;

const SectionTitle = styled(MediumText)`
  ${fontStyles.regular};
  color: ${baseColors.accent};
`;

const TankBalanceWrapper = styled.View`
  padding: ${spacing.large}px 40px;
  align-items: center;
`;

const TankBalance = styled(BaseText)`
  font-size: ${fontSizes.giant}px;
  color: ${baseColors.text};
`;

const BlueText = styled(BaseText)`
  color: ${baseColors.primary};
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

const iconSend = require('assets/icons/icon_send.png');

const UNSETTLED = 'UNSETTLED';
const SETTLED = 'SETTLED';

class PPNView extends React.Component<Props, State> {
  state = {
    activeTab: UNSETTLED,
  };

  goToSend = () => {
    const {
      navigation,
      assets,
      activeAccount,
      baseFiatCurrency,
      rates,
      availableStake,
    } = this.props;
    const thisAsset = assets[PLR] || {};

    const {
      name,
      symbol,
      iconMonoUrl,
      decimals,
      iconUrl,
      patternUrl,
      address,
      description,
    } = thisAsset;
    const fullIconUrl = iconUrl ? `${SDK_PROVIDER}/${iconUrl}?size=3` : '';
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const paymentNetworkBalanceFormatted = formatMoney(availableStake, 4);
    const totalInFiat = availableStake * getRate(rates, PLR, fiatCurrency);
    const formattedAmountInFiat = formatFiat(totalInFiat, baseFiatCurrency);
    const assetData = {
      id: PLR,
      name: name || symbol,
      token: symbol,
      amount: paymentNetworkBalanceFormatted,
      balanceInFiat: formattedAmountInFiat,
      address: getAccountAddress(activeAccount),
      contractAddress: address,
      icon: iconMonoUrl ? `${SDK_PROVIDER}/${iconMonoUrl}?size=2` : '',
      iconColor: fullIconUrl,
      patternIcon: patternUrl ? `${SDK_PROVIDER}/${patternUrl}?size=3` : fullIconUrl,
      description,
      decimals,
      isSynthetic: true,
      isListed: true,
    };
    navigation.navigate(SEND_TOKEN_FROM_ASSET_FLOW, { assetData });
  };

  setActiveTab = (activeTab) => {
    this.setState({ activeTab });
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
    } = this.props;

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
        title: 'To top up PLR Tank or Settle transactions, deploy Smart Wallet first',
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
                fetchVirtualAccountBalance();
              }}
            />
          }
        >
          {!!disableTopUpAndSettle &&
          <DeploymentView
            message={sendingBlockedMessage}
            buttonLabel="Deploy Smart Wallet"
            buttonAction={() => navigation.navigate(SMART_WALLET_INTRO, { deploy: true })}
          />}
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
                disabled={!!disableTopUpAndSettle}
              />
              <CircleButton
                label="Withdraw"
                fontIcon="up-arrow"
                onPress={() => navigation.navigate(TANK_WITHDRAWAL)}
                disabled={availableStake <= 0}
              />
              <CircleButton
                label="Send"
                icon={iconSend}
                onPress={this.goToSend}
                disabled={availableStake <= 0}
              />
            </AssetButtonsWrapper>
          </TopPartWrapper>
          {incomingBalanceInFiat > 0 &&
          <ListItemChevron
            wrapperStyle={{
              borderTopWidth: 0,
              borderBottomWidth: 1,
              borderColor: baseColors.border,
            }}
            chevronStyle={{ color: baseColors.secondaryText }}
            label="Incoming balance"
            rightAddon={(<BlueText>{formatFiat(incomingBalanceInFiat, baseFiatCurrency)}</BlueText>)}
            onPress={() => navigation.navigate(UNSETTLED_ASSETS)}
            color={baseColors.text}
            bordered
          />}
          <Tabs
            tabs={historyTabs}
            wrapperStyle={{ paddingTop: 16 }}
          />
          <ActivityFeed
            backgroundColor={baseColors.card}
            navigation={navigation}
            tabs={historyTabs}
            activeTab={activeTab}
            hideTabs
            initialNumToRender={6}
            wrapperStyle={{ flexGrow: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
          />
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
  assets: { supportedAssets },
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency, appearanceSettings: { assetsLayout } } },
  smartWallet: smartWalletState,
  accounts: { data: accounts },
  paymentNetwork: { balances, availableToSettleTx: { data: availableToSettleTx, isFetched } },
  contacts: { data: contacts, contactsSmartAddresses: { addresses: contactsSmartAddresses } },
}) => ({
  rates,
  baseFiatCurrency,
  assetsLayout,
  supportedAssets,
  smartWalletState,
  accounts,
  balances,
  availableToSettleTx,
  isFetched,
  contacts,
  contactsSmartAddresses,
});

const structuredSelector = createStructuredSelector({
  paymentNetworkBalances: paymentNetworkAccountBalancesSelector,
  assetsOnNetwork: paymentNetworkNonZeroBalancesSelector,
  availableStake: availableStakeSelector,
  activeAccount: activeAccountSelector,
  PPNTransactions: PPNTransactionsSelector,
  assets: accountAssetsSelector,
  history: accountHistorySelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch) => ({
  fetchVirtualAccountBalance: () => dispatch(fetchVirtualAccountBalanceAction()),
});

export default withNavigation(connect(combinedMapStateToProps, mapDispatchToProps)(PPNView));
