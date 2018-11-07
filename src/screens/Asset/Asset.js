// @flow
import * as React from 'react';
import { Share, RefreshControl } from 'react-native';
import isEqual from 'lodash.isequal';
import { baseColors, spacing, fontSizes } from 'utils/variables';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { fetchAssetsBalancesAction } from 'actions/assetsActions';
import { fetchTransactionsHistoryAction } from 'actions/historyActions';
import type { Transaction } from 'models/Transaction';
import type { Assets, Balances } from 'models/Asset';
import AssetButtons from 'components/AssetButtons';
import ActivityFeed from 'components/ActivityFeed';
// import TruncatedText from 'components/TruncatedText';
import Header from 'components/Header';
import { Container, ScrollWrapper } from 'components/Layout';
import AssetPattern from 'components/AssetPattern';
import { BoldText, BaseText } from 'components/Typography';
import { SEND_TOKEN_FROM_ASSET_FLOW } from 'constants/navigationConstants';
import { defaultFiatCurrency } from 'constants/assetsConstants';
import { TRANSACTIONS } from 'constants/activityConstants';
import { formatMoney, getCurrencySymbol } from 'utils/common';
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
  padding-top: 5px;
  padding-bottom: 30px;
  background-color: ${baseColors.snowWhite};
  border-top-width: 1px;
  border-bottom-width: 1px;
  border-color: ${baseColors.mediumLightGray};
  margin-top: 4px;
`;

const DataWrapper = styled.View`
  margin: ${spacing.large}px;
  justify-content: center;
`;

const TokenValue = styled(BoldText)`
  font-size: ${fontSizes.semiGiant}px;
  text-align: center;
`;

const ValueInFiat = styled(BaseText)`
  font-size: ${fontSizes.extraExtraSmall}px;
  text-align: center;
  color: ${baseColors.darkGray};
  margin-top: 5px;
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

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    const isFocused = this.props.navigation.isFocused();
    if (!isFocused) {
      return false;
    }
    const isEq = isEqual(this.props, nextProps) && isEqual(this.state, nextState);
    return !isEq;
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
    const currencySymbol = getCurrencySymbol(fiatCurrency);

    const {
      listed: isListed = true,
      send: isSendActive = true,
      receive: isReceiveActive = true,
      // disclaimer,
    } = assetsConfig[assetData.token] || {};

    return (
      <Container color={baseColors.white}>
        <Header
          onBack={this.handleCardTap}
          title={assetData.name}
          onNextPress={() => {}}
          nextIcon="info-circle"
          nextIconSize={fontSizes.mediumLarge}
        />
        <ScrollWrapper
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
          <AssetPattern
            token={assetData.token}
            icon={isListed ? assetData.iconColor : assetData.icon}
            contractAddress={assetData.contractAddress}
            isListed={isListed}
          />
          <DataWrapper>
            <TokenValue>
              {`${displayAmount}${token}`}
            </TokenValue>
            <ValueInFiat>
              {`${currencySymbol}${formattedBalanceInFiat}`}
            </ValueInFiat>
          </DataWrapper>
          <AssetCardWrapper>
            { /*
            <View style={{ paddingHorizontal: spacing.mediumLarge, paddingTop: 10 }}>
              <TruncatedText lines={1} text={assetData.description} />
           </View
           > */}

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
            noBorder
            wrapperStyle={{ marginTop: 10 }}
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
