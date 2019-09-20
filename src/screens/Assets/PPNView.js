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
import { RefreshControl, ScrollView } from 'react-native';
import styled from 'styled-components/native';
import { SDK_PROVIDER } from 'react-native-dotenv';
import { createStructuredSelector } from 'reselect';
import { withNavigation } from 'react-navigation';
import get from 'lodash.get';

import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import { BaseText, MediumText } from 'components/Typography';
import TankAssetBalance from 'components/TankAssetBalance';
import DeploymentView from 'components/DeploymentView';
import CircleButton from 'components/CircleButton';
import { ListItemChevron } from 'components/ListItem/ListItemChevron';
import Tabs from 'components/Tabs';

import {
  calculateBalanceInFiat,
  getRate,
} from 'utils/assets';
import { formatMoney, formatFiat } from 'utils/common';
import { baseColors, fontSizes, spacing } from 'utils/variables';
import { getAccountAddress } from 'utils/accounts';
import { getSmartWalletStatus } from 'utils/smartWallet';

import { defaultFiatCurrency, ETH, PLR, TOKENS } from 'constants/assetsConstants';
import {
  ASSET,
  FUND_TANK,
  SEND_TOKEN_FROM_ASSET_FLOW,
  SETTLE_BALANCE,
  SMART_WALLET_INTRO, UNSETTLED_ASSETS,
} from 'constants/navigationConstants';
import { SMART_WALLET_UPGRADE_STATUSES } from 'constants/smartWalletConstants';

import { activeAccountSelector } from 'selectors';
import {
  availableStakeSelector,
  paymentNetworkAccountBalancesSelector,
  paymentNetworkNonZeroBalancesSelector,
} from 'selectors/paymentNetwork';
import type { Asset, Assets, Balances } from 'models/Asset';
import type { SmartWalletStatus } from 'models/SmartWalletStatus';
import type { NavigationScreenProp } from 'react-navigation';
import type { Accounts } from 'models/Account';

import { fetchVirtualAccountBalanceAction } from 'actions/smartWalletActions';
import { responsiveSize } from 'utils/ui';
import ActivityFeed from 'components/ActivityFeed';

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
}

type State = {
  activeTab: string,
}

const AssetButtonsWrapper = styled.View`
  flex-direction: row;
  justify-content: center;
`;

const ListHeaderWrapper = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: ${spacing.large}px;
`;

const TopPartWrapper = styled.View`
  padding: 36px ${spacing.large}px;
  background-color: ${baseColors.snowWhite};
  border-bottom-width: 1;
  border-color: ${baseColors.mediumLightGray};
`;

const SectionTitle = styled(MediumText)`
  font-size: ${fontSizes.extraSmall}px;
  color: ${baseColors.blueYonder};
`;

const TankBalanceWrapper = styled.View`
  padding: ${spacing.large}px 40px;
  align-items: center;
`;

const TankBalance = styled(BaseText)`
  font-size: ${responsiveSize(36)}px;
  color: ${baseColors.slateBlack};
`;

const HeaderButton = styled.TouchableOpacity`
  background-color: ${props => props.disabled ? baseColors.lightGray : baseColors.electricBlue};
  border-radius: 3px;
  padding: 6px 12px;
`;

const ButtonText = styled(MediumText)`
  font-size: ${fontSizes.extraExtraSmall}px;
  color: ${props => props.disabled ? baseColors.darkGray : baseColors.white};
`;

const AddonWrapper = styled.View`
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
`;

const BalanceWrapper = styled.View`
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-end;
`;

const ValueInFiat = styled(BaseText)`
  color: ${baseColors.coolGrey};
  font-size: ${fontSizes.extraExtraSmall}px;
`;

const BlueText = styled(BaseText)`
  color: ${baseColors.electricBlue};
  font-size: ${fontSizes.extraSmall}px;
  margin-right: ${spacing.medium}px;
`;

const iconSend = require('assets/icons/icon_send.png');
const genericToken = require('assets/images/tokens/genericToken.png');

const UNSETTLED = 'UNSETTLED';
const SETTLED = 'SETTLED';

class PPNView extends React.Component<Props, State> {
  initialAssets = [{ balance: '0', symbol: ETH }, { balance: '0', symbol: PLR }];
  state = {
    activeTab: UNSETTLED,
  };

  renderAsset = ({ item }) => {
    const {
      baseFiatCurrency,
      assets,
      rates,
      navigation,
      activeAccount,
    } = this.props;

    const tokenSymbol = get(item, 'symbol', ETH);
    const tokenBalance = get(item, 'balance', '0');
    const paymentNetworkBalanceFormatted = formatMoney(tokenBalance, 4);
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const totalInFiat = tokenBalance * getRate(rates, tokenSymbol, fiatCurrency);
    const formattedAmountInFiat = formatFiat(totalInFiat, baseFiatCurrency);
    const thisAsset = assets[tokenSymbol] || {};

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

    const assetInfo = {
      id: tokenSymbol,
      name: name || symbol,
      token: symbol,
      amount: paymentNetworkBalanceFormatted,
      balanceInFiat: { amount: formattedAmountInFiat, currency: fiatCurrency },
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

    return (
      <ListItemWithImage
        onPress={() => {
          navigation.navigate(ASSET,
            {
              assetData: {
                ...assetInfo,
                tokenType: TOKENS,
              },
            },
          );
        }}
        label={assetInfo.name}
        itemImageUrl={fullIconUrl || genericToken}
        fallbackSource={genericToken}
        customAddon={
          <AddonWrapper>
            <BalanceWrapper>
              <TankAssetBalance amount={paymentNetworkBalanceFormatted} monoColor />
              <ValueInFiat>
                {formattedAmountInFiat}
              </ValueInFiat>
            </BalanceWrapper>
          </AddonWrapper>
        }
        rightColumnInnerStyle={{ flexDirection: 'row' }}
      />
    );
  };

  renderHeader = (disableSettle: boolean) => {
    const {
      assetsOnNetwork,
      navigation,
      rates,
      baseFiatCurrency,
      balances,
    } = this.props;

    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const balance = calculateBalanceInFiat(rates, balances, fiatCurrency);
    const PPNBalance = formatFiat(balance, baseFiatCurrency);
    const disabled = !Object.keys(assetsOnNetwork).length || disableSettle;

    return (
      <ListHeaderWrapper>
        <SectionTitle>{`Balance ${PPNBalance}`}</SectionTitle>
        <HeaderButton
          onPress={() => navigation.navigate(SETTLE_BALANCE)}
          disabled={disabled}
        >
          <ButtonText disabled={disabled}>Settle</ButtonText>
        </HeaderButton>
      </ListHeaderWrapper>
    );
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
    } = this.props;

    const assetsOnNetworkArray = Object.values(assetsOnNetwork);
    const availableFormattedAmount = formatMoney(availableStake, 4);
    const smartWalletStatus: SmartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);
    const { upgrade: { status } } = smartWalletState;
    const sendingBlockedMessage = status === SMART_WALLET_UPGRADE_STATUSES.ACCOUNT_CREATED
      ? {
        title: 'To top up PLR Tank or Settle transactions, deploy Smart Wallet first',
        message: 'You will have to pay a small fee',
      }
      : smartWalletStatus.sendingBlockedMessage || {};
    const disableTopUpAndSettle = Object.keys(sendingBlockedMessage).length;

    const historyTabs = [
      {
        id: UNSETTLED,
        name: 'Unsettled',
        onPress: () => this.setActiveTab(UNSETTLED),
        data: [],
        emptyState: {
          title: 'No unsettled transactions',
        },
      },
      {
        id: SETTLED,
        name: 'Settled',
        onPress: () => this.setActiveTab(SETTLED),
        data: [],
        emptyState: {
          title: 'No settled transactions',
        },
      },
    ];

    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
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
              fontIcon="up-arrow"
              disabled={!!disableTopUpAndSettle}
            />
            { /* <CircleButton
            label="Withdraw"
            fontIcon="down-arrow"
            onPress={() => {}}
            disabled={availableStake <= 0}
          /> */ }
            <CircleButton
              label="Send"
              icon={iconSend}
              onPress={this.goToSend}
              disabled={availableStake <= 0}
            />
          </AssetButtonsWrapper>
        </TopPartWrapper>
        {!!assetsOnNetworkArray.length &&
        <ListItemChevron
          wrapperStyle={{
            borderTopWidth: 0,
            borderBottomWidth: 1,
            borderColor: baseColors.mediumLightGray,
          }}
          chevronStyle={{ color: baseColors.darkGray }}
          label="Unsettled Balance"
          rightAddon={(<BlueText>11.11</BlueText>)}
          onPress={() => navigation.navigate(UNSETTLED_ASSETS)}
          color={baseColors.slateBlack}
          bordered
        />}
        <Tabs
          tabs={historyTabs}
          wrapperStyle={{ paddingTop: 16 }}
        />
        <ActivityFeed
          backgroundColor={baseColors.white}
          navigation={navigation}
          tabs={historyTabs}
          activeTab={activeTab}
          hideTabs
          initialNumToRender={6}
          wrapperStyle={{ flexGrow: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
        />
      </ScrollView>
    );
  }
}

const mapStateToProps = ({
  assets: { data: assets, supportedAssets },
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency, appearanceSettings: { assetsLayout } } },
  smartWallet: smartWalletState,
  accounts: { data: accounts },
  paymentNetwork: { balances, availableToSettleTx: { data: availableToSettleTx, isFetched } },
}) => ({
  assets,
  rates,
  baseFiatCurrency,
  assetsLayout,
  supportedAssets,
  smartWalletState,
  accounts,
  balances,
  availableToSettleTx,
  isFetched,
});

const structuredSelector = createStructuredSelector({
  paymentNetworkBalances: paymentNetworkAccountBalancesSelector,
  assetsOnNetwork: paymentNetworkNonZeroBalancesSelector,
  availableStake: availableStakeSelector,
  activeAccount: activeAccountSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch) => ({
  fetchVirtualAccountBalance: () => dispatch(fetchVirtualAccountBalanceAction()),
});

export default withNavigation(connect(combinedMapStateToProps, mapDispatchToProps)(PPNView));
