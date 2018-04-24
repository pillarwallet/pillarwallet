// @flow
import * as React from 'react';
import { View, Dimensions } from 'react-native';
import AnimatedBackroundItem from './AnimatedBackgroundItem';

type State = {
  animatedBackgroundItemList: []
}

export default class AnimatedBackground extends React.Component<{}, State> {
  state = {
    animatedBackgroundItemList: [<AnimatedBackroundItem />],
  }

  componentDidMount() {
    setInterval(() => {
      const newAnimatedBackgroundItemList = [...this.state.animatedBackgroundItemList];
      newAnimatedBackgroundItemList.push(
        <AnimatedBackroundItem key={this.state.animatedBackgroundItemList.length} />,
      );
      if (newAnimatedBackgroundItemList.length > 5) {
        newAnimatedBackgroundItemList.shift();
      }
      this.setState({
        animatedBackgroundItemList: newAnimatedBackgroundItemList,
      });
    }, 5000);
  }

  render() {
    const windowHeight = Dimensions.get('window').height;
    const windowWidth = Dimensions.get('window').width;
    return (
      <View style={{ width: windowWidth, height: windowHeight }} >
        {this.state.animatedBackgroundItemList}
      </View>
    );
  }
}
