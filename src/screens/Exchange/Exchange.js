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
import { TextInput as RNTextInput, ScrollView, Keyboard, View } from 'react-native';
import type { NavigationEventSubscription, NavigationScreenProp } from 'react-navigation';
import styled, { withTheme } from 'styled-components/native';
import { connect } from 'react-redux';
import debounce from 'lodash.debounce';
import { formatAmount, formatFiat, isValidNumber, reportOrWarn } from 'utils/common';
import t from 'tcomb-form-native';
import { createStructuredSelector } from 'reselect';
import Intercom from 'react-native-intercom';
import get from 'lodash.get';
import isEmpty from 'lodash.isempty';
import { SDK_PROVIDER } from 'react-native-dotenv';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import TextInput from 'components/TextInput';
import SWActivationCard from 'components/SWActivationCard';

// actions
import {
  searchOffersAction,
  resetOffersAction,
  markNotificationAsSeenAction,
  getMetaDataAction,
  getExchangeSupportedAssetsAction,
} from 'actions/exchangeActions';
import { hasSeenExchangeIntroAction } from 'actions/appSettingsActions';

// constants
import { EXCHANGE_INFO } from 'constants/navigationConstants';
import { defaultFiatCurrency, ETH, POPULAR_EXCHANGE_TOKENS, POPULAR_SWAPS } from 'constants/assetsConstants';
import { SMART_WALLET_UPGRADE_STATUSES } from 'constants/smartWalletConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

// utils, services
import { fiatCurrencies, initialAssets } from 'fixtures/assets';
import { spacing } from 'utils/variables';
import { getAssetData, getAssetsAsList, getBalance, getRate, sortAssets } from 'utils/assets';
import { isFiatCurrency } from 'utils/exchange';
import { getSmartWalletStatus, getDeploymentData } from 'utils/smartWallet';
import { getActiveAccountType } from 'utils/accounts';
import { themedColors } from 'utils/themes';
import { satoshisToBtc } from 'utils/bitcoin';

// selectors
import { accountBalancesSelector } from 'selectors/balances';
import { paymentNetworkAccountBalancesSelector } from 'selectors/paymentNetwork';
import { accountAssetsSelector } from 'selectors/assets';

// models, types
import type { ExchangeSearchRequest, Allowance, ExchangeProvider } from 'models/Offer';
import type { Asset, Assets, Balances, Rates } from 'models/Asset';
import type { SmartWalletStatus } from 'models/SmartWalletStatus';
import type { Accounts } from 'models/Account';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { BitcoinAddress, BitcoinBalance } from 'models/Bitcoin';
import type { Theme } from 'models/Theme';

// partials
import { HotSwapsHorizontalList } from './HotSwapsList';
import ExchangeIntroModal from './ExchangeIntroModal';
import ExchangeOffers from './ExchangeOffers';
import { calculateMaxAmount, getFormattedBalanceInFiat } from './utils';
import SellMaxButton from './SellMaxButton';


type Props = {
  rates: Rates,
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: ?string,
  user: Object,
  assets: Assets,
  searchOffers: (string, string, number) => void,
  authorizeWithShapeshift: Function,
  balances: Balances,
  resetOffers: () => void,
  paymentNetworkBalances: Balances,
  exchangeSearchRequest: ExchangeSearchRequest,
  exchangeAllowances: Allowance[],
  connectedProviders: ExchangeProvider[],
  hasUnreadExchangeNotification: boolean,
  markNotificationAsSeen: () => void,
  oAuthAccessToken: ?string,
  accounts: Accounts,
  smartWalletState: Object,
  smartWalletFeatureEnabled: boolean,
  getMetaData: () => void,
  exchangeSupportedAssets: Asset[],
  fiatExchangeSupportedAssets: Asset[],
  getExchangeSupportedAssets: () => void,
  hasSeenExchangeIntro: boolean,
  updateHasSeenExchangeIntro: () => void,
  btcAddresses: BitcoinAddress[],
  btcBalances: BitcoinBalance,
  theme: Theme,
};

type InputValue = {
  selector: Object,
  input: string,
}

export type FormValue = {
  fromInput: InputValue,
  toInput: InputValue,
}

type State = {
  value: FormValue,
  formOptions: Object,
  isSubmitted: boolean,
  showEmptyMessage: boolean,
};


const FormWrapper = styled.View`
  padding: ${({ bottomPadding }) => `${spacing.large}px ${spacing.layoutSides}px ${bottomPadding}px`};
  background-color: ${themedColors.surface};
`;

const { Form } = t.form;

const MIN_TX_AMOUNT = 0.000000000000000001;

const settingsIcon = require('assets/icons/icon_key.png');

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
    if (!selector) {
      reportOrWarn('Wrong exchange selector value', selector, 'critical');
      return true;
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
      fiatOptions,
      fiatOptionsTitle,
      displayFiatOptionsFirst,
      rightLabel,
      onPressRightLabel,
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
    rightLabel,
    onPressRightLabel,
  };

  return (
    <View style={{ flexDirection: 'row', flex: 1 }}>
      <TextInput
        style={{ width: '100%' }}
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
          fiatOptions,
          fiatOptionsTitle,
          fullWidth: !hasInput,
          selectorModalTitle: label,
          selectorPlaceholder: placeholderSelector,
          optionsSearchPlaceholder: 'Asset search',
          displayFiatOptionsFirst,
        }}
        getInputRef={inputRef}
        inputWrapperStyle={inputWrapperStyle}
      />
    </View>
  );
}

class ExchangeScreen extends React.Component<Props, State> {
  exchangeForm: t.form;
  fromInputRef: RNTextInput;
  listeners: NavigationEventSubscription[];
  _isMounted: boolean;
  emptyMessageTimeout: ?TimeoutID;

  constructor(props: Props) {
    super(props);
    this.listeners = [];
    this.state = {
      shapeshiftAuthPressed: false,
      isSubmitted: false,
      showEmptyMessage: false,
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
              horizontalOptionsTitle: 'Popular',
              fiatOptions: [],
              fiatOptionsTitle: 'Fiat',
              optionsTitle: 'Crypto',
              placeholderSelector: 'select',
              placeholderInput: '0',
              inputRef: (ref) => { this.fromInputRef = ref; },
              displayFiatOptionsFirst: get(props, 'navigation.state.params.displayFiatOptionsFirst'),
              inputWrapperStyle: { width: '100%' },
              rightLabel: 'Sell max',
              onPressRightLabel: this.handleSellMax,
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
              inputWrapperStyle: { marginTop: 6, width: '100%' },
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
    const { hasSeenExchangeIntro } = this.props;
    setTimeout(() => {
      if (!this.fromInputRef || !this._isMounted || !hasSeenExchangeIntro) return;
      this.fromInputRef.focus();
    }, 200);
  };

  componentDidUpdate(prevProps: Props, prevState: State) {
    const {
      assets,
      exchangeSupportedAssets,
      oAuthAccessToken,
    } = this.props;

    const fromAssetSymbol = get(this.state, 'value.fromInput.selector.symbol');
    const prevFromAssetSymbol = get(prevState, 'value.fromInput.selector.symbol');
    const toAssetSymbol = get(this.state, 'value.toInput.selector.symbol');
    const prevToAssetSymbol = get(prevState, 'value.toInput.selector.symbol');

    // update from and to options when (supported) assets changes or user selects an option
    if (assets !== prevProps.assets || exchangeSupportedAssets !== prevProps.exchangeSupportedAssets
      || fromAssetSymbol !== prevFromAssetSymbol || toAssetSymbol !== prevToAssetSymbol) {
      this.provideOptions();
    }

    if (prevProps.oAuthAccessToken !== oAuthAccessToken) {
      // access token has changed, init search again
      this.resetSearch();
      this.triggerSearch();
    }

    if (!prevProps.hasSeenExchangeIntro && this.props.hasSeenExchangeIntro) {
      setTimeout(this.focusInputWithKeyboard, 300);
    }
  }

  handleSellMax = () => {
    const { balances } = this.props;
    const selectedAssetSymbol = this.getSelectedFromAssetSymbol();
    const chosenAssetBalance = formatAmount(getBalance(balances, selectedAssetSymbol));
    const value = { ...this.state.value };
    value.fromInput.input = chosenAssetBalance;
    this.handleFormChange(value);
  }

  shouldShowSellMax = () => {
    const { balances } = this.props;
    const selectedAssetSymbol = this.getSelectedFromAssetSymbol();
    if (isFiatCurrency(selectedAssetSymbol)) return false;
    const assetBalance = getBalance(balances, selectedAssetSymbol);
    return !!assetBalance;
  }

  getSelectedFromAssetSymbol = () => {
    const { value } = this.state;
    return get(value, 'fromInput.selector.symbol', '');
  }

  resetSearch = () => {
    const { resetOffers } = this.props;
    resetOffers();
    this.setState({ isSubmitted: false, showEmptyMessage: false });
    if (this.emptyMessageTimeout) {
      clearTimeout(this.emptyMessageTimeout);
    }
    this.emptyMessageTimeout = null;
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
    const {
      assets,
      exchangeSupportedAssets,
      btcAddresses,
    } = this.props;

    const selectedFromAssetSymbol = this.getSelectedFromAssetSymbol();
    const isFromSelectedFiat = isFiatCurrency(selectedFromAssetSymbol);

    const assetsOptionsBuying = this.generateSupportedAssetsOptions(exchangeSupportedAssets);
    if (!isEmpty(btcAddresses) && isFromSelectedFiat) {
      assetsOptionsBuying.push(this.generateBTCAssetOption());
    }

    const assetsOptionsFrom = this.generateAssetsOptions(assets);
    const fiatOptionsFrom = this.generateFiatOptions();

    const popularOptions = POPULAR_EXCHANGE_TOKENS.reduce((popularAssetsList, popularSymbol) => {
      const popularAsset = assetsOptionsBuying.find(({ symbol }) => symbol === popularSymbol);
      if (popularAsset) return [...popularAssetsList, popularAsset];
      return popularAssetsList;
    }, []);

    const thisStateFormOptionsCopy = { ...this.state.formOptions };
    thisStateFormOptionsCopy.fields.fromInput.config.options = assetsOptionsFrom;
    thisStateFormOptionsCopy.fields.fromInput.config.fiatOptions = fiatOptionsFrom;
    thisStateFormOptionsCopy.fields.fromInput.config.horizontalOptions = popularOptions;
    thisStateFormOptionsCopy.fields.toInput.config.options = assetsOptionsBuying;
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
          input: '',
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

    // if it's not supported currecy, we show the empty message immadietely, otherwise we wait for 5 sec
    if (!this.isSupportedExchange(from, to)) {
      this.setState({ showEmptyMessage: true });
    } else {
      this.emptyMessageTimeout = setTimeout(() => this.setState({ showEmptyMessage: true }), 5000);
    }
  };

  isSupportedExchange = (from: string, to: string) => {
    const {
      fiatExchangeSupportedAssets,
    } = this.props;
    return !(isFiatCurrency(from) && !fiatExchangeSupportedAssets.some(({ symbol }) => symbol === to));
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

  generateAssetsOptions = (assets: Assets) => {
    const {
      balances,
      exchangeSupportedAssets,
      baseFiatCurrency,
      rates,
    } = this.props;

    return sortAssets(assets)
      .filter(({ symbol }) => (getBalance(balances, symbol) !== 0 || symbol === ETH)
        && !!exchangeSupportedAssets.some(asset => asset.symbol === symbol))
      .map(({ symbol, iconUrl, ...rest }) => {
        const assetBalance = formatAmount(getBalance(balances, symbol));
        const formattedBalanceInFiat = getFormattedBalanceInFiat(baseFiatCurrency, assetBalance, rates, symbol);
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

  generateBTCAssetOption = () => {
    const symbol = 'BTC';
    const {
      btcAddresses,
      btcBalances,
      baseFiatCurrency,
      rates,
    } = this.props;
    const [{ address }] = btcAddresses;
    const addressBalance = btcBalances[address];
    const rawAssetBalance = addressBalance ? satoshisToBtc(addressBalance.confirmed) : 0;
    const assetBalance = rawAssetBalance ? formatAmount(rawAssetBalance) : null;
    const formattedBalanceInFiat = getFormattedBalanceInFiat(baseFiatCurrency, assetBalance, rates, symbol);
    const btcAsset = initialAssets.find(e => e.symbol === symbol);
    const iconUrl = btcAsset ? btcAsset.iconUrl : '';
    return {
      key: symbol,
      value: symbol,
      icon: iconUrl,
      iconUrl,
      symbol,
      ...btcAsset,
      assetBalance,
      formattedBalanceInFiat,
    };
  };

  generateSupportedAssetsOptions = (assets: Asset[]) => {
    if (!Array.isArray(assets)) return [];
    const { balances, baseFiatCurrency, rates } = this.props;
    return [...assets] // prevent mutation of param
      .map(({ symbol, iconUrl, ...rest }) => {
        const rawAssetBalance = getBalance(balances, symbol);
        const assetBalance = rawAssetBalance ? formatAmount(rawAssetBalance) : null;
        const formattedBalanceInFiat = getFormattedBalanceInFiat(baseFiatCurrency, assetBalance, rates, symbol);
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
      }).filter(asset => asset.key !== 'BTC');
  };

  handleFormChange = (value: FormValue) => {
    this.resetSearch(); // reset all cards before they change according to input values
    const { value: currentValue } = this.state;

    const selectedFromAsset = get(value, 'fromInput.selector.value', '');
    const selectedToAsset = get(value, 'toInput.selector.value', '');

    if (selectedFromAsset === selectedToAsset) {
      if (get(currentValue, 'fromInput.selector.value') === selectedFromAsset) {
        value.fromInput = { selector: {}, input: '' };
      } else if (get(currentValue, 'toInput.selector.value') === selectedToAsset) {
        value.toInput = { selector: {}, input: '' };
      }
    }

    this.setState({ value }, () => {
      this.updateOptions(value, () => {
        if (this.exchangeForm.getValue()) { // this validates form!
          this.triggerSearch();
        }
      });
    });
  };

  updateOptions = (value: FormValue, callback: () => void) => {
    const {
      assets,
      exchangeSupportedAssets,
      rates,
      baseFiatCurrency,
      btcAddresses,
    } = this.props;
    const { fromInput } = value;
    const { selector: selectedFromOption, input: amount } = fromInput;
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
    const optionsTo = this.generateSupportedAssetsOptions(exchangeSupportedAssets);
    const selectedFromAssetSymbol = this.getSelectedFromAssetSymbol();
    const isFromSelectedFiat = isFiatCurrency(selectedFromAssetSymbol);
    if (!isEmpty(btcAddresses) && isFromSelectedFiat) {
      optionsTo.push(this.generateBTCAssetOption());
    }

    const newOptions = t.update(this.state.formOptions, {
      fields: {
        fromInput: {
          config: {
            options: { $set: optionsFrom },
            inputAddonText: { $set: valueInFiatToShow },
            rightLabel: { $set: this.shouldShowSellMax() ? 'Sell max' : '' },
          },
        },
        toInput: {
          config: { options: { $set: optionsTo } },
        },
      },
    });

    this.setState({ formOptions: newOptions }, callback);
  };

  generatePopularSwaps = () => {
    const { assets, exchangeSupportedAssets } = this.props;
    const fromOptions = this.generateAssetsOptions(assets);
    const toOptions = this.generateSupportedAssetsOptions(exchangeSupportedAssets);
    return POPULAR_SWAPS.filter(({ from, to }) => {
      return fromOptions.find(({ key }) => key === from) && toOptions.find(({ key }) => key === to);
    });
  };

  onSwapPress = (fromAssetCode: string, toAssetCode: string) => {
    const { assets, exchangeSupportedAssets } = this.props;
    const { fromInput, toInput } = this.state.value;
    const fromOptions = this.generateAssetsOptions(assets);
    const toOptions = this.generateSupportedAssetsOptions(exchangeSupportedAssets);
    const fromAsset = fromOptions.find(option => option.key === fromAssetCode);
    const toAsset = toOptions.find(option => option.key === toAssetCode);
    this.handleFormChange({
      fromInput: { selector: fromAsset, input: fromInput.input }, toInput: { selector: toAsset, input: toInput.input },
    });
  };

  render() {
    const {
      balances,
      navigation,
      exchangeAllowances,
      connectedProviders,
      hasUnreadExchangeNotification,
      markNotificationAsSeen,
      accounts,
      smartWalletState,
      hasSeenExchangeIntro,
      updateHasSeenExchangeIntro,
    } = this.props;

    const {
      value,
      formOptions,
      isSubmitted,
      showEmptyMessage,
    } = this.state;
    const { fromInput, toInput } = value;
    const { selector: selectedFromOption } = fromInput;
    const { selector: selectedToOption } = toInput;

    const formStructure = generateFormStructure(balances);
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

    const deploymentData = getDeploymentData(smartWalletState);
    const smartWalletStatus: SmartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);
    const sendingBlockedMessage = smartWalletStatus.sendingBlockedMessage || {};
    const blockView = !isEmpty(sendingBlockedMessage)
      && smartWalletStatus.status !== SMART_WALLET_UPGRADE_STATUSES.ACCOUNT_CREATED
      && !deploymentData.error;

    const isSelectedFiat = !isEmpty(selectedFromOption) &&
      fiatCurrencies.some(({ symbol }) => symbol === selectedFromOption.symbol);
    const disableNonFiatExchange = !this.checkIfAssetsExchangeIsAllowed() && !isSelectedFiat;


    const swaps = this.generatePopularSwaps();

    const isSupportedExchange = selectedFromOption &&
      this.isSupportedExchange(selectedFromOption.symbol, selectedToOption.symbol);

    return (
      <ContainerWithHeader
        headerProps={{
          rightItems,
          centerItems: [{ title: 'Exchange' }],
        }}
        inset={{ bottom: 'never' }}
        // footer={!blockView && !reorderedOffers.length && !isSubmitted && (
        //   <PromoWrapper>
        //     <PromoText>
        //       Aggregated from many decentralized exchanges and token swap services
        //     </PromoText>
        //   </PromoWrapper>
        // )}
      >
        <ExchangeIntroModal isVisible={!hasSeenExchangeIntro} onButtonPress={updateHasSeenExchangeIntro} />
        {(blockView || !!deploymentData.error) && <SWActivationCard />}
        {!blockView &&
        <ScrollView
          onScroll={() => Keyboard.dismiss()}
          keyboardShouldPersistTaps="handled"
          disableOnAndroid
        >
          {!isSubmitted && <HotSwapsHorizontalList onPress={this.onSwapPress} swaps={swaps} />}
          <FormWrapper bottomPadding={isSubmitted ? 6 : 30}>
            {/* {this.shouldShowSellMax() && <SellMaxButton onPress={this.handleSellMax} />} */}
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
              message="To start exchanging assets you need to activate your Smart Wallet"
              buttonTitle="Activate Smart Wallet"
            />
          }
          {!!isSubmitted &&
          <ExchangeOffers
            value={value}
            disableNonFiatExchange={disableNonFiatExchange}
            isExchangeActive={isSubmitted && isSupportedExchange}
            showEmptyMessage={showEmptyMessage}
            setFromAmount={this.setFromAmount}
            navigation={navigation}
          />}
        </ScrollView>}
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  oAuthTokens: { data: { accessToken: oAuthAccessToken } },
  appSettings: { data: { baseFiatCurrency, hasSeenExchangeIntro } },
  exchange: {
    data: {
      searchRequest: exchangeSearchRequest,
      allowances: exchangeAllowances,
      connectedProviders,
      hasNotification: hasUnreadExchangeNotification,
    },
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
  bitcoin: {
    data: {
      addresses: btcAddresses,
      balances: btcBalances,
    },
  },
}: RootReducerState): $Shape<Props> => ({
  baseFiatCurrency,
  rates,
  exchangeSearchRequest,
  exchangeAllowances,
  connectedProviders,
  hasUnreadExchangeNotification,
  oAuthAccessToken,
  smartWalletFeatureEnabled,
  accounts,
  smartWalletState,
  exchangeSupportedAssets,
  fiatExchangeSupportedAssets,
  hasSeenExchangeIntro,
  btcAddresses,
  btcBalances,
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
  resetOffers: () => dispatch(resetOffersAction()),
  markNotificationAsSeen: () => dispatch(markNotificationAsSeenAction()),
  getMetaData: () => dispatch(getMetaDataAction()),
  getExchangeSupportedAssets: () => dispatch(getExchangeSupportedAssetsAction()),
  updateHasSeenExchangeIntro: () => dispatch(hasSeenExchangeIntroAction()),
});

export default withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(ExchangeScreen));
