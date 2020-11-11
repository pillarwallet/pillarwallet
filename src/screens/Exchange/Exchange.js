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
} from 'actions/exchangeActions';
import { hasSeenExchangeIntroAction } from 'actions/appSettingsActions';

// constants
import { ETH, PLR } from 'constants/assetsConstants';
import { SMART_WALLET_UPGRADE_STATUSES } from 'constants/smartWalletConstants';

// utils, services
import { getSmartWalletStatus, getDeploymentData } from 'utils/smartWallet';
import { themedColors } from 'utils/themes';
import { formatAmount, noop } from 'utils/common';
import type { ExchangeOptions } from 'utils/exchange';

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
  validateInput,
  getBestAmountToBuy,
  provideOptions,
  getHeaderRightItems,
  shouldTriggerSearch,
  shouldBlockView,
} from './utils';
import ExchangeSwapIcon from './ExchangeSwapIcon';


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
  getExchangeSupportedAssets: (callback: () => void) => void,
  hasSeenExchangeIntro: boolean,
  updateHasSeenExchangeIntro: () => void,
  theme: Theme,
  isActiveAccountSmartWallet: boolean,
  offers: Offer[],
  isFetchingUniswapTokens: boolean,
  uniswapTokensGraphQueryFailed: boolean,
};

type State = {
  isSubmitted: boolean,
  showEmptyMessage: boolean,
  fromAmount: string,
  fromAsset: Option,
  toAsset: Option,
  isFormValid: boolean,
};


const FormWrapper = styled.View`
  padding: 24px 40px 60px;
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
      fromAmount: '',
      fromAsset,
      toAsset,
      isSubmitted: false,
      showEmptyMessage: false,
      isFormValid: false,
    };
    this.triggerSearch = debounce(this.triggerSearch, 500);
  }

  componentDidMount() {
    const {
      navigation,
      getExchangeSupportedAssets,
      hasSeenExchangeIntro,
    } = this.props;
    const { fromAsset, toAsset } = this.state;
    this._isMounted = true;
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
    } = this.props;
    const {
      fromAsset, toAsset, fromAmount, isFormValid,
    } = this.state;
    const {
      fromAsset: prevFromAsset, toAsset: prevToAsset, fromAmount: prevFromAmount,
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
      // valid input provided or asset changed
      ((
        fromAsset !== prevFromAsset ||
        toAsset !== prevToAsset ||
        fromAmount !== prevFromAmount) &&
        isFormValid &&
        validateInput(fromAmount, fromAsset, toAsset))
    ) {
      this.resetSearch();
      this.triggerSearch();
    }
  }

  getInitialAssets = (): Object => {
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
      fromAmount: '',
    }, () => {
      this.resetSearch();
      this.focusInputWithKeyboard();
    });
  };

  getFromInput = () => {
    const {
      fromAsset, fromAmount,
    } = this.state;
    const { fromOptions, horizontalOptions } = this.options;

    return (
      <ValueInput
        assetData={fromAsset}
        onAssetDataChange={(assetData) => this.setState({ fromAsset: assetData })}
        value={fromAmount}
        onValueChange={amount => this.setState({ fromAmount: amount })}
        selectorOptionsTitle={t('label.sell')}
        customAssets={fromOptions}
        horizontalOptions={horizontalOptions}
        leftSideSymbol="minus" // eslint-disable-line i18next/no-literal-string
        getInputRef={ref => { this.fromInputRef = ref; }}
        onBlur={this.blurFromInput}
        onFormValid={valid => this.setState({ isFormValid: valid })}
      />
    );
  };

  getToInput = () => {
    const { offers } = this.props;
    const {
      toAsset, fromAmount,
    } = this.state;
    const { toOptions, horizontalOptions } = this.options;

    let toAmount = '0';
    if (offers?.length && fromAmount) {
      toAmount = formatAmount(getBestAmountToBuy(offers, fromAmount) || '0');
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

  openExchangeIntroModal = () => {
    Modal.open(() => (
      <ExchangeIntroModal
        onButtonPress={this.props.updateHasSeenExchangeIntro}
      />
    ));
  }

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
    } = this.state;

    const { fromOptions, toOptions } = this.options;
    const assetsLoaded = !!fromOptions.length && !!toOptions.length;
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
        >
          {assetsLoaded &&
          <FormWrapper>
            {this.getFromInput()}
            <ExchangeSwapIcon onPress={this.handleBuySellSwap} />
            {this.getToInput()}
          </FormWrapper>}
          {!!disableNonFiatExchange &&
          <SWActivationCard
            message={t('smartWalletContent.exchangeActivation.message')}
            buttonTitle={t('smartWalletContent.exchangeActivation.button')}
          />
        }
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
});

export default withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(ExchangeScreen));
