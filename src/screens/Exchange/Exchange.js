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
import Spinner from 'components/Spinner';
import Toast from 'components/Toast';

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
  shapeshiftAuthPressed: boolean,
  formOptions: Object,
  // offer id will be passed to prevent double clicking
  pressedOfferId: string,
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

const FromOption = t.refinement(t.Object, ({ selector, input }) => {
  let isValid = true;
  if (!Object.keys(selector).length) {
    isValid = false;
  } else if (!input || parseFloat(input) < 0) {
    isValid = false;
  }
  return isValid;
});

FromOption.getValidationErrorMessage = ({ selector, input }) => {
  if (!Object.keys(selector).length) return 'Asset should be selected';
  if (!input) return 'Amount should be specified.';
  if (parseFloat(input) < 0) return 'Amount should be bigger than 0.';
  return null;
};

const ToOption = t.refinement(t.Object, ({ selector }) => {
  return !!Object.keys(selector).length;
});

ToOption.getValidationErrorMessage = () => {
  return 'Asset should be selected';
};

const formStructure = t.struct({
  fromInput: FromOption,
  toInput: ToOption,
});

function SelectorInputTemplate(locals) {
  const {
    config: {
      label,
      hasInput,
      wrapperStyle,
      placeholderSelector,
      placeholderInput,
      options,
    },
  } = locals;
  const errorMessage = locals.error;
  const inputProps = {
    onChange: locals.onChange,
    onBlur: locals.onBlur,
    keyboardType: locals.keyboardType,
    maxLength: 42,
    label,
    placeholderSelector,
    placeholder: placeholderInput,
  };
  return (
    <SelectorInput
      inputProps={inputProps}
      options={options}
      errorMessage={errorMessage}
      hasInput={hasInput}
      wrapperStyle={wrapperStyle}
      value={locals.value}
    />
  );
}

class ExchangeScreen extends React.Component<Props, State> {
  exchangeForm: t.form;

  state = {
    shapeshiftAuthPressed: false,
    pressedOfferId: '',
    value: {
      fromInput: {
        selector: {},
        input: '',
      },
      toInput: {
        selector: {},
        input: '',
      },
    },
    formOptions: {
      fields: {
        fromInput: {
          keyboardType: 'decimal-pad',
          template: SelectorInputTemplate,
          config: {
            label: 'Selling',
            hasInput: true,
            options: [],
            placeholderSelector: 'select',
            placeholderInput: '0',
          },
        },
        toInput: {
          template: SelectorInputTemplate,
          config: {
            label: 'Buying',
            options: [],
            wrapperStyle: { marginTop: spacing.mediumLarge },
            placeholderSelector: 'select asset',
          },
        },
      },
    },
  };

  constructor(props: Props) {
    super(props);
    this.triggerSearch = debounce(this.triggerSearch, 500);
  }

  componentDidMount() {
    this.provideOptions();
    this.setInitialSelection();
  }

  provideOptions = () => {
    const { assets } = this.props;
    const assetsOptionsFrom = this.generateOptions(assets);
    const assetsOptionsBuying = this.generateOptions(assets);
    const initialAssetsOptionsBuying = assetsOptionsBuying.filter((option) => option.value !== ETH);

    this.setState({
      formOptions: {
        fields: {
          fromInput: {
            keyboardType: 'decimal-pad',
            template: SelectorInputTemplate,
            config: {
              label: 'Selling',
              hasInput: true,
              options: assetsOptionsFrom,
              placeholderSelector: 'select',
              placeholderInput: '0',
            },
          },
          toInput: {
            template: SelectorInputTemplate,
            config: {
              label: 'Buying',
              options: initialAssetsOptionsBuying,
              wrapperStyle: { marginTop: spacing.mediumLarge },
              placeholderSelector: 'select asset',
            },
          },
        },
      },
    });
  };

  setInitialSelection = () => {
    const { assets } = this.props;
    const assetsOptions = this.generateOptions({ ETH: assets[ETH] });
    const initialFormState = { ...this.state.value };
    initialFormState.fromInput = {
      selector: assetsOptions[0],
      input: '',
    };
    this.setState({ value: initialFormState });
  };

  triggerSearch = () => {
    const { value: { fromInput, toInput } } = this.state;
    const { selector: { value: from }, input: amount } = fromInput;
    const { selector: { value: to } } = toInput;
    const { searchOffers } = this.props;
    const parsedAmount = parseFloat(amount);

    searchOffers(from, to, parsedAmount);
  };

  onShapeshiftAuthClick = () => {
    const { authorizeWithShapeshift } = this.props;
    this.setState({ shapeshiftAuthPressed: true }, async () => {
      await authorizeWithShapeshift();
      this.setState({ shapeshiftAuthPressed: false });
    });
  };

  onOfferPress = (offer: Offer) => {
    const {
      navigation,
      takeOffer,
    } = this.props;
    const {
      value: {
        fromInput: {
          input: selectedSellAmount,
        },
      },
    } = this.state;
    const {
      _id,
      provider,
      fromAssetCode,
      toAssetCode,
      askRate,
    } = offer;
    const amountToBuy = parseFloat(selectedSellAmount) * askRate;
    this.setState({ pressedOfferId: _id }, async () => {
      const offerOrder = await takeOffer(fromAssetCode, toAssetCode, amountToBuy, provider);
      this.setState({ pressedOfferId: '' }); // reset
      if (!offerOrder || !offerOrder.data || offerOrder.error) {
        Toast.show({
          title: 'Exchange service failed',
          type: 'warning',
          message: 'Unable to request offer',
        });
        return;
      }
      const { data: offerOrderData } = offerOrder;
      navigation.navigate(EXCHANGE_CONFIRM, { offerOrder: offerOrderData });
    });
  };

  renderOffers = ({ item: offer }) => {
    const { value: { fromInput }, pressedOfferId } = this.state;
    const { input: selectedSellAmount } = fromInput;
    const available = getAvailable(offer.minQuantity, offer.maxQuantity);
    const amountToBuy = parseFloat(selectedSellAmount) * offer.askRate;
    const isPressed = pressedOfferId === offer._id;
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
                disabled={isPressed}
                title={isPressed ? '' : `${formatMoney(amountToBuy)} ${offer.toAssetCode}`}
                small
                onPress={() => this.onOfferPress(offer)}
              >
                {isPressed && <Spinner width={20} height={20} />}
              </Button>
            </CardColumn>
          </CardRow>
        </CardWrapper>
      </ShadowedCard>
    );
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
    const formValue = this.exchangeForm.getValue();
    if (!formValue) return;
    this.triggerSearch();
  };

  handleFormChange = (value: Object) => {
    this.setState({ value });
    this.handleSearch();
    this.updateOptions(value);
  };

  updateOptions = (value) => {
    const { assets } = this.props;
    const { fromInput, toInput } = value;
    const { selector: selectedFromOption } = fromInput;
    const { selector: selectedToOption } = toInput;

    const optionsFrom = this.generateOptions(assets);
    let newOptionsFrom = optionsFrom;
    if (Object.keys(selectedToOption).length) {
      newOptionsFrom = optionsFrom.filter((option) => option.value !== selectedToOption.value);
    }

    const optionsTo = this.generateOptions(assets);
    let newOptionsTo = optionsTo;
    // const newOptionsTo = this.generateOptions(supportedAssets);
    if (Object.keys(selectedFromOption).length) {
      newOptionsTo = optionsTo.filter((option) => option.value !== selectedFromOption.value);
    }

    const newOptions = t.update(this.state.formOptions, {
      fields: {
        fromInput: {
          config: { options: { $set: newOptionsFrom } },
        },
        toInput: {
          config: { options: { $set: newOptionsTo } },
        },
      },
    });

    this.setState({ formOptions: newOptions });
  };

  render() {
    const {
      offers,
      shapeshiftAccessToken,
      resetShapeshiftAccessToken,
    } = this.props;
    const {
      shapeshiftAuthPressed,
      value,
      formOptions,
    } = this.state;

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
                  <HeaderButton disabled={shapeshiftAuthPressed} onPress={this.onShapeshiftAuthClick}>
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
