// @flow
import * as React from 'react';
import {
  Animated,
  Easing,
  RefreshControl,
  FlatList,
} from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import Header from 'components/Header';
import { Container } from 'components/Layout';
import { spacing, baseColors } from 'utils/variables';
import IcoCard from 'components/IcoCard';
import { ICO } from 'constants/navigationConstants';

type Props = {
  navigation: NavigationScreenProp<*>,
  icos: Array<Object>,
}

class MarketScreen extends React.Component<Props> {
  static navigationOptions = {
    transitionConfig: {
      duration: 300,
      timing: Animated.timing,
      easing: Easing.easing,
    },
  };

  // some fake data
  static defaultProps = {
    icos: [
      {
        id: 0,
        title: '2030.io',
        status: 'pre-sale',
        goal: 2400000,
        raised: 1608000,
        endDate: '1 Nov 2018',
        goalCurrency: 'GBP',
      },
      {
        id: 1,
        title: 'Longer ICO name to check styling',
        status: 'pre-sale',
        goal: 100000,
        raised: 9000,
        endDate: '20 Sep 2018',
        goalCurrency: 'EUR',
      },
      {
        id: 2,
        title: '2030.io',
        status: 'pre-sale',
        goal: 100,
        raised: 100,
        endDate: '1 Nov 2018',
        goalCurrency: 'GBP',
      },
    ],
  };

  renderAsset = ({ item: ico }: Object) => {
    return (
      <IcoCard
        name={ico.title}
        status={ico.status}
        goal={ico.goal}
        raised={ico.raised}
        goalCurrency={ico.goalCurrency}
        endDate={ico.endDate}
        startDate={ico.startDate}
        onPress={this.goToICO}
      />
    );
  };

  goToICO = () => {
    const { navigation } = this.props;
    navigation.navigate(ICO);
  };

  render() {
    const { icos } = this.props;

    return (
      <Container color={baseColors.snowWhite}>
        <Header
          title="market"
        />
        <FlatList
          data={icos}
          extraData={this.state}
          keyExtractor={(item) => item.id.toString()}
          renderItem={this.renderAsset}
          style={{ width: '100%' }}
          contentContainerStyle={{
            paddingHorizontal: spacing.rhythm / 2,
            width: '100%',
          }}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {}}
            />
          }
        />
      </Container >
    );
  }
}

export default MarketScreen;
