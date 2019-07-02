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
import { CachedImage } from 'react-native-cached-image';
import { utils } from 'ethers';
import { BigNumber } from 'bignumber.js';
import { createStructuredSelector } from 'reselect';

import { baseColors, fontSizes, spacing } from 'utils/variables';
import { getBalance, getRate } from 'utils/assets';
import { getProviderLogo } from 'utils/exchange';

import { Container, ScrollWrapper } from 'components/Layout';
import Header from 'components/Header';
import ShadowedCard from 'components/ShadowedCard';
import { BaseText, Label, TextLink, Paragraph } from 'components/Typography';
import SelectorInput from 'components/SelectorInput';
import Button from 'components/Button';
import Spinner from 'components/Spinner';
import SlideModal from 'components/Modals/SlideModal';
import ButtonText from 'components/ButtonText';

import {
  searchOffersAction,
  takeOfferAction,
  authorizeWithShapeshiftAction,
  resetOffersAction,
  setExecutingTransactionAction,
  setTokenAllowanceAction,
} from 'actions/exchangeActions';
import { fetchGasInfoAction } from 'actions/historyActions';

import type { Offer, ExchangeSearchRequest, Allowance, ExchangeProvider } from 'models/Offer';
import type { Asset, Assets, Balances, Rates } from 'models/Asset';
import type { GasInfo } from 'models/GasInfo';

import { EXCHANGE_CONFIRM, EXCHANGE_INFO } from 'constants/navigationConstants';
import { defaultFiatCurrency, ETH } from 'constants/assetsConstants';
import { PROVIDER_SHAPESHIFT } from 'constants/exchangeConstants';

import { accountBalancesSelector } from 'selectors/balances';
import { paymentNetworkAccountBalancesSelector } from 'selectors/paymentNetwork';

// partials
import { ExchangeStatus } from './ExchangeStatus';

const CardWrapper = styled.View`
  width: 100%;
`;

const CardRow = styled.View`
  flex: 1;
  flex-direction: row;
  justify-content: space-between;
  align-items: ${props => props.alignTop ? 'flex-start' : 'flex-end'};
  padding: 10px 0;
  ${props => props.withBorder
    ? `border-bottom-width: 1px;
      border-bottom-color: ${baseColors.mediumLightGray};`
    : ''}
`;

const CardInnerRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  padding-left: 10px;
  flex-wrap: wrap;
`;

const CardColumn = styled.View`
  flex-direction: column;
  align-items: ${props => props.alignRight ? 'flex-end' : 'flex-start'};
  justify-content: flex-start;
`;

const CardText = styled(BaseText)`
  line-height: 18px;
  font-size: ${fontSizes.extraSmall}px;
  letter-spacing: 0.18px;
  color: ${props => props.label ? baseColors.slateBlack : baseColors.darkGray};
  flex-wrap: wrap;
  width: 100%;
`;

const ListHeader = styled.View`
  width: 100%;
  align-items: center;
`;

const CardButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 4px 0;
  margin-left: 10px;
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

const HeaderAddonWrapper = styled.View`
  flex-direction: row;
  align-items: center;
  height: 52px;
`;

const SettingsButton = styled.TouchableOpacity`
  padding: 10px;
  padding-right: -10px;
`;

const SettingsIcon = styled(CachedImage)`
  width: 24px;
  height: 24px;
`;

const ProviderIcon = styled(CachedImage)`
  width: 24px;
  height: 24px;
`;

const ESWrapper = styled.View`
  width: 100%;
  align-items: center;
`;

type Props = {
  rates: Rates,
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: string,
  user: Object,
  assets: Assets,
  searchOffers: (string, string, number) => void,
  offers: Offer[],
  takeOffer: (string, string, number, string, Function) => Object,
  authorizeWithShapeshift: Function,
  supportedAssets: Asset[],
  fetchGasInfo: Function,
  balances: Balances,
  gasInfo: GasInfo,
  resetOffers: Function,
  paymentNetworkBalances: Balances,
  exchangeSearchRequest: ExchangeSearchRequest,
  setExecutingTransaction: Function,
  setTokenAllowance: Function,
  exchangeAllowances: Allowance[],
  connectedProviders: ExchangeProvider[],
};

type State = {
  value: Object,
  shapeshiftAuthPressed: boolean,
  formOptions: Object,
  // offer id will be passed to prevent double clicking
  pressedOfferId: string,
  transactionSpeed: string,
  showFeeModal: boolean,
  pressedTokenAllowanceId: string,
};

const getAvailable = (_min, _max, rate) => {
  if (!_min && !_max) {
    return 'N/A';
  }
  const min = _min * rate;
  const max = _max * rate;
  if (!min || !max || min === max) {
    return `${formatMoney(min || max, 2)}`;
  }
  return `${formatMoney(min, 2)} - ${formatMoney(max, 2)}`;
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
const settingsIcon = require('assets/icons/icon_key.png');

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
    pressedTokenAllowanceId: '',
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
    const { fetchGasInfo, exchangeSearchRequest = {} } = this.props;
    fetchGasInfo();
    this.provideOptions();
    const { fromAssetCode = ETH, toAssetCode, fromAmount } = exchangeSearchRequest;
    this.setInitialSelection(fromAssetCode, toAssetCode, fromAmount);
  }

  componentDidUpdate(prevProps: Props) {
    const { assets, supportedAssets, navigation } = this.props;
    if (assets !== prevProps.assets || supportedAssets !== prevProps.supportedAssets) {
      this.provideOptions();
    }
    const fromAssetCode = navigation.getParam('fromAssetCode');
    if (fromAssetCode) {
      this.setInitialSelection(fromAssetCode);
      // reset to prevent nav value change over newly selected
      navigation.setParams({ fromAssetCode: null });
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

  setInitialSelection = (fromAssetCode: string, toAssetCode?: string, fromAmount?: number) => {
    const { assets, supportedAssets } = this.props;
    const assetsOptions = this.generateAssetsOptions({
      [fromAssetCode]: assets[fromAssetCode],
    });
    const initialFormState = {
      ...this.state.value,
      fromInput: {
        selector: assetsOptions[0],
        input: fromAmount ? fromAmount.toString() : '',
      },
    };
    if (toAssetCode) {
      const toAsset = supportedAssets.find(({ symbol }) => symbol === toAssetCode);
      if (toAsset) {
        const supportedAssetsOptions = this.generateSupportedAssetsOptions([toAsset]);
        initialFormState.toInput = {
          selector: supportedAssetsOptions[0],
        };
      }
    }
    this.setState({ value: initialFormState });
  };

  triggerSearch = () => {
    const { resetOffers } = this.props;
    const { value: { fromInput, toInput } } = this.state;
    const {
      selector: { value: from },
      input: amountString = 0,
    } = fromInput;
    const { selector: { value: to } } = toInput;
    const { searchOffers } = this.props;
    const amount = parseFloat(amountString);
    if (!amount) return;
    resetOffers(); // reset here to avoid cards reload delay
    searchOffers(from, to, amount);
  };

  onShapeshiftAuthPress = () => {
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
      setExecutingTransaction,
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
    const amountToSell = parseFloat(selectedSellAmount);
    const amountToBuy = amountToSell * askRate;
    this.setState({ pressedOfferId: _id }, () => {
      takeOffer(fromAssetCode, toAssetCode, amountToSell, provider, order => {
        this.setState({ pressedOfferId: '' }); // reset offer card button loading spinner
        if (!order || !Object.keys(order).length) return;
        const { data: offerOrderData } = order;
        setExecutingTransaction();
        navigation.navigate(EXCHANGE_CONFIRM, {
          transactionSpeed,
          offerOrder: {
            ...offerOrderData,
            receiveAmount: amountToBuy,
            provider,
          },
        });
      });
    });
  };

  onSetTokenAllowancePress = (offer: Offer) => {
    const {
      navigation,
      setTokenAllowance,
      setExecutingTransaction,
    } = this.props;
    const {
      transactionSpeed,
    } = this.state;
    const {
      _id,
      provider,
      fromAssetCode,
    } = offer;
    this.setState({ pressedTokenAllowanceId: _id }, () => {
      setTokenAllowance(fromAssetCode, provider, (response) => {
        this.setState({ pressedTokenAllowanceId: '' }); // reset set allowance button to be enabled
        if (!response || !Object.keys(response).length) return;
        const { data: { to: payToAddress, data } } = response;
        setExecutingTransaction();
        navigation.navigate(EXCHANGE_CONFIRM, {
          offerOrder: {
            provider,
            fromAssetCode,
            payToAddress,
            transactionObj: {
              data,
            },
            setTokenAllowance: true,
          },
          transactionSpeed,
        });
      });
    });
  };

  renderOffers = ({ item: offer }) => {
    const {
      value: { fromInput },
      pressedOfferId,
      shapeshiftAuthPressed,
      pressedTokenAllowanceId,
    } = this.state;
    const { exchangeAllowances, connectedProviders } = this.props;
    const { input: selectedSellAmount } = fromInput;
    const {
      _id: offerId,
      minQuantity,
      maxQuantity,
      askRate,
      fromAssetCode,
      toAssetCode,
      provider: offerProvider,
    } = offer;
    let { allowanceSet = true } = offer;

    let storedAllowance;
    if (!allowanceSet) {
      storedAllowance = exchangeAllowances.find(
        ({ provider, assetCode }) => fromAssetCode === assetCode && provider === offerProvider,
      );
      allowanceSet = storedAllowance && storedAllowance.enabled;
    }

    const available = getAvailable(minQuantity, maxQuantity, askRate);
    const amountToBuy = parseFloat(selectedSellAmount) * askRate;
    const isTakeOfferPressed = pressedOfferId === offerId;
    const isSetAllowancePressed = pressedTokenAllowanceId === offerId;
    const isShapeShift = offerProvider === PROVIDER_SHAPESHIFT;
    const providerLogo = getProviderLogo(offerProvider);

    /**
     * avoid text overlapping on many decimals,
     * full amount will be displayed n confirm screen
     * also show only 2 decimals for amounts above 1.00
     * to avoid same text overlapping in the other side
    */
    let amountToBuyString;
    if (amountToBuy > 1) {
      amountToBuyString = formatMoney(amountToBuy, 2);
    } else {
      amountToBuyString = amountToBuy > 0.00001 ? formatMoney(amountToBuy, 5) : '<0.00001';
    }

    let shapeshiftAccessToken;
    if (isShapeShift) {
      ({ extra: shapeshiftAccessToken } = connectedProviders
        .find(({ id: providerId }) => providerId === PROVIDER_SHAPESHIFT) || {});
    }

    return (
      <ShadowedCard
        wrapperStyle={{ marginBottom: 10 }}
        contentWrapperStyle={{ paddingHorizontal: 16, paddingVertical: 6 }}
      >
        <CardWrapper>
          <CardRow withBorder alignTop>
            <CardColumn>
              <CardText label>Exchange rate</CardText>
              <CardText>{`1 ${fromAssetCode} = ~${formatMoney(askRate, 2)} ${toAssetCode}`}</CardText>
            </CardColumn>
            <CardInnerRow style={{ flexShrink: 1 }}>
              {!!providerLogo && <ProviderIcon source={providerLogo} resizeMode="contain" />}
              {isShapeShift && !shapeshiftAccessToken &&
              <CardButton disabled={shapeshiftAuthPressed} onPress={this.onShapeshiftAuthPress}>
                <ButtonLabel color={baseColors.electricBlue}>Connect</ButtonLabel>
              </CardButton>
              }
              {!allowanceSet &&
              <CardButton disabled={isSetAllowancePressed} onPress={() => this.onSetTokenAllowancePress(offer)}>
                <ButtonLabel color={storedAllowance ? baseColors.darkGray : baseColors.electricBlue} >
                  {storedAllowance
                    ? 'Pending'
                    : 'Enable'
                  }
                </ButtonLabel>
              </CardButton>
              }
            </CardInnerRow>
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
                disabled={isTakeOfferPressed || !allowanceSet || (isShapeShift && !shapeshiftAccessToken)}
                title={isTakeOfferPressed ? '' : `${amountToBuyString} ${toAssetCode}`}
                small
                onPress={() => this.onOfferPress(offer)}
              >
                {isTakeOfferPressed && <Spinner width={20} height={20} />}
              </Button>
            </CardColumn>
          </CardRow>
        </CardWrapper>
      </ShadowedCard>
    );
  };

  generateAssetsOptions = (assets) => {
    const { balances, paymentNetworkBalances } = this.props;
    const assetsList = Object.keys(assets).map((key: string) => assets[key]);
    const nonEmptyAssets = assetsList.filter((asset: any) => {
      return getBalance(balances, asset.symbol) !== 0 || asset.symbol === ETH;
    });
    const alphabeticalAssets = nonEmptyAssets.sort((a, b) => a.symbol.localeCompare(b.symbol));
    return alphabeticalAssets.map(({ symbol, iconUrl, ...rest }) => {
      const assetBalance = formatAmount(getBalance(balances, symbol));
      const paymentNetworkBalance = getBalance(paymentNetworkBalances, symbol);

      return ({
        key: symbol,
        value: symbol,
        icon: iconUrl,
        iconUrl,
        symbol,
        ...rest,
        assetBalance,
        paymentNetworkBalance,
      });
    });
  };

  generateSupportedAssetsOptions = (assets) => {
    const { balances, paymentNetworkBalances } = this.props;
    const alphabeticalSupportedAssets = assets.sort((a, b) => a.symbol.localeCompare(b.symbol));
    return alphabeticalSupportedAssets.map(({ symbol, iconUrl, ...rest }) => {
      const rawAssetBalance = getBalance(balances, symbol);
      const assetBalance = rawAssetBalance ? formatAmount(rawAssetBalance) : null;
      const paymentNetworkBalance = getBalance(paymentNetworkBalances, symbol);

      return ({
        key: symbol,
        value: symbol,
        icon: iconUrl,
        iconUrl,
        symbol,
        ...rest,
        assetBalance,
        paymentNetworkBalance,
      });
    });
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
      const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
      const totalInFiat = parseFloat(amount) * getRate(rates, token, fiatCurrency);
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
      balances,
      navigation,
      exchangeAllowances,
      connectedProviders,
    } = this.props;
    const {
      value,
      formOptions,
      showFeeModal,
      transactionSpeed,
    } = this.state;

    const txFeeInWei = this.getTxFeeInWei();
    const formStructure = generateFormStructure({ balances, txFeeInWei });
    const shapeShiftOffer = offers.find(offer => offer.provider === PROVIDER_SHAPESHIFT) || null;
    const reorderedOffers = offers.sort((a, b) => b.askRate - a.askRate)
      .filter(offer => offer.provider !== PROVIDER_SHAPESHIFT) || [];
    if (shapeShiftOffer) reorderedOffers.push(shapeShiftOffer);

    return (
      <Container color={baseColors.snowWhite} inset={{ bottom: 0 }}>
        <Header
          title="exchange"
          headerRightAddon={
            (!!exchangeAllowances.length || !!connectedProviders.length) &&
            <HeaderAddonWrapper>
              <SettingsButton onPress={() => navigation.navigate(EXCHANGE_INFO)}>
                <SettingsIcon
                  source={settingsIcon}
                />
              </SettingsButton>
            </HeaderAddonWrapper>
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
            data={reorderedOffers}
            keyExtractor={(item) => item._id}
            style={{ width: '100%' }}
            contentContainerStyle={{ width: '100%', paddingHorizontal: 20, paddingVertical: 10 }}
            renderItem={this.renderOffers}
            ListHeaderComponent={reorderedOffers.length
              ? (
                <ListHeader>
                  <ExchangeStatus />
                </ListHeader>)
              : null
            }
            ListEmptyComponent={(
              <ESWrapper style={{ marginTop: '15%' }}>
                <ExchangeStatus />
                <Paragraph small style={{ textAlign: 'center' }}>
                  {'If there are any matching offers\nthey will appear live here'}
                </Paragraph>
              </ESWrapper>
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
  exchange: {
    data: {
      offers,
      searchRequest: exchangeSearchRequest,
      allowances: exchangeAllowances,
      connectedProviders,
    },
  },
  assets: { data: assets, supportedAssets },
  rates: { data: rates },
  history: { gasInfo },
}) => ({
  baseFiatCurrency,
  offers,
  assets,
  supportedAssets,
  rates,
  gasInfo,
  exchangeSearchRequest,
  exchangeAllowances,
  connectedProviders,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  paymentNetworkBalances: paymentNetworkAccountBalancesSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Function) => ({
  searchOffers: (fromAssetCode, toAssetCode, fromAmount) => dispatch(
    searchOffersAction(fromAssetCode, toAssetCode, fromAmount),
  ),
  takeOffer: (fromAssetCode, toAssetCode, fromAmount, provider, callback) => dispatch(
    takeOfferAction(fromAssetCode, toAssetCode, fromAmount, provider, callback),
  ),
  authorizeWithShapeshift: () => dispatch(authorizeWithShapeshiftAction()),
  fetchGasInfo: () => dispatch(fetchGasInfoAction()),
  resetOffers: () => dispatch(resetOffersAction()),
  setExecutingTransaction: () => dispatch(setExecutingTransactionAction()),
  setTokenAllowance: (assetCode, provider, callback) => dispatch(
    setTokenAllowanceAction(assetCode, provider, callback),
  ),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(ExchangeScreen);
