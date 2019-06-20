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
import debounce from 'lodash.debounce';
import { formatMoney } from 'utils/common';
import t from 'tcomb-form-native';

import { baseColors, fontSizes, spacing } from 'utils/variables';

import { Container, ScrollWrapper } from 'components/Layout';
import Header from 'components/Header';
import ShadowedCard from 'components/ShadowedCard';
import { BaseText } from 'components/Typography';
import SelectorInput from 'components/SelectorInput';
import Button from 'components/Button';

import {
  searchOffersAction,
  takeOfferAction,
  authorizeWithShapeshiftAction,
  resetShapeshiftAccessTokenAction,
} from 'actions/exchangeActions';

import type { Offer } from 'models/Offer';
import type { Assets, Rates } from 'models/Asset';

import { EXCHANGE_CONFIRM } from 'constants/navigationConstants';
import { ETH } from 'constants/assetsConstants';

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

const ButtonLabelNegative = styled(ButtonLabel)`
  color: ${baseColors.burningFire};
`;

const FormWrapper = styled.View`
  padding: 0 ${spacing.large}px;
  margin-top: ${spacing.large}px;
`;

type Props = {
  rates: Rates,
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: string,
  user: Object,
  assets: Assets,
  searchOffers: (string, string, number) => void,
  offers: Offer[],
  takeOffer: (string, string, number, string) => Object,
  authorizeWithShapeshift: Function,
  shapeshiftAccessToken?: string,
  resetShapeshiftAccessToken: Function,
};

type State = {
  value: Object,
  selectedSellAmount: string,
  selectedValueSelling: Object,
  selectedValueBuying: Object,
  shapeshiftAuthClicked: boolean,
};

const getAvailable = (min, max) => {
  if (!min && !max) {
    return 'N/A';
  } else if (!min || !max || min === max) {
    return `${min || max}`;
  }
  return `${min} - ${max}`;
};

const { Form } = t.form;

const Amount = t.String;

Amount.getValidationErrorMessage = () => {
  return 'Amount should be specified.';
};

const formStructure = t.struct({
  selling: Amount,
  buying: t.String,
});

function SelectorInputTemplate(locals) {
  const {
    config: {
      onValueSelected,
      options,
      selectedOption,
      label,
      hasInput,
      onInputChange,
      wrapperStyle,
      placeholderSelector,
      placeholderInput,
    },
  } = locals;
  const errorMessage = locals.error;
  const inputProps = {
    onChange: locals.onChange,
    onBlur: locals.onBlur,
    value: locals.value,
    keyboardType: locals.keyboardType,
    maxLength: 42,
    label,
    placeholderSelector,
    placeholder: placeholderInput,
  };
  return (
    <SelectorInput
      inputProps={inputProps}
      onValueSelected={onValueSelected}
      options={options}
      selectedOption={selectedOption}
      errorMessage={errorMessage}
      hasInput={hasInput}
      onInputChange={onInputChange}
      wrapperStyle={wrapperStyle}
    />
  );
}

const generateFormOptions = (config: Object): Object => ({
  fields: {
    selling: {
      keyboardType: 'decimal-pad',
      placeholder: '0.0',
      template: SelectorInputTemplate,
      config: {
        label: 'Selling',
        hasInput: true,
        selectedOption: config.selectedOptionSelling,
        options: config.optionsSelling,
        inputProps: {
          autoCapitalize: 'none',
        },
        onValueSelected: config.onValueSelectedSelling,
        onInputChange: config.onInputChange,
        placeholderSelector: 'select',
        placeholderInput: '0',
      },
    },
    buying: {
      template: SelectorInputTemplate,
      config: {
        label: 'Buying',
        selectedOption: config.selectedOptionBuying,
        options: config.optionsBuying,
        inputProps: {
          autoCapitalize: 'none',
        },
        onValueSelected: config.onValueSelectedBuying,
        wrapperStyle: { marginTop: spacing.mediumLarge },
        placeholderSelector: 'select asset',
      },
    },
  },
});

class ExchangeScreen extends React.Component<Props, State> {
  exchangeForm: t.form;

  state = {
    shapeshiftAuthClicked: false,
    value: {
      selling: '',
      buying: '',
    },
    selectedSellAmount: '',
    selectedValueSelling: {},
    selectedValueBuying: {},
  };

  constructor(props: Props) {
    super(props);
    this.triggerSearch = debounce(this.triggerSearch, 500);
  }

  componentDidMount() {
    this.setInitialSelection();
  }

  setInitialSelection = () => {
    const { assets } = this.props;
    const assetsOptions = this.generateOptions({ ETH: assets[ETH] });
    this.setState({
      selectedValueSelling: assetsOptions[0],
    });
  };

  triggerSearch = () => {
    const { selectedSellAmount, selectedValueSelling, selectedValueBuying } = this.state;
    const { value: selectedSellToken } = selectedValueSelling;
    const { value: selectedBuyToken } = selectedValueBuying;
    const { searchOffers } = this.props;
    const fromAmount = parseFloat(selectedSellAmount);

    if (fromAmount > 0 && selectedBuyToken && selectedSellToken) {
      searchOffers(selectedBuyToken, selectedSellToken, fromAmount);
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
              <CardText>{`${offer.askRate} ${offer.fromAssetCode || ''}`}</CardText>
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
                title={`${formatMoney(amountToBuy)} ${offer.toAssetCode}`}
                small
                onPress={() => { navigation.navigate(EXCHANGE_CONFIRM, { transactionPayload }); }}
              />
            </CardColumn>
          </CardRow>
        </CardWrapper>
      </ShadowedCard>
    );
  };

  onShapeshiftAuthClick = () => {
    const { authorizeWithShapeshift } = this.props;
    this.setState({ shapeshiftAuthClicked: true }, async () => {
      await authorizeWithShapeshift();
      this.setState({ shapeshiftAuthClicked: false });
    });
  };

  generateOptions = (assets) => {
    const assetsList = Object.keys(assets).map((key: string) => assets[key]);
    // TODO: filter out assets without balance
    return assetsList.map(({ symbol, iconUrl, ...rest }) =>
      ({
        key: symbol,
        value: symbol,
        icon: iconUrl,
        iconUrl,
        symbol,
        ...rest,
      }));
  };

  handleSearch = () => {
    // const formValue = this.exchangeForm.getValue();
    // if (!formValue) return;
    this.triggerSearch();
  };

  handleFormChange = (value: Object) => {
    this.setState({ value });
  };

  handleInputChange = (inputVal: string) => {
    this.setState({ selectedSellAmount: inputVal });
  }

  render() {
    const {
      assets,
      offers,
      shapeshiftAccessToken,
      resetShapeshiftAccessToken,
    } = this.props;
    const {
      shapeshiftAuthClicked,
      value,
      selectedValueSelling,
      selectedValueBuying,
      // supportedAssets = [],
    } = this.state;
    const assetsOptionsSelling = this.generateOptions(assets);
    // const assetsOptionsBuying = this.generateOptions(supportedAssets);
    const assetsOptionsBuying = this.generateOptions(assets);

    const formOptions = generateFormOptions({
      optionsSelling: assetsOptionsSelling,
      selectedOptionSelling: selectedValueSelling,
      onValueSelectedSelling: (val) => {
        this.setState({ selectedValueSelling: val });
        this.handleSearch();
      },
      onInputChange: (val) => { this.handleInputChange(val); },
      optionsBuying: assetsOptionsBuying,
      selectedOptionBuying: selectedValueBuying,
      onValueSelectedBuying: (val) => {
        this.setState({ selectedValueBuying: val });
        this.handleSearch();
      },
    });

    return (
      <Container color={baseColors.snowWhite} inset={{ bottom: 0 }}>
        <Header title="exchange" />
        <ScrollWrapper>
          <FormWrapper>
            <Form
              ref={node => { this.exchangeForm = node; }}
              type={formStructure}
              options={formOptions}
              value={value}
              onChange={this.handleFormChange}
            />
          </FormWrapper>
          <FlatList
            data={offers}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ width: '100%', paddingHorizontal: 20, paddingVertical: 10 }}
            renderItem={this.renderOffers}
            ListHeaderComponent={
              <ListHeader>
                {(!shapeshiftAccessToken &&
                  <HeaderButton disabled={shapeshiftAuthClicked} onPress={() => this.onShapeshiftAuthClick()}>
                    <ButtonLabel>Connect to ShapeShift</ButtonLabel>
                  </HeaderButton>) ||
                  <HeaderButton onPress={() => resetShapeshiftAccessToken()}>
                    <ButtonLabelNegative>Disconnect ShapeShift</ButtonLabelNegative>
                  </HeaderButton>
                }
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
  exchange: { data: { offers, shapeshiftAccessToken } },
  assets: { data: assets, supportedAssets },
  rates: { data: rates },
}) => ({
  baseFiatCurrency,
  offers,
  assets,
  supportedAssets,
  rates,
  shapeshiftAccessToken,
});

const mapDispatchToProps = (dispatch: Function) => ({
  searchOffers: (fromAssetCode, toAssetCode, fromAmount) => dispatch(
    searchOffersAction(fromAssetCode, toAssetCode, fromAmount),
  ),
  takeOffer: (fromAssetCode, toAssetCode, fromAmount, provider) => dispatch(
    takeOfferAction(fromAssetCode, toAssetCode, fromAmount, provider),
  ),
  authorizeWithShapeshift: () => dispatch(authorizeWithShapeshiftAction()),
  resetShapeshiftAccessToken: () => dispatch(resetShapeshiftAccessTokenAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(ExchangeScreen);
