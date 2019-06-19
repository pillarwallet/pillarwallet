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
import { FlatList, View } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import { baseColors, fontSizes, spacing } from 'utils/variables';

import { Container, ScrollWrapper } from 'components/Layout';
import Header from 'components/Header';
import ShadowedCard from 'components/ShadowedCard';
import { BaseText, BoldText } from 'components/Typography';
import SelectToken from 'components/SelectToken';
import SelectTokenAmount from 'components/SelectTokenAmount';
import Button from 'components/Button';

import { searchOffersAction } from 'actions/exchangeActions';

import type { SearchResults } from 'models/Exchange';
import type { Assets, Rates } from 'models/Asset';

import { EXCHANGE_CONFIRM } from 'constants/navigationConstants';

const Subtitle = styled(BoldText)`
  margin: 10px 0;
  color: ${baseColors.slateBlack};
  font-size: ${fontSizes.medium}px;
`;

const PaddingWrapper = styled.View`
  padding: 0 ${spacing.mediumLarge}px;
`;

const CardWrapper = styled.View`
  width: 100%;
`;

const CardRow = styled.View`
  flex: 1;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;
  padding: 10px 0;
  ${props => props.withBorder
    ? `border-bottom-width: 1px;
      border-bottom-color: ${baseColors.mediumLightGray};`
    : ''}
`;

const CardColumn = styled.View`
  flex-direction: column;
`;

const CardText = styled(BaseText)`
  line-height: 18px;
  font-size: ${fontSizes.extraSmall}px;
  letter-spacing: 0.18px;
  color: ${props => props.label ? baseColors.slateBlack : baseColors.darkGray};
  flex-wrap: wrap;
  flex: 1;
`;

const ListHeader = styled.View`
  width: 100%;
  flex-direction: row;
  justify-content: flex-end;
  margin: 14px 0;
`;

const HeaderButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
`;

const ButtonLabel = styled(BaseText)`
  color: ${baseColors.fruitSalad};
  font-size: ${fontSizes.extraSmall}px;
`;

const dummyOffers = [
  {
    _id: 'shapeshift',
    provider: 'SHAPESHIFT-SHIM',
    description: '',
    fromAssetCode: 'SNT',
    toAssetCode: 'ETH',
    askRate: 0.00010297,
    minQuantity: 57.24350649,
    maxQuantity: 180637.01281294,
  },
  {
    _id: 'shapeshift2',
    provider: 'SHAPESHIFT-SHIM',
    description: '',
    fromAssetCode: 'SNT',
    toAssetCode: 'ETH',
    askRate: 0.00010297,
    minQuantity: 57.24350649,
    maxQuantity: 180637.01281294,
  },
  {
    _id: 'shapeshift3',
    provider: 'SHAPESHIFT-SHIM',
    description: '',
    fromAssetCode: 'SNT',
    toAssetCode: 'ETH',
    askRate: 0.00010297,
    minQuantity: null,
    maxQuantity: 180637.01281294,
  },
  {
    _id: 'shapeshift4',
    provider: 'SHAPESHIFT-SHIM',
    description: '',
    fromAssetCode: 'SNT',
    toAssetCode: 'ETH',
    askRate: 0.00010297,
    minQuantity: 57.24350649,
    maxQuantity: null,
  },
  {
    _id: 'shapeshift5',
    provider: 'SHAPESHIFT-SHIM',
    description: '',
    fromAssetCode: 'SNT',
    toAssetCode: 'ETH',
    askRate: 0.00010297,
    minQuantity: null,
    maxQuantity: null,
  },
];

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

const getAvailable = (min, max) => {
  if (!min && !max) {
    return 'N/A';
  } else if (!min || !max || min === max) {
    return `${min || max}`;
  }
  return `${min} - ${max}`;
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
  };

  onSellAmountChanged = (selectedSellAmount: string) => {
    this.setState({ selectedSellAmount }, () => this.triggerSearch());
  };

  onBuyTokenChanged = (selectedBuyToken: string) => {
    this.setState({ selectedBuyToken }, () => this.triggerSearch());
  };

  triggerSearch = () => {
    const { selectedSellAmount, selectedSellToken, selectedBuyToken } = this.state;
    const { searchOffers } = this.props;
    const sellAmount = parseFloat(selectedSellAmount);

    if ((sellAmount > 0) && (selectedBuyToken !== '') && (selectedSellToken !== '')) {
      searchOffers(selectedBuyToken, selectedSellToken, selectedSellAmount);
    }
  };

  renderOffers = ({ item: offer }) => {
    const { selectedSellAmount } = this.state;
    const { navigation } = this.props;
    const available = getAvailable(offer.minQuantity, offer.maxQuantity);
    const amountToBuy = parseFloat(selectedSellAmount) * offer.askRate;
    const transactionPayload = {
      amountToBuy,
      selectedSellAmount,
      toAssetCode: offer.toAssetCode,
      fromAssetCode: offer.fromAssetCode,
    };

    return (
      <ShadowedCard
        wrapperStyle={{ marginBottom: 10 }}
        contentWrapperStyle={{ paddingHorizontal: 16, paddingVertical: 6 }}
      >
        <CardWrapper>
          <CardRow withBorder>
            <CardColumn>
              <CardText label>Exchange rate</CardText>
              <CardText>{`${amountToBuy} ${offer.fromAssetCode || ''}`}</CardText>
            </CardColumn>
          </CardRow>
          <CardRow>
            <CardColumn style={{ flex: 1 }}>
              <CardText label>Available</CardText>
              <View style={{ flexDirection: 'row' }}>
                <CardText>{available}</CardText>
              </View>
            </CardColumn>
            <CardColumn >
              <Button
                title={`${offer.askRate} ${offer.toAssetCode}`}
                small
                onPress={() => { navigation.navigate(EXCHANGE_CONFIRM, { transactionPayload }); }}
              />
            </CardColumn>
          </CardRow>
        </CardWrapper>
      </ShadowedCard>
    );
  };

  render() {
    const {
      rates,
      assets,
      baseFiatCurrency,
      // searchResults: offers,
    } = this.props;
    const { selectedBuyToken, selectedSellAmount, selectedSellToken } = this.state;
    const assetsList = Object.keys(assets).map((key: string) => assets[key]);

    return (
      <Container color={baseColors.snowWhite} inset={{ bottom: 0 }}>
        <Header title="exchange" />
        <ScrollWrapper>
          <PaddingWrapper>
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
          </PaddingWrapper>
          <FlatList
            // data={offers}
            data={dummyOffers}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ width: '100%', paddingHorizontal: 20, paddingVertical: 10 }}
            renderItem={this.renderOffers}
            ListHeaderComponent={
              <ListHeader>
                <HeaderButton onPress={() => {}}>
                  <ButtonLabel>Connect more exchanges</ButtonLabel>
                </HeaderButton>
              </ListHeader>
            }
          />
        </ScrollWrapper>
      </Container>
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
