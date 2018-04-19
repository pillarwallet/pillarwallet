// @flow
import * as React from 'react';
import {
  Animated,
  Text,
  ScrollView,
  View,
}
  from 'react-native';
import type { Asset } from 'models/Asset';
import { connect } from 'react-redux';
import { fetchEtherBalanceAction } from 'actions/assetsActions';
import AssetCard from 'components/AssetCard';

const address = '0x583cbbb8a8443b38abcc0c956bece47340ea1367';

type Props = {
  fetchEtherBalance: () => Function,
  assets: Object
}

type State = {
  animHeaderHeight: any,
  animCardPositionY: any,

  cardActive: boolean,
  card01: boolean,
  card02: boolean,
}

class AssetCardList extends React.Component<Props, State> {
  state = {
    animHeaderHeight: new Animated.Value(200),
    animCardPositionY: new Animated.Value(30),
    cardActive: false,
    card01: false,
    card02: false,
  }

  componentWillMount() {
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

  hitAssetCard = (event: any) => {
    if (event === 'card01') {
      this.setState({
        cardActive: !this.state.cardActive,
        card02: !this.state.cardActive,
      }, () => {
        this.checkStateStatus(this.state.cardActive);
      });
    }
    if (event === 'card02') {
      this.setState({
        cardActive: !this.state.cardActive,
        card01: !this.state.cardActive,
      }, () => {
        this.checkStateStatus(this.state.cardActive);
      });
    }
  }

  checkStateStatus = (status: boolean) => {
    if (status === true) {
      this.setCardActive();
    } else {
      this.setCardInactive();
    }
  }

  headerComponent() {
    const component =
      (
        <Animated.View style={
      {
        backgroundColor: 'cyan',
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

  getTokenColor(token) {
    if (token === 'ETH') {
      return '#B4D455';
    }
    return '#0000FF';
  }

  generateAssetsList(assets) {
    const assetsList = [];
    for (let i = 0; i < Object.keys(assets).length; i++) {
      const token = Object.keys(assets)[i];
      const displayAmount = +parseFloat(assets[token].balance).toFixed(4);

      assetsList.push(
        <Animated.View style={{ marginTop: this.state.animCardPositionY }}>
          <AssetCard
            name={assets[token].id}
            amount={displayAmount}
            color={this.getTokenColor(token)}
            onTap={this.hitAssetCard}
            tag="card01"
          />
        </Animated.View>,
      );
    }

    return assetsList;
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
