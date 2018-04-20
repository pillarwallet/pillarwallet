// @flow
import * as React from 'react';
import {
  Animated,
  Text,
  ScrollView,
  View,
}
  from 'react-native';
import { connect } from 'react-redux';
import { fetchEtherBalanceAction } from 'actions/assetsActions';
import AssetCard from 'components/AssetCard';

// TODO: Replace me with real address or pass in with Redux
const address = '0x583cbbb8a8443b38abcc0c956bece47340ea1367';

type Props = {
  fetchEtherBalance: () => Function,
  assets: Object,
  wallet: Object,
}

type State = {
  animHeaderHeight: any,
  animCardPositionY: any,
  cardActive: boolean,
  history: {}
}

class Assets extends React.Component<Props, State> {
  state = {
    animHeaderHeight: new Animated.Value(200),
    animCardPositionY: new Animated.Value(30),
    cardActive: false,
    history: {},
  };

  componentDidMount() {
    const { fetchEtherBalance } = this.props;
    fetchEtherBalance();
    this.getTransactionHistory();
  }

  onScroll = (event: any) => {
    if (event.nativeEvent.contentOffset.y <= -100) {
      this.setCardInactive();
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
    }).catch(() => {
      // TODO: Use proper error handling
    });
  }


  setCardActive = () => {
    Animated.parallel([
      Animated.spring(
        this.state.animHeaderHeight,
        {
          toValue: 120,
        },
      ).start(),
      Animated.spring(
        this.state.animCardPositionY,
        {
          toValue: -40,
        },
      ).start(),
    ]);
  };

  setCardInactive = () => {
    Animated.parallel([
      Animated.spring(
        this.state.animHeaderHeight,
        {
          toValue: 200,
        },
      ).start(),
      Animated.spring(
        this.state.animCardPositionY,
        {
          toValue: 30,
        },
      ).start(),
    ]);
  };

  getTokenColor(token) {
    if (token === 'ETH') {
      return '#4C4E5E';
    }
    return '#0000FF';
  }

  getTokenName(token) {
    if (token === 'ETH') {
      return 'Ethereum';
    }
    return token;
  }

  headerComponent() {
    return (
      <Animated.View style={{
          backgroundColor: '#2CB3F8',
          height: this.state.animHeaderHeight,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text>$10.02 Total Portfolio</Text>
      </Animated.View>);
  }

  checkStateStatus = (status: boolean) => {
    if (status === true) {
      this.setCardActive();
    } else {
      this.setCardInactive();
    }
  };

  hitAssetCard = (event: any) => {
    if (event === 'card01') {
      this.setState({
        cardActive: !this.state.cardActive,
      }, () => {
        this.checkStateStatus(this.state.cardActive);
      });
    }
    if (event === 'card02') {
      this.setState({
        cardActive: !this.state.cardActive,
      }, () => {
        this.checkStateStatus(this.state.cardActive);
      });
    }
  };

  generateAssetsList(assets) {
    return Object.keys(assets)
      .map(id => assets[id])
      .map(({ id, balance }) => {
        const displayAmount = +parseFloat(balance).toFixed(4);
        return (
          <Animated.View key={id} style={{ marginTop: this.state.animCardPositionY }}>
            <AssetCard
              name={this.getTokenName(id)}
              token={id}
              amount={displayAmount}
              color={this.getTokenColor(id)}
              onTap={this.hitAssetCard}
              tag="card01"
              history={this.state.history}
              address={this.props.wallet.data.address}
            />
          </Animated.View>);
      });
  }

  render() {
    const { assets: { data: assets } } = this.props;
    const assetsList = this.generateAssetsList(assets);

    return (
      <View>
        <ScrollView onScroll={this.onScroll} scrollEventThrottle={200}>
          { this.headerComponent() }
          { assetsList }
        </ScrollView>
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
