// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import * as React from 'react';
import styled from 'styled-components/native';
import { FlatList } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import type { Assets, Balances, Rates } from 'models/Asset';
import { connect } from 'react-redux';
import { SDK_PROVIDER } from 'react-native-dotenv';
import { createStructuredSelector } from 'reselect';

import { Container, Footer } from 'components/Layout';
import { Label, BaseText } from 'components/Typography';
import Button from 'components/Button';
import Header from 'components/Header';
import Separator from 'components/Separator';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import { defaultFiatCurrency } from 'constants/assetsConstants';
import { SETTLE_BALANCE_CONFIRM } from 'constants/navigationConstants';
import TankAssetBalance from 'components/TankAssetBalance';
import Checkbox from 'components/Checkbox';

import { accountBalancesSelector } from 'selectors/balances';
import assetsConfig from 'configs/assetsConfig';

import { baseColors, fontSizes } from 'utils/variables';
import { getBalance, getRate } from 'utils/assets';
import { formatMoney, getCurrencySymbol, formatAmount } from 'utils/common';

type Props = {
  navigation: NavigationScreenProp<*>,
  assets: Assets,
  balances: Balances,
  baseFiatCurrency: string,
  rates: Rates,
};

type State = {
  assetsToSettle: Object[],
};

const FooterInner = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;
  width: 100%;
`;

const AddonWrapper = styled.View`
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
`;

const BalanceWrapper = styled.View`
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-end;
  height: 100%;
`;

const ValueInFiat = styled(BaseText)`
  color: ${baseColors.coolGrey};
  font-size: ${fontSizes.extraExtraSmall}px;
`;

const genericToken = require('assets/images/tokens/genericToken.png');

class SettleBalance extends React.Component<Props, State> {
  state = {
    assetsToSettle: [],
  };

  renderAsset = ({ item }) => {
    const assetShouldRender = assetsConfig[item.symbol] && !assetsConfig[item.symbol].send;
    if (assetShouldRender) {
      return null;
    }
    const { assetsToSettle } = this.state;
    const { baseFiatCurrency, rates, balances } = this.props;
    const fullIconUrl = `${SDK_PROVIDER}/${item.iconUrl}?size=3`;
    const formattedAmount = formatAmount(item.amount);
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const balance = getBalance(balances, item.symbol);
    const totalInFiat = balance * getRate(rates, item.symbol, fiatCurrency);
    const formattedAmountInFiat = formatMoney(totalInFiat);
    const currencySymbol = getCurrencySymbol(fiatCurrency);

    return (
      <ListItemWithImage
        label={item.name}
        itemImageUrl={fullIconUrl || genericToken}
        fallbackSource={genericToken}
        onPress={() => this.toggleAssetInTransferList(item.name, item.amount)}
        customAddon={
          <AddonWrapper>
            <BalanceWrapper>
              <TankAssetBalance amount={formattedAmount} isSynthetic={item.symbol !== 'ETH'} />
              <ValueInFiat>
                {`${currencySymbol}${formattedAmountInFiat}`}
              </ValueInFiat>
            </BalanceWrapper>
            <Checkbox
              onPress={() => this.toggleAssetInTransferList(item.name, item.amount)}
              checked={!!assetsToSettle.find(asset => asset.name === item.name)}
              rounded
              wrapperStyle={{ width: 24, marginRight: 4, marginLeft: 12 }}
            />
          </AddonWrapper>
        }
        rightColumnInnerStyle={{ flexDirection: 'row' }}
      />
    );
  };

  toggleAssetInTransferList = (name: string, amount: number) => {
    const { assetsToSettle } = this.state;
    // toggle asset in array
    const updated = assetsToSettle.filter(asset => asset.name !== name);
    if (!assetsToSettle.find(asset => asset.name === name)) {
      updated.push({ name, amount });
    }
    this.setState({ assetsToSettle: updated });
  };

  goToConfirm = () => {
    const { navigation } = this.props;
    const transactionPayload = {};
    navigation.navigate(SETTLE_BALANCE_CONFIRM, { transactionPayload });
  }

  render() {
    const { navigation, assets, balances } = this.props;
    const tankAssets = Object.values(assets)
      .map((asset: any) => {
        const amount = getBalance(balances, asset.symbol);
        return { ...asset, amount };
      });

    return (
      <Container>
        <Header
          onBack={() => navigation.goBack(null)}
          title="settle balance"
          white
        />
        <FlatList
          keyExtractor={item => item.symbol}
          data={tankAssets}
          renderItem={this.renderAsset}
          ItemSeparatorComponent={() => <Separator spaceOnLeft={82} />}
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: 10,
          }}
        />
        <Footer>
          <FooterInner style={{ alignItems: 'center' }}>
            <Label>Fee 0.0004 ETH</Label>
            <Button
              small
              title="Next"
              onPress={this.goToConfirm}
            />
          </FooterInner>
        </Footer>
      </Container>
    );
  }
}

const mapStateToProps = ({
  assets: { data: assets },
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
}) => ({
  assets,
  rates,
  baseFiatCurrency,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(SettleBalance);
