// @flow
import * as React from 'react';
import { TouchableOpacity, Animated, Easing, RefreshControl, View, Text, ActivityIndicator } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { Transition } from 'react-navigation-fluid-transitions';
import { connect } from 'react-redux';
import { Grid, Row, Column } from 'components/Grid';
import { TextLink } from 'components/Typography';
import type { Assets } from 'models/Asset';
import Button from 'components/Button';
import {
  fetchInitialAssetsAction,
  fetchAssetsBalancesAction,
  fetchExchangeRatesAction,
} from 'actions/assetsActions';
import AssetCard from 'components/AssetCard';
import { Container, ScrollWrapper } from 'components/Layout';
import PortfolioBalance from 'components/PortfolioBalance';
import Title from 'components/Title';
import { formatMoney } from 'utils/common';
import { FETCH_INITIAL_FAILED, defaultFiatCurrency, ETH, FETCHED } from 'constants/assetsConstants';
import { ASSET, ADD_TOKEN, SEND_TOKEN_FLOW } from 'constants/navigationConstants';

type Props = {
  fetchInitialAssets: (walletAddress: string) => Function,
  fetchAssetsBalances: (assets: Assets, walletAddress: string) => Function,
  fetchExchangeRates: (assets: Assets) => Function,
  assets: Assets,
  wallet: Object,
  rates: Object,
  assetsState: ?string,
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: string,
}

type State = {
  assetsMedia: Object,
}

class AssetsScreen extends React.Component<Props, State> {
  state = {
    assetsMedia: {},
  };

  static navigationOptions = {
    transitionConfig: {
      duration: 300,
      timing: Animated.timing,
      easing: Easing.easing,
    },
  };

  componentDidMount() {
    const {
      fetchInitialAssets,
      fetchAssetsBalances,
      fetchExchangeRates,
      assets,
      wallet,
    } = this.props;

    fetchAssetsBalances(assets, wallet.address);
    fetchExchangeRates(assets);

    if (!Object.keys(assets).length) {
      fetchInitialAssets(wallet.address);
    }

    this.fetchAssetsMedia();
  }

  fetchAssetsMedia = async () => {
    const response = await fetch('https://api.myjson.com/bins/dqsvy');
    const json = await response.json();
    this.setState({
      assetsMedia: json,
    });
  };

  handleCardTap = (assetData: Object) => {
    this.props.navigation.navigate(ASSET, {
      assetData,
    });
  };

  goToAddTokenPage = () => {
    this.props.navigation.navigate(ADD_TOKEN);
  };

  goToSendTokenFlow = (asset: Object) => {
    this.props.navigation.navigate(SEND_TOKEN_FLOW, {
      asset,
    });
  };

  renderAssets() {
    const {
      wallet,
      assets,
      rates,
      baseFiatCurrency,
    } = this.props;

    const { assetsMedia } = this.state;

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
        const assetData = {
          name: name || symbol,
          token: symbol,
          amount: displayAmount,
          contractAddress: asset.address,
          balance,
          balanceInFiat: { amount: balanceInFiat, currency: fiatCurrency },
          address: wallet.address,
          icon: assetsMedia[symbol] ? assetsMedia[symbol].icon : assetsMedia[ETH].icon,
          background: assetsMedia[symbol] ? assetsMedia[symbol].background : assetsMedia[ETH].background,
        };
        return (
          <Transition key={index} shared={assetData.name}>
            <AssetCard
              id={assetData.token}
              name={assetData.name}
              token={assetData.token}
              amount={assetData.amount}
              balanceInFiat={assetData.balanceInFiat}
              onPress={() => this.handleCardTap(assetData)}
              address={assetData.address}
              iconUri={assetData.icon}
              backgroundUri={assetData.background}
            />
          </Transition>
        );
      });
  }

  render() {
    const {
      assets,
      wallet,
      assetsState,
      fetchInitialAssets,
    } = this.props;

    if (!Object.keys(assets).length && assetsState === FETCHED) {
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
        <View
          style={{
            width: '100%',
            height: 140,
            flexDirection: 'row',
            backgroundColor: 'white',
            shadowColor: 'black',
            shadowOpacity: 0.07,
            shadowRadius: 0,
            shadowOffset: { width: 0, height: 1 },
          }}
        >
          <Grid style={{ paddingRight: 20, paddingLeft: 20, paddingBottom: 40 }}>
            <View style={{ alignItems: 'center', height: 80, flexDirection: 'row', justifyContent: 'space-between'} }>
              <View>
                <Title title="assets" />
              </View>
              <View>
                <TouchableOpacity onPress={this.goToAddTokenPage} >
                  <TextLink>
                    Add token
                  </TextLink>
                </TouchableOpacity>
              </View>
            </View>
            <Row>
              <Column
                style={{
                  alignSelf: 'flex-end',
                  justifyContent: 'space-between',
                }}
              >
                <PortfolioBalance />
              </Column>
            </Row>
          </Grid>
        </View>
        <ScrollWrapper
          regularPadding
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                const {
                  fetchAssetsBalances,
                  fetchExchangeRates,
                } = this.props;
                fetchAssetsBalances(assets, wallet.address);
                fetchExchangeRates(assets);
              }}
            />
          }
        >
          {Object.keys(this.state.assetsMedia).length ? this.renderAssets() : <ActivityIndicator animating />}
        </ScrollWrapper>
      </Container >
    );
  }
}

const mapStateToProps = ({
  wallet: { data: wallet },
  assets: { data: assets, assetsState },
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
}) => ({
  wallet,
  assets,
  assetsState,
  rates,
  baseFiatCurrency,
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
});

export default connect(mapStateToProps, mapDispatchToProps)(AssetsScreen);
