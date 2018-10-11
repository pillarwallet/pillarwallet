// @flow
import * as React from 'react';
import { View } from 'react-native';
import { UIColors, baseColors, fontSizes } from 'utils/variables';
import type { Assets, Balances, Rates } from 'models/Asset';
import { BaseText } from 'components/Typography';
import { connect } from 'react-redux';
import { formatMoney, getCurrencySymbol } from 'utils/common';
import { getBalance } from 'utils/assets';
import { defaultFiatCurrency } from 'constants/assetsConstants';

type Props = {
  assets: Assets,
  rates: Rates,
  balances: Balances,
  baseFiatCurrency: string,
  label?: string,
  style: Object,
};

class PortfolioBalance extends React.Component<Props, {}> {
  calculatePortfolioBalance(assets: Assets, rates: Rates, balances: Object) {
    // CLEANUP REQUIRED
    return Object
      .keys(assets)
      .map(key => assets[key])
      .map(({ symbol }) => {
        const assetRates = rates[symbol] || {};
        const balance = getBalance(balances, symbol);
        const assetFiatBalance = Object
          .keys(assetRates)
          .map(key => ({
            currency: key,
            total: assetRates[key] * (balance || 0),
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
    const {
      style,
      assets,
      rates,
      balances,
      baseFiatCurrency,
      label,
    } = this.props;

    const portfolioBalances = this.calculatePortfolioBalance(assets, rates, balances);
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const portfolioBalance = formatMoney(portfolioBalances[fiatCurrency] || 0);
    const currencySymbol = getCurrencySymbol(fiatCurrency);

    return (
      <View style={style}>
        {!!label &&
        <BaseText style={{
          color: baseColors.darkGray,
          fontSize: fontSizes.small,
          paddingTop: 10,
        }}
        >
          {label}
        </BaseText>}
        <BaseText style={{
          color: UIColors.defaultTextColor,
          fontSize: fontSizes.extraExtraLarge,
        }}
        >
          {currencySymbol}{portfolioBalance}
        </BaseText>
      </View>
    );
  }
}

const mapStateToProps = ({
  assets: { data: assets, balances },
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
}) => ({
  rates,
  assets,
  balances,
  baseFiatCurrency,
});
export default connect(mapStateToProps)(PortfolioBalance);
