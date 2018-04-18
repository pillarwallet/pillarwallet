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
import AssetCard from 'components/AssetCard';

type Props = {
  assets: Asset[]
}

type State = {
  animHeaderHeight: any,
  animCardPositionY: any,

  cardActive: boolean,
  card01: boolean,
  card02: boolean,
}

export default class AssetCardList extends React.Component<Props, State> {
  state = {
    animHeaderHeight: new Animated.Value(200),
    animCardPositionY: new Animated.Value(20),
    cardActive: false,
    card01: false,
    card02: false,
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
          toValue: 20,
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

  render() {
    const { card01, card02 } = this.state;

    return (
      <View>

        <ScrollView style={{ height: '100%' }}>
          { this.headerComponent() }

          {!card01 && (
          <Animated.View style={{ marginTop: this.state.animCardPositionY }}>
            <AssetCard
              name={this.props.assets[0].name}
              amount={this.props.assets[0].amount}
              color={this.props.assets[0].color}
              onTap={this.hitAssetCard}
              tag="card01"
            />
          </Animated.View>
          )}

          {!card02 && (
          <Animated.View style={{ marginTop: this.state.animCardPositionY }}>
            <AssetCard
              name={this.props.assets[1].name}
              amount={this.props.assets[1].amount}
              color={this.props.assets[1].color}
              onTap={this.hitAssetCard}
              tag="card02"
            />
          </Animated.View>
          )}
        </ScrollView>
      </View>
    );
  }
}

