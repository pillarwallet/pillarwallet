// @flow
import * as React from 'react';
import { Share, RefreshControl, Platform, View } from 'react-native';
import { baseColors, UIColors, spacing } from 'utils/variables';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { fetchAssetsBalancesAction } from 'actions/assetsActions';
import { fetchTransactionsHistoryAction } from 'actions/historyActions';
import type { Transaction } from 'models/Transaction';
import type { Assets, Balances } from 'models/Asset';
import AssetCard from 'components/AssetCard';
import AssetButtons from 'components/AssetButtons';
import ActivityFeed from 'components/ActivityFeed';
import TruncatedText from 'components/TruncatedText';
import Header from 'components/Header';
import { Container, ScrollWrapper } from 'components/Layout';
import { SEND_TOKEN_FROM_ASSET_FLOW } from 'constants/navigationConstants';
import { defaultFiatCurrency } from 'constants/assetsConstants';
import { TRANSACTIONS } from 'constants/activityConstants';
import { formatMoney } from 'utils/common';
import { getBalance, getRate } from 'utils/assets';
import assetsConfig from 'configs/assetsConfig';
import ReceiveModal from './ReceiveModal';

const RECEIVE = 'RECEIVE';

const activeModalResetState = {
  type: null,
  opts: {
    address: '',
    token: '',
    tokenName: '',
  },
};

type Props = {
  fetchAssetsBalances: (assets: Assets, walletAddress: string) => Function,
  fetchTransactionsHistory: (walletAddress: string, asset: string, indexFrom?: number) => Function,
  history: Transaction[],
  assets: Assets,
  balances: Balances,
  wallet: Object,
  rates: Object,
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: ?string,
  contacts: Object,
  resetHideRemoval: Function,
};

type State = {
  activeModal: {
    type: string | null,
    opts: {
      address?: string,
      token?: string,
      tokenName?: string,
      formValues?: Object,
    },
  },
};

const AssetCardWrapper = styled.View`
  flex: 1;
  justify-content: flex-start;
  padding-bottom: 38px;
  background-color: ${UIColors.defaultBackgroundColor};
`;

const CardInnerWrapper = styled.View`
  padding: ${Platform.select({
    ios: 0,
    android: '0 10px',
  })}
`;

class AssetScreen extends React.Component<Props, State> {
  state = {
    activeModal: activeModalResetState,
  };

  componentDidMount() {
    const { fetchTransactionsHistory, wallet, navigation } = this.props;
    const { assetData, resetHideRemoval } = navigation.state.params;
    fetchTransactionsHistory(wallet.address, assetData.token);
    resetHideRemoval();
  }

  handleCardTap = () => {
    this.props.navigation.goBack();
  };

  handleOpenShareDialog = (address: string) => {
    Share.share({ title: 'Public address', message: address });
  };

  goToSendTokenFlow = (assetData: Object) => {
    this.props.navigation.navigate(SEND_TOKEN_FROM_ASSET_FLOW, {
      assetData,
    });
  };

  openReceiveTokenModal = assetData => {
    this.setState({
      activeModal: {
        type: RECEIVE,
        opts: { address: assetData.address },
      },
    });
  };

  handleScrollWrapperEndDrag = e => {
    const { fetchTransactionsHistory, wallet, history } = this.props;
    const {
      assetData: { token },
    } = this.props.navigation.state.params;
    const layoutHeight = e.nativeEvent.layoutMeasurement.height;
    const contentHeight = e.nativeEvent.contentSize.height;
    const offsetY = e.nativeEvent.contentOffset.y;
    const indexFrom = history.filter(({ asset }) => asset === token).length;

    if (layoutHeight + offsetY + 200 >= contentHeight) {
      fetchTransactionsHistory(wallet.address, token, indexFrom);
    }
  };

  render() {
    const {
      assets,
      rates,
      balances,
      wallet,
      fetchAssetsBalances,
      fetchTransactionsHistory,
      baseFiatCurrency,
      navigation,
    } = this.props;
    const { assetData } = this.props.navigation.state.params;
    const { token } = assetData;
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const balance = getBalance(balances, token);
    const isWalletEmpty = balance <= 0;
    const totalInFiat = balance * getRate(rates, token, fiatCurrency);
    const formattedBalanceInFiat = formatMoney(totalInFiat);
    const displayAmount = formatMoney(balance, 4);
    const displayBalanceInFiat = {
      amount: formattedBalanceInFiat,
      currency: fiatCurrency,
    };
    const {
      listed: isListed = true,
      send: isSendActive = true,
      receive: isReceiveActive = true,
      disclaimer,
    } = assetsConfig[assetData.token] || {};
    return (
      <Container>
        <Header onBack={this.handleCardTap} />
        <ScrollWrapper
          color={baseColors.white}
          onScrollEndDrag={this.handleScrollWrapperEndDrag}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                fetchAssetsBalances(assets, wallet.address);
                fetchTransactionsHistory(wallet.address, assetData.token);
              }}
            />
          }
        >
          <AssetCardWrapper>
            <CardInnerWrapper>
              <AssetCard
                id={assetData.token}
                name={assetData.name}
                token={assetData.token}
                amount={displayAmount}
                balanceInFiat={displayBalanceInFiat}
                color={assetData.color}
                onPress={this.handleCardTap}
                address={assetData.address}
                icon={assetData.icon}
                wallpaper={assetData.wallpaper}
                isListed={isListed}
                disclaimer={disclaimer}
                horizontalPadding
                innerCard
              />
            </CardInnerWrapper>
            <View style={{ paddingHorizontal: spacing.mediumLarge, paddingTop: 10 }}>
              <TruncatedText lines={1} text={assetData.description} />
            </View>

            <AssetButtons
              onPressReceive={() => this.openReceiveTokenModal({ ...assetData, balance })}
              onPressSend={() => this.goToSendTokenFlow(assetData)}
              noBalance={isWalletEmpty}
              isSendDisabled={!isSendActive}
              isReceiveDisabled={!isReceiveActive}
            />
          </AssetCardWrapper>

          <ActivityFeed
            feedTitle="transactions."
            navigation={navigation}
            activeTab={TRANSACTIONS}
            additionalFiltering={data => data.filter(({ asset }) => asset === assetData.token)}
            backgroundColor={baseColors.white}
            wrapperStyle={{ borderTopWidth: 1, borderTopColor: baseColors.mediumLightGray }}
          />
        </ScrollWrapper>

        <ReceiveModal
          isVisible={this.state.activeModal.type === RECEIVE}
          onModalHide={() => {
            this.setState({ activeModal: activeModalResetState });
          }}
          address={assetData.address}
          token={assetData.token}
          tokenName={assetData.name}
          handleOpenShareDialog={this.handleOpenShareDialog}
        />
      </Container>
    );
  }
}

const mapStateToProps = ({
  wallet: { data: wallet },
  contacts: { data: contacts },
  assets: { data: assets, balances },
  rates: { data: rates },
  history: { data: history },
  appSettings: { data: { baseFiatCurrency } },
}) => ({
  wallet,
  contacts,
  assets,
  balances,
  rates,
  history,
  baseFiatCurrency,
});

const mapDispatchToProps = (dispatch: Function) => ({
  fetchAssetsBalances: (assets, walletAddress) => {
    dispatch(fetchAssetsBalancesAction(assets, walletAddress));
  },
  fetchTransactionsHistory: (walletAddress, asset, indexFrom) => {
    dispatch(fetchTransactionsHistoryAction(walletAddress, asset, indexFrom));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(AssetScreen);
