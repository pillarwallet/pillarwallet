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
import { FlatList, TextInput as RNTextInput, View } from 'react-native';
import type { NavigationEventSubscription, NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import debounce from 'lodash.debounce';
import { formatAmount, formatMoney, formatFiat, isValidNumber, formatAmountDisplay } from 'utils/common';
import t from 'tcomb-form-native';
import { CachedImage } from 'react-native-cached-image';
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
import { ScrollWrapper } from 'components/Layout';
import ShadowedCard from 'components/ShadowedCard';
import { BaseText, Paragraph } from 'components/Typography';
import TextInput from 'components/TextInput';
import Button from 'components/Button';
import Spinner from 'components/Spinner';
import DeploymentView from 'components/DeploymentView';

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
import { EXCHANGE_CONFIRM, EXCHANGE_INFO, FIAT_EXCHANGE, SMART_WALLET_INTRO } from 'constants/navigationConstants';
import { defaultFiatCurrency, ETH } from 'constants/assetsConstants';
import { PROVIDER_SHAPESHIFT } from 'constants/exchangeConstants';
import { SMART_WALLET_UPGRADE_STATUSES } from 'constants/smartWalletConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

// utils, services
import { wyreWidgetUrl } from 'services/sendwyre';
import { fiatCurrencies } from 'fixtures/assets';
import { baseColors, fontSizes, spacing, UIColors, fontStyles } from 'utils/variables';
import { getAssetData, getAssetsAsList, getBalance, getRate, sortAssets } from 'utils/assets';
import { isFiatProvider, isFiatCurrency, getOfferProviderLogo } from 'utils/exchange';
import { getSmartWalletStatus, getDeployErrorMessage } from 'utils/smartWallet';
import { getActiveAccountType, getActiveAccountAddress } from 'utils/accounts';

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

// partials
import { ExchangeStatus } from './ExchangeStatus';

const CardWrapper = styled.TouchableOpacity`
  width: 100%;
`;

const CardRow = styled.View`
  flex: 1;
  flex-direction: row;
  justify-content: space-between;
  align-items: ${props => props.alignTop ? 'flex-start' : 'flex-end'};
  padding: 10px 0;
  ${({ withBorder, theme }) => withBorder
    ? `border-bottom-width: 1px;
      border-bottom-color: ${theme.colors.border};`
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
  ${fontStyles.regular};
  letter-spacing: 0.18px;
  color: ${({ label, theme }) => label ? theme.colors.text : theme.colors.secondaryText};
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
  font-size: ${fontSizes.regular}px;
`;

const FormWrapper = styled.View`
  padding: 0 ${spacing.large}px;
  margin-top: ${spacing.large}px;
`;

const ProviderIcon = styled(CachedImage)`
  width: 24px;
  height: 24px;
`;

const ESWrapper = styled.View`
  width: 100%;
  align-items: center;
`;

const CardNote = styled(BaseText)`
  flex-direction: row;
  align-items: center;
  padding: 4px 0;
  margin-left: 10px;
  color: ${props => props.color ? props.color : baseColors.slateBlack};
  ${fontStyles.regular};
`;

type Props = {
  rates: Rates,
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: ?string,
  user: Object,
  assets: Assets,
  searchOffers: (string, string, number) => void,
  offers: Offer[],
  takeOffer: (string, string, number, string, Function) => Object,
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
  providersMeta: ProvidersMeta
};

type State = {
  value: Object,
  shapeshiftAuthPressed: boolean,
  formOptions: Object,
  // offer id will be passed to prevent double clicking
  pressedOfferId: string,
  pressedTokenAllowanceId: string,
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
        optionsTitle: 'CRYPTO',
        horizontalOptionsTitle: 'FIAT',
        fullWidth: !hasInput,
        selectorModalTitle: label,
      }}
      getInputRef={inputRef}
    />
  );
}

class ExchangeScreen extends React.Component<Props, State> {
  exchangeForm: t.form;
  fromInputRef: RNTextInput;
  listeners: NavigationEventSubscription[];

  constructor(props: Props) {
    super(props);
    this.listeners = [];
    this.state = {
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
      formOptions: {
        fields: {
          fromInput: {
            keyboardType: 'decimal-pad',
            autoCapitalize: 'words',
            template: SelectorInputTemplate,
            config: {
              label: 'Selling',
              hasInput: true,
              options: [],
              horizontalOptions: [],
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
              label: 'Buying',
              options: [],
              wrapperStyle: { marginTop: spacing.mediumLarge },
              placeholderSelector: 'select asset',
              onSelectorOpen: this.blurFromInput,
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
    getMetaData();
    getExchangeSupportedAssets();
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;

    const defaultFrom = this.checkIfAssetsExchangeIsAllowed() ? ETH : fiatCurrency;
    const { fromAssetCode = defaultFrom, toAssetCode, fromAmount } = exchangeSearchRequest;
    this.setInitialSelection(fromAssetCode, toAssetCode, fromAmount);
    this.provideOptions();
    this.listeners = [
      navigation.addListener('didFocus', this.focusInputWithKeyboard),
      navigation.addListener('didBlur', this.blurFromInput),
    ];
  }

  componentWillUnmount() {
    this.listeners.forEach(listener => listener.remove());
  }

  blurFromInput = () => {
    if (!this.fromInputRef) return;
    this.fromInputRef.blur();
  };

  focusInputWithKeyboard = () => {
    setTimeout(() => {
      if (!this.fromInputRef) return;
      this.fromInputRef.focus();
    }, 200);
  };

  componentDidUpdate(prevProps: Props, prevState: State) {
    const {
      assets,
      exchangeSupportedAssets,
      fiatExchangeSupportedAssets,
      navigation,
      oAuthAccessToken,
      resetOffers,
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

    const fromAssetCode = navigation.getParam('fromAssetCode');
    const toAssetCode = navigation.getParam('toAssetCode');
    if (fromAssetCode || toAssetCode) {
      const _fromAssetCode = fromAssetCode || fromAssetSymbol;
      this.setInitialSelection(_fromAssetCode, toAssetCode);
      // reset to prevent nav value change over newly selected
      navigation.setParams({ fromAssetCode: null, toAssetCode: null });
    }
    if (prevProps.oAuthAccessToken !== oAuthAccessToken) {
      // access token has changed, init search again
      resetOffers();
      this.triggerSearch();
    }
  }

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

    const thisStateFormOptionsCopy = { ...this.state.formOptions };
    thisStateFormOptionsCopy.fields.fromInput.config.options = initialAssetsOptionsSelling;
    thisStateFormOptionsCopy.fields.fromInput.config.horizontalOptions = fiatOptionsFrom;
    thisStateFormOptionsCopy.fields.toInput.config.options = initialAssetsOptionsBuying;

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
      console.error('InAppBrowser.error', error);
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
    } = offer;
    const { code: fromAssetCode } = fromAsset;
    const { code: toAssetCode } = toAsset;
    const amountToSell = parseFloat(selectedSellAmount);
    const amountToBuy = calculateAmountToBuy(askRate, amountToSell);
    this.setState({ pressedOfferId: _id }, () => {
      takeOffer(fromAssetCode, toAssetCode, amountToSell, provider, order => {
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
    } = offer;
    const { address: fromAssetAddress, code: fromAssetCode } = fromAsset;
    const { address: toAssetAddress } = toAsset;
    this.setState({ pressedTokenAllowanceId: _id }, () => {
      setTokenAllowance(fromAssetCode, fromAssetAddress, toAssetAddress, provider, (response) => {
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
    this.props.resetOffers(); // reset all cards before they change according to input values
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
    const isSetAllowancePressed = pressedTokenAllowanceId === offerId;
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
    const minOrMaxAmount = formatAmountDisplay(isBelowMin ? minQuantity : maxQuantity);

    const isTakeButtonDisabled = !!minOrMaxNeeded
      || isTakeOfferPressed
      || !allowanceSet
      || (isShapeShift && !shapeshiftAccessToken);

    const isFiat = isFiatProvider(offerProvider);

    const disableFiatExchange = isFiat && (minOrMaxNeeded || !!offerRestricted);
    const disableOffer = disableNonFiatExchange || disableFiatExchange;

    return (
      <ShadowedCard
        wrapperStyle={{ marginBottom: 10 }}
        contentWrapperStyle={{ paddingHorizontal: 16, paddingVertical: 6 }}
      >
        <CardWrapper
          disabled={isTakeButtonDisabled || disableOffer}
          onPress={() => isFiat ? this.onFiatOfferPress(offer) : this.onOfferPress(offer)}
        >
          <CardRow withBorder alignTop>
            {!!isFiat &&
            <CardColumn>
              <CardText label>Amount total</CardText>
              <CardText>{`${askRate} ${fromAssetCode}`}</CardText>
            </CardColumn>
            }
            {!isFiat &&
            <CardColumn>
              <CardText label>Exchange rate</CardText>
              <CardText>{formatAmountDisplay(askRate)}</CardText>
            </CardColumn>
            }
            <CardInnerRow style={{ flexShrink: 1 }}>
              {!!providerLogo && <ProviderIcon source={providerLogo} resizeMode="contain" />}
              {minOrMaxNeeded &&
              <CardButton onPress={() => this.setFromAmount(isBelowMin ? minQuantity : maxQuantity)}>
                <ButtonLabel color={baseColors.electricBlue}>
                  {`${minOrMaxAmount} ${fromAssetCode} ${isBelowMin ? 'min' : 'max'}`}
                </ButtonLabel>
              </CardButton>
              }
              {!minOrMaxNeeded && isShapeShift && !shapeshiftAccessToken &&
              <CardButton disabled={shapeshiftAuthPressed} onPress={this.onShapeshiftAuthPress}>
                <ButtonLabel color={baseColors.electricBlue}>Connect</ButtonLabel>
              </CardButton>
              }
              {!minOrMaxNeeded && !allowanceSet &&
              <CardButton disabled={isSetAllowancePressed} onPress={() => this.onSetTokenAllowancePress(offer)}>
                {!isSetAllowancePressed &&
                <ButtonLabel color={storedAllowance ? baseColors.darkGray : baseColors.electricBlue} >
                  {storedAllowance
                    ? 'Pending'
                    : 'Enable'
                  }
                </ButtonLabel>}
                {!!isSetAllowancePressed && <Spinner width={20} height={20} />}
              </CardButton>
              }
              {!!isFiat && !!offerRestricted &&
                <CardNote color={baseColors.electricBlue}>{offerRestricted}</CardNote>
              }
            </CardInnerRow>
          </CardRow>
          <CardRow>
            {!!isFiat &&
            <CardColumn style={{ flex: 1 }}>
              <CardText label>Fees total</CardText>
              <View style={{ flexDirection: 'row' }}>
                <CardText>
                  {
                    feeAmount !== ''
                      ? `${formatAmountDisplay(feeAmount + extraFeeAmount)} ${fromAssetCode}`
                      : 'Will be calculated'
                  }
                </CardText>
              </View>
            </CardColumn>
            }
            {!isFiat &&
            <CardColumn style={{ flex: 1 }}>
              <CardText label>Available</CardText>
              <View style={{ flexDirection: 'row' }}>
                <CardText>{available}</CardText>
              </View>
            </CardColumn>
            }
            {!!isFiat &&
            <CardColumn>
              <Button
                title={isTakeOfferPressed ? '' : `${formatAmountDisplay(quoteCurrencyAmount)} ${toAssetCode}`}
                small
                onPress={() => this.onFiatOfferPress(offer)}
                disabled={disableFiatExchange}
              >
                {isTakeOfferPressed && <Spinner width={20} height={20} />}
              </Button>
            </CardColumn>
            }
            {!isFiat &&
            <CardColumn>
              <Button
                disabled={isTakeButtonDisabled || disableNonFiatExchange}
                title={isTakeOfferPressed ? '' : `${amountToBuyString} ${toAssetCode}`}
                small
                onPress={() => this.onOfferPress(offer)}
              >
                {isTakeOfferPressed && <Spinner width={20} height={20} />}
              </Button>
            </CardColumn>
            }
          </CardRow>
        </CardWrapper>
      </ShadowedCard>
    );
  };

  generateAssetsOptions = (assets: Assets, selectedToSymbol?: string) => {
    const { balances, paymentNetworkBalances, exchangeSupportedAssets } = this.props;

    if (selectedToSymbol && !exchangeSupportedAssets.some(({ symbol }) => symbol === selectedToSymbol)) return [];

    return sortAssets(assets)
      .filter(({ symbol }) => (getBalance(balances, symbol) !== 0 || symbol === ETH)
        && !!exchangeSupportedAssets.some(asset => asset.symbol === symbol))
      .map(({ symbol, iconUrl, ...rest }) => {
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
    const { balances, paymentNetworkBalances } = this.props;
    return [...assets] // prevent mutation of param
      .map(({ symbol, iconUrl, ...rest }) => {
        const rawAssetBalance = getBalance(balances, symbol);
        const assetBalance = rawAssetBalance ? formatAmount(rawAssetBalance) : null;
        const paymentNetworkBalance = getBalance(paymentNetworkBalances, symbol);
        return {
          key: symbol,
          value: symbol,
          icon: iconUrl,
          iconUrl,
          symbol,
          ...rest,
          assetBalance,
          paymentNetworkBalance,
        };
      });
  };

  handleFormChange = (value: Object) => {
    this.props.resetOffers(); // reset all cards before they change according to input values
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
    } = this.props;

    const {
      value,
      formOptions,
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
    const blockView = !isEmpty(sendingBlockedMessage)
      && smartWalletStatus.status !== SMART_WALLET_UPGRADE_STATUSES.ACCOUNT_CREATED;
    const deploymentData = get(smartWalletState, 'upgrade.deploymentData', {});
    const isSelectedFiat = !isEmpty(selectedFromOption) &&
      fiatCurrencies.some(({ symbol }) => symbol === selectedFromOption.symbol);

    const disableNonFiatExchange = !this.checkIfAssetsExchangeIsAllowed() && !isSelectedFiat;

    return (
      <ContainerWithHeader
        headerProps={{
          leftItems: [{ user: true }],
          rightItems,
        }}
        inset={{ bottom: 'never' }}
      >
        {!!blockView &&
        <DeploymentView
          message={deploymentData.error ? getDeployErrorMessage(deploymentData.error) : sendingBlockedMessage}
          buttonAction={deploymentData.error ? () => deploySmartWallet() : null}
          buttonLabel="Retry"
          forceRetry={!!deploymentData.error}
        />}
        {!blockView &&
        <ScrollWrapper
          keyboardShouldPersistTaps="handled"
          color={UIColors.defaultBackgroundColor}
        >
          <FormWrapper>
            <Form
              ref={node => { this.exchangeForm = node; }}
              type={formStructure}
              options={formOptions}
              value={value}
              onChange={this.handleFormChange}
            />
          </FormWrapper>
          {!!disableNonFiatExchange &&
          <DeploymentView
            message={{
              title: 'To exchange assets, deploy Smart Wallet first',
              message: 'You will have to pay a small fee',
            }}
            buttonAction={() => navigation.navigate(SMART_WALLET_INTRO, { deploy: true })}
            buttonLabel="Deploy Smart Wallet"
          />
          }
          <FlatList
            data={reorderedOffers}
            keyExtractor={(item) => item._id}
            style={{ width: '100%' }}
            contentContainerStyle={{ width: '100%', paddingHorizontal: 20, paddingVertical: 10 }}
            renderItem={(props) => this.renderOffers(props, disableNonFiatExchange)}
            ListHeaderComponent={!isEmpty(reorderedOffers)
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
        </ScrollWrapper>}
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

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  searchOffers: (fromAssetCode, toAssetCode, fromAmount) => dispatch(
    searchOffersAction(fromAssetCode, toAssetCode, fromAmount),
  ),
  takeOffer: (fromAssetCode, toAssetCode, fromAmount, provider, callback) => dispatch(
    takeOfferAction(fromAssetCode, toAssetCode, fromAmount, provider, callback),
  ),
  authorizeWithShapeshift: () => dispatch(authorizeWithShapeshiftAction()),
  resetOffers: () => dispatch(resetOffersAction()),
  setExecutingTransaction: () => dispatch(setExecutingTransactionAction()),
  setTokenAllowance: (formAssetCode, fromAssetAddress, toAssetAddress, provider, callback) => dispatch(
    setTokenAllowanceAction(formAssetCode, fromAssetAddress, toAssetAddress, provider, callback),
  ),
  markNotificationAsSeen: () => dispatch(markNotificationAsSeenAction()),
  deploySmartWallet: () => dispatch(deploySmartWalletAction()),
  getMetaData: () => dispatch(getMetaDataAction()),
  getExchangeSupportedAssets: () => dispatch(getExchangeSupportedAssetsAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(ExchangeScreen);
