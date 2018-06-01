// @flow
import * as React from 'react';
import { RefreshControl, View, Image, Text, ActivityIndicator } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { Transition } from 'react-navigation-fluid-transitions';
import { connect } from 'react-redux';
import { Grid, Row, Column } from 'components/Grid';
import { UIColors, baseColors } from 'utils/variables';
import { BCX_URL } from 'react-native-dotenv';
import type { Transaction } from 'models/Transaction';
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
import TransactionSentModal from 'components/TransactionSentModal';
import { formatMoney } from 'utils/common';
import { FETCH_INITIAL_FAILED, defaultFiatCurrency } from 'constants/assetsConstants';
import { ASSET, ADD_TOKEN, SEND_TOKEN_FLOW } from 'constants/navigationConstants';
import ReceiveModal from './ReceiveModal';

// TODO: Replace me with real address or pass in with Redux
const address = '0x77215198488f31ad467c5c4d2c5AD9a06586Dfcf';
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
  assets: Object,
  wallet: Object,
  rates: Object,
  assetsState: ?string,
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: string,
}

type State = {
  history: Transaction[],
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
    activeModal: activeModalResetState,
    history: [],
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
    this.getTransactionHistory();

    if (!Object.keys(assets).length) {
      fetchInitialAssets(wallet.address);
    }
  }

  // TODO: Move this into Redux and pass in with rest of asset DATA
  getTransactionHistory() {
    // TODO: Needs to use this.props.wallet.data.address
    const queryParams = [
      `address1=${address}`,
      'address2=ALL',
      'asset=ALL',
      'batchNb=0', // show 10 latest transactions only
    ];

    fetch(`${BCX_URL}/wallet-client/txhistory?${queryParams.join('&')}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
      .then(res => res.json())
      .then(res => res.txHistory && Array.isArray(res.txHistory) ? res.txHistory : [])
      .then((txHistory) => {
        this.setState({
          history: txHistory,
        });
      })
      .catch(() => {
        // TODO: Use proper error handling
      });
  }

  handleCardTap = (assetData: Object) => {
    this.props.navigation.navigate(ASSET, {
      assetData,
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
    } = this.props;

    const {
      history,
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
        const assetColor = assetColors[symbol] || defaultAssetColor;
        const assetData = {
          name: name || symbol,
          token: symbol,
          amount: displayAmount,
          balance,
          balanceInFiat: { amount: balanceInFiat, currency: fiatCurrency },
          color: assetColor,
          history: assetHistory,
          address: wallet.address,
        };
        return (
          <Transition shared={assetData.name}>
            <AssetCard
              key={index}
              id={symbol}
              name={assetData.name}
              token={assetData.token}
              amount={assetData.amount}
              balanceInFiat={assetData.balanceInFiat}
              color={assetData.color}
              onPress={() => this.handleCardTap(assetData)}
              address={assetData.address}
            />
          </Transition>
        );
      });
  }

  render() {
    const {
      activeModal: { type: activeModalType, opts },
    } = this.state;
    const {
      assets,
      wallet,
      assetsState,
      fetchInitialAssets,
    } = this.props;

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
        <View
          style={{
            width: '100%',
            height: 150,
            flexDirection: 'row',
          }}
        >
          <Grid
            style={{
              padding: 20,
              borderBottomWidth: 1,
              borderStyle: 'solid',
              borderBottomColor: UIColors.defaultBorderColor,
            }}
          >
            <Row>
              <Image
                source={pillarLogoSource}
                style={{
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
                <PortfolioBalance />
              </Column>
            </Row>
          </Grid>
        </View>
        <ScrollWrapper
          padding
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
          <Grid>
            <Row>
              <Column>
                <Title title="assets" />
              </Column>
              <Column style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                <Button
                  secondary
                  noPadding
                  marginTop="20px"
                  marginBottom="20px"
                  onPress={this.goToAddTokenPage}
                  title="Add Token+"
                />
              </Column>
            </Row>
          </Grid>

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
