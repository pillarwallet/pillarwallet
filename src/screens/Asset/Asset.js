// @flow
import * as React from 'react';
import { View, Animated, RefreshControl, Text, ActivityIndicator } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { Grid, Row, Column } from 'components/Grid';
import { UIColors, baseColors } from 'utils/variables';
import { BCX_URL } from 'react-native-dotenv';
// import type { Transaction } from 'models/Transaction';
import type { Assets } from 'models/Asset';
import Button from 'components/Button';
import {
  fetchInitialAssetsAction,
  fetchAssetsBalancesAction,
  fetchExchangeRatesAction,
} from 'actions/assetsActions';
import AssetCard from 'components/AssetCard';
import { Container, ScrollWrapper } from 'components/Layout';
import Title from 'components/Title';
import TransactionSentModal from 'components/TransactionSentModal';
import { FETCH_INITIAL_FAILED } from 'constants/assetsConstants';
import { ADD_TOKEN, SEND_TOKEN_FLOW } from 'constants/navigationConstants';
import ReceiveModal from './ReceiveModal';

// TODO: Replace me with real address or pass in with Redux
const address = '0x77215198488f31ad467c5c4d2c5AD9a06586Dfcf';

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
  animHeaderHeight: Animated.Value,
  animHeaderTextOpacity: Animated.Value,
  isCardActive: boolean,
  // history: Transaction[],
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

class AssetScreen extends React.Component<Props, State> {
  state = {
    animHeaderHeight: new Animated.Value(150),
    animHeaderTextOpacity: new Animated.Value(1),
    isCardActive: false,
    activeModal: activeModalResetState,
    // history: [],
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
      // .then((txHistory) => {
      //   this.setState({
      //     history: txHistory,
      //   });
      // })
      .catch(() => {
        // TODO: Use proper error handling
      });
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

  handleCardTap = () => {
  };

  goToAddTokenPage = () => {
    this.props.navigation.navigate(ADD_TOKEN);
  }

  goToSendTokenFlow = (asset: Object) => {
    this.props.navigation.navigate(SEND_TOKEN_FLOW, {
      asset,
    });
  }


  render() {
    const {
      activeModal: { type: activeModalType, opts },
    } = this.state;

    const { assetData } = this.props.navigation.state.params;

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
            borderBottomWidth: 1,
            borderStyle: 'solid',
            backgroundColor: baseColors.white,
            borderColor: UIColors.defaultBorderColor,
            padding: 20,
            height: 60,
            flexDirection: 'row',
          }}
        />
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


          <AssetCard
            id={assetData.symbol}
            name={assetData.name}
            token={assetData.token}
            amount={assetData.displayAmount}
            balanceInFiat={assetData.balanceInFiat}
            color={assetData.color}
            onPress={this.handleCardTap}
            address={assetData.address}
          />

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

export default connect(mapStateToProps, mapDispatchToProps)(AssetScreen);
