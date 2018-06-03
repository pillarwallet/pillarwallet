// @flow
import * as React from 'react';
import { Animated, RefreshControl, Text, ActivityIndicator } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { Grid, Row, Column } from 'components/Grid';
import { UIColors, baseColors } from 'utils/variables';
import type { Transaction } from 'models/Transaction';
import type { Assets } from 'models/Asset';
import Button from 'components/Button';
import {
  fetchInitialAssetsAction,
  fetchAssetsBalancesAction,
  fetchExchangeRatesAction,
  fetchTransactionsHistoryAction,
} from 'actions/assetsActions';
import AssetCard from 'components/AssetCard';
import AssetButtons from 'components/AssetButtons';
import { Container, ScrollWrapper, Wrapper } from 'components/Layout';
import PortfolioBalance from 'components/PortfolioBalance';
import Title from 'components/Title';
import TransactionSentModal from 'components/TransactionSentModal';
import { formatMoney } from 'utils/common';
import { FETCH_INITIAL_FAILED, defaultFiatCurrency } from 'constants/assetsConstants';
import { ADD_TOKEN, SEND_TOKEN_FLOW } from 'constants/navigationConstants';
import ReceiveModal from './ReceiveModal';

const defaultAssetColor = '#4C4E5E';
const pillarLogoSource = require('assets/images/header-pillar-logo.png');

const assetColors = {
  ETH: baseColors.darkGray,
  PLR: baseColors.clearBlue,
};

const activeModalResetState = {
  type: null,
  opts: {
    address: '',
    token: '',
    tokenName: '',
  },
};


type Props = {
  fetchInitialAssets: (walletAddress: string) => Function,
  fetchAssetsBalances: (assets: Assets, walletAddress: string) => Function,
  fetchExchangeRates: (assets: Assets) => Function,
  fetchTransactionHistory: (walletAddress: string) => Function,
  history: Transaction[],
  assets: Object,
  wallet: Object,
  rates: Object,
  assetsState: ?string,
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: string,
}

type State = {
  animHeaderHeight: Animated.Value,
  animHeaderTextOpacity: Animated.Value,
  isCardActive: boolean,
  activeCard: string,
  activeModal: {
    type: string | null,
    opts: {
      address?: string,
      token?: string,
      tokenName?: string,
      formValues?: Object
    }
  }
}

class AssetsScreen extends React.Component<Props, State> {
  state = {
    animHeaderHeight: new Animated.Value(150),
    animHeaderTextOpacity: new Animated.Value(1),
    isCardActive: false,
    activeCard: '',
    activeModal: activeModalResetState,
  };

  componentDidMount() {
    const {
      fetchInitialAssets,
      fetchAssetsBalances,
      fetchExchangeRates,
      fetchTransactionsHistory,
      assets,
      wallet,
    } = this.props;

    fetchAssetsBalances(assets, wallet.address);
    fetchExchangeRates(assets);
    fetchTransactionsHistory(wallet.address);

    if (!Object.keys(assets).length) {
      fetchInitialAssets(wallet.address);
    }
  }

  animateHeaderHeight = () => {
    const headerHeightValue = this.state.isCardActive ? 120 : 150;
    const headerTextOpacityValue = this.state.isCardActive ? 0 : 1;

    const {
      animHeaderHeight,
      animHeaderTextOpacity,
    } = this.state;

    Animated.parallel([
      Animated.spring(animHeaderHeight, {
        toValue: headerHeightValue,
      }),
      Animated.spring(animHeaderTextOpacity, {
        toValue: headerTextOpacityValue,
      }),
    ]).start();
  };

  handleCardTap = (id: string) => {
    this.setState({
      isCardActive: !this.state.isCardActive,
      activeCard: id,
    }, () => {
      this.animateHeaderHeight();
    });
  };

  goToAddTokenPage = () => {
    this.props.navigation.navigate(ADD_TOKEN);
  }

  goToSendTokenFlow = (asset: Object) => {
    this.props.navigation.navigate(SEND_TOKEN_FLOW, {
      asset,
    });
  }

  renderAssets() {
    const {
      wallet,
      assets,
      rates,
      baseFiatCurrency,
      history,
    } = this.props;

    const {
      activeCard,
      isCardActive,
    } = this.state;

    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;

    return Object.keys(assets)
      .map(id => assets[id])
      .map((asset, index) => {
        const {
          name,
          symbol,
        } = asset;
        const balance = asset.balance || 0;
        const balanceInFiat = rates[symbol] ? formatMoney(balance * rates[symbol][fiatCurrency]) : formatMoney(0);
        const displayAmount = formatMoney(balance, 4);
        const assetHistory = history.filter(({ asset: assetName }) => assetName === symbol);
        const activeModalOptions = { address: wallet.address };
        const assetColor = assetColors[symbol] || defaultAssetColor;
        const defaultCardPositionTop = index * 140;

        return (
          <AssetCard
            key={index}
            id={symbol}
            isCardActive={isCardActive}
            activeCardId={activeCard}
            name={name || symbol}
            token={symbol}
            amount={displayAmount}
            balanceInFiat={{ amount: balanceInFiat, currency: fiatCurrency }}
            color={assetColor}
            onTap={this.handleCardTap}
            defaultPositionY={defaultCardPositionTop}
            history={assetHistory}
            address={wallet.address}
          >
            <AssetButtons
              onPressReceive={() => { this.setState({ activeModal: { type: 'RECEIVE', opts: activeModalOptions } }); }}
              onPressSend={() => this.goToSendTokenFlow(asset)}
            />

          </AssetCard>
        );
      });
  }

  render() {
    const {
      activeModal: { type: activeModalType, opts },
      animHeaderHeight,
      animHeaderTextOpacity,
    } = this.state;
    const {
      assets,
      wallet,
      assetsState,
      fetchInitialAssets,
    } = this.props;

    const headerBorderColor = animHeaderTextOpacity.interpolate({
      inputRange: [0, 1],
      outputRange: ['rgba(0, 0, 0, 0)', UIColors.defaultBorderColor],
    });

    if (!Object.keys(assets).length) {
      return (
        <Container center>
          <Text style={{ marginBottom: 20 }}>Loading default assets</Text>
          {assetsState !== FETCH_INITIAL_FAILED && (
            <ActivityIndicator
              animating
              color="#111"
              size="large"
            />
          )}
          {assetsState === FETCH_INITIAL_FAILED && (
            <Button title="Try again" onPress={() => fetchInitialAssets(wallet.address)} />
          )}
        </Container>
      );
    }

    return (
      <Container>
        <ScrollWrapper
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                const {
                  fetchAssetsBalances,
                  fetchExchangeRates,
                  fetchTransactionsHistory,
                } = this.props;
                fetchAssetsBalances(assets, wallet.address);
                fetchTransactionsHistory(wallet.address);
                fetchExchangeRates(assets);
              }}
            />
          }
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            backgroundColor: baseColors.lightGray,
          }}
        >
          <Animated.View
            style={{
              height: animHeaderHeight,
              borderBottomWidth: 1,
              borderStyle: 'solid',
              backgroundColor: baseColors.white,
              borderColor: headerBorderColor,
              padding: 20,
              flexDirection: 'row',
            }}
          >
            <Grid>
              <Row>
                <Animated.Image
                  source={pillarLogoSource}
                  style={{
                    opacity: animHeaderTextOpacity,
                    height: 35,
                    width: 71,
                  }}
                />
              </Row>
              <Row>
                <Column
                  style={{
                    alignSelf: 'flex-end',
                    justifyContent: 'space-between',
                  }}
                >
                  <Animated.View style={{ opacity: animHeaderTextOpacity }}>
                    <PortfolioBalance />
                  </Animated.View>
                </Column>
              </Row>
            </Grid>
          </Animated.View>
          <Wrapper padding>
            <Grid>
              <Row>
                <Column>
                  <Title title="assets" />
                </Column>
                <Column style={{ justifyContent: 'flex-end', alignItems: 'flex-end' }}>
                  <Button secondary noPadding marginBottom="20px" onPress={this.goToAddTokenPage} title="Add Token+" />
                </Column>
              </Row>
            </Grid>
          </Wrapper>
          {this.renderAssets()}

        </ScrollWrapper>
        <ReceiveModal
          isVisible={activeModalType === 'RECEIVE'}
          onModalHide={() => { this.setState({ activeModal: activeModalResetState }); }}
          {...opts}
        />

        <TransactionSentModal
          isVisible={activeModalType === 'SEND_CONFIRMATION'}
          onModalHide={() => { this.setState({ activeModal: activeModalResetState }); }}
        />

      </Container>
    );
  }
}

const mapStateToProps = ({
  wallet: { data: wallet },
  assets: { data: assets, assetsState },
  rates: { data: rates },
  history: { data: history },
  appSettings: { data: { baseFiatCurrency } },
}) => ({
  wallet,
  assets,
  assetsState,
  rates,
  baseFiatCurrency,
  history,
});

const mapDispatchToProps = (dispatch: Function) => ({
  fetchInitialAssets: (walletAddress) => {
    dispatch(fetchInitialAssetsAction(walletAddress));
  },
  fetchAssetsBalances: (assets, walletAddress) => {
    dispatch(fetchAssetsBalancesAction(assets, walletAddress));
  },
  fetchExchangeRates: (assets) => {
    dispatch(fetchExchangeRatesAction(assets));
  },
  fetchTransactionsHistory: (walletAddress) => {
    dispatch(fetchTransactionsHistoryAction(walletAddress));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(AssetsScreen);
