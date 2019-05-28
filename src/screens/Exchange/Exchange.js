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
import { TouchableOpacity, FlatList, Text } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import { UIColors } from 'utils/variables';
import { Container, Wrapper } from 'components/Layout';
import Header from 'components/Header';
import SelectToken from 'components/SelectToken';
import SelectTokenAmount from 'components/SelectTokenAmount';
import { searchOffersAction } from 'actions/exchangeActions';

import type { SearchResults } from 'models/Exchange';
import type { Assets, Rates } from 'models/Asset';

const Screen = styled(Container)`
  background-color: ${UIColors.defaultBackgroundColor};
`;

const HeaderWrapper = styled(Wrapper)`
  background-color: ${UIColors.defaultHeaderColor};
`;

const BodyWrapper = styled(Wrapper)`
  margin: 20px 20px 0;
`;

const ListItem = styled(TouchableOpacity)``;

const Subtitle = styled(Text)`
  margin: 9px 0;
  color: black;
  font-size: 17px;
  font-weight: bold;
`;

type Props = {
  rates: Rates,
  navigation: NavigationScreenProp<*>,
  searchResults: SearchResults,
  baseFiatCurrency: string,
  user: Object,
  assets: Assets,
  searchOffers: (string, string, string) => void,
  offers: {
    searchResults: SearchResults,
  },
};

type State = {
  selectedSellToken: string,
  selectedSellAmount: string,
  selectedBuyToken: string,
};

class ExchangeScreen extends React.Component<Props, State> {
  state = {
    selectedSellAmount: '0.0',
    selectedSellToken: '',
    selectedBuyToken: '',
  };

  constructor(props: Props) {
    super(props);
    const firstAssetKey = Object.keys(props.assets)[0];
    const firstAssetSymbol = props.assets[firstAssetKey].symbol;

    this.state.selectedSellToken = firstAssetSymbol;
    this.state.selectedBuyToken = firstAssetSymbol;
  }

  onSellTokenChanged = (selectedSellToken: string) => {
    this.setState({ selectedSellToken }, () => this.triggerSearch());
  }

  onSellAmountChanged = (selectedSellAmount: string) => {
    this.setState({ selectedSellAmount }, () => this.triggerSearch());
  }

  onBuyTokenChanged = (selectedBuyToken: string) => {
    this.setState({ selectedBuyToken }, () => this.triggerSearch());
  }

  triggerSearch = () => {
    const { selectedSellAmount, selectedSellToken, selectedBuyToken } = this.state;
    const { searchOffers } = this.props;
    const sellAmount = parseFloat(selectedSellAmount);

    if ((sellAmount > 0) && (selectedBuyToken !== '') && (selectedSellToken !== '')) {
      searchOffers(selectedBuyToken, selectedSellToken, selectedSellAmount);
    }
  }

  render() {
    const {
      rates,
      assets,
      baseFiatCurrency,
      searchResults: offers,
    } = this.props;
    const { selectedBuyToken, selectedSellAmount, selectedSellToken } = this.state;
    const assetsList = Object.keys(assets).map((key: string) => assets[key]);

    return (
      <Screen inset={{ bottom: 0 }}>
        <HeaderWrapper>
          <Header title="exchange" />
        </HeaderWrapper>

        <BodyWrapper inset={{ bottom: 0 }}>
          <Subtitle>Selling</Subtitle>
          <SelectTokenAmount
            baseFiatCurrency={baseFiatCurrency}
            selectedToken={selectedSellToken}
            selectedAmount={selectedSellAmount}
            onTokenChange={this.onSellTokenChanged}
            onAmountChange={this.onSellAmountChanged}
            assets={assetsList}
            rates={rates}
          />

          <Subtitle>Buying</Subtitle>
          <SelectToken
            assets={assetsList}
            selectedToken={selectedBuyToken}
            onTokenChange={this.onBuyTokenChanged}
          />

          <Text>OFFERS</Text>
          <FlatList
            data={offers}
            contentContainerStyle={{ width: '100%' }}
            renderItem={({ item: { provider } }) => (
              <ListItem>
                <Text>PROVIDER: {provider}</Text>
              </ListItem>
            )}
          />
        </BodyWrapper>
      </Screen>
    );
  }
}

const mapStateToProps = ({
  appSettings: { data: { baseFiatCurrency } },
  exchange: { data: { offers: searchResults } },
  assets: { data: assets },
  rates: { data: rates },
}) => ({
  baseFiatCurrency,
  searchResults,
  assets,
  rates,
});

const mapDispatchToProps = (dispatch: Function) => ({
  searchOffers: (buyToken, sellToken, sellAmount) => dispatch(
    searchOffersAction(buyToken, sellToken, sellAmount),
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(ExchangeScreen);
