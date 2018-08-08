// @flow
import * as React from 'react';
import { Animated, Easing, Share, RefreshControl } from 'react-native';
import { baseColors } from 'utils/variables';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { Transition } from 'react-navigation-fluid-transitions';
import { connect } from 'react-redux';
import { fetchAssetsBalancesAction } from 'actions/assetsActions';
import { fetchTransactionsHistoryAction } from 'actions/historyActions';
import type { Transaction } from 'models/Transaction';
import type { Assets } from 'models/Asset';
import AssetCard from 'components/AssetCard';
import AssetButtons from 'components/AssetButtons';
import TXHistory from 'components/TXHistory';
import Header from 'components/Header';
import { Container, Wrapper, ScrollWrapper } from 'components/Layout';
import { Paragraph } from 'components/Typography';
import { SEND_TOKEN_FLOW } from 'constants/navigationConstants';
import { formatMoney } from 'utils/common';
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
  fetchTransactionsHistory: (walletAddress: string, asset: string) => Function,
  history: Transaction[],
  assets: Assets,
  balances: Assets,
  wallet: Object,
  rates: Object,
  navigation: NavigationScreenProp<*>,
}

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
}

const AssetCardWrapper = styled(Wrapper)`
  flex: 1;
`;

class AssetScreen extends React.Component<Props, State> {
  state = {
    activeModal: activeModalResetState,
  };

  static navigationOptions = {
    transitionConfig: {
      duration: 200,
      timing: Animated.timing,
      easing: Easing.easing,
    },
  };

  componentDidMount() {
    const {
      fetchTransactionsHistory,
      wallet,
      navigation,
    } = this.props;
    const { assetData } = navigation.state.params;
    fetchTransactionsHistory(wallet.address, assetData.token);
  }

  handleCardTap = () => {
    this.props.navigation.goBack();
  };

  handleOpenShareDialog = (address: string) => {
    Share.share({ title: 'Public address', message: address });
  };

  goToSendTokenFlow = (assetData: Object) => {
    this.props.navigation.navigate(SEND_TOKEN_FLOW, {
      assetData,
    });
  };

  openReceiveTokenModal = (assetData) => {
    this.setState({
      activeModal: {
        type: RECEIVE,
        opts: { address: assetData.address },
      },
    });
  };

  render() {
    const {
      assets,
      rates,
      balances,
      wallet,
      fetchAssetsBalances,
      fetchTransactionsHistory,
    } = this.props;
    const { assetData } = this.props.navigation.state.params;
    const { balanceInFiat: { currency: fiatCurrency }, token } = assetData;
    const history = this.props.history
      .filter(({ asset }) => asset === assetData.token)
      .sort((a, b) => b.timestamp - a.timestamp);
    const balance = Number(balances[token] && balances[token].balance) || 0;
    const isWalletEmpty = balance <= 0;
    const totalInFiat = rates[token] ? balance * rates[token][fiatCurrency] : 0;
    const formattedBalanceInFiat = formatMoney(totalInFiat);
    const displayAmount = formatMoney(balance, 4);
    const displayBalanceInFiat = {
      amount: formattedBalanceInFiat,
      currency: fiatCurrency,
    };
    return (
      <Container color={baseColors.snowWhite}>
        <Header onClose={this.handleCardTap} />
        <ScrollWrapper
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
          <AssetCardWrapper regularPadding>
            <Transition shared={assetData.name}>
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
              />
            </Transition>
            <Paragraph small light>
              {assetData.description}
            </Paragraph>
            <AssetButtons
              onPressReceive={() => this.openReceiveTokenModal({ ...assetData, balance })}
              onPressSend={() => this.goToSendTokenFlow(assetData)}
              noBalance={isWalletEmpty}
            />
          </AssetCardWrapper>
          <TXHistory
            history={history}
            token={assetData.token}
          />
        </ScrollWrapper>

        <ReceiveModal
          isVisible={this.state.activeModal.type === RECEIVE}
          onModalHide={() => { this.setState({ activeModal: activeModalResetState }); }}
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
  assets: { data: assets, balances },
  rates: { data: rates },
  history: { data: history },
}) => ({
  wallet,
  assets,
  balances,
  rates,
  history,
});

const mapDispatchToProps = (dispatch: Function) => ({
  fetchAssetsBalances: (assets, walletAddress) => {
    dispatch(fetchAssetsBalancesAction(assets, walletAddress));
  },
  fetchTransactionsHistory: (walletAddress, asset) => {
    dispatch(fetchTransactionsHistoryAction(walletAddress, asset));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(AssetScreen);
