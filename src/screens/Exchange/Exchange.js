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
import debounce from 'lodash.debounce';
import { createStructuredSelector } from 'reselect';

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
import { defaultFiatCurrency, ETH, PLR } from 'constants/assetsConstants';
import { SMART_WALLET_UPGRADE_STATUSES } from 'constants/smartWalletConstants';

// utils, services
import { spacing } from 'utils/variables';
import { getSmartWalletStatus, getDeploymentData } from 'utils/smartWallet';
import { themedColors } from 'utils/themes';
import type { ExchangeOptions } from 'utils/exchange';
import { formatAmount, formatFiat } from 'utils/common';

// selectors
import { accountBalancesSelector } from 'selectors/balances';
import { accountAssetsSelector } from 'selectors/assets';
import { isActiveAccountSmartWalletSelector } from 'selectors/smartWallet';

// models, types
import type { ExchangeSearchRequest, Allowance, Offer } from 'models/Offer';
import type { Asset, Assets, Balances, Rates } from 'models/Asset';
import type { SmartWalletStatus } from 'models/SmartWalletStatus';
import type { Accounts } from 'models/Account';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Theme } from 'models/Theme';
import type { Option } from 'models/Selector';


// partials
import ExchangeIntroModal from './ExchangeIntroModal';
import ExchangeOffers from './ExchangeOffers';
import {
  getFormattedSellMax,
  getBalanceInFiat,
  getAssetBalanceFromFiat,
  validateInput,
  getBestAmountToBuy,
  provideOptions,
  getHeaderRightItems,
  getErrorMessage,
  shouldTriggerSearch,
  shouldBlockView,
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
  getExchangeSupportedAssets: () => void,
  hasSeenExchangeIntro: boolean,
  updateHasSeenExchangeIntro: () => void,
  theme: Theme,
  isActiveAccountSmartWallet: boolean,
  offers: Offer[],
};

type State = {
  isSubmitted: boolean,
  showEmptyMessage: boolean,
  fromAmount: ?string,
  fromAmountInFiat: ?string,
  fromAsset: Asset,
  toAsset: Asset,
  includeTxFee: boolean,
  errorMessage: string,
  showSellOptions: boolean,
  showBuyOptions: boolean,
  displayFiatFromAmount: boolean,
  displayFiatToAmount: boolean,
};


const FormWrapper = styled.View`
  padding: ${({ bottomPadding }) => `${spacing.large}px 40px ${bottomPadding}px`};
  background-color: ${themedColors.surface};
`;

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
    const { fromAsset, toAsset } = this.getInitialAssets();

    this.state = {
      fromAmount: undefined,
      fromAmountInFiat: undefined,
      fromAsset,
      toAsset,
      includeTxFee: false,
      errorMessage: '',
      showSellOptions: false,
      showBuyOptions: false,
      displayFiatFromAmount: false,
      displayFiatToAmount: false,
      isSubmitted: false,
      showEmptyMessage: false,
    };
    this.triggerSearch = debounce(this.triggerSearch, 500);
  }

  componentDidMount() {
    const { navigation, getExchangeSupportedAssets } = this.props;
    this._isMounted = true;
    getExchangeSupportedAssets();

    this.listeners = [
      navigation.addListener('didFocus', this.focusInputWithKeyboard),
      navigation.addListener('didBlur', this.blurFromInput),
    ];
  }

  componentWillUnmount() {
    this.listeners.forEach(listener => listener.remove());
    this._isMounted = false;
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    const {
      assets,
      exchangeSupportedAssets,
      oAuthAccessToken,
    } = this.props;
    const {
      fromAsset, toAsset, fromAmount, errorMessage,
    } = this.state;
    const {
      fromAsset: prevFromAsset, toAsset: prevToAsset, fromAmount: prevFromAmount, errorMessage: prevErrorMessage,
    } = prevState;

    // update from and to options when (supported) assets changes or user selects an option
    if (assets !== prevProps.assets || exchangeSupportedAssets !== prevProps.exchangeSupportedAssets
      || fromAsset !== prevFromAsset || toAsset !== prevToAsset) {
      this.options = this.provideOptions();
    }

    if (!prevProps.hasSeenExchangeIntro && this.props.hasSeenExchangeIntro) {
      setTimeout(this.focusInputWithKeyboard, 300);
    }

    if (
      // access token has changed, init search again
      (prevProps.oAuthAccessToken !== oAuthAccessToken) ||
      // valid input provided
      ((
        fromAsset !== prevFromAsset ||
        toAsset !== prevToAsset ||
        fromAmount !== prevFromAmount ||
        (prevErrorMessage && !errorMessage)) &&
      validateInput(fromAmount, fromAsset, toAsset, errorMessage))
    ) {
      this.resetSearch();
      this.triggerSearch();
    }
  }

  getInitialAssets = (): { fromAsset: Asset, toAsset: Asset } => {
    const { navigation, exchangeSearchRequest } = this.props;
    const fromAssetCode = navigation.getParam('fromAssetCode') || exchangeSearchRequest?.fromAssetCode || ETH;
    const toAssetCode = navigation.getParam('toAssetCode') || exchangeSearchRequest?.toAssetCode || PLR;
    return {
      fromAsset: this.options.fromOptions.find(a => a.value === fromAssetCode),
      toAsset: this.options.toOptions.find(a => a.value === toAssetCode),
    };
  }

  handleBuySellSwap = () => {
    const { fromAsset, toAsset } = this.state;
    this.setState({
      toAsset: fromAsset,
      fromAsset: toAsset,
      fromAmount: null,
    });
  };

  setErrorMessage = (errorMessage: string) => this.setState({ errorMessage });

  handleFromInputChange = (input: string) => {
    const { fromAsset, displayFiatFromAmount } = this.state;
    const { baseFiatCurrency, rates } = this.props;
    const { symbol } = fromAsset;
    const val = input.replace(/,/g, '.');
    this.setState(displayFiatFromAmount
      ? {
        fromAmountInFiat: val,
        fromAmount: getAssetBalanceFromFiat(baseFiatCurrency, val, rates, symbol),
      }
      : {
        fromAmount: val,
        fromAmountInFiat: getBalanceInFiat(baseFiatCurrency, val, rates, symbol),
      },
    );
    this.setErrorMessage(getErrorMessage(val, fromAsset));
  };

  getFromInput = () => {
    const { baseFiatCurrency } = this.props;
    const {
      errorMessage, fromAsset, fromAmount, fromAmountInFiat, displayFiatFromAmount,
    } = this.state;
    const { assetBalance, symbol } = fromAsset;
    const value = displayFiatFromAmount ? fromAmountInFiat : fromAmount;

    return (
      <ExchangeTextInput
        getInputRef={ref => { this.fromInputRef = ref; }}
        onChange={this.handleFromInputChange}
        value={value}
        onBlur={this.blurFromInput}
        errorMessage={errorMessage}
        asset={fromAsset}
        onAssetPress={() => this.setState({ showSellOptions: true })}
        labelText={assetBalance && getFormattedSellMax(fromAsset)}
        onLabelPress={assetBalance && this.handleSellMax}
        leftSideText={displayFiatFromAmount
          ? `${formatAmount(fromAmount || '0', 2)} ${fromAsset.symbol}`
          : formatFiat(fromAmountInFiat, baseFiatCurrency).replace(/ /g, '')
        }
        leftSideSymbol="-"
        onLeftSideTextPress={() => this.setState({ displayFiatFromAmount: !displayFiatFromAmount })}
        rightPlaceholder={displayFiatFromAmount ? baseFiatCurrency || defaultFiatCurrency : symbol}
      />
    );
  };

  getToInput = () => {
    const { baseFiatCurrency, offers, rates } = this.props;
    const {
      displayFiatToAmount, toAsset, fromAmount,
    } = this.state;

    let value;
    let toAmount;
    let toAmountInFiat;
    if (offers?.length && fromAmount) {
      toAmount = getBestAmountToBuy(offers, fromAmount);
      toAmountInFiat = formatAmount(getBalanceInFiat(baseFiatCurrency, toAmount, rates, toAsset.symbol), 2);
      value = displayFiatToAmount ? toAmountInFiat : formatAmount(toAmount, 6);
    }

    return (
      <ExchangeTextInput
        disabled
        value={value}
        onBlur={this.blurFromInput}
        asset={toAsset}
        onAssetPress={() => this.setState({ showBuyOptions: true })}
        leftSideText={displayFiatToAmount
          ? `${formatAmount(toAmount || '0', 2)} ${toAsset.symbol}`
          : formatFiat(toAmountInFiat || '0', baseFiatCurrency).replace(/ /g, '')
        }
        leftSideSymbol="+"
        onLeftSideTextPress={() => this.setState({ displayFiatToAmount: !displayFiatToAmount })}
        rightPlaceholder={displayFiatToAmount ? baseFiatCurrency || defaultFiatCurrency : toAsset.symbol}
      />
    );
  }

  blurFromInput = () => {
    if (this.fromInputRef) this.fromInputRef.blur();
  };

  focusInputWithKeyboard = () => {
    const { hasSeenExchangeIntro } = this.props;
    setTimeout(() => {
      if (!this.fromInputRef || !this._isMounted || !hasSeenExchangeIntro) return;
      this.fromInputRef.focus();
    }, 200);
  };

  handleSellMax = () => {
    const { fromAsset } = this.state;
    this.setState({
      fromAmount: fromAsset.assetBalance,
      fromAmountInFiat: fromAsset.formattedBalanceInFiat.substr(2), // TODO change
    });
  };

  resetSearch = () => {
    this.props.resetOffers();
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
    const {
      assets, exchangeSupportedAssets, balances, rates, baseFiatCurrency,
    } = this.props;
    return provideOptions(assets, exchangeSupportedAssets, balances, rates, baseFiatCurrency);
  };

  triggerSearch = () => {
    const {
      searchOffers,
    } = this.props;
    const { fromAmount, fromAsset, toAsset } = this.state;
    const { symbol: from } = fromAsset;
    const { symbol: to } = toAsset;
    const amount = parseFloat(fromAmount);
    if (!from || !to || !amount || !shouldTriggerSearch(fromAsset, toAsset, amount)) return;
    this.setState({ isSubmitted: true });
    searchOffers(from, to, amount);

    this.emptyMessageTimeout = setTimeout(() => this.setState({ showEmptyMessage: true }), 5000);
  };

  handleSelectorOptionSelect = (option: Option) => {
    const { showSellOptions, fromAmount } = this.state;
    const optionsStateChanges = { showSellOptions: false, showBuyOptions: false };
    this.setState(showSellOptions
      ? { fromAsset: option, ...optionsStateChanges }
      : { toAsset: option, ...optionsStateChanges },
    () => this.setErrorMessage(getErrorMessage(fromAmount, this.state.fromAsset)),
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
      fromAmount,
      isSubmitted,
      showEmptyMessage,
      showSellOptions,
      showBuyOptions,
    } = this.state;

    const { fromOptions, toOptions, horizontalOptions } = this.options;

    const rightItems = getHeaderRightItems(
      exchangeAllowances, hasUnreadExchangeNotification, navigation, markNotificationAsSeen,
    );

    const deploymentData = getDeploymentData(smartWalletState);
    const blockView = shouldBlockView(smartWalletState, accounts);

    const disableNonFiatExchange = !this.checkIfAssetsExchangeIsAllowed();

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
            <FormWrapper bottomPadding={isSubmitted ? 6 : 30}>
              {this.getFromInput()}
              {this.getToInput()}
            </FormWrapper>
            {!!disableNonFiatExchange &&
            <SWActivationCard
              message="To start exchanging assets you need to activate your Smart Wallet"
              buttonTitle="Activate Smart Wallet"
            />
          }
            {!!isSubmitted &&
            <ExchangeOffers
              fromAmount={fromAmount}
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
      offers,
    },
    exchangeSupportedAssets,
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
  hasSeenExchangeIntro,
  offers,
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
