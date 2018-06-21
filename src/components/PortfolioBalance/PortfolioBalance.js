// @flow
import * as React from 'react';
import { Text, View } from 'react-native';
import { UIColors, baseColors, fontSizes, fontWeights } from 'utils/variables';
import type { Asset, Assets } from 'models/Asset';
import { connect } from 'react-redux';
import { formatMoney, getCurrencySymbol } from 'utils/common';
import { defaultFiatCurrency } from 'constants/assetsConstants';

type Rates = {
  [string]: {
    [string]: number,
  },
};

type Props = {
  assets: Assets,
  rates: Rates,
  baseFiatCurrency: string,
  label?: string;
};

class PortfolioBalance extends React.Component<Props, {}> {
  calculatePortfolioBalance(assets: Assets, rates: Rates) {
    // CLEANUP REQUIRED
    return Object
      .keys(assets)
      .map(key => assets[key])
      .map((item: Asset) => {
        const assetRates = rates[item.symbol] || {};
        const assetFiatBalance = Object
          .keys(assetRates)
          .map(key => ({
            currency: key,
            total: assetRates[key] * (item.balance || 0),
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
    const { assets, rates, baseFiatCurrency, label } = this.props;

    if (!Object.keys(rates).length || !Object.keys(assets).length) {
      return null;
    }

    let portfolioBalance = this.calculatePortfolioBalance(assets, rates);
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    portfolioBalance = formatMoney(portfolioBalance[fiatCurrency]);
    const currencySymbol = getCurrencySymbol(fiatCurrency);

    return (
      <View>
        {!!label &&
        <Text style={{
          color: baseColors.mediumGray,
          fontSize: fontSizes.medium,
          }}
        >
          {label}
        </Text>}
        <Text style={{
          color: UIColors.defaultTextColor,
          fontSize: fontSizes.extraExtraLarge,
          fontWeight: fontWeights.bold,
        }}
        >
          {currencySymbol}{portfolioBalance}
        </Text>
      </View>
    );
  }
}

const mapStateToProps = ({
  assets: { data: assets },
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
}) => ({
  rates,
  assets,
  baseFiatCurrency,
});
export default connect(mapStateToProps)(PortfolioBalance);
