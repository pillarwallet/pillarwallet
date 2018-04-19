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
}

class AssetCardList extends React.Component<Props, State> {
  state = {
    animHeaderHeight: new Animated.Value(200),
    animCardPositionY: new Animated.Value(30),
    cardActive: false,
  }

  componentWillMount() {
    // TODO: Need to refactor the below line
    this.props.wallet.data.address = address;
    const { fetchEtherBalance } = this.props;
    fetchEtherBalance();
  }

  onScroll = (event: any) => {
    if (event.nativeEvent.contentOffset.y <= -100) {
      this.setCardInactive();
    }
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
  }


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
  }

  getTokenColor(token) {
    if (token === 'ETH') {
      return '#B4D455';
    }
    return '#0000FF';
  }

  headerComponent() {
    const component =
      (
        <Animated.View style={
      {
        backgroundColor: '#2CB3F8',
        height: this.state.animHeaderHeight,
        justifyContent: 'center',
        alignItems: 'center',
      }
    }
        >
          <Text>$10.02 Total Portfolio</Text>
        </Animated.View>);

    return component;
  }

  checkStateStatus = (status: boolean) => {
    if (status === true) {
      this.setCardActive();
    } else {
      this.setCardInactive();
    }
  }

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
  }

  generateAssetsList(assets) {
    return Object.keys(assets)
      .map(id => assets[id])
      .map(({ id, balance }) => {
        const displayAmount = +parseFloat(balance).toFixed(4);
        return (
          <Animated.View key={id} style={{ marginTop: this.state.animCardPositionY }}>
            <AssetCard
              name={id}
              amount={displayAmount}
              color={this.getTokenColor(id)}
              onTap={this.hitAssetCard}
              tag="card01"
            />
          </Animated.View>);
      });
  }


  render() {
    const { assets: { data: assets } } = this.props;
    const assetsList = this.generateAssetsList(assets);

    return (
      <View>
        <ScrollView style={{ height: '100%' }} onScroll={this.onScroll} scrollEventThrottle={200}>
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

export default connect(mapStateToProps, mapDispatchToProps)(AssetCardList);
