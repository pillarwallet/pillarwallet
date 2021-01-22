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
import isEmpty from 'lodash.isempty';
import styled, { withTheme } from 'styled-components/native';
import { connect } from 'react-redux';
import debounce from 'lodash.debounce';
import { createStructuredSelector } from 'reselect';
import t from 'translations/translate';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import SWActivationCard from 'components/SWActivationCard';
import ValueInput from 'components/ValueInput';
import Modal from 'components/Modal';
import RetryGraphQueryBox from 'components/RetryGraphQueryBox';

// actions
import {
  searchOffersAction,
  resetOffersAction,
  markNotificationAsSeenAction,
  getExchangeSupportedAssetsAction,
  getWbtcFeesAction,
} from 'actions/exchangeActions';
import { hasSeenExchangeIntroAction } from 'actions/appSettingsActions';
import { fetchBitcoinRateAction } from 'actions/ratesActions';

// constants
import { ETH, PLR, WBTC, BTC } from 'constants/assetsConstants';
import { SMART_WALLET_UPGRADE_STATUSES } from 'constants/smartWalletConstants';
import { MIN_WBTC_CAFE_AMOUNT } from 'constants/exchangeConstants';

// utils, services
import { getSmartWalletStatus, getDeploymentData } from 'utils/smartWallet';
import { isWbtcCafe, type ExchangeOptions } from 'utils/exchange';
import { gatherWBTCFeeData, showWbtcErrorToast, isWbtcCafeActive } from 'services/wbtcCafe';

import { noop } from 'utils/common';

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
import type { WBTCFeesRaw, WBTCFeesWithRate } from 'models/WBTC';

// partials
import ExchangeIntroModal from './ExchangeIntroModal';
import ExchangeOffers from './ExchangeOffers';
import {
  shouldResetAndTriggerSearch,
  getBestAmountToBuy,
  provideOptions,
  getHeaderRightItems,
  shouldTriggerSearch,
  shouldBlockView,
  getToOption,
} from './utils';
import ExchangeSwapIcon from './ExchangeSwapIcon';
import WBTCCafeInfo from './WBTCCafeInfo';

type Props = {
  rates: Rates,
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: ?string,
  user: Object,
  assets: Assets,
  searchOffers: (string, string, string) => void,
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
  getExchangeSupportedAssets: (callback: () => void) => void,
  hasSeenExchangeIntro: boolean,
  updateHasSeenExchangeIntro: () => void,
  theme: Theme,
  isActiveAccountSmartWallet: boolean,
  offers: Offer[],
  wbtcFees: ?WBTCFeesRaw,
  getWbtcFees: () => void,
  isFetchingUniswapTokens: boolean,
  uniswapTokensGraphQueryFailed: boolean,
  getBtcRate: () => void,
};

type State = {
  isSubmitted: boolean,
  showEmptyMessage: boolean,
  fromAmount: string,
  fromAsset: Option,
  toAsset: Option,
  isFormValid: boolean,
  wbtcData: ?WBTCFeesWithRate,
};


const FormWrapper = styled.View`
  padding: 24px 40px 60px;
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
      fromAmount: '',
      fromAsset,
      toAsset,
      isSubmitted: false,
      showEmptyMessage: false,
      isFormValid: false,
      wbtcData: null,
    };
    this.triggerSearch = debounce(this.triggerSearch, 500);
  }

  componentDidMount() {
    const {
      navigation, getExchangeSupportedAssets, hasSeenExchangeIntro, getWbtcFees, getBtcRate,
    } = this.props;
    const { fromAsset, toAsset } = this.state;
    this._isMounted = true;
    getWbtcFees();
    getBtcRate();
    getExchangeSupportedAssets(() => {
      // handle edgecase for new/reimported wallets in case their assets haven't loaded yet
      if (!fromAsset || !toAsset) this.setState(this.getInitialAssets());
    });

    this.listeners = [
      navigation.addListener('didFocus', this.focusInputWithKeyboard),
      navigation.addListener('didBlur', this.blurFromInput),
    ];

    if (!hasSeenExchangeIntro) {
      this.openExchangeIntroModal();
    }
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
      getWbtcFees,
      getBtcRate,
    } = this.props;
    const {
      fromAsset, toAsset, fromAmount, isFormValid,
    } = this.state;
    const {
      fromAsset: prevFromAsset, toAsset: prevToAsset, fromAmount: prevFromAmount, isFormValid: prevIsFormValid,
    } = prevState;

    if (!prevIsFormValid && isFormValid) this.resetSearch();

    // update from and to options when (supported) assets changes or user selects an option
    if (assets !== prevProps.assets || exchangeSupportedAssets !== prevProps.exchangeSupportedAssets
      || fromAsset !== prevFromAsset || toAsset !== prevToAsset) {
      this.options = this.provideOptions();
      if (!isWbtcCafe(prevFromAsset?.symbol) && isWbtcCafe(fromAsset?.symbol)) {
        getWbtcFees();
        getBtcRate();
      }
    }

    if (!prevProps.hasSeenExchangeIntro && this.props.hasSeenExchangeIntro) {
      setTimeout(this.focusInputWithKeyboard, 300);
    }

    const { oAuthAccessToken: prevAccessToken } = prevProps;
    if (shouldResetAndTriggerSearch(
      fromAmount, prevFromAmount, fromAsset, prevFromAsset, toAsset, prevToAsset, oAuthAccessToken, prevAccessToken,
    )) {
      this.resetSearch();
      this.triggerSearch();
    }
  }

  getInitialAssets = (): { fromAsset: Option, toAsset: Option } => {
    const { navigation, exchangeSearchRequest } = this.props;
    const fromAssetCode = navigation.getParam('fromAssetCode') || exchangeSearchRequest?.fromAssetCode || ETH;
    const toAssetCode = navigation.getParam('toAssetCode') || exchangeSearchRequest?.toAssetCode || PLR;
    return {
      fromAsset: this.options.fromOptions.find(a => a.value === fromAssetCode) || {},
      toAsset: getToOption(toAssetCode, this.options),
    };
  }

  handleBuySellSwap = () => {
    const { fromAsset, toAsset } = this.state;
    this.setState({ toAsset: fromAsset, fromAsset: toAsset, fromAmount: '' }, () => {
      this.resetSearch();
      this.focusInputWithKeyboard();
    });
  };

  handleFromInputChange = async (input: string) => {
    const { fromAsset } = this.state;
    const { wbtcFees } = this.props;
    const { symbol = '' } = fromAsset;
    const val = input.replace(/,/g, '.');
    this.setState({ fromAmount: val });
    if (isWbtcCafe(fromAsset.symbol)) {
      const wbtcData = await gatherWBTCFeeData(Number(val), wbtcFees, symbol);
      if (wbtcData) this.setState({ wbtcData });
      if (!wbtcData || (wbtcData && !wbtcData.estimate && +input >= MIN_WBTC_CAFE_AMOUNT)) showWbtcErrorToast();
    }
  };

  getFromInput = () => {
    const { fromAsset, fromAmount, toAsset } = this.state;
    const { fromOptions, horizontalOptions } = this.options;

    return (
      <>
        <ValueInput
          assetData={fromAsset}
          onAssetDataChange={(assetData) => this.setState({
            fromAsset: assetData, toAsset: assetData.symbol === BTC ? getToOption(WBTC, this.options) : toAsset,
          })}
          value={fromAmount}
          onValueChange={this.handleFromInputChange}
          selectorOptionsTitle={t('label.sell')}
          customAssets={fromOptions}
          horizontalOptions={horizontalOptions}
          leftSideSymbol="minus" // eslint-disable-line i18next/no-literal-string
          getInputRef={ref => { this.fromInputRef = ref; }}
          onBlur={this.blurFromInput}
          onFormValid={valid => this.setState({ isFormValid: valid })}
          hideMaxSend={fromAsset.symbol === BTC}
        />
      </>
    );
  };

  getToInput = () => {
    const { offers } = this.props;
    const {
      toAsset, fromAmount, fromAsset, wbtcData,
    } = this.state;
    const { toOptions, horizontalOptions } = this.options;

    let toAmount;
    const isWbtc = isWbtcCafe(fromAsset.symbol);

    if (isWbtc && wbtcData) {
      toAmount = String(wbtcData.estimate);
    } else if (offers?.length && fromAmount) {
      toAmount = getBestAmountToBuy(offers, fromAmount);
    }

    return (
      <ValueInput
        disabled
        value={toAmount}
        assetData={toAsset}
        onAssetDataChange={(assetData) => this.setState({ toAsset: assetData })}
        selectorOptionsTitle={t('label.buy')}
        customAssets={toOptions}
        horizontalOptions={horizontalOptions}
        leftSideSymbol="plus" // eslint-disable-line i18next/no-literal-string
        onBlur={this.blurFromInput}
        hideMaxSend
        disableAssetChange={isWbtc}
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
    return provideOptions(assets, exchangeSupportedAssets, balances, rates, baseFiatCurrency, isWbtcCafeActive());
  };

  triggerSearch = () => {
    const { searchOffers } = this.props;
    const { fromAmount, fromAsset, toAsset } = this.state;
    const { symbol: from } = fromAsset;
    const { symbol: to } = toAsset;
    if (!from || !to || !fromAmount || !shouldTriggerSearch(fromAsset, toAsset, fromAmount)) return;
    this.setState({ isSubmitted: true });
    searchOffers(from, to, fromAmount);
    this.emptyMessageTimeout = setTimeout(() => this.setState({ showEmptyMessage: true }), 5000);
  };

  openExchangeIntroModal = () => {
    Modal.open(() => (
      <ExchangeIntroModal
        onButtonPress={this.props.updateHasSeenExchangeIntro}
      />
    ));
  };

  render() {
    const {
      navigation,
      exchangeAllowances,
      hasUnreadExchangeNotification,
      markNotificationAsSeen,
      accounts,
      smartWalletState,
      isFetchingUniswapTokens,
      uniswapTokensGraphQueryFailed,
      getExchangeSupportedAssets,
    } = this.props;

    const {
      fromAmount,
      isSubmitted,
      showEmptyMessage,
      isFormValid,
      fromAsset,
      toAsset,
      wbtcData,
    } = this.state;

    const displayWbtcCafe = isWbtcCafe(fromAsset?.symbol);
    const { fromOptions, toOptions } = this.options;
    const assetsLoaded = !!fromOptions.length && !!toOptions.length && !isEmpty(fromAsset) && !isEmpty(toAsset);
    const rightItems = getHeaderRightItems(
      exchangeAllowances, hasUnreadExchangeNotification, navigation, markNotificationAsSeen,
    );
    const deploymentData = getDeploymentData(smartWalletState);
    const blockView = shouldBlockView(smartWalletState, accounts);
    const disableNonFiatExchange = !this.checkIfAssetsExchangeIsAllowed();

    return (
      <ContainerWithHeader
        headerProps={{
        rightItems,
        centerItems: [{ title: t('title.exchange') }],
      }}
        inset={{ bottom: 'never' }}
      >
        {(blockView || !!deploymentData.error) && <SWActivationCard />}
        {!blockView &&
        <ScrollView
          onScroll={() => Keyboard.dismiss()}
          keyboardShouldPersistTaps="handled"
          disableOnAndroid
          contentContainerStyle={{ flex: 1 }}
        >
          {assetsLoaded &&
          <FormWrapper>
            {this.getFromInput()}
            <ExchangeSwapIcon onPress={this.handleBuySellSwap} disabled={displayWbtcCafe} />
            {this.getToInput()}
          </FormWrapper>}
          {!!disableNonFiatExchange &&
            <SWActivationCard
              message={t('smartWalletContent.exchangeActivation.message')}
              buttonTitle={t('smartWalletContent.exchangeActivation.button')}
            />
          }
          {displayWbtcCafe && <WBTCCafeInfo wbtcData={wbtcData} amount={fromAmount} navigation={navigation} />}
          {!!isSubmitted && isFormValid &&
          <ExchangeOffers
            fromAmount={fromAmount}
            disableNonFiatExchange={disableNonFiatExchange}
            isExchangeActive={isSubmitted}
            showEmptyMessage={showEmptyMessage}
            setFromAmount={val => this.setState({ fromAmount: val })}
            navigation={navigation}
          />}
        </ScrollView>}
        <RetryGraphQueryBox
          message={t('error.theGraphQueryFailed.uniswapSupportedTokenList')}
          hasFailed={uniswapTokensGraphQueryFailed}
          isFetching={isFetchingUniswapTokens}
          onRetry={() => getExchangeSupportedAssets(noop)}
        />
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
      hasNotification: hasUnreadExchangeNotification,
      offers,
    },
    wbtcFees,
    exchangeSupportedAssets,
    isFetchingUniswapTokens,
    uniswapTokensGraphQueryFailed,
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
  wbtcFees,
  isFetchingUniswapTokens,
  uniswapTokensGraphQueryFailed,
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
  getExchangeSupportedAssets: (callback) => dispatch(getExchangeSupportedAssetsAction(callback)),
  updateHasSeenExchangeIntro: () => dispatch(hasSeenExchangeIntroAction()),
  getWbtcFees: () => dispatch(getWbtcFeesAction()),
  getBtcRate: () => dispatch(fetchBitcoinRateAction()),
});

export default withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(ExchangeScreen));
