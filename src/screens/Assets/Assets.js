// @flow
import * as React from 'react';
import {
  Animated,
  Text,
  ScrollView,
  View,
  TouchableOpacity,
  Image,
} from 'react-native';
import { connect } from 'react-redux';
import type { Transaction } from 'models/Transaction'
import type { ScrollEvent, onPress } from 'react-native';
import { fetchEtherBalanceAction } from 'actions/assetsActions';
import AssetCard from 'components/AssetCard';

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
    address: ''
  }
};

type State = {
  animHeaderHeight: any,
  animCardPositionY: any,
  isCardActive: boolean,
  history: Transaction[],
  receiveModal: {
    isVisible: boolean,
    opts: {
      address: string
    }
  }
}

class Assets extends React.Component<Props, State> {
  state = {
    animHeaderHeight: new Animated.Value(200),
    animCardPositionY: new Animated.Value(30),
    isCardActive: false,
    receiveModal: receiveModalResetState,
    history: [],
  };

  componentDidMount() {
    const { fetchEtherBalance } = this.props;
    fetchEtherBalance();
    this.getTransactionHistory();
  }

  handleScroll = (event: ScrollEvent) => {
    const distanceY = event.nativeEvent.contentOffset.y;
    const offsetY = -100;
    if (distanceY < offsetY) {
      this.animateCardPositionAndHeader(false);
    }
  };

  // TODO: Move this into Redux and pass in with rest of asset DATA
  getTransactionHistory() {
    fetch('https://bcx-dev.pillarproject.io/txhistory', {
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
    }).then(res => res.json()).then((res) => {
      this.setState({
        history: res,
      });
    }).catch((e) => {
      // TODO: Use proper error handling
    });
  }

  animateCardPositionAndHeader = (isActive: boolean) => {
    const headerHeightValue = isActive ? 120 : 200;
    const cardPositionYValue = isActive ? -40 : 30;
    Animated.parallel([
      Animated.spring(this.state.animHeaderHeight, {
        toValue: headerHeightValue
      }),
      Animated.spring(this.state.animCardPositionY, {
        toValue: cardPositionYValue
      }),
    ]).start();
  };

  handleCardTap = (event: onPress) => {
    this.setState({
      isCardActive: !this.state.isCardActive,
    }, () => {
      this.animateCardPositionAndHeader(this.state.isCardActive);
    });
  };

  renderAssets() {
    const { wallet: { data: wallet }, assets: { data: assets } } = this.props;
    const { history } = this.state;
    return Object.keys(assets)
      .map(id => assets[id])
      .map(({ id, balance, name, color }) => {
        const displayAmount = +parseFloat(balance).toFixed(4);
        const assetHistory = history.filter(({ asset }) => asset === id);
        const receiveModalOptions = { address: wallet.address };
        return (
          <Animated.View key={id} style={{ marginTop: this.state.animCardPositionY }}>
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
                <TouchableOpacity onPress={() => { this.setState({ receiveModal: { isVisible: true, opts: receiveModalOptions } }) }}>
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
    const { assets: { data: assets } } = this.props;
    const { receiveModal: { isVisible: isReceiveModalOpen, opts } } = this.state
    return (
      <View>
        <ScrollView onScroll={this.handleScroll} scrollEventThrottle={200}>
          <Animated.View
            style={{
              backgroundColor: '#2CB3F8',
              height: this.state.animHeaderHeight,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text>$10.02 Total Portfolio</Text>
          </Animated.View>
          {this.renderAssets()}
        </ScrollView>
        <ReceiveModal isVisible={isReceiveModalOpen} {...opts} onDismiss={() => { this.setState({ receiveModal: receiveModalResetState }) }} />
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
