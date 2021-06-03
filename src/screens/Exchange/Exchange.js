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
import { TextInput as RNTextInput, ScrollView, Keyboard, InteractionManager } from 'react-native';
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
} from 'actions/exchangeActions';
import { hasSeenExchangeIntroAction } from 'actions/appSettingsActions';

// constants
import { ETH, PLR } from 'constants/assetsConstants';
import { ARCHANOVA_WALLET_UPGRADE_STATUSES } from 'constants/archanovaConstants';

// utils, services
import { getArchanovaWalletStatus, getDeploymentData } from 'utils/archanova';
import { isArchanovaAccount } from 'utils/accounts';

import { noop } from 'utils/common';

// selectors
import { accountEthereumWalletAssetsBalancesSelector } from 'selectors/balances';
import { accountAssetsSelector } from 'selectors/assets';
import { activeAccountExchangeAllowancesSelector, activeAccountSelector } from 'selectors';

// models, types
import type { ExchangeSearchRequest, Allowance, Offer } from 'models/Offer';
import type { Asset, Assets, AssetOption, Rates } from 'models/Asset';
import type { ArchanovaWalletStatus } from 'models/ArchanovaWalletStatus';
import type { Account } from 'models/Account';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Theme } from 'models/Theme';
import type { ExchangeOptions } from 'utils/exchange';
import type { WalletAssetsBalances } from 'models/Balances';

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


type Props = {
  rates: Rates,
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: ?string,
  user: Object,
  assets: Assets,
  searchOffers: (string, string, string) => void,
  balances: WalletAssetsBalances,
  resetOffers: () => void,
  exchangeSearchRequest: ExchangeSearchRequest,
  exchangeAllowances: Allowance[],
  hasUnreadExchangeNotification: boolean,
  markNotificationAsSeen: () => void,
  accounts: Account[],
  smartWalletState: Object,
  exchangeSupportedAssets: Asset[],
  getExchangeSupportedAssets: (callback: () => void) => void,
  hasSeenExchangeIntro: boolean,
  updateHasSeenExchangeIntro: () => void,
  theme: Theme,
  offers: Offer[],
  isFetchingUniswapTokens: boolean,
  uniswapTokensGraphQueryFailed: boolean,
  activeAccount: ?Account
};

type State = {
  isSubmitted: boolean,
  showEmptyMessage: boolean,
  fromAmount: string,
  fromAsset: AssetOption,
  toAsset: AssetOption,
  isFormValid: boolean,
};

const FormWrapper = styled.View`
  padding: 24px 40px 60px;
`;

class ExchangeScreen extends React.Component<Props, State> {
  fromInputRef: React.ElementRef<typeof RNTextInput>;
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
    InteractionManager.runAfterInteractions(() => {
      const {
        getExchangeSupportedAssets,
        hasSeenExchangeIntro,
      } = this.props;
      const { fromAsset, toAsset } = this.state;
      getExchangeSupportedAssets(() => {
        // handle edgecase for new/reimported wallets in case their assets haven't loaded yet
        if (!fromAsset || !toAsset) this.setState(this.getInitialAssets());
      });

      if (!hasSeenExchangeIntro) {
        this.openExchangeIntroModal();
      }
    });

    const { navigation } = this.props;
    this.listeners = [
      navigation.addListener('didFocus', this.focusInputWithKeyboard),
      navigation.addListener('didBlur', this.blurFromInput),
    ];

    this._isMounted = true;
  }

  componentWillUnmount() {
    this.listeners.forEach(listener => listener.remove());
    this._isMounted = false;
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    const {
      assets,
      exchangeSupportedAssets,
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
    }

    if (!prevProps.hasSeenExchangeIntro && this.props.hasSeenExchangeIntro) {
      setTimeout(this.focusInputWithKeyboard, 300);
    }

    if (shouldResetAndTriggerSearch(
      fromAmount, prevFromAmount, fromAsset, prevFromAsset, toAsset, prevToAsset,
    )) {
      this.resetSearch();
      this.triggerSearch();
    }
  }

  getInitialAssets = (): { fromAsset: AssetOption, toAsset: AssetOption } => {
    const { navigation, exchangeSearchRequest } = this.props;
    const fromAssetCode = navigation.getParam('fromAssetCode') || exchangeSearchRequest?.fromAssetCode || ETH;
    const toAssetCode = navigation.getParam('toAssetCode') || exchangeSearchRequest?.toAssetCode || PLR;
    return {
      fromAsset: this.options.fromOptions.find(a => a.symbol === fromAssetCode) || {},
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
    const val = input.replace(/,/g, '.');
    this.setState({ fromAmount: val });
  };

  getFromInput = () => {
    const { fromAsset, fromAmount, toAsset } = this.state;
    const { fromOptions } = this.options;

    return (
      <>
        <ValueInput
          assetData={fromAsset}
          onAssetDataChange={(assetData) => this.setState({
            fromAsset: assetData, toAsset,
          })}
          onCollectibleAssetDataChange={(collectible) => this.setState({ fromAsset: collectible })}
          value={fromAmount}
          onValueChange={this.handleFromInputChange}
          selectorOptionsTitle={t('label.sell')}
          customAssets={fromOptions}
          leftSideSymbol="minus" // eslint-disable-line i18next/no-literal-string
          getInputRef={ref => { this.fromInputRef = ref; }}
          onBlur={this.blurFromInput}
          onFormValid={valid => this.setState({ isFormValid: valid })}
        />
      </>
    );
  };

  getToInput = () => {
    const { offers } = this.props;
    const { toAsset, fromAmount } = this.state;
    const { toOptions } = this.options;

    const toAmount = getBestAmountToBuy(offers, fromAmount);

    return (
      <ValueInput
        disabled
        value={toAmount}
        assetData={toAsset}
        onAssetDataChange={(assetData) => this.setState({ toAsset: assetData })}
        selectorOptionsTitle={t('label.buy')}
        customAssets={toOptions}
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
    }, 650);
  };

  resetSearch = () => {
    this.props.resetOffers();
    this.setState({ isSubmitted: false, showEmptyMessage: false });
    if (this.emptyMessageTimeout) {
      clearTimeout(this.emptyMessageTimeout);
    }
    this.emptyMessageTimeout = null;
  };

  isAssetsExchangeAllowed = (): boolean => {
    const { accounts, smartWalletState, activeAccount } = this.props;
    if (!isArchanovaAccount(activeAccount)) return true;

    const archanovaWalletStatus: ArchanovaWalletStatus = getArchanovaWalletStatus(accounts, smartWalletState);
    return archanovaWalletStatus.status === ARCHANOVA_WALLET_UPGRADE_STATUSES.DEPLOYMENT_COMPLETE;
  };

  provideOptions = (): ExchangeOptions => {
    const {
      assets, exchangeSupportedAssets, balances, rates, baseFiatCurrency,
    } = this.props;
    return provideOptions(assets, exchangeSupportedAssets, balances, rates, baseFiatCurrency);
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
      activeAccount,
    } = this.props;

    const {
      fromAmount,
      isSubmitted,
      showEmptyMessage,
      isFormValid,
      fromAsset,
      toAsset,
    } = this.state;

    const { fromOptions, toOptions } = this.options;
    const assetsLoaded = !!fromOptions.length && !!toOptions.length && !isEmpty(fromAsset) && !isEmpty(toAsset);
    const rightItems = getHeaderRightItems(
      exchangeAllowances, hasUnreadExchangeNotification, navigation, markNotificationAsSeen,
    );
    const deploymentData = getDeploymentData(smartWalletState);
    const blockView = isArchanovaAccount(activeAccount) && shouldBlockView(smartWalletState, accounts);
    const disableNonFiatExchange = !this.isAssetsExchangeAllowed();

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
        // $FlowFixMe: react-native types
        <ScrollView
          onScroll={() => Keyboard.dismiss()}
          keyboardShouldPersistTaps="handled"
          disableOnAndroid
          contentContainerStyle={{ flex: 1 }}
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
  appSettings: { data: { baseFiatCurrency, hasSeenExchangeIntro } },
  exchange: {
    data: {
      searchRequest: exchangeSearchRequest,
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
  hasUnreadExchangeNotification,
  accounts,
  smartWalletState,
  exchangeSupportedAssets,
  hasSeenExchangeIntro,
  offers,
  isFetchingUniswapTokens,
  uniswapTokensGraphQueryFailed,
});

const structuredSelector = createStructuredSelector({
  balances: accountEthereumWalletAssetsBalancesSelector,
  assets: accountAssetsSelector,
  activeAccount: activeAccountSelector,
  exchangeAllowances: activeAccountExchangeAllowancesSelector,
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
