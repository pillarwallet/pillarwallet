// @flow
import * as React from 'react';
import { Animated, RefreshControl, Text, ActivityIndicator } from 'react-native';
import { connect } from 'react-redux';
import { Grid, Row, Column } from 'components/Grid';
import { Paragraph } from 'components/Typography';
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
import AssetButtons from 'components/AssetButtons';
import { Container, Wrapper } from 'components/Layout';
import PortfolioBalance from 'components/PortfolioBalance';
import Title from 'components/Title';
import PopModal from 'components/Modals/PopModal';
import { formatMoney } from 'utils/common';
import { FETCH_INITIAL_FAILED } from 'constants/assetsConstants';
import ReceiveModal from './ReceiveModal';
import SendModal from './SendModal';


// TODO: Replace me with real address or pass in with Redux
const address = '0x77215198488f31ad467c5c4d2c5AD9a06586Dfcf';
const defaultAssetColor = '#4C4E5E';
const pillarLogoSource = require('assets/images/header-pillar-logo.png');
const tokenSentConfirmationImage = require('assets/images/token-sent-confirmation-image.png');

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
}

type State = {
  animHeaderHeight: Animated.Value,
  animHeaderTextOpacity: Animated.Value,
  isCardActive: boolean,
  activeCard: string,
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
    animHeaderHeight: new Animated.Value(150),
    animHeaderTextOpacity: new Animated.Value(1),
    isCardActive: false,
    activeCard: '',
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

  animateHeaderHeight = () => {
    const headerHeightValue = this.state.isCardActive ? 120 : 150;
    const headerTextOpacityValue = this.state.isCardActive ? 0 : 1;

    Animated.parallel([
      Animated.spring(this.state.animHeaderHeight, {
        toValue: headerHeightValue,
      }),
      Animated.spring(this.state.animHeaderTextOpacity, {
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
    // TODO: Link to add token page
  };

  renderAssets() {
    const { wallet, assets, rates } = this.props;
    const {
      history,
      activeCard,
      isCardActive,
    } = this.state;

    return Object.keys(assets)
      .map(id => assets[id])
      .map((asset, index) => {
        const {
          balance,
          name,
          symbol,
          address: contractAddress,
        } = asset;

        const balanceInFiat = rates[symbol] ? formatMoney(balance * rates[symbol].USD) : 0;
        const displayAmount = formatMoney(balance, 4);
        const assetHistory = history.filter(({ asset: assetName }) => assetName === symbol);
        const activeModalOptions = { address: wallet.address };
        const sendModalOptions = { token: symbol, totalBalance: balance, contractAddress };
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
            balanceInFiat={{ amount: balanceInFiat, currency: 'USD' }}
            color={assetColor}
            onTap={this.handleCardTap}
            defaultPositionY={defaultCardPositionTop}
            history={assetHistory}
            address={wallet.address}
          >

            <AssetButtons
              recieveOnPress={() => { this.setState({ activeModal: { type: 'SEND', opts: sendModalOptions } }); }}
              sendOnPress={() => { this.setState({ activeModal: { type: 'RECEIVE', opts: activeModalOptions } }); }}
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
            <Button title="Try again" onPress={fetchInitialAssets(wallet.address)} />
          )}
        </Container>
      );
    }

    return (
      <Container>
        <Wrapper
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                this.props.fetchAssetsBalances(assets, wallet.address);
                this.props.fetchExchangeRates(assets);
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
              borderColor: UIColors.defaultBorderColor,
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

        </Wrapper>
        <ReceiveModal
          isVisible={activeModalType === 'RECEIVE'}
          onModalHide={() => { this.setState({ activeModal: activeModalResetState }); }}
          {...opts}
        />
        <SendModal
          isVisible={activeModalType === 'SEND'}
          onModalHide={() => { this.setState({ activeModal: activeModalResetState }); }}
          {...opts}
        />
        <PopModal
          isVisible={activeModalType === 'SEND_CONFIRMATION'}
          onModalHide={() => { this.setState({ activeModal: activeModalResetState }); }}
          headerImage={tokenSentConfirmationImage}
        >
          <Title
            title="Your transaction is pending"
            center
            maxWidth={200}
          />
          <Paragraph light center style={{ marginBottom: 20 }}>
            The process may take up to 10 minutes to complete. please check your transaction history.
          </Paragraph>
        </PopModal>

      </Container>
    );
  }
}

const mapStateToProps = ({
  wallet: { data: wallet },
  assets: { data: assets, assetsState },
  rates: { data: rates },
}) => ({
  wallet,
  assets,
  assetsState,
  rates,
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
