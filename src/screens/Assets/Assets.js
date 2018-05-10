// @flow
import * as React from 'react';
import { Animated, RefreshControl } from 'react-native';
import { connect } from 'react-redux';
import { BCX_URL } from 'react-native-dotenv';

import type { Transaction } from 'models/Transaction';
import type { Assets } from 'models/Asset';

import { fetchAssetsBalancesAction } from 'actions/assetsActions';
import AssetCard from 'components/AssetCard';
import AssetButtons from 'components/AssetButtons';
import { Container, Wrapper } from 'components/Layout';
import PortfolioBalance from 'components/PortfolioBalance';
import Title from 'components/Title';

import ReceiveModal from './ReceiveModal';
import SendModal from './SendModal';


// TODO: Replace me with real address or pass in with Redux
const address = '0x77215198488f31ad467c5c4d2c5AD9a06586Dfcf';

const defaultAssetColor = '#4C4E5E';
const assetColors = {
  ETH: '#4C4E5E',
  PLR: '#5e1b22',
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
  fetchAssetsBalances: (assets: Assets, walletAddress: string) => Function,
  assets: Object,
  wallet: Object,
  rates: Object,
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
    const { fetchAssetsBalances, assets, wallet } = this.props;
    fetchAssetsBalances(assets, wallet.address);
    this.getTransactionHistory();
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

        // TODO: extract this to service
        const balanceInFiat = rates[symbol] ? +parseFloat(balance * rates[symbol].USD).toFixed(2) : 0;

        const displayAmount = +parseFloat(balance).toFixed(4);
        const assetHistory = history.filter(({ asset: assetName }) => assetName === symbol);
        const activeModalOptions = { address: wallet.address };
        const sendModalOptions = { token: symbol, totalBalance: balance, contractAddress };
        const assetColor = assetColors[symbol] || defaultAssetColor;
        const defaultCardPositionTop = (index * 140) + 30;


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
    return (
      <Container>
        <Wrapper
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                const { assets, wallet } = this.props;
                this.props.fetchAssetsBalances(assets, wallet.address);
              }}
            />
          }
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
          }}
        >
          <Animated.View
            style={{
              height: animHeaderHeight,
            }}
          >
            <Animated.View style={{ opacity: animHeaderTextOpacity }}>
              <PortfolioBalance />
            </Animated.View>

          </Animated.View>
          <Wrapper padding>
            <Title title="assets" />
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
      </Container>
    );
  }
}

const mapStateToProps = ({
  wallet: { data: wallet },
  assets: { data: assets },
  rates: { data: rates },
}) => ({
  wallet,
  assets,
  rates,
});

const mapDispatchToProps = (dispatch: Function) => ({
  fetchAssetsBalances: (assets, walletAddress) =>
    dispatch(fetchAssetsBalancesAction(assets, walletAddress)),
});

export default connect(mapStateToProps, mapDispatchToProps)(AssetsScreen);
