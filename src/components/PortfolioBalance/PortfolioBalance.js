// @flow
import * as React from 'react';
import { Text, View } from 'react-native';
import type { Asset, Assets } from 'models/Asset';
import { USD } from 'constants/assetsConstants';
import { connect } from 'react-redux';

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
  baseCurrency: string
};

class PortfolioBalance extends React.Component<Props, {}> {
  static defaultProps = {
    baseCurrency: USD,
  }

  calculatePortfolioBalance(assets: Assets, rates: Rates) {
    // CLEANUP REQUIRED
    return Object
      .keys(assets)
      .map(key => assets[key])
      .map((item: Asset) => {
        const assetFiatBalance = Object
          .keys(rates[item.symbol])
          .map(key => ({
            currency: key,
            total: rates[item.symbol][key] * item.balance,
          }));
        return assetFiatBalance;
      })
      .reduce((memo, item) => {
        return memo.concat(item);
      }, [])
      .reduce((memo, item) => {
        memo[item.currency] = (memo[item.currency] || 0) + item.total;
        return memo;
      }, {});
  }

  render() {
    const { assets, rates, baseCurrency } = this.props;
    if (!Object.keys(rates).length || !Object.keys(assets).length) {
      return null;
    }
    const portfolioBalance = this.calculatePortfolioBalance(assets, rates);
    return (
      <View>
        <Text style={{ color: 'white', fontSize: 32 }}>
          Total Portfolio
        </Text>
        <Text style={{ color: 'white', fontSize: 32, textAlign: 'center' }}>
          ${+parseFloat(portfolioBalance[baseCurrency]).toFixed(2)}
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
