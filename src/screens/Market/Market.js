// @flow
import * as React from 'react';
import {
  Animated,
  Easing,
  RefreshControl,
  FlatList,
} from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { Transition } from 'react-navigation-fluid-transitions';
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
        startDate: '10 Sept',
        endDate: '1 Nov 2018',
        goalCurrency: 'GBP',
        description: 'Tokenizing equity and other securities for client firms.' +
        'We have been accepted into the FCA sandbox and will conduct one of the UK’s' +
        'first equity-token offerings. Tokenizing equity and other securities for client' +
        'firms. We have been accepted into the FCA sandbox and will conduct one of the UK’s' +
        'first equity-token offerings.',
        tokenPrice: 0.40,
        accepted: 'British Pounds (GBP), ETH, BTC, BCH, LTC',
        maxSupply: 6000000,
        lockedTokens: 500000,
        tokenType: 'ERC-20',
        restricted: 'USA, China',
        minContribution: 20000,
        maxContribution: 'Unlimited',
        tokenIssue: 'Instant',
      },
      {
        id: 1,
        title: 'Longer ICO name to check styling',
        status: 'pre-sale',
        goal: 100000,
        raised: 9000,
        startDate: '10 Sept',
        endDate: '20 Sep 2018',
        goalCurrency: 'EUR',
        description: 'Tokenizing equity and other securities for client firms.' +
        'We have been accepted into the FCA sandbox and will conduct one of the UK’s' +
        'first equity-token offerings. Tokenizing equity and other securities for client' +
        'firms. We have been accepted into the FCA sandbox and will conduct one of the UK’s' +
        'first equity-token offerings.',
        tokenPrice: 0.40,
        accepted: 'British Pounds (GBP), ETH, BTC, BCH, LTC',
        maxSupply: 6000000,
        lockedTokens: 500000,
        tokenType: 'ERC-20',
        restricted: 'USA, China',
        minContribution: 20000,
        maxContribution: 'Unlimited',
        tokenIssue: 'Instant',
      },
      {
        id: 2,
        title: '2030.io',
        status: 'pre-sale',
        goal: 100,
        raised: 100,
        startDate: '10 Sept',
        endDate: '1 Nov 2018',
        goalCurrency: 'GBP',
        description: 'Tokenizing equity and other securities for client firms.' +
        'We have been accepted into the FCA sandbox and will conduct one of the UK’s' +
        'first equity-token offerings. Tokenizing equity and other securities for client' +
        'firms. We have been accepted into the FCA sandbox and will conduct one of the UK’s' +
        'first equity-token offerings.',
        tokenPrice: 0.40,
        accepted: 'British Pounds (GBP), ETH, BTC, BCH, LTC',
        maxSupply: 6000000,
        lockedTokens: 500000,
        tokenType: 'ERC-20',
        restricted: 'USA, China',
        minContribution: 20000,
        maxContribution: 'Unlimited',
        tokenIssue: 'Instant',
      },
    ],
  };

  renderAsset = ({ item: ico }: Object) => {
    return (
      <Transition key={ico.id} shared={ico.id}>
        <IcoCard
          id={ico.id}
          title={ico.title}
          status={ico.status}
          goal={ico.goal}
          raised={ico.raised}
          goalCurrency={ico.goalCurrency}
          endDate={ico.endDate}
          onPress={() => this.goToICO(ico)}
        />
      </Transition>
    );
  };

  goToICO = (icoData: Object) => {
    this.props.navigation.navigate(ICO, {
      icoData,
    });
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
