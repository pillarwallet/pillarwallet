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
import { FlatList } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import styled from 'styled-components/native';
import { SDK_PROVIDER } from 'react-native-dotenv';

import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Assets, Balances } from 'models/Asset';
import type { Collectible } from 'models/Collectible';
import type { Accounts } from 'models/Account';
import type { SmartWalletStatus } from 'models/SmartWalletStatus';
import { fetchAssetsBalancesAction } from 'actions/assetsActions';
import { fetchAllCollectiblesDataAction } from 'actions/collectiblesActions';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { Wrapper } from 'components/Layout';
import Separator from 'components/Separator';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import Tabs from 'components/Tabs';
import TankAssetBalance from 'components/TankAssetBalance';
import SWActivationCard from 'components/SWActivationCard';

import { formatAmount, formatMoney } from 'utils/common';
import { getAssetsAsList, getBalance } from 'utils/assets';
import { spacing } from 'utils/variables';
import { getSmartWalletStatus } from 'utils/smartWallet';

import {
  SEND_TOKEN_AMOUNT,
  SEND_COLLECTIBLE_CONFIRM,
  SEND_TOKEN_ASSETS,
} from 'constants/navigationConstants';
import { ETH, TOKENS, COLLECTIBLES, BTC } from 'constants/assetsConstants';

import assetsConfig from 'configs/assetsConfig';

import { accountBalancesSelector } from 'selectors/balances';
import { accountCollectiblesSelector } from 'selectors/collectibles';
import { paymentNetworkAccountBalancesSelector } from 'selectors/paymentNetwork';
import { accountAssetsSelector } from 'selectors/assets';


type Props = {
  fetchAssetsBalances: () => void,
  assets: Assets,
  balances: Balances,
  navigation: NavigationScreenProp<*>,
  fetchAllCollectiblesData: () => void,
  collectibles: Collectible[],
  paymentNetworkBalances: Balances,
  accounts: Accounts,
  smartWalletState: Object,
};

type State = {
  activeTab: string,
}

type NextScreenAssetData = {
  token: string,
  contractAddress: string,
  decimals: number,
  icon: string,
  iconColor: string,
};

type NextScreenCollectibleData = {
  assetContract: string,
  category: string,
  contractAddress: string,
  description: string,
  icon: string,
  id: string,
  tokenType: string,
};


const ContentBackground = styled(Wrapper)`
   flex: 1;
`;

const InnerWrapper = styled(Wrapper)`
   flex: 1;
   margin-top: ${spacing.large}px;
`;


class SendTokenAssetsScreen extends React.Component<Props, State> {
  state = {
    activeTab: TOKENS,
  };

  getReceiverAddress = () => {
    const { navigation } = this.props;
    const contact = navigation.getParam('contact', {});
    return contact.ethAddress;
  };

  proceedSendingAsset = (nextScreenAssetData: NextScreenAssetData) => {
    const {
      token,
      contractAddress,
      decimals,
      icon,
      iconColor,
    } = nextScreenAssetData;

    this.props.navigation.navigate(SEND_TOKEN_AMOUNT, {
      assetData: {
        token,
        contractAddress,
        decimals,
        icon,
        iconColor,
      },
      receiver: this.getReceiverAddress(),
      source: 'Assets',
    });
  };

  proceedSendingCollectible = (assetData: NextScreenCollectibleData) => {
    this.props.navigation.navigate(SEND_COLLECTIBLE_CONFIRM, {
      assetData,
      receiver: this.getReceiverAddress(),
      source: 'Assets',
      backTo: SEND_TOKEN_ASSETS,
    });
  };

  renderAsset = ({ item }) => {
    const { balances, paymentNetworkBalances } = this.props;
    const assetBalance = formatAmount(getBalance(balances, item.symbol));
    const fullIconUrl = `${SDK_PROVIDER}/${item.iconUrl}?size=3`;
    const fullIconMonoUrl = `${SDK_PROVIDER}/${item.iconMonoUrl}?size=2`;
    const assetShouldRender = assetsConfig[item.symbol] && !assetsConfig[item.symbol].send;
    const paymentNetworkBalance = getBalance(paymentNetworkBalances, item.symbol);
    const paymentNetworkBalanceFormatted = formatMoney(paymentNetworkBalance, 4);

    const nextScreenAssetData = {
      token: item.symbol,
      contractAddress: item.address,
      decimals: item.decimals,
      icon: fullIconMonoUrl,
      iconColor: fullIconUrl,
    };
    if (assetShouldRender) {
      return null;
    }

    return (
      <ListItemWithImage
        onPress={() => this.proceedSendingAsset(nextScreenAssetData)}
        label={item.name}
        itemImageUrl={fullIconUrl}
        itemValue={`${assetBalance} ${item.symbol}`}
        fallbackToGenericToken
        customAddon={paymentNetworkBalance ? (
          <TankAssetBalance
            amount={paymentNetworkBalanceFormatted}
            isSynthetic={item.symbol !== ETH}
          />)
          : null
        }
        rightColumnInnerStyle={{ alignItems: 'flex-end' }}
      />
    );
  };

  renderCollectible = ({ item }) => {
    return (
      <ListItemWithImage
        onPress={() => this.proceedSendingCollectible(item)}
        label={item.name}
        itemImageUrl={item.icon}
        fallbackToGenericToken
      />
    );
  };

  refreshAssetsList = () => {
    const { fetchAssetsBalances } = this.props;
    fetchAssetsBalances();
  };

  setActiveTab = (activeTab) => {
    this.setState({ activeTab });
  };

  renderAssets = () => {
    const { assets, balances } = this.props;
    const assetsArray = getAssetsAsList(assets).filter(({ symbol }) => symbol !== BTC);
    const nonEmptyAssets = assetsArray.filter((asset: any) => {
      return getBalance(balances, asset.symbol) !== 0;
    });

    return (
      <FlatList
        keyExtractor={item => item.symbol}
        data={nonEmptyAssets}
        renderItem={this.renderAsset}
        ItemSeparatorComponent={() => <Separator spaceOnLeft={82} />}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: 45,
        }}
        refreshing={false}
        onRefresh={this.refreshAssetsList}
        ListEmptyComponent={
          <Wrapper
            fullScreen
            style={{
              paddingTop: 90,
              paddingBottom: 90,
              alignItems: 'center',
            }}
          >
            <EmptyStateParagraph title="No assets to send" bodyText="None of your assets have a balance" />
          </Wrapper>
        }
      />
    );
  };

  renderCollectibles = () => {
    const { collectibles, fetchAllCollectiblesData } = this.props;

    return (
      <FlatList
        keyExtractor={item => `${item.assetContract}${item.id}`}
        data={collectibles}
        renderItem={this.renderCollectible}
        ItemSeparatorComponent={() => <Separator spaceOnLeft={82} />}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: 45,
        }}
        refreshing={false}
        onRefresh={fetchAllCollectiblesData}
        ListEmptyComponent={
          <Wrapper
            fullScreen
            style={{
              paddingTop: 90,
              paddingBottom: 90,
              alignItems: 'center',
            }}
          >
            <EmptyStateParagraph title="No collectibles to send" bodyText="There are no collectibles in this wallet" />
          </Wrapper>
        }
      />
    );
  };

  render() {
    const { navigation, accounts, smartWalletState } = this.props;
    const { activeTab } = this.state;
    const contact = navigation.getParam('contact', {});
    const contactUsername = contact.username;

    const assetsTabs = [
      {
        id: TOKENS,
        name: 'Tokens',
        onPress: () => this.setActiveTab(TOKENS),
      },
      {
        id: COLLECTIBLES,
        name: 'Collectibles',
        onPress: () => this.setActiveTab(COLLECTIBLES),
      },
    ];

    const smartWalletStatus: SmartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);
    const sendingBlockedMessage = smartWalletStatus.sendingBlockedMessage || {};
    const disableSend = !!Object.keys(sendingBlockedMessage).length;

    return (
      <ContainerWithHeader
        inset={{ bottom: 0 }}
        headerProps={{ centerItems: [{ title: `Send to ${contactUsername}` }] }}
      >
        {disableSend &&
          <SWActivationCard
            message="To start sending and exchanging assets you need to activate Smart Wallet"
          />
        }
        {!disableSend &&
        <ContentBackground>
          <InnerWrapper>
            <Tabs tabs={assetsTabs} isFloating activeTab={activeTab} />
            {activeTab === TOKENS && this.renderAssets()}
            {activeTab === COLLECTIBLES && this.renderCollectibles()}
          </InnerWrapper>
        </ContentBackground>}
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  accounts: { data: accounts },
  smartWallet: smartWalletState,
}: RootReducerState): $Shape<Props> => ({
  accounts,
  smartWalletState,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  collectibles: accountCollectiblesSelector,
  paymentNetworkBalances: paymentNetworkAccountBalancesSelector,
  assets: accountAssetsSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchAssetsBalances: () => dispatch(fetchAssetsBalancesAction()),
  fetchAllCollectiblesData: () => dispatch(fetchAllCollectiblesDataAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(SendTokenAssetsScreen);
