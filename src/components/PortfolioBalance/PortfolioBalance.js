// @flow
import * as React from 'react';
import { Text, View } from 'react-native';
// import cryptocompare from 'cryptocompare';
import type { Asset } from 'models/Asset';

const cryptocompare = {
  priceMulti: (tokensArray, pricesArray) => {
    return Promise.resolve({
      ETH: {
        EUR: 624.21,
        GBP: 544.57,
        USD: 748.92,
      },
      PLR: {
        EUR: 0.3142,
        GBP: 0.2762,
        USD: 0.377,
      },
    });
  },
};

type Assets = {
  [string]: Asset,
};

type Props = {
  assets: Assets,
};

type Prices = {
  [string]: {
    USD: number,
    EUR: number,
    GBP: number,
  },
};

type State = {
  portfolioBalance: {
    USD: number,
    EUR: number,
    GBP: number,
  },
};

export default class PortfolioBalance extends React.Component<Props, State> {
  // state = {
  /* portfolioBalance = {
    USD: 0,
    EUR: 0,
    GBP: 0,
  }; */
  // };

  prices: ?Prices = null;
  pricesFetched: boolean = false;

  componentDidMount() {
    cryptocompare.priceMulti(['ETH', 'PLR'], ['USD', 'EUR', 'GBP'])
      .then(prices => {
        console.log('prices', prices);
        this.prices = prices;
        this.pricesFetched = true;
        this.forceUpdate();
      })
      .catch(console.error);
  }

  /* static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    if (Object.keys(nextProps.assets).length && this.pricesFetched) {
      return {
        ...prevState,
        portfolioBalance: this.calculatePortfolioBalance(),
      };
    }
    return null;
  } */

  calculatePortfolioBalance(assets: Assets) {
    const portfolioBalance = {
      USD: 0,
      EUR: 0,
      GBP: 0,
    };

    if (!this.pricesFetched) return portfolioBalance;

    Object.keys(assets).forEach(asset => {
      if (!this.prices || !this.prices[asset]) return;

      const amount = assets[asset].balance;

      portfolioBalance.USD += this.prices[asset].USD * amount;
      portfolioBalance.EUR += this.prices[asset].EUR * amount;
      portfolioBalance.GBP += this.prices[asset].GBP * amount;
    });

    return portfolioBalance;
  }

  /*
    assets Object {
     "ETH": Object {
       "balance": "21.749756564999937",
       "color": "#4C4E5E",
       "id": "ETH",
       "name": "Ethereum",
     },
     "PLR": Object {
       "balance": 100,
       "color": "#4C4E5E",
       "id": "PLR",
       "name": "Pillar",
     },
    }
   */

  render() {
    const { assets } = this.props;
    // const { portfolioBalance } = this.state;
    if (!Object.keys(assets).length) return null;
    const portfolioBalance = this.calculatePortfolioBalance(assets);

    return (
      <View>
        <Text style={{ color: 'white', fontSize: 32 }}>
          Total Portfolio
        </Text>
        <Text style={{ color: 'white', fontSize: 32, textAlign: 'center' }}>
          ${+parseFloat(portfolioBalance.USD).toFixed(2)}
        </Text>
      </View>
    );
  }
}
