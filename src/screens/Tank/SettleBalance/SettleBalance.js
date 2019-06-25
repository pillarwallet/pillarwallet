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
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import { FlatList } from 'react-native';
import { createStructuredSelector } from 'reselect';
import { SDK_PROVIDER } from 'react-native-dotenv';
import type { NavigationScreenProp } from 'react-navigation';

// config
import assetsConfig from 'configs/assetsConfig';

// components
import { Container, Footer } from 'components/Layout';
import { Label, BaseText } from 'components/Typography';
import Button from 'components/Button';
import Header from 'components/Header';
import Separator from 'components/Separator';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import TankAssetBalance from 'components/TankAssetBalance';
import Checkbox from 'components/Checkbox';

// constants
import { defaultFiatCurrency, ETH } from 'constants/assetsConstants';
import { SETTLE_BALANCE_CONFIRM } from 'constants/navigationConstants';

// selectors
import { paymentNetworkNonZeroBalancesSelector } from 'selectors/paymentNetwork';

// types
import type { Assets, Balances, Rates } from 'models/Asset';

// utils
import { baseColors, fontSizes } from 'utils/variables';
import { formatMoney, getCurrencySymbol, formatAmount } from 'utils/common';
import { getRate } from 'utils/assets';


type Props = {
  navigation: NavigationScreenProp<*>,
  assetsOnNetwork: Object[],
  paymentNetworkBalances: Balances,
  baseFiatCurrency: string,
  rates: Rates,
  assets: Assets,
  session: Object,
  estimateSettleBalance: Function,
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
    if (assetShouldRender) return null;
    const { assetsToSettle } = this.state;
    const { baseFiatCurrency, assets, rates } = this.props;
    const assetInfo = {
      ...(assets[item.symbol] || {}),
      ...item,
    };

    const fullIconUrl = `${SDK_PROVIDER}/${assetInfo.iconUrl}?size=3`;
    const formattedAmount = formatAmount(assetInfo.balance);
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const totalInFiat = assetInfo.balance * getRate(rates, assetInfo.symbol, fiatCurrency);
    const formattedAmountInFiat = formatMoney(totalInFiat);
    const currencySymbol = getCurrencySymbol(fiatCurrency);

    return (
      <ListItemWithImage
        label={assetInfo.name}
        itemImageUrl={fullIconUrl || genericToken}
        fallbackSource={genericToken}
        onPress={() => this.toggleAssetInTransferList(assetInfo)}
        customAddon={
          <AddonWrapper>
            <BalanceWrapper>
              <TankAssetBalance amount={formattedAmount} isSynthetic={assetInfo.symbol !== ETH} />
              <ValueInFiat>
                {`${currencySymbol}${formattedAmountInFiat}`}
              </ValueInFiat>
            </BalanceWrapper>
            <Checkbox
              onPress={() => this.toggleAssetInTransferList(assetInfo)}
              checked={!!assetsToSettle.find(asset => asset.name === assetInfo.name)}
              rounded
              wrapperStyle={{ width: 24, marginRight: 4, marginLeft: 12 }}
            />
          </AddonWrapper>
        }
        rightColumnInnerStyle={{ flexDirection: 'row' }}
      />
    );
  };

  toggleAssetInTransferList = (asset: Object) => {
    const { assetsToSettle } = this.state;
    let updatedAssetsToSettle;
    if (assetsToSettle.find(thisAsset => thisAsset.name === asset.name)) {
      updatedAssetsToSettle = assetsToSettle.filter(_asset => _asset.name !== asset.name);
    } else {
      updatedAssetsToSettle = [...assetsToSettle, asset];
    }
    this.setState({ assetsToSettle: updatedAssetsToSettle });
  };

  goToConfirm = () => {
    const { navigation } = this.props;
    const { assetsToSettle } = this.state;
    navigation.navigate(SETTLE_BALANCE_CONFIRM, { assetsToSettle });
  };

  render() {
    const { navigation, assetsOnNetwork, session } = this.props;
    const { assetsToSettle } = this.state;
    return (
      <Container>
        <Header
          onBack={() => navigation.goBack(null)}
          title="settle balance"
          white
        />
        <FlatList
          keyExtractor={item => item.symbol}
          data={Object.values(assetsOnNetwork)}
          renderItem={this.renderAsset}
          ItemSeparatorComponent={() => <Separator spaceOnLeft={82} />}
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: 10,
          }}
        />
        <Footer>
          <FooterInner style={{ alignItems: 'center' }}>
            <Label>&nbsp;</Label>
            {!!assetsToSettle.length && (
              <Button
                small
                disabled={!session.isOnline}
                title="Next"
                onPress={this.goToConfirm}
              />
            )}
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
  session: { data: session },
}) => ({
  assets,
  rates,
  baseFiatCurrency,
  session,
});

const structuredSelector = createStructuredSelector({
  assetsOnNetwork: paymentNetworkNonZeroBalancesSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(SettleBalance);
