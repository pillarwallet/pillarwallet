// @flow
import * as React from 'react';
import {
  Animated,
  Text,
  View,
  TouchableOpacity,
  Image,
} from 'react-native';
import { connect } from 'react-redux';
import type { Transaction } from 'models/Transaction';
import { fetchEtherBalanceAction } from 'actions/assetsActions';
import AssetCard from 'components/AssetCard';
import { Container } from 'components/Layout';
import Wrapper from 'components/Wrapper';
import { BCX_URL } from 'react-native-dotenv';

import ReceiveModal from './ReceiveModal';
import SendModal from './SendModal';

const imageSend = require('assets/images/btn_iconSend.png');
const imageReceive = require('assets/images/btn_iconReceive.png');
// TODO: Replace me with real address or pass in with Redux
const address = '0x583cbbb8a8443b38abcc0c956bece47340ea1367';

type Props = {
  fetchEtherBalance: () => Function,
  assets: Object,
  wallet: Object,
}

const activeModalResetState = {
  type: null,
  opts: {
    address: '',
    token: '',
    tokenName: '',
  },
};

type State = {
  animHeaderHeight: any,
  animCardPositionY: any,
  animTotalPortfolioFade: any,
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

class Assets extends React.Component<Props, State> {
  state = {
    animHeaderHeight: new Animated.Value(180),
    animCardPositionY: new Animated.Value(30),
    animTotalPortfolioFade: new Animated.Value(1),
    isCardActive: false,
    activeCard: '',
    activeModal: activeModalResetState,
    history: [],
  };

  componentDidMount() {
    const { fetchEtherBalance } = this.props;
    fetchEtherBalance();
    this.getTransactionHistory();
  }

  // TODO: Move this into Redux and pass in with rest of asset DATA
  getTransactionHistory() {
    fetch(`${BCX_URL}/wallet-client/txhistory`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      // TODO: Needs to use this.props.wallet.data.address
      body: JSON.stringify({
        address1: address,
        fromtmstmp: 0,
        address2: 'ALL',
        asset: 'ALL',
      }),
    })
      .then(res => res.json())
      .then(res => res.txHistory && Array.isArray(res.txHistory) ? res.txHistory : [])
      .then((txHistory) => {
        this.setState({
          history: txHistory.slice(0, 10), // show 10 latest transactions only
        });
      })
      .catch(() => {
        // TODO: Use proper error handling
      });
  }

  animateCardPositionAndHeader = (isActive: boolean, startingPosition: number) => {
    const headerHeightValue = isActive ? 120 : 180;
    const cardPositionYValue = isActive ? startingPosition - 90 : startingPosition;
    const totalPortfolioFadeValue = isActive ? 0 : 1;
    Animated.parallel([
      Animated.spring(this.state.animHeaderHeight, {
        toValue: headerHeightValue,
      }),
      Animated.spring(this.state.animCardPositionY, {
        toValue: cardPositionYValue,
      }),
      Animated.spring(this.state.animTotalPortfolioFade, {
        toValue: totalPortfolioFadeValue,
      }),
    ]).start();
  };

  handleCardTap = (id: string, startingPosition: number) => {
    alert(id);
    this.setState({
      isCardActive: !this.state.isCardActive,
      activeCard: id,
    }, () => {
      this.animateCardPositionAndHeader(this.state.isCardActive, startingPosition);
    });
  };

  renderAssets() {
    const { wallet: { data: wallet }, assets: { data: assets } } = this.props;
    const {
      history, animCardPositionY, isCardActive, activeCard,
    } = this.state;
    return Object.keys(assets)
      .map(id => assets[id])
      .map(asset => {
        const {
          id,
          balance,
          name,
          color,
        } = asset;
        const displayAmount = +parseFloat(balance).toFixed(4);
        const assetHistory = history.filter(({ asset: assetName }) => assetName === id);
        const activeModalOptions = { address: wallet.address };
        const sendModalOptions = { token: id };
        const cardShouldShow = () => {
          if (!isCardActive) {
            return true;
          }
          if (isCardActive && activeCard === id) {
            return true;
          }
          return false;
        };

        return (
          cardShouldShow &&
          <Animated.View key={id} style={{ marginTop: animCardPositionY }}>
            <AssetCard
              name={name || id}
              token={id}
              amount={displayAmount}
              color={color}
              onTap={this.handleCardTap}
              tag={id}
              history={assetHistory}
              address={wallet.address}
            >
              <View>
                <TouchableOpacity
                  onPress={() => { this.setState({ activeModal: { type: 'RECEIVE', opts: activeModalOptions } }); }}
                >
                  <Image style={{ width: 50, height: 50 }} source={imageReceive} />
                </TouchableOpacity>
                <Text style={{ color: '#2077FD', textAlign: 'center', marginTop: 10 }}>Receive</Text>
              </View>
              <View>
                <TouchableOpacity
                  onPress={() => { this.setState({ activeModal: { type: 'SEND', opts: sendModalOptions } }); }}
                >
                  <Image style={{ width: 50, height: 50 }} source={imageSend} />
                </TouchableOpacity>
                <Text style={{ color: '#2077FD', textAlign: 'center', marginTop: 10 }}>Send</Text>
              </View>
            </AssetCard>
          </Animated.View>

        );
      });
  }

  render() {
    const {
      animHeaderHeight,
      animTotalPortfolioFade,
      activeModal: { type: activeModalType, opts },
    } = this.state;
    return (
      <Container>
        <Wrapper>
          <Animated.View
            style={{
              backgroundColor: '#2CB3F8',
              height: animHeaderHeight,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Animated.Text style={{ opacity: animTotalPortfolioFade }}>$10.02 Total Portfolio</Animated.Text>
          </Animated.View>
          {this.renderAssets()}
        </Wrapper>
        <ReceiveModal
          isVisible={activeModalType === 'RECEIVE'}
          {...opts}
          onDismiss={() => { this.setState({ activeModal: activeModalResetState }); }}
        />
        <SendModal
          isVisible={activeModalType === 'SEND'}
          {...opts}
          onDismiss={() => { this.setState({ activeModal: activeModalResetState }); }}
        />
      </Container>
    );
  }
}


const mapStateToProps = ({ wallet, assets }) => ({ wallet, assets });

const mapDispatchToProps = (dispatch: Function) => ({
  fetchEtherBalance: () =>
    dispatch(fetchEtherBalanceAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(Assets);
