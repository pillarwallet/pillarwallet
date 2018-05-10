// @flow
import * as React from 'react';
import { Text, View } from 'react-native';
import type { Asset } from 'models/Asset';
// import cryptocompare from 'cryptocompare';
import { delay } from 'utils/common';

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

type Rates = {
  [string]: {
    USD: number,
    EUR: number,
    GBP: number,
  },
};

type State = {
  rates: ?Rates,
};

export default class PortfolioBalance extends React.Component<Props, State> {
  state = {
    rates: null,
  };

  async componentDidMount() {
    await delay(600);
    const rates = await cryptocompare.priceMulti(['ETH', 'PLR'], ['USD', 'EUR', 'GBP']);
    this.setState({ rates });
  }

  calculatePortfolioBalance(assets: Assets, rates: Rates) {
    // CLEANUP REQUIRED
    return Object
      .values(assets)
      .map((item: Asset) => {
        const assetFiatBalance = Object
          .keys(rates[item.symbol])
          .map(key => ({
            currency: key,
            total: rates[item.symbol][key] * item.balance,
          }));
        return assetFiatBalance;
      }).reduce((memo, item) => {
        return memo.concat(item);
      }, []).reduce((memo, item) => {
        memo[item.currency] = (memo[item.currency] || 0) + item.total;
        return memo;
      }, {});
  }

  render() {
    const { assets } = this.props;
    const { rates } = this.state;
    if (!rates) {
      return null;
    }
    const portfolioBalance = this.calculatePortfolioBalance(assets, rates);
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
