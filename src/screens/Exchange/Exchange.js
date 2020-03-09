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
import { FlatList, TextInput as RNTextInput, ScrollView, Keyboard } from 'react-native';
import type { NavigationEventSubscription, NavigationScreenProp } from 'react-navigation';
import styled, { withTheme } from 'styled-components/native';
import { connect } from 'react-redux';
import debounce from 'lodash.debounce';
import { formatAmount, formatMoney, formatFiat, isValidNumber, formatAmountDisplay } from 'utils/common';
import t from 'tcomb-form-native';
import { utils } from 'ethers';
import { BigNumber } from 'bignumber.js';
import { createStructuredSelector } from 'reselect';
import Intercom from 'react-native-intercom';
import get from 'lodash.get';
import isEmpty from 'lodash.isempty';
import { InAppBrowser } from '@matt-block/react-native-in-app-browser';
import { SDK_PROVIDER } from 'react-native-dotenv';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { BaseText, MediumText } from 'components/Typography';
import TextInput from 'components/TextInput';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import SWActivationCard from 'components/SWActivationCard';
import OfferCard from 'components/OfferCard/OfferCard';

// actions
import {
  searchOffersAction,
  takeOfferAction,
  authorizeWithShapeshiftAction,
  resetOffersAction,
  setExecutingTransactionAction,
  setTokenAllowanceAction,
  markNotificationAsSeenAction,
  getMetaDataAction,
  getExchangeSupportedAssetsAction,
} from 'actions/exchangeActions';
import { deploySmartWalletAction } from 'actions/smartWalletActions';

// constants
import { EXCHANGE_CONFIRM, EXCHANGE_INFO, FIAT_EXCHANGE } from 'constants/navigationConstants';
import { defaultFiatCurrency, ETH, POPULAR_EXCHANGE_TOKENS, POPULAR_SWAPS } from 'constants/assetsConstants';
import { PROVIDER_SHAPESHIFT } from 'constants/exchangeConstants';
import { SMART_WALLET_UPGRADE_STATUSES } from 'constants/smartWalletConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

// utils, services
import { wyreWidgetUrl } from 'services/sendwyre';
import { fiatCurrencies } from 'fixtures/assets';
import { spacing, fontStyles } from 'utils/variables';
import { getAssetData, getAssetsAsList, getBalance, getRate, sortAssets } from 'utils/assets';
import { isFiatProvider, isFiatCurrency, getOfferProviderLogo } from 'utils/exchange';
import { getSmartWalletStatus, getDeployErrorMessage } from 'utils/smartWallet';
import { getActiveAccountType, getActiveAccountAddress } from 'utils/accounts';
import { getThemeColors, themedColors } from 'utils/themes';

// selectors
import { accountBalancesSelector } from 'selectors/balances';
import { paymentNetworkAccountBalancesSelector } from 'selectors/paymentNetwork';
import { accountAssetsSelector } from 'selectors/assets';

// models, types
import type { Offer, FiatOffer, ExchangeSearchRequest, Allowance, ExchangeProvider, ProvidersMeta } from 'models/Offer';
import type { Asset, Assets, Balances, Rates } from 'models/Asset';
import type { SmartWalletStatus } from 'models/SmartWalletStatus';
import type { Accounts } from 'models/Account';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Theme } from 'models/Theme';

// partials
import ExchangeStatus from './ExchangeStatus';
import { HotSwapsHorizontalList, HotSwapsGridList } from './HotSwapsList';


const ListHeader = styled.View`
  width: 100%;
  align-items: flex-start;
  margin-bottom: 8px;
`;

const FormWrapper = styled.View`
  padding: ${({ bottomPadding }) => `${spacing.large}px ${spacing.layoutSides}px ${bottomPadding}px`};
  background-color: ${themedColors.surface};
`;

const ESWrapper = styled.View`
  width: 100%;
  align-items: center;
`;

const PromoWrapper = styled.View`
  width: 100%;
  align-items: center;
  padding: ${spacing.large}px ${spacing.layoutSides}px;
  margin-bottom: 30px;
`;

const PromoText = styled(BaseText)`
  ${fontStyles.medium};
  color: ${themedColors.secondaryText};
  text-align: center;
`;

const FooterWrapper = styled.View`
  border-top-width: 1px;
  border-top-color: ${themedColors.tertiary};
  background-color: ${themedColors.card};
  padding: ${spacing.large}px ${spacing.layoutSides}px;
`;

type Props = {
  rates: Rates,
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: ?string,
  user: Object,
  assets: Assets,
  searchOffers: (string, string, number) => void,
  offers: Offer[],
  takeOffer: (string, string, number, string, string, Function) => void,
  authorizeWithShapeshift: Function,
  balances: Balances,
  resetOffers: Function,
  paymentNetworkBalances: Balances,
  exchangeSearchRequest: ExchangeSearchRequest,
  setExecutingTransaction: Function,
  setTokenAllowance: Function,
  exchangeAllowances: Allowance[],
  connectedProviders: ExchangeProvider[],
  hasUnreadExchangeNotification: boolean,
  markNotificationAsSeen: Function,
  oAuthAccessToken: ?string,
  accounts: Accounts,
  smartWalletState: Object,
  deploySmartWallet: Function,
  smartWalletFeatureEnabled: boolean,
  getMetaData: () => void,
  exchangeSupportedAssets: Asset[],
  fiatExchangeSupportedAssets: Asset[],
  getExchangeSupportedAssets: () => void,
  providersMeta: ProvidersMeta,
  theme: Theme,
};

type State = {
  value: Object,
  shapeshiftAuthPressed: boolean,
  formOptions: Object,
  // offer id will be passed to prevent double clicking
  pressedOfferId: string,
  pressedTokenAllowanceId: string,
  isSubmitted: boolean,
};

const getAvailable = (_min, _max, rate) => {
  if (!_min && !_max) {
    return 'N/A';
  }
  let min = (new BigNumber(rate)).multipliedBy(_min);
  let max = (new BigNumber(rate)).multipliedBy(_max);
  if ((min.gte(0) && min.lt(0.01)) || (max.gte(0) && max.lt(0.01))) {
    if (max.isZero()) return '>0.01';
    const maxAvailable = max.lt(0.01)
      ? '<0.01'
      : formatMoney(max.toNumber(), 2);
    return min.eq(max) || min.isZero()
      // max available displayed if equal to min or min is zero
      ? maxAvailable
      : '<0.01 - <0.01';
  }
  min = min.toNumber();
  max = max.toNumber();
  if (!min || !max || min === max) {
    return `${formatMoney(min || max, 2)}`;
  }
  return `${formatMoney(min, 2)} - ${formatMoney(max, 2)}`;
};

const { Form } = t.form;

const MIN_TX_AMOUNT = 0.000000000000000001;

const settingsIcon = require('assets/icons/icon_key.png');

const calculateMaxAmount = (token: string, balance: number | string): number => {
  if (typeof balance !== 'string') {
    balance = balance.toString();
  }
  if (token !== ETH) {
    return +balance;
  }
  const maxAmount = utils.parseUnits(balance, 'ether');
  if (maxAmount.lt(0)) return 0;
  return new BigNumber(utils.formatEther(maxAmount)).toNumber();
};

const calculateAmountToBuy = (askRate: number | string, amountToSell: number | string) => {
  return (new BigNumber(askRate)).multipliedBy(amountToSell).toFixed();
};

const generateFormStructure = (balances: Balances) => {
  let balance;
  let maxAmount;
  let amount;

  const FromOption = t.refinement(t.Object, ({ selector, input }) => {
    if (!selector
      || isEmpty(selector)
      || !input
      || !isValidNumber(input)) return false;

    const { symbol, decimals } = selector;

    if (isFiatCurrency(symbol)) return true;

    amount = parseFloat(input);

    if (decimals === 0 && amount.toString().includes('.')) return false;

    balance = getBalance(balances, symbol);
    maxAmount = calculateMaxAmount(symbol, balance);

    return amount <= maxAmount && amount >= MIN_TX_AMOUNT;
  });

  FromOption.getValidationErrorMessage = ({ selector, input }) => {
    if (isEmpty(selector)) {
      return 'Asset should be selected.';
    }

    const { symbol, decimals } = selector;

    const isFiat = isFiatCurrency(symbol);

    if (!isValidNumber(input.toString())) {
      return 'Incorrect number entered.';
    }

    const numericAmount = parseFloat(input || 0);

    if (numericAmount === 0) {
      /**
       * 0 is the first number that can be typed therefore we don't want
       * to show any error message on the input, however,
       * the form validation would still not go through,
       * but it's obvious that you cannot send 0 amount
       */
      return null;
    } else if (numericAmount < 0) {
      return 'Amount should be bigger than 0.';
    }

    // all possible fiat validation is done
    if (isFiat) return true;

    if (amount > maxAmount) {
      return `Amount should not be bigger than your balance - ${balance} ${symbol}.`;
    } else if (amount < MIN_TX_AMOUNT) {
      return 'Amount should be greater than 1 Wei (0.000000000000000001 ETH).';
    } else if (decimals === 0 && amount.toString().includes('.')) {
      return 'Amount should not contain decimal places';
    }

    return true;
  };

  const ToOption = t.refinement(t.Object, ({ selector }) => {
    return !isEmpty(selector);
  });

  ToOption.getValidationErrorMessage = () => {
    return false; // should still validate (to not trigger search if empty), yet error should not be visible to user
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
      placeholderSelector,
      placeholderInput,
      options,
      horizontalOptions = [],
      inputAddonText,
      inputRef,
      onSelectorOpen,
      horizontalOptionsTitle,
      optionsTitle,
      inputWrapperStyle,
    },
  } = locals;
  const value = get(locals, 'value', {});
  const { selector = {} } = value;
  const { iconUrl } = selector;
  const selectedOptionIcon = iconUrl ? `${SDK_PROVIDER}/${iconUrl}?size=3` : '';
  const selectorValue = {
    ...value,
    selector: { ...selector, icon: selectedOptionIcon },
  };

  const errorMessage = locals.error;
  const inputProps = {
    onChange: locals.onChange,
    onBlur: locals.onBlur,
    keyboardType: locals.keyboardType,
    autoCapitalize: locals.autoCapitalize,
    maxLength: 42,
    placeholderSelector,
    placeholder: placeholderInput,
    onSelectorOpen,
    selectorValue,
    label,
  };


  return (
    <TextInput
      errorMessage={errorMessage}
      inputProps={inputProps}
      leftSideText={inputAddonText}
      numeric
      selectorOptions={{
        options,
        horizontalOptions,
        showOptionsTitles: !isEmpty(horizontalOptions),
        optionsTitle,
        horizontalOptionsTitle,
        fullWidth: !hasInput,
        selectorModalTitle: label,
        selectorPlaceholder: placeholderSelector,
        optionsSearchPlaceholder: 'Asset search',
      }}
      getInputRef={inputRef}
      inputWrapperStyle={inputWrapperStyle}
    />
  );
}

function getCardTopButtonData(topButtonProps) {
  const {
    offer,
    minOrMaxNeeded,
    isBelowMin,
    thisComponent,
    isShapeShift,
    shapeshiftAccessToken,
    storedAllowance,
    allowanceSet,
    shapeshiftAuthPressed,
    pressedTokenAllowanceId,
  } = topButtonProps;

  const {
    _id: offerId,
    minQuantity,
    maxQuantity,
    fromAsset,
  } = offer;

  const { code: fromAssetCode } = fromAsset;
  const isSetAllowancePressed = pressedTokenAllowanceId === offerId;
  const minOrMaxAmount = formatAmountDisplay(isBelowMin ? minQuantity : maxQuantity);

  if (minOrMaxNeeded) {
    return {
      label: `${minOrMaxAmount} ${fromAssetCode} ${isBelowMin ? 'min' : 'max'}`,
      onPress: () => thisComponent.setFromAmount(isBelowMin ? minQuantity : maxQuantity),
    };
  } else if (isShapeShift && !shapeshiftAccessToken) {
    return {
      label: 'Connect',
      onPress: thisComponent.onShapeshiftAuthPress,
      isDisabled: shapeshiftAuthPressed,
    };
  } else if (!allowanceSet) {
    return {
      label: storedAllowance ? 'Pending' : 'Enable',
      onPress: () => thisComponent.onSetTokenAllowancePress(offer),
      isDisabled: isSetAllowancePressed,
      isSecondary: !!storedAllowance,
      isLoading: isSetAllowancePressed,
    };
  }
  return {};
}

class ExchangeScreen extends React.Component<Props, State> {
  exchangeForm: t.form;
  fromInputRef: RNTextInput;
  listeners: NavigationEventSubscription[];
  _isMounted: boolean;

  constructor(props: Props) {
    super(props);
    this.listeners = [];
    this.state = {
      shapeshiftAuthPressed: false,
      pressedOfferId: '',
      pressedTokenAllowanceId: '',
      isSubmitted: false,
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
            autoCapitalize: 'words',
            template: SelectorInputTemplate,
            config: {
              label: 'Sell',
              hasInput: true,
              options: [],
              horizontalOptions: [],
              horizontalOptionsTitle: 'Fiat',
              optionsTitle: 'Crypto',
              placeholderSelector: 'select',
              placeholderInput: '0',
              inputRef: (ref) => { this.fromInputRef = ref; },
            },
            transformer: {
              parse: (value) => {
                let formattedAmount = value.input;
                if (value.input) formattedAmount = value.input.toString().replace(/,/g, '.');
                return { ...value, input: formattedAmount };
              },
              format: (value) => {
                let formattedAmount = value.input;
                if (value.input) formattedAmount = value.input.toString().replace(/,/g, '.');
                return { ...value, input: formattedAmount };
              },
            },
          },
          toInput: {
            template: SelectorInputTemplate,
            config: {
              label: 'Buy',
              options: [],
              horizontalOptions: [],
              horizontalOptionsTitle: 'Popular',
              optionsTitle: 'All tokens',
              wrapperStyle: { marginTop: spacing.mediumLarge },
              placeholderSelector: 'Select asset',
              onSelectorOpen: this.blurFromInput,
              inputWrapperStyle: { marginTop: 6 },
            },
          },
        },
      },
    };
    this.triggerSearch = debounce(this.triggerSearch, 500);
  }

  componentDidMount() {
    const {
      exchangeSearchRequest = {},
      baseFiatCurrency,
      navigation,
      getMetaData,
      getExchangeSupportedAssets,
    } = this.props;
    this._isMounted = true;
    getMetaData();
    getExchangeSupportedAssets();
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;

    const defaultFrom = this.checkIfAssetsExchangeIsAllowed() ? ETH : fiatCurrency;
    const { fromAmount } = exchangeSearchRequest;
    const fromAssetCode = navigation.getParam('fromAssetCode') || exchangeSearchRequest.fromAssetCode || defaultFrom;
    const toAssetCode = navigation.getParam('toAssetCode') || exchangeSearchRequest.toAssetCode;
    this.setInitialSelection(fromAssetCode, toAssetCode, fromAmount);
    this.provideOptions();
    this.listeners = [
      navigation.addListener('didFocus', this.focusInputWithKeyboard),
      navigation.addListener('didBlur', this.blurFromInput),
    ];
  }

  componentWillUnmount() {
    this.listeners.forEach(listener => listener.remove());
    this._isMounted = false;
  }

  blurFromInput = () => {
    if (!this.fromInputRef) return;
    this.fromInputRef.blur();
  };

  focusInputWithKeyboard = () => {
    setTimeout(() => {
      if (!this.fromInputRef || !this._isMounted) return;
      this.fromInputRef.focus();
    }, 200);
  };

  componentDidUpdate(prevProps: Props, prevState: State) {
    const {
      assets,
      exchangeSupportedAssets,
      fiatExchangeSupportedAssets,
      oAuthAccessToken,
    } = this.props;

    const fromAssetSymbol = get(this.state, 'value.fromInput.selector.symbol');
    const prevFromAssetSymbol = get(prevState, 'value.fromInput.selector.symbol');
    const toAssetSymbol = get(this.state, 'value.toInput.selector.symbol');
    const prevToAssetSymbol = get(prevState, 'value.toInput.selector.symbol');

    // update from and to options when (supported) assets changes or user selects an option
    if (assets !== prevProps.assets || exchangeSupportedAssets !== prevProps.exchangeSupportedAssets
      || fiatExchangeSupportedAssets !== prevProps.fiatExchangeSupportedAssets
      || fromAssetSymbol !== prevFromAssetSymbol || toAssetSymbol !== prevToAssetSymbol) {
      this.provideOptions();
    }

    if (prevProps.oAuthAccessToken !== oAuthAccessToken) {
      // access token has changed, init search again
      this.resetSearch();
      this.triggerSearch();
    }
  }

  resetSearch = () => {
    const { resetOffers } = this.props;
    resetOffers();
    this.setState({ isSubmitted: false });
  };

  checkIfAssetsExchangeIsAllowed = () => {
    const { accounts, smartWalletState, smartWalletFeatureEnabled } = this.props;
    const activeAccountType = getActiveAccountType(accounts);
    const smartWalletStatus: SmartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);
    const isSmartWallet = smartWalletFeatureEnabled && activeAccountType === ACCOUNT_TYPES.SMART_WALLET;
    return !isSmartWallet
      || (isSmartWallet && smartWalletStatus.status === SMART_WALLET_UPGRADE_STATUSES.DEPLOYMENT_COMPLETE);
  };

  provideOptions = () => {
    const { assets, exchangeSupportedAssets, fiatExchangeSupportedAssets } = this.props;

    const selectedFromAssetSymbol = get(this.state, 'value.fromInput.selector.symbol', '');
    const selectedToAssetSymbol = get(this.state, 'value.toInput.selector.symbol', '');
    const isFromSelectedFiat = isFiatCurrency(selectedFromAssetSymbol);

    const assetsOptionsBuying = this.generateSupportedAssetsOptions(isFromSelectedFiat
      ? fiatExchangeSupportedAssets : exchangeSupportedAssets);

    const assetsOptionsFrom = this.generateAssetsOptions(assets, selectedToAssetSymbol);

    const initialAssetsOptionsBuying = selectedFromAssetSymbol
      ? assetsOptionsBuying.filter(({ value }) => value !== selectedFromAssetSymbol)
      : assetsOptionsBuying;

    const initialAssetsOptionsSelling = selectedToAssetSymbol
      ? assetsOptionsFrom.filter(({ value }) => value !== selectedToAssetSymbol)
      : assetsOptionsFrom;

    // show FIAT options only if TO value isn't selected or selected TO value is supported by fiat exchange providers
    const fiatOptionsFrom = !selectedToAssetSymbol
    || fiatExchangeSupportedAssets.some(({ symbol }) => symbol === selectedToAssetSymbol)
      ? this.generateFiatOptions()
      : [];

    const popularOptions = POPULAR_EXCHANGE_TOKENS.reduce((popularAssetsList, popularSymbol) => {
      const popularAsset = initialAssetsOptionsBuying.find(({ symbol }) => symbol === popularSymbol);
      if (popularAsset) return [...popularAssetsList, popularAsset];
      return popularAssetsList;
    }, []);

    const thisStateFormOptionsCopy = { ...this.state.formOptions };
    thisStateFormOptionsCopy.fields.fromInput.config.options = initialAssetsOptionsSelling;
    thisStateFormOptionsCopy.fields.fromInput.config.horizontalOptions = fiatOptionsFrom;
    thisStateFormOptionsCopy.fields.toInput.config.options = initialAssetsOptionsBuying;
    thisStateFormOptionsCopy.fields.toInput.config.horizontalOptions = popularOptions;

    this.setState({
      formOptions: thisStateFormOptionsCopy,
    });
  };

  setInitialSelection = (fromAssetCode: string, toAssetCode?: string, fromAmount?: number) => {
    const { assets, exchangeSupportedAssets } = this.props;
    const assetsData = getAssetsAsList(assets);
    const fromAsset = fiatCurrencies.find(currency => currency.symbol === fromAssetCode)
      || getAssetData(assetsData, exchangeSupportedAssets, fromAssetCode);
    const selectedAssetOptions = isFiatCurrency(fromAssetCode)
      ? this.generateFiatOptions().find(({ symbol }) => symbol === fromAssetCode)
      : this.generateAssetsOptions({ [fromAssetCode]: fromAsset })[0];
    const initialFormState = {
      ...this.state.value,
      fromInput: {
        selector: selectedAssetOptions,
        input: fromAmount ? fromAmount.toString() : '',
      },
    };
    if (toAssetCode) {
      const toAsset = getAssetData(assetsData, exchangeSupportedAssets, toAssetCode);
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
    const {
      searchOffers,
    } = this.props;
    const {
      value: {
        fromInput: {
          selector: { value: from },
          input: amountString = 0,
        } = {},
        toInput: {
          selector: {
            value: to,
          },
        } = {},
      } = {},
    } = this.state;
    const amount = parseFloat(amountString);
    if (!from || !to || !amount) return;
    this.setState({ isSubmitted: true });
    searchOffers(from, to, amount);
  };

  onShapeshiftAuthPress = () => {
    const { authorizeWithShapeshift } = this.props;
    this.setState({ shapeshiftAuthPressed: true }, async () => {
      await authorizeWithShapeshift();
      this.setState({ shapeshiftAuthPressed: false });
    });
  };

  openSendWyre(selectedSellAmount: string, offer: FiatOffer) {
    const { accounts } = this.props;
    const destAddress = getActiveAccountAddress(accounts);

    const { fromAsset, toAsset } = offer;
    const { code: fromAssetCode } = fromAsset;
    const { code: toAssetCode } = toAsset;

    const wyreUrl = wyreWidgetUrl(
      destAddress,
      toAssetCode,
      fromAssetCode,
      selectedSellAmount,
    );

    InAppBrowser.open(wyreUrl).catch(error => {
      console.error('InAppBrowser.error', error); // eslint-disable-line no-console
    });
  }

  onFiatOfferPress = (offer: FiatOffer) => {
    const {
      navigation,
    } = this.props;
    const {
      value: {
        fromInput: {
          input: selectedSellAmount,
        },
      },
    } = this.state;
    const { provider } = offer;

    if (provider === 'SendWyre') {
      this.openSendWyre(selectedSellAmount, offer);
      return;
    }

    navigation.navigate(FIAT_EXCHANGE, {
      fiatOfferOrder: {
        ...offer,
        amount: selectedSellAmount,
      },
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
    } = this.state;
    const {
      _id,
      provider,
      fromAsset,
      toAsset,
      askRate,
      trackId = '',
    } = offer;
    const { code: fromAssetCode } = fromAsset;
    const { code: toAssetCode } = toAsset;
    const amountToSell = parseFloat(selectedSellAmount);
    const amountToBuy = calculateAmountToBuy(askRate, amountToSell);
    this.setState({ pressedOfferId: _id }, () => {
      takeOffer(fromAssetCode, toAssetCode, amountToSell, provider, trackId, order => {
        this.setState({ pressedOfferId: '' }); // reset offer card button loading spinner
        if (isEmpty(order)) return;
        setExecutingTransaction();
        navigation.navigate(EXCHANGE_CONFIRM, {
          offerOrder: {
            ...order,
            receiveQuantity: amountToBuy, // this value should be provided by exchange, currently returning 0,
            // hence we overwrite it with our calculation
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
      _id,
      provider,
      fromAsset,
      toAsset,
      trackId = '',
    } = offer;
    const { address: fromAssetAddress, code: fromAssetCode } = fromAsset;
    const { address: toAssetAddress } = toAsset;
    this.setState({ pressedTokenAllowanceId: _id }, () => {
      setTokenAllowance(fromAssetCode, fromAssetAddress, toAssetAddress, provider, trackId, (response) => {
        this.setState({ pressedTokenAllowanceId: '' }); // reset set allowance button to be enabled
        if (isEmpty(response)) return;
        setExecutingTransaction();
        navigation.navigate(EXCHANGE_CONFIRM, {
          offerOrder: {
            ...response,
            provider,
            fromAsset,
            toAsset,
            setTokenAllowance: true,
          },
        });
      });
    });
  };

  setFromAmount = amount => {
    this.resetSearch(); // reset all cards before they change according to input values
    this.setState(prevState => ({
      value: {
        ...prevState.value,
        fromInput: {
          ...prevState.value.fromInput,
          input: amount,
        },
      },
    }), () => {
      const errors = get(this.exchangeForm.validate(), 'errors', []);
      if (!isEmpty(errors)) return;
      this.triggerSearch();
    });
  };

  renderOffers = ({ item: offer }, disableNonFiatExchange: boolean) => {
    const {
      value: { fromInput },
      pressedOfferId,
      shapeshiftAuthPressed,
      pressedTokenAllowanceId,
    } = this.state;
    const { exchangeAllowances, connectedProviders, providersMeta } = this.props;
    const { input: selectedSellAmount } = fromInput;
    const {
      _id: offerId,
      minQuantity,
      maxQuantity,
      askRate,
      toAsset,
      fromAsset,
      provider: offerProvider,
      feeAmount,
      extraFeeAmount,
      quoteCurrencyAmount,
      offerRestricted,
    } = offer;
    let { allowanceSet = true } = offer;

    const { code: toAssetCode } = toAsset;
    const { code: fromAssetCode } = fromAsset;

    let storedAllowance;
    if (!allowanceSet) {
      storedAllowance = exchangeAllowances.find(
        ({ provider, fromAssetCode: _fromAssetCode, toAssetCode: _toAssetCode }) => _fromAssetCode === fromAssetCode
          && _toAssetCode === toAssetCode && provider === offerProvider,
      );
      allowanceSet = storedAllowance && storedAllowance.enabled;
    }

    const available = getAvailable(minQuantity, maxQuantity, askRate);
    const amountToBuy = calculateAmountToBuy(askRate, selectedSellAmount);
    const isTakeOfferPressed = pressedOfferId === offerId;
    const isShapeShift = offerProvider === PROVIDER_SHAPESHIFT;
    const providerLogo = getOfferProviderLogo(providersMeta, offerProvider);

    const amountToBuyString = formatAmountDisplay(amountToBuy);

    let shapeshiftAccessToken;
    if (isShapeShift) {
      ({ extra: shapeshiftAccessToken } = connectedProviders
        .find(({ id: providerId }) => providerId === PROVIDER_SHAPESHIFT) || {});
    }

    const amountToSell = parseFloat(selectedSellAmount);
    const minQuantityNumeric = parseFloat(minQuantity);
    const maxQuantityNumeric = parseFloat(maxQuantity);
    const isBelowMin = minQuantityNumeric !== 0 && amountToSell < minQuantityNumeric;
    const isAboveMax = maxQuantityNumeric !== 0 && amountToSell > maxQuantityNumeric;

    const minOrMaxNeeded = isBelowMin || isAboveMax;
    const isTakeButtonDisabled = !!minOrMaxNeeded
      || isTakeOfferPressed
      || !allowanceSet
      || (isShapeShift && !shapeshiftAccessToken);

    const isFiat = isFiatProvider(offerProvider);

    const disableFiatExchange = isFiat && (minOrMaxNeeded || !!offerRestricted);
    const disableOffer = disableNonFiatExchange || disableFiatExchange;

    const topButtonProps = {
      offer,
      minOrMaxNeeded,
      isBelowMin,
      isShapeShift,
      shapeshiftAccessToken,
      allowanceSet,
      storedAllowance,
      shapeshiftAuthPressed,
      pressedTokenAllowanceId,
      thisComponent: this,
    };

    if (isFiat) {
      return (
        <OfferCard
          isDisabled={isTakeButtonDisabled || disableOffer}
          onPress={() => this.onFiatOfferPress(offer)}
          labelTop="Amount total"
          valueTop={`${askRate} ${fromAssetCode}`}
          cardImageSource={providerLogo}
          cardTopButton={getCardTopButtonData(topButtonProps)}
          labelBottom="Fees total"
          valueBottom={feeAmount ?
            `${formatAmountDisplay(feeAmount + extraFeeAmount)} ${fromAssetCode}`
            : 'Will be calculated'
          }
          cardMainButton={{
            label: `${formatAmountDisplay(quoteCurrencyAmount)} ${toAssetCode}`,
            onPress: () => this.onFiatOfferPress(offer),
            isDisabled: disableFiatExchange,
            isLoading: isTakeOfferPressed,
          }}
          cardNote={offerRestricted}
        />
      );
    }

    return (
      <OfferCard
        isDisabled={isTakeButtonDisabled || disableOffer}
        onPress={() => this.onOfferPress(offer)}
        labelTop="Exchange rate"
        valueTop={formatAmountDisplay(askRate)}
        cardImageSource={providerLogo}
        cardTopButton={getCardTopButtonData(topButtonProps)}
        labelBottom="Available"
        valueBottom={available}
        cardMainButton={{
          label: `${amountToBuyString} ${toAssetCode}`,
          onPress: () => this.onOfferPress(offer),
          isDisabled: isTakeButtonDisabled || disableNonFiatExchange,
          isLoading: isTakeOfferPressed,
        }}
      />
    );
  };

  generateAssetsOptions = (assets: Assets, selectedToSymbol?: string) => {
    const {
      balances,
      exchangeSupportedAssets,
      baseFiatCurrency,
    } = this.props;

    if (selectedToSymbol && !exchangeSupportedAssets.some(({ symbol }) => symbol === selectedToSymbol)) return [];

    return sortAssets(assets)
      .filter(({ symbol }) => (getBalance(balances, symbol) !== 0 || symbol === ETH)
        && !!exchangeSupportedAssets.some(asset => asset.symbol === symbol))
      .map(({ symbol, iconUrl, ...rest }) => {
        const assetBalance = formatAmount(getBalance(balances, symbol));
        const assetBalanceInFiat = formatAmount(getBalance(balances, symbol));
        const formattedBalanceInFiat = formatFiat(assetBalanceInFiat, baseFiatCurrency);
        return ({
          key: symbol,
          value: symbol,
          icon: iconUrl,
          iconUrl,
          symbol,
          ...rest,
          assetBalance,
          formattedBalanceInFiat,
        });
      });
  };

  generateFiatOptions = () => fiatCurrencies.map(({ symbol, iconUrl, ...rest }) => ({
    key: symbol,
    value: symbol,
    icon: iconUrl,
    iconUrl,
    symbol,
    ...rest,
    assetBalance: null,
    paymentNetworkBalance: null,
  }));

  generateSupportedAssetsOptions = (assets: Asset[]) => {
    if (!Array.isArray(assets)) return [];
    const { balances, baseFiatCurrency } = this.props;
    return [...assets] // prevent mutation of param
      .map(({ symbol, iconUrl, ...rest }) => {
        const rawAssetBalance = getBalance(balances, symbol);
        const assetBalance = rawAssetBalance ? formatAmount(rawAssetBalance) : null;
        const assetBalanceInFiat = rawAssetBalance ? formatAmount(getBalance(balances, symbol)) : null;
        const formattedBalanceInFiat = assetBalanceInFiat ? formatFiat(assetBalanceInFiat, baseFiatCurrency) : null;
        return {
          key: symbol,
          value: symbol,
          icon: iconUrl,
          iconUrl,
          symbol,
          ...rest,
          assetBalance,
          formattedBalanceInFiat,
        };
      });
  };

  handleFormChange = (value: Object) => {
    this.resetSearch(); // reset all cards before they change according to input values
    this.setState({ value });
    this.updateOptions(value);
    if (!this.exchangeForm.getValue()) return; // this validates form!
    this.triggerSearch();
  };

  updateOptions = (value) => {
    const {
      assets,
      exchangeSupportedAssets,
      rates,
      baseFiatCurrency,
    } = this.props;
    const { fromInput, toInput } = value;
    const { selector: selectedFromOption, input: amount } = fromInput;
    const { selector: selectedToOption } = toInput;
    let amountValueInFiat;
    let valueInFiatToShow;
    if (amount && !isEmpty(selectedFromOption)) {
      const { symbol: token } = selectedFromOption;
      const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
      const totalInFiat = parseFloat(amount) * getRate(rates, token, fiatCurrency);
      amountValueInFiat = formatFiat(totalInFiat, baseFiatCurrency);
      valueInFiatToShow = totalInFiat > 0 ? amountValueInFiat : null;
    }

    const optionsFrom = this.generateAssetsOptions(assets);
    let newOptionsFrom = optionsFrom;
    if (!isEmpty(selectedToOption)) {
      newOptionsFrom = optionsFrom.filter((option) => option.value !== selectedToOption.value);
    }

    const optionsTo = this.generateSupportedAssetsOptions(exchangeSupportedAssets);
    let newOptionsTo = optionsTo;
    if (!isEmpty(selectedFromOption)) {
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

  generatePopularSwaps = () => {
    const { assets, exchangeSupportedAssets } = this.props;
    const fromOptions = this.generateAssetsOptions(assets);
    const toOptions = this.generateSupportedAssetsOptions(exchangeSupportedAssets);
    return POPULAR_SWAPS.filter(({ from, to }) => {
      return fromOptions.find(({ key }) => key === from) && toOptions.find(({ key }) => key === to);
    });
  };

  onSwapPress = (fromAssetCode, toAssetCode) => {
    const { assets, exchangeSupportedAssets } = this.props;
    const fromOptions = this.generateAssetsOptions(assets);
    const toOptions = this.generateSupportedAssetsOptions(exchangeSupportedAssets);
    const fromAsset = fromOptions.find(option => option.key === fromAssetCode);
    const toAsset = toOptions.find(option => option.key === toAssetCode);
    this.handleFormChange({ fromInput: { selector: fromAsset, input: '' }, toInput: { selector: toAsset, input: '' } });
  };

  render() {
    const {
      offers,
      balances,
      navigation,
      exchangeAllowances,
      connectedProviders,
      hasUnreadExchangeNotification,
      markNotificationAsSeen,
      accounts,
      smartWalletState,
      deploySmartWallet,
      theme,
    } = this.props;

    const {
      value,
      formOptions,
      isSubmitted,
    } = this.state;
    const { fromInput } = value;
    const { selector: selectedFromOption } = fromInput;

    const formStructure = generateFormStructure(balances);
    const reorderedOffers = offers.sort((a, b) => (new BigNumber(b.askRate)).minus(a.askRate).toNumber());
    const rightItems = [{ label: 'Support', onPress: () => Intercom.displayMessenger(), key: 'getHelp' }];
    if ((!isEmpty(exchangeAllowances) || !isEmpty(connectedProviders))
      && !rightItems.find(({ key }) => key === 'exchangeSettings')) {
      rightItems.push({
        iconSource: settingsIcon,
        indicator: !!hasUnreadExchangeNotification,
        key: 'exchangeSettings',
        onPress: () => {
          navigation.navigate(EXCHANGE_INFO);
          if (hasUnreadExchangeNotification) markNotificationAsSeen();
        },
      });
    }

    const smartWalletStatus: SmartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);
    const sendingBlockedMessage = smartWalletStatus.sendingBlockedMessage || {};
    const deploymentData = get(smartWalletState, 'upgrade.deploymentData', {});
    const deploymentErrorMessage = deploymentData.error ?
      getDeployErrorMessage(deploymentData.error) : sendingBlockedMessage;
    const blockView = !isEmpty(sendingBlockedMessage)
      && smartWalletStatus.status !== SMART_WALLET_UPGRADE_STATUSES.ACCOUNT_CREATED;


    const isSelectedFiat = !isEmpty(selectedFromOption) &&
      fiatCurrencies.some(({ symbol }) => symbol === selectedFromOption.symbol);
    const disableNonFiatExchange = !this.checkIfAssetsExchangeIsAllowed() && !isSelectedFiat;
    const colors = getThemeColors(theme);
    const scrollContentStyle = {
      backgroundColor: isSubmitted ? colors.surface : colors.card,
    };

    const flatListContentStyle = {
      width: '100%',
      paddingHorizontal: spacing.layoutSides,
      paddingVertical: 10,
    };

    const swaps = this.generatePopularSwaps();

    return (
      <ContainerWithHeader
        headerProps={{
          rightItems,
          centerItems: [{ title: 'Exchange' }],
        }}
        inset={{ bottom: 'never' }}
        footer={!blockView && !reorderedOffers.length && (
          <React.Fragment>
            {!isSubmitted
              ?
                <PromoWrapper>
                  <PromoText>
                    Aggregated from many decentralized exchanges and token swap services
                  </PromoText>
                </PromoWrapper>
              :
                <FooterWrapper>
                  <MediumText medium style={{ marginBottom: spacing.medium }}>
                    Try these popular swaps
                  </MediumText>
                  <HotSwapsGridList onPress={this.onSwapPress} swaps={swaps} />
                </FooterWrapper>
            }
          </React.Fragment>
        )}
      >
        {!!blockView &&
        <SWActivationCard
          title={deploymentErrorMessage.title}
          message={deploymentErrorMessage.message}
          onButtonPress={deploymentData.error ? () => deploySmartWallet() : null}
          buttonTitle="Retry"
          forceRetry={!!deploymentData.error}
        />}
        {!blockView &&
        <ScrollView
          contentContainerStyle={scrollContentStyle}
          onScroll={() => Keyboard.dismiss()}
          keyboardShouldPersistTaps="handled"
          disableOnAndroid
        >
          {!isSubmitted && <HotSwapsHorizontalList onPress={this.onSwapPress} swaps={swaps} />}
          <FormWrapper bottomPadding={isSubmitted ? 6 : 30}>
            <Form
              ref={node => { this.exchangeForm = node; }}
              type={formStructure}
              options={formOptions}
              value={value}
              onChange={this.handleFormChange}
            />
          </FormWrapper>
          {!!disableNonFiatExchange &&
            <SWActivationCard
              message="To exchange assets, deploy Smart Wallet first. You will have to pay a small fee."
              buttonTitle="Deploy Smart Wallet"
            />
          }
          {!!isSubmitted &&
          <FlatList
            data={reorderedOffers}
            keyExtractor={(item) => item._id}
            style={{ width: '100%' }}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={flatListContentStyle}
            renderItem={(props) => this.renderOffers(props, disableNonFiatExchange)}
            ListHeaderComponent={(
              <ListHeader>
                <ExchangeStatus isVisible={isSubmitted} />
              </ListHeader>
            )}
            ListEmptyComponent={isSubmitted
              && (
                <ESWrapper style={{ marginTop: '15%', marginBottom: spacing.large }}>
                  <EmptyStateParagraph
                    title="No live offers"
                    bodyText="Currently no matching offers from exchange services are provided.
                    New offers may appear at any time — don’t miss it."
                    large
                    wide
                  />
                </ESWrapper>
              )}
          />}
        </ScrollView>}
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  oAuthTokens: { data: { accessToken: oAuthAccessToken } },
  appSettings: { data: { baseFiatCurrency } },
  exchange: {
    data: {
      offers,
      searchRequest: exchangeSearchRequest,
      allowances: exchangeAllowances,
      connectedProviders,
      hasNotification: hasUnreadExchangeNotification,
    },
    providersMeta,
    exchangeSupportedAssets,
    fiatExchangeSupportedAssets,
  },
  rates: { data: rates },
  featureFlags: {
    data: {
      SMART_WALLET_ENABLED: smartWalletFeatureEnabled,
    },
  },
  accounts: { data: accounts },
  smartWallet: smartWalletState,
}: RootReducerState): $Shape<Props> => ({
  baseFiatCurrency,
  offers,
  rates,
  exchangeSearchRequest,
  exchangeAllowances,
  connectedProviders,
  hasUnreadExchangeNotification,
  oAuthAccessToken,
  smartWalletFeatureEnabled,
  accounts,
  smartWalletState,
  providersMeta,
  exchangeSupportedAssets,
  fiatExchangeSupportedAssets,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  paymentNetworkBalances: paymentNetworkAccountBalancesSelector,
  assets: accountAssetsSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  searchOffers: (fromAssetCode, toAssetCode, fromAmount) => dispatch(
    searchOffersAction(fromAssetCode, toAssetCode, fromAmount),
  ),
  takeOffer: (fromAssetCode, toAssetCode, fromAmount, provider, trackId, callback) => dispatch(
    takeOfferAction(fromAssetCode, toAssetCode, fromAmount, provider, trackId, callback),
  ),
  authorizeWithShapeshift: () => dispatch(authorizeWithShapeshiftAction()),
  resetOffers: () => dispatch(resetOffersAction()),
  setExecutingTransaction: () => dispatch(setExecutingTransactionAction()),
  setTokenAllowance: (formAssetCode, fromAssetAddress, toAssetAddress, provider, trackId, callback) => dispatch(
    setTokenAllowanceAction(formAssetCode, fromAssetAddress, toAssetAddress, provider, trackId, callback),
  ),
  markNotificationAsSeen: () => dispatch(markNotificationAsSeenAction()),
  deploySmartWallet: () => dispatch(deploySmartWalletAction()),
  getMetaData: () => dispatch(getMetaDataAction()),
  getExchangeSupportedAssets: () => dispatch(getExchangeSupportedAssetsAction()),
});

export default withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(ExchangeScreen));
