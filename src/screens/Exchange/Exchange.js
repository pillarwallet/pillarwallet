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
import { FlatList, Platform, View } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import debounce from 'lodash.debounce';
import { formatAmount, formatMoney, getCurrencySymbol, isValidNumber } from 'utils/common';
import t from 'tcomb-form-native';
import { utils } from 'ethers';
import { BigNumber } from 'bignumber.js';
import { createStructuredSelector } from 'reselect';

import { baseColors, fontSizes, spacing } from 'utils/variables';
import { getBalance, getRate } from 'utils/assets';

import { Container, ScrollWrapper } from 'components/Layout';
import Header from 'components/Header';
import ShadowedCard from 'components/ShadowedCard';
import { BaseText, Label, TextLink, Paragraph, BoldText } from 'components/Typography';
import SelectorInput from 'components/SelectorInput';
import Button from 'components/Button';
import Spinner from 'components/Spinner';
import Toast from 'components/Toast';
import SlideModal from 'components/Modals/SlideModal';
import ButtonText from 'components/ButtonText';
import Animation from 'components/Animation';

import {
  searchOffersAction,
  takeOfferAction,
  authorizeWithShapeshiftAction,
  resetShapeshiftAccessTokenAction,
  resetOffersAction,
} from 'actions/exchangeActions';
import { fetchGasInfoAction } from 'actions/historyActions';

import type { Offer } from 'models/Offer';
import type { Asset, Assets, Balances, Rates } from 'models/Asset';
import type { GasInfo } from 'models/GasInfo';

import { EXCHANGE_CONFIRM } from 'constants/navigationConstants';
import { defaultFiatCurrency, ETH } from 'constants/assetsConstants';
import { accountBalancesSelector } from 'selectors/balances';

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
  align-items: ${props => props.alignRight ? 'flex-end' : 'flex-start'};
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
  align-items: flex-end;
  margin: 14px 0;
`;

const HeaderButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
`;

const ButtonLabel = styled(BaseText)`
  color: ${props => props.color ? props.color : baseColors.slateBlack};
  font-size: ${fontSizes.extraSmall}px;
`;

const FormWrapper = styled.View`
  padding: 0 ${spacing.large}px;
  margin-top: ${spacing.large}px;
`;

const ButtonWrapper = styled.View`
  margin-top: ${spacing.rhythm / 2}px;
  margin-bottom: ${spacing.rhythm + 10}px;
`;

const SpeedButton = styled(Button)`
  margin-top: 14px;
  display: flex;
  justify-content: space-between;
`;

const FeeInfo = styled.View`
  margin-top: ${spacing.small}px;
`;

const Status = styled.View`
  flex-direction: row;
  height: 50px;
  justify-content: flex-start;
  align-items: center;
`;

const StatusIcon = styled.View`
  height: 8px;
  width: 8px;
  border-radius: 4px;
  background-color: ${baseColors.fruitSalad};
  position: absolute;
  top: 7px;
  left: 7px;
`;

const StatusText = styled(BoldText)`
  color: ${baseColors.fruitSalad};
  font-size: ${fontSizes.tiny}px;
  letter-spacing: 0.15px;
  line-height: ${fontSizes.tiny}px;
  margin-top: 2px;
`;

const IconHolder = styled.View`
  position: relative;
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
  supportedAssets: Asset[],
  fetchGasInfo: Function,
  balances: Balances,
  gasInfo: GasInfo,
  resetOffers: Function,
};

type State = {
  value: Object,
  shapeshiftAuthPressed: boolean,
  formOptions: Object,
  // offer id will be passed to prevent double clicking
  pressedOfferId: string,
  transactionSpeed: string,
  showFeeModal: boolean,
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

const MIN_TX_AMOUNT = 0.000000000000000001;
const GAS_LIMIT = 500000;

const SLOW = 'min';
const NORMAL = 'avg';
const FAST = 'max';

const SPEED_TYPES = {
  [SLOW]: 'Slow',
  [NORMAL]: 'Normal',
  [FAST]: 'Fast',
};

const PROVIDER_SHAPESHIFT = 'SHAPESHIFT-SHIM';
const animationSource = require('assets/animations/livePulsatingAnimation.json');

const checkIfEnoughForFee = (balances: Balances, txFeeInWei) => {
  if (!balances[ETH]) return false;
  const ethBalance = getBalance(balances, ETH);
  const balanceInWei = utils.parseUnits(ethBalance.toString(), 'ether');
  return balanceInWei.gte(txFeeInWei);
};

const calculateMaxAmount = (token: string, balance: number | string, txFeeInWei: ?Object): number => {
  if (typeof balance !== 'string') {
    balance = balance.toString();
  }
  if (token !== ETH) {
    return +balance;
  }
  const maxAmount = utils.parseUnits(balance, 'ether').sub(txFeeInWei);
  if (maxAmount.lt(0)) return 0;
  return new BigNumber(utils.formatEther(maxAmount)).toNumber();
};

const generateFormStructure = (data: Object) => {
  const { balances, txFeeInWei } = data;
  let balance;
  let maxAmount;
  let amount;

  const isEnoughForFee = checkIfEnoughForFee(balances, txFeeInWei);
  const FromOption = t.refinement(t.Object, ({ selector, input }) => {
    if (!Object.keys(selector).length || !input) return false;
    if (!isValidNumber(input)) return false;

    const { symbol, decimals } = selector;

    if (decimals === 0 && amount.toString().indexOf('.') > -1) {
      return false;
    }
    balance = getBalance(balances, symbol);
    maxAmount = calculateMaxAmount(symbol, balance, txFeeInWei);
    amount = parseFloat(input);
    return isEnoughForFee && amount <= maxAmount && amount >= MIN_TX_AMOUNT;
  });

  FromOption.getValidationErrorMessage = ({ selector, input }) => {
    const feeInEth = formatAmount(utils.formatEther(txFeeInWei));
    const { symbol } = selector;

    if (!isValidNumber(input.toString())) {
      return 'Incorrect number entered.';
    }

    if (!Object.keys(selector).length) {
      return 'Asset should be selected.';
    } else if (!input) {
      return 'Amount should be specified.';
    } else if (parseFloat(input) < 0) {
      return 'Amount should be bigger than 0.';
    } else if (amount > maxAmount) {
      let additionalMsg = '.';
      if (symbol === ETH) {
        additionalMsg = ` and est. transaction fee (${feeInEth} ETH).`;
      }
      return `Amount should not be bigger than your balance - ${balance} ${symbol}${additionalMsg}`;
    } else if (!isEnoughForFee) {
      return 'Not enough ETH to process the transaction fee.';
    } else if (amount < MIN_TX_AMOUNT) {
      return 'Amount should be greater than 1 Wei (0.000000000000000001 ETH).';
    }
    return true;
  };

  const ToOption = t.refinement(t.Object, ({ selector }) => {
    return !!Object.keys(selector).length;
  });

  ToOption.getValidationErrorMessage = () => {
    return 'Asset should be selected.';
  };

  return t.struct({
    fromInput: FromOption,
    toInput: ToOption,
  });
};

function SelectorInputTemplate(locals) {
  const {
    config: {
      label,
      hasInput,
      wrapperStyle,
      placeholderSelector,
      placeholderInput,
      options,
      inputAddonText,
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
      inputAddonText={inputAddonText}
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
    transactionSpeed: NORMAL,
    showFeeModal: false,
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
    const { fetchGasInfo } = this.props;
    fetchGasInfo();
    this.provideOptions();
    this.setInitialSelection();
  }
  componentDidUpdate(prevProps: Props) {
    const { assets, supportedAssets } = this.props;
    if (assets !== prevProps.assets || supportedAssets !== prevProps.supportedAssets) {
      this.provideOptions();
    }
  }

  provideOptions = () => {
    const { assets, supportedAssets } = this.props;
    const assetsOptionsFrom = this.generateAssetsOptions(assets);
    const assetsOptionsBuying = this.generateSupportedAssetsOptions(supportedAssets);
    const initialAssetsOptionsBuying = assetsOptionsBuying.filter((option) => option.value !== ETH);
    const thisStateFormOptionsCopy = { ...this.state.formOptions };
    thisStateFormOptionsCopy.fields.fromInput.config.options = assetsOptionsFrom;
    thisStateFormOptionsCopy.fields.toInput.config.options = initialAssetsOptionsBuying;

    this.setState({
      formOptions: thisStateFormOptionsCopy,
    });
  };

  setInitialSelection = () => {
    const { assets } = this.props;
    const assetsOptions = this.generateAssetsOptions({ ETH: assets[ETH] });
    const initialFormState = { ...this.state.value };
    initialFormState.fromInput = {
      selector: assetsOptions[0],
      input: '',
    };
    this.setState({ value: initialFormState });
  };

  triggerSearch = () => {
    const { value: { fromInput, toInput } } = this.state;
    const {
      selector: { value: from },
      input: amountString = 0,
    } = fromInput;
    const { selector: { value: to } } = toInput;
    const { searchOffers } = this.props;
    const amount = parseFloat(amountString);
    if (!amount) return;
    searchOffers(from, to, amount);
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
      transactionSpeed,
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
      navigation.navigate(EXCHANGE_CONFIRM, {
        offerOrder: {
          ...offerOrderData,
          transactionSpeed,
          receiveAmount: amountToBuy,
        },
      });
    });
  };

  renderOffers = ({ item: offer }) => {
    const { value: { fromInput }, pressedOfferId, shapeshiftAuthPressed } = this.state;
    const { shapeshiftAccessToken } = this.props;
    const { input: selectedSellAmount } = fromInput;
    const available = getAvailable(offer.minQuantity, offer.maxQuantity);
    const amountToBuy = parseFloat(selectedSellAmount) * offer.askRate;
    const isPressed = pressedOfferId === offer._id;
    console.log('offer: ', offer);
    const isShapeShift = offer.provider === PROVIDER_SHAPESHIFT;
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
            <CardColumn>
              <Button
                disabled={isPressed || (isShapeShift && !shapeshiftAccessToken)}
                title={isPressed ? '' : `${formatMoney(amountToBuy)} ${offer.toAssetCode}`}
                small
                onPress={() => this.onOfferPress(offer)}
              >
                {isPressed && <Spinner width={20} height={20} />}
              </Button>
            </CardColumn>
          </CardRow>
          {isShapeShift && !shapeshiftAccessToken &&
          <CardRow style={{ paddingTop: 0, paddingBottom: 6, justifyContent: 'flex-end' }}>
            <HeaderButton disabled={shapeshiftAuthPressed} onPress={this.onShapeshiftAuthClick}>
              <ButtonLabel color={baseColors.fruitSalad}>Connect to ShapeShift to accept</ButtonLabel>
            </HeaderButton>
          </CardRow>}
        </CardWrapper>
      </ShadowedCard>
    );
  };

  onShapeshiftAuthClick = () => {
    const { authorizeWithShapeshift } = this.props;
    this.setState({ shapeshiftAuthPressed: true }, async () => {
      await authorizeWithShapeshift();
      this.setState({ shapeshiftAuthPressed: false });
    });
  };

  generateAssetsOptions = (assets) => {
    const { balances } = this.props;
    const assetsList = Object.keys(assets).map((key: string) => assets[key]);
    const nonEmptyAssets = assetsList.filter((asset: any) => {
      return getBalance(balances, asset.symbol) !== 0 || asset.symbol === ETH;
    });
    const alphabeticalAssets = nonEmptyAssets.sort((a, b) => a.symbol.localeCompare(b.symbol));
    return alphabeticalAssets.map(({ symbol, iconUrl, ...rest }) =>
      ({
        key: symbol,
        value: symbol,
        icon: iconUrl,
        iconUrl,
        symbol,
        ...rest,
      }));
  };

  generateSupportedAssetsOptions = (assets) => {
    const alphabeticalSupportedAssets = assets.sort((a, b) => a.symbol.localeCompare(b.symbol));
    return alphabeticalSupportedAssets.map(({ symbol, iconUrl, ...rest }) =>
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
    const { resetOffers } = this.props;
    const formValue = this.exchangeForm.getValue();
    if (!formValue) {
      resetOffers();
      return;
    }
    this.triggerSearch();
  };

  handleFormChange = (value: Object) => {
    this.setState({ value });
    this.handleSearch();
    this.updateOptions(value);
  };

  updateOptions = (value) => {
    const {
      assets,
      supportedAssets,
      balances,
      rates,
      baseFiatCurrency,
    } = this.props;
    const { fromInput, toInput } = value;
    const { selector: selectedFromOption, input: amount } = fromInput;
    const { selector: selectedToOption } = toInput;
    let amountValueInFiat;
    let fiatSymbol;
    let valueInFiatToShow;
    if (amount && Object.keys(selectedFromOption).length) {
      const { symbol: token } = selectedFromOption;
      const balance = getBalance(balances, token);
      const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
      const totalInFiat = balance * getRate(rates, token, fiatCurrency);
      amountValueInFiat = formatMoney(totalInFiat);
      fiatSymbol = getCurrencySymbol(fiatCurrency);
      valueInFiatToShow = totalInFiat > 0 ? `${amountValueInFiat} ${fiatSymbol}` : null;
    }

    const optionsFrom = this.generateAssetsOptions(assets);
    let newOptionsFrom = optionsFrom;
    if (Object.keys(selectedToOption).length) {
      newOptionsFrom = optionsFrom.filter((option) => option.value !== selectedToOption.value);
    }

    const optionsTo = this.generateSupportedAssetsOptions(supportedAssets);
    let newOptionsTo = optionsTo;
    if (Object.keys(selectedFromOption).length) {
      newOptionsTo = optionsTo.filter((option) => option.value !== selectedFromOption.value);
    }

    const newOptions = t.update(this.state.formOptions, {
      fields: {
        fromInput: {
          config: {
            options: { $set: newOptionsFrom },
            inputAddonText: { $set: valueInFiatToShow },
          },
        },
        toInput: {
          config: { options: { $set: newOptionsTo } },
        },
      },
    });

    this.setState({ formOptions: newOptions });
  };

  getTxFeeInWei = (txSpeed?: string) => {
    txSpeed = txSpeed || this.state.transactionSpeed;
    const { gasInfo } = this.props;
    const gasPrice = gasInfo.gasPrice[txSpeed] || 0;
    const gasPriceWei = utils.parseUnits(gasPrice.toString(), 'gwei');
    return gasPriceWei.mul(GAS_LIMIT);
  };

  renderTxSpeedButtons = () => {
    const { rates, baseFiatCurrency } = this.props;
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    return Object.keys(SPEED_TYPES).map(txSpeed => {
      const feeInEth = formatAmount(utils.formatEther(this.getTxFeeInWei(txSpeed)));
      const feeInFiat = parseFloat(feeInEth) * getRate(rates, ETH, fiatCurrency);
      return (
        <SpeedButton
          key={txSpeed}
          primaryInverted
          onPress={() => this.handleGasPriceChange(txSpeed)}
        >
          <TextLink>{SPEED_TYPES[txSpeed]} - {feeInEth} ETH</TextLink>
          <Label>{`${getCurrencySymbol(fiatCurrency)}${feeInFiat.toFixed(2)}`}</Label>
        </SpeedButton>
      );
    });
  };

  handleGasPriceChange = (txSpeed: string) => {
    this.setState({
      transactionSpeed: txSpeed,
      showFeeModal: false,
    });
  };

  render() {
    const {
      offers,
      shapeshiftAccessToken,
      resetShapeshiftAccessToken,
      balances,
    } = this.props;
    const {
      value,
      formOptions,
      showFeeModal,
      transactionSpeed,
    } = this.state;

    const txFeeInWei = this.getTxFeeInWei();
    const formStructure = generateFormStructure({ balances, txFeeInWei });

    return (
      <Container color={baseColors.snowWhite} inset={{ bottom: 0 }}>
        <Header
          title="exchange"
          headerRightAddon={
            <Status>
              <IconHolder>
                <Animation source={animationSource} style={{ height: 22, width: 22 }} loop speed={0.9} />
                <StatusIcon />
              </IconHolder>
              <StatusText>ACTIVE</StatusText>
            </Status>
          }
        />
        <ScrollWrapper>
          <FormWrapper>
            <Form
              ref={node => { this.exchangeForm = node; }}
              type={formStructure}
              options={formOptions}
              value={value}
              onChange={this.handleFormChange}
            />
            <FeeInfo>
              <Label>Est. transaction fee:</Label>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                <ButtonLabel style={Platform.OS === 'ios' ? { marginBottom: 2 } : {}}>
                  {formatAmount(utils.formatEther(this.getTxFeeInWei(transactionSpeed)))} ETH
                </ButtonLabel>
                <ButtonText
                  buttonText="Change"
                  onPress={() => this.setState({ showFeeModal: true })}
                  wrapperStyle={{ marginLeft: 8, marginBottom: Platform.OS === 'ios' ? 2 : -1 }}
                />
              </View>
            </FeeInfo>
          </FormWrapper>
          <FlatList
            data={offers}
            keyExtractor={(item) => item._id}
            style={{ width: '100%' }}
            contentContainerStyle={{ width: '100%', paddingHorizontal: 20, paddingVertical: 10 }}
            renderItem={this.renderOffers}
            ListHeaderComponent={
              <ListHeader>
                {!!shapeshiftAccessToken &&
                  <HeaderButton onPress={() => resetShapeshiftAccessToken()}>
                    <ButtonLabel color={baseColors.burningFire}>Disconnect ShapeShift</ButtonLabel>
                  </HeaderButton>
                }
              </ListHeader>
            }
            ListEmptyComponent={(
              <Paragraph small style={{ textAlign: 'center', marginTop: '15%' }}>
                {'If there are any matching offers\nthey will appear live here'}
              </Paragraph>
            )}
          />
          <SlideModal
            isVisible={showFeeModal}
            title="transaction speed"
            onModalHide={() => { this.setState({ showFeeModal: false }); }}
          >
            <Label>Choose your gas price.</Label>
            <Label>Faster transaction requires more fee.</Label>
            <ButtonWrapper>{this.renderTxSpeedButtons()}</ButtonWrapper>
          </SlideModal>
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
  history: { gasInfo },
}) => ({
  baseFiatCurrency,
  offers,
  assets,
  supportedAssets,
  rates,
  shapeshiftAccessToken,
  gasInfo,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
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
  fetchGasInfo: () => dispatch(fetchGasInfoAction()),
  resetOffers: () => dispatch(resetOffersAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(ExchangeScreen);
