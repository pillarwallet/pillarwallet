// @flow
import * as React from 'react';
import { Text, View } from 'react-native';
import type { Asset } from 'models/Asset';
import { delay } from 'utils/common';
import { connect } from 'react-redux';

type Assets = {
  [string]: Asset,
};

type Rates = {
  [string]: {
    USD: number,
    EUR: number,
    GBP: number,
  },
};

type Props = {
  assets: Assets,
  rates: Rates,
};

/* type State = {

}; */

class PortfolioBalance extends React.Component<Props, {}> {
  async componentDidMount() {
    await delay(1000);
    // const rates = await cryptocompare.priceMulti(['ETH', 'PLR'], ['USD', 'EUR', 'GBP']);
    console.log('herer');
    this.setState({});
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
    const { assets, rates } = this.props;
    if (!Object.keys(rates).length || !Object.keys(assets).length) {
      return null;
    }
    const portfolioBalance = this.calculatePortfolioBalance(assets, rates);
    console.log('Portfolio balance', portfolioBalance);
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

const mapStateToProps = ({ assets: { data: assets }, rates: { data: rates } }) => ({
  rates,
  assets,
});
export default connect(mapStateToProps)(PortfolioBalance);
