// @flow
import * as React from 'react';
import {
  Animated,
  Text,
  View,
  ScrollView,
}
  from 'react-native';
import { connect } from 'react-redux';
import { fetchEtherBalanceAction } from 'actions/assetsActions';
import AssetCard from 'components/AssetCard';
import AssetHeader from 'components/AssetHeader';

// TODO: Replace me with real address or pass in with Redux
const address = '0x583cbbb8a8443b38abcc0c956bece47340ea1367';

const AnimatedAssetHeader = Animated.createAnimatedComponent(AssetHeader);

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
  static navigationOptions = {
    header: () => null,
  };

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
          <Animated.ScrollView
            onScroll={this.onScroll}
            scrollEventThrottle={300}
            key={id}
            style={{
              zIndex: 1,
              overflow: 'visible',
              position: 'relative',
              height: '100%',
              marginTop: this.state.animCardPositionY,
            }}
          >
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
          </Animated.ScrollView>);
      });
  }

  render() {
    const { assets: { data: assets } } = this.props;
    const assetsList = this.generateAssetsList(assets);

    return (
      <View>
        <AnimatedAssetHeader style={{ height: this.state.animHeaderHeight }}>
          <Text>$10.02 Total Portfolio</Text>
        </AnimatedAssetHeader>
        { assetsList }
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
