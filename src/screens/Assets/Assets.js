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
import { BCX_URL } from 'react-native-dotenv';

import ReceiveModal from './ReceiveModal';

const imageSend = require('assets/images/btn_iconSend.png');
const imageReceive = require('assets/images/btn_iconReceive.png');
// TODO: Replace me with real address or pass in with Redux
const address = '0x583cbbb8a8443b38abcc0c956bece47340ea1367';

type Props = {
  fetchEtherBalance: () => Function,
  assets: Object,
  wallet: Object,
}

const receiveModalResetState = {
  isVisible: false,
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
  history: Transaction[],
  receiveModal: {
    isVisible: boolean,
    opts: {
      address: string,
      token: string,
      tokenName: string
    }
  }
}

class Assets extends React.Component<Props, State> {
  state = {
    animHeaderHeight: new Animated.Value(180),
    animCardPositionY: new Animated.Value(30),
    animTotalPortfolioFade: new Animated.Value(1),
    isCardActive: false,
    receiveModal: receiveModalResetState,
    history: [],
  };

  componentDidMount() {
    const { fetchEtherBalance } = this.props;
    fetchEtherBalance();
    this.getTransactionHistory();
  }

  // TODO: Move this into Redux and pass in with rest of asset DATA
  getTransactionHistory() {
    fetch(`${BCX_URL}/txhistory`, {
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
      .then(res => Array.isArray(res) ? res : [])
      .then((res) => {
        this.setState({
          history: res,
        });
      })
      .catch(() => {
        // TODO: Use proper error handling
      });
  }

  animateCardPositionAndHeader = (isActive: boolean) => {
    const headerHeightValue = isActive ? 120 : 180;
    const cardPositionYValue = isActive ? -60 : 30;
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

  handleCardTap = () => {
    this.setState({
      isCardActive: !this.state.isCardActive,
    }, () => {
      this.animateCardPositionAndHeader(this.state.isCardActive);
    });
  };

  renderAssets() {
    const { wallet: { data: wallet }, assets: { data: assets } } = this.props;
    const { history, animCardPositionY } = this.state;
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
        const receiveModalOptions = { address: wallet.address, token: id, tokenName: name };
        return (
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
                  onPress={() => { this.setState({ receiveModal: { isVisible: true, opts: receiveModalOptions } }); }}
                >
                  <Image style={{ width: 50, height: 50 }} source={imageReceive} />
                </TouchableOpacity>
                <Text style={{ color: '#2077FD', textAlign: 'center', marginTop: 10 }}>Receive</Text>
              </View>
              <View>
                <TouchableOpacity onPress={() => { }}>
                  <Image style={{ width: 50, height: 50 }} source={imageSend} />
                </TouchableOpacity>
                <Text style={{ color: '#2077FD', textAlign: 'center', marginTop: 10 }}>Send</Text>
              </View>
            </AssetCard>
          </Animated.View>);
      });
  }

  render() {
    const {
      animHeaderHeight,
      animTotalPortfolioFade,
      receiveModal: { isVisible: isReceiveModalOpen, opts },
    } = this.state;
    return (
      <View style={{ backgroundColor: '#FFFFFF' }}>
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
        <ReceiveModal
          isVisible={isReceiveModalOpen}
          {...opts}
          onDismiss={() => { this.setState({ receiveModal: receiveModalResetState }); }}
        />
      </View>
    );
  }
}

const mapStateToProps = ({ wallet, assets }) => ({ wallet, assets });

const mapDispatchToProps = (dispatch: Function) => ({
  fetchEtherBalance: () =>
    dispatch(fetchEtherBalanceAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(Assets);
