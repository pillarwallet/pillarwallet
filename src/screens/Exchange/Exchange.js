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
import { TextInput as RNTextInput, ScrollView, Keyboard } from 'react-native';
import type { NavigationEventSubscription, NavigationScreenProp } from 'react-navigation';
import styled, { withTheme } from 'styled-components/native';
import { connect } from 'react-redux';
import { SDK_PROVIDER } from 'react-native-dotenv';
import debounce from 'lodash.debounce';
import t from 'tcomb-form-native';
import { createStructuredSelector } from 'reselect';
import Intercom from 'react-native-intercom';
import get from 'lodash.get';
import isEmpty from 'lodash.isempty';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import SWActivationCard from 'components/SWActivationCard';
import SelectorOptions from 'components/SelectorOptions';

// actions
import {
  searchOffersAction,
  resetOffersAction,
  markNotificationAsSeenAction,
  getExchangeSupportedAssetsAction,
} from 'actions/exchangeActions';
import { hasSeenExchangeIntroAction } from 'actions/appSettingsActions';

// constants
import { EXCHANGE_INFO } from 'constants/navigationConstants';
import { defaultFiatCurrency, ETH, POPULAR_SWAPS } from 'constants/assetsConstants';
import { SMART_WALLET_UPGRADE_STATUSES } from 'constants/smartWalletConstants';

// utils, services
import { spacing } from 'utils/variables';
import { getAssetData, getAssetsAsList, getBalance, getRate, sortAssets } from 'utils/assets';
import { getSmartWalletStatus, getDeploymentData } from 'utils/smartWallet';
import { themedColors } from 'utils/themes';
import { SelectorInputTemplate, inputFormatter, inputParser } from 'utils/formHelpers';
import { generateHorizontalOptions, ExchangeOptions } from 'utils/exchange';
import { formatAmount, formatFiat, isValidNumber } from 'utils/common';

// selectors
import { accountBalancesSelector } from 'selectors/balances';
import { accountAssetsSelector } from 'selectors/assets';
import { isActiveAccountSmartWalletSelector } from 'selectors/smartWallet';

// models, types
import type { ExchangeSearchRequest, Allowance } from 'models/Offer';
import type { Asset, Assets, Balances, Rates } from 'models/Asset';
import type { SmartWalletStatus } from 'models/SmartWalletStatus';
import type { Accounts } from 'models/Account';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Theme } from 'models/Theme';
import type { FormSelector } from 'models/TextInput';
import type { Option } from 'models/Selector';


// partials
import { HotSwapsHorizontalList } from './HotSwapsList';
import ExchangeIntroModal from './ExchangeIntroModal';
import ExchangeOffers from './ExchangeOffers';
import {
  getFormattedBalanceInFiat,
  getFormattedSellMax,
  getBalanceInFiat,
  getAssetBalanceFromFiat,
} from './utils';
import ExchangeTextInput from './ExchangeTextInput';

type Props = {
  rates: Rates,
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: ?string,
  user: Object,
  assets: Assets,
  searchOffers: (string, string, number) => void,
  balances: Balances,
  resetOffers: () => void,
  exchangeSearchRequest: ExchangeSearchRequest,
  exchangeAllowances: Allowance[],
  hasUnreadExchangeNotification: boolean,
  markNotificationAsSeen: () => void,
  oAuthAccessToken: ?string,
  accounts: Accounts,
  smartWalletState: Object,
  exchangeSupportedAssets: Asset[],
  fiatExchangeSupportedAssets: Asset[],
  getExchangeSupportedAssets: () => void,
  hasSeenExchangeIntro: boolean,
  updateHasSeenExchangeIntro: () => void,
  theme: Theme,
  isActiveAccountSmartWallet: boolean,
};

export type FormValue = {
  fromInput: FormSelector,
  toInput: FormSelector,
}

type State = {
  value: FormValue,
  formOptions: Object,
  isSubmitted: boolean,
  showEmptyMessage: boolean,
};


const FormWrapper = styled.View`
  padding: ${({ bottomPadding }) => `${spacing.large}px 40px ${bottomPadding}px`};
  background-color: ${themedColors.surface};
`;

const settingsIcon = require('assets/icons/icon_key.png');

class ExchangeScreen extends React.Component<Props, State> {
  fromInputRef: RNTextInput;
  listeners: NavigationEventSubscription[];
  _isMounted: boolean;
  emptyMessageTimeout: ?TimeoutID;
  options: ExchangeOptions;

  constructor(props: Props) {
    super(props);
    this.listeners = [];
    this.options = this.provideOptions();

    this.state = {
      fromAmount: undefined,
      toAmount: undefined,
      fromAmountInFiat: undefined,
      fromAsset: this.options.fromOptions.find(a => a.value === ETH),
      toAsset: '',
      toAmountInFiat: false,
      includeTxFee: true,
      errorMessage: '',
      showSellOptions: false,
      showBuyOptions: false,
      displayFiatFromAmount: false,

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
              optionsTitle: 'Crypto',
              placeholderSelector: 'select',
              placeholderInput: '0',
              inputRef: (ref) => { this.fromInputRef = ref; },
              inputWrapperStyle: { width: '100%' },
              rightLabel: '',
              onPressRightLabel: this.handleSellMax,
            },
            transformer: {
              parse: inputParser,
              format: inputFormatter,
            },
          },
          toInput: {
            template: SelectorInputTemplate,
            config: {
              label: 'Buy',
              options: [],
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

  handleBuySellSwap = () => {
    // TODO
    const { fromAsset, toAsset } = this.state;
    this.setState({
      toAsset: fromAsset,
      fromAsset: toAsset,
      fromAmount: 0, // TODO - make 0 or not?
      toAmount: 0,
    });
  };

  setErrorMessage = (errorMessage: string) => this.setState({ errorMessage });

  handleFromInputChange = (input: string) => {
    const {
      fromAsset, displayFiatFromAmount,
    } = this.state;
    const { baseFiatCurrency, rates } = this.props;
    const val = input || '0';
    const isValid = isValidNumber(val) || ['.', ','].includes(val[val.length - 1]);
    this.setState(displayFiatFromAmount
      ? {
        fromAmountInFiat: val,
        fromAmount: getAssetBalanceFromFiat(baseFiatCurrency, val, rates, fromAsset.symbol),
      }
      : {
        fromAmount: val,
        fromAmountInFiat: getBalanceInFiat(baseFiatCurrency, val, rates, fromAsset.symbol),
      },
    );
    this.setErrorMessage(isValid ? '' : 'Incorrect number entered');
  }

  getFromInput = () => {
    const { baseFiatCurrency } = this.props;
    const {
      errorMessage, fromAsset, fromAmount, fromAmountInFiat, displayFiatFromAmount,
    } = this.state;
    const { assetBalance, symbol } = fromAsset;
    const value = fromAmount ? formatAmount(displayFiatFromAmount ? fromAmountInFiat : fromAmount, 2) : null;
    return (
      <ExchangeTextInput
        onChange={this.handleFromInputChange}
        value={value}
        onBlur={this.blurFromInput}
        errorMessage={errorMessage}
        asset={fromAsset}
        onAssetPress={() => this.setState({ showSellOptions: true })}
        labelText={assetBalance && getFormattedSellMax(fromAsset)}
        onLabelPress={assetBalance && this.handleSellMax}
        leftSideText={displayFiatFromAmount
          ? `${formatAmount(fromAmount, 2)} ${fromAsset.symbol}`
          : formatFiat(fromAmountInFiat, baseFiatCurrency)
        }
        leftSideSymbol="-"
        onLeftSideTextPress={() => this.setState({ displayFiatFromAmount: !displayFiatFromAmount })}
        rightPlaceholder={displayFiatFromAmount ? baseFiatCurrency || defaultFiatCurrency : symbol}
      />
    );
  };

  componentDidMount() {
    const {
      exchangeSearchRequest = {},
      navigation,
      getExchangeSupportedAssets,
    } = this.props;
    this._isMounted = true;
    getExchangeSupportedAssets();

    const defaultFrom = ETH;
    const { fromAmount } = exchangeSearchRequest;
    const fromAssetCode = navigation.getParam('fromAssetCode') || exchangeSearchRequest.fromAssetCode || defaultFrom;
    const toAssetCode = navigation.getParam('toAssetCode') || exchangeSearchRequest.toAssetCode;
    this.setInitialSelection(fromAssetCode, toAssetCode, fromAmount);
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
      this.options = this.provideOptions();
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
    const { fromAsset } = this.state;
    this.setState({
      fromAmount: fromAsset.assetBalance,
      fromAmountInFiat: fromAsset.formattedBalanceInFiat.substr(2), // TODO change
    });
  };

  shouldShowSellMax = () => {
    const { balances } = this.props;
    const selectedAssetSymbol = this.getSelectedFromAssetSymbol();
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
    const { accounts, smartWalletState, isActiveAccountSmartWallet } = this.props;
    if (!isActiveAccountSmartWallet) return true;
    const smartWalletStatus: SmartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);
    return smartWalletStatus.status === SMART_WALLET_UPGRADE_STATUSES.DEPLOYMENT_COMPLETE;
  };

  provideOptions = (): ExchangeOptions => {
    const { assets, exchangeSupportedAssets } = this.props;
    const assetsOptionsBuying = this.generateSupportedAssetsOptions(exchangeSupportedAssets);
    const assetsOptionsFrom = this.generateAssetsOptions(assets);
    return {
      fromOptions: assetsOptionsFrom,
      toOptions: assetsOptionsBuying,
      horizontalOptions: generateHorizontalOptions(assetsOptionsBuying), // the same for buy/sell
    };
  };

  generateHorizontalOptions = (popularOptions: Option[]) => [{
    title: 'Popular',
    data: popularOptions,
  }];

  setInitialSelection = (fromAssetCode: string, toAssetCode?: string, fromAmount?: number) => {
    const { assets, exchangeSupportedAssets } = this.props;
    const assetsData = getAssetsAsList(assets);

    const fromAsset = getAssetData(assetsData, exchangeSupportedAssets, fromAssetCode);
    const selectedAssetOptions = this.generateAssetsOptions({ [fromAssetCode]: fromAsset })[0];

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

    this.setState({ value: initialFormState }, () => this.updateOptions(initialFormState));
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

    this.emptyMessageTimeout = setTimeout(() => this.setState({ showEmptyMessage: true }), 5000);
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
        const imageUrl = iconUrl ? `${SDK_PROVIDER}/${iconUrl}?size=3` : '';

        return ({
          key: symbol,
          value: symbol,
          imageUrl,
          icon: iconUrl,
          iconUrl,
          symbol,
          ...rest,
          assetBalance,
          formattedBalanceInFiat,
          customProps: {
            balance: !!formattedBalanceInFiat && {
              balance: assetBalance,
              value: formattedBalanceInFiat,
              token: symbol,
            },
            rightColumnInnerStyle: { alignItems: 'flex-end' },
          },
        });
      });
  };

  generateSupportedAssetsOptions = (assets: Asset[]) => {
    if (!Array.isArray(assets)) return [];
    const { balances, baseFiatCurrency, rates } = this.props;
    return [...assets] // prevent mutation of param
      .map(({ symbol, iconUrl, ...rest }) => {
        const rawAssetBalance = getBalance(balances, symbol);
        const assetBalance = rawAssetBalance ? formatAmount(rawAssetBalance) : null;
        const formattedBalanceInFiat = getFormattedBalanceInFiat(baseFiatCurrency, assetBalance, rates, symbol);
        const imageUrl = iconUrl ? `${SDK_PROVIDER}/${iconUrl}?size=3` : '';

        return {
          key: symbol,
          value: symbol,
          icon: iconUrl,
          imageUrl,
          iconUrl,
          symbol,
          ...rest,
          assetBalance,
          formattedBalanceInFiat,
          customProps: {
            balance: !!formattedBalanceInFiat && {
              balance: assetBalance,
              value: formattedBalanceInFiat,
              token: symbol,
            },
            rightColumnInnerStyle: { alignItems: 'flex-end' },
          },
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

  updateOptions = (value: FormValue, callback?: () => void) => {
    const {
      assets,
      exchangeSupportedAssets,
      rates,
      baseFiatCurrency,
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

  handleSelectorOptionSelect = (option: Option) => {
    const { showSellOptions } = this.state;
    const optionsStateChanges = { showSellOptions: false, showBuyOptions: false };
    this.setState(showSellOptions
      ? { fromAsset: option, ...optionsStateChanges }
      : { toAsset: option, ...optionsStateChanges },
    );
  }

  render() {
    const {
      navigation,
      exchangeAllowances,
      hasUnreadExchangeNotification,
      markNotificationAsSeen,
      accounts,
      smartWalletState,
      hasSeenExchangeIntro,
      updateHasSeenExchangeIntro,
    } = this.props;

    const {
      value,
      isSubmitted,
      showEmptyMessage,
      showSellOptions,
      showBuyOptions,
    } = this.state;

    const { fromOptions, toOptions, horizontalOptions } = this.options;

    const rightItems = [{ label: 'Support', onPress: () => Intercom.displayMessenger(), key: 'getHelp' }];
    if (!isEmpty(exchangeAllowances)
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

    const disableNonFiatExchange = !this.checkIfAssetsExchangeIsAllowed();

    const swaps = this.generatePopularSwaps();

    return (
      <>
        <ContainerWithHeader
          headerProps={{
          rightItems,
          centerItems: [{ title: 'Exchange' }],
        }}
          inset={{ bottom: 'never' }}
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
              {this.getFromInput()}
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
              isExchangeActive={isSubmitted}
              showEmptyMessage={showEmptyMessage}
              setFromAmount={this.setFromAmount}
              navigation={navigation}
            />}
          </ScrollView>}
        </ContainerWithHeader>
        <SelectorOptions
          isVisible={showBuyOptions || showSellOptions}
          onHide={() => this.setState({ showBuyOptions: false, showSellOptions: false })}
          title={showSellOptions ? 'Sell' : 'Buy'}
          options={showSellOptions ? fromOptions : toOptions}
          searchPlaceholder="Search"
          onOptionSelect={this.handleSelectorOptionSelect}
          horizontalOptionsData={horizontalOptions}
        />
      </>
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
      hasNotification: hasUnreadExchangeNotification,
    },
    exchangeSupportedAssets,
    fiatExchangeSupportedAssets,
  },
  rates: { data: rates },
  accounts: { data: accounts },
  smartWallet: smartWalletState,
}: RootReducerState): $Shape<Props> => ({
  baseFiatCurrency,
  rates,
  exchangeSearchRequest,
  exchangeAllowances,
  hasUnreadExchangeNotification,
  oAuthAccessToken,
  accounts,
  smartWalletState,
  exchangeSupportedAssets,
  fiatExchangeSupportedAssets,
  hasSeenExchangeIntro,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  assets: accountAssetsSelector,
  isActiveAccountSmartWallet: isActiveAccountSmartWalletSelector,
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
  getExchangeSupportedAssets: () => dispatch(getExchangeSupportedAssetsAction()),
  updateHasSeenExchangeIntro: () => dispatch(hasSeenExchangeIntroAction()),
});

export default withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(ExchangeScreen));
