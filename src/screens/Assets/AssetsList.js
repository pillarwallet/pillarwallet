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
import { connect } from 'react-redux';
import { Alert, FlatList, Platform, View } from 'react-native';
import isEqualWith from 'lodash.isequalwith';
import isEqual from 'lodash.isequal';
import type { NavigationEventSubscription, NavigationScreenProp } from 'react-navigation';
import { SDK_PROVIDER } from 'react-native-dotenv';
import { createStructuredSelector } from 'reselect';
import { withNavigation } from 'react-navigation';
import styled from 'styled-components/native';
import Swipeout from 'react-native-swipeout';

// components
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import { MediumText } from 'components/Typography';
import Toast from 'components/Toast';
import CheckAuth from 'components/CheckAuth';

// constants
import { defaultFiatCurrency, TOKENS, ETH, PLR } from 'constants/assetsConstants';
import { ASSET, ASSETS } from 'constants/navigationConstants';
import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';
// actions
import { hideAssetAction } from 'actions/userSettingsActions';
import { setActiveBlockchainNetworkAction } from 'actions/blockchainNetworkActions';
import { initializeBitcoinWalletAction } from 'actions/bitcoinActions';
import { resetIncorrectPasswordAction } from 'actions/authActions';
// utils
import { getAccountAddress } from 'utils/accounts';
import { getBalance, getRate } from 'utils/assets';
import { formatMoney, formatFiat, formatAmount } from 'utils/common';
import { fontStyles, spacing } from 'utils/variables';
import { themedColors } from 'utils/themes';

// configs
import assetsConfig from 'configs/assetsConfig';

// types
import type { Asset, Assets, Balances } from 'models/Asset';
import type { Account } from 'models/Account';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { EthereumWallet } from 'models/Wallet';
import type { BitcoinAddress, BitcoinBalance } from 'models/Bitcoin';

// selectors
import { accountBalancesSelector } from 'selectors/balances';
import { activeAccountSelector } from 'selectors';
import { paymentNetworkAccountBalancesSelector } from 'selectors/paymentNetwork';
import { accountAssetsSelector } from 'selectors/assets';
import HideAssetButton from './HideAssetButton';

const IS_IOS = Platform.OS === 'ios';

type Props = {
  onHideTokenFromWallet: Function,
  horizontalPadding: Function,
  assets: Assets,
  balances: Balances,
  balance: number,
  rates: Object,
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: ?string,
  assetsLayout: string,
  activeAccount: ?Account,
  paymentNetworkBalances: Balances,
  hideAsset: Function,
  scrollViewRef?: Object,
  setActiveBlockchainNetwork: (id: string) => void,
  initializeBitcoinWallet: (wallet: EthereumWallet) => void;
  bitcoinAddresses: BitcoinAddress[],
  bitcoinBalances: BitcoinBalance,
  resetIncorrectPassword: () => void,
}

type State = {
  forceHideRemoval: boolean,
  showPinModal: boolean,
  onPinValidAction: ?(_: string, wallet: EthereumWallet) => Promise<void>,
}

const ListHeaderWrapper = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: ${spacing.medium}px ${spacing.large}px 0;
  margin-bottom: 6px;
`;

const HeaderTitle = styled(MediumText)`
  ${fontStyles.regular};
  color: ${themedColors.accent};
`;

class AssetsList extends React.Component<Props, State> {
  didBlur: NavigationEventSubscription;
  willFocus: NavigationEventSubscription;

  state = {
    forceHideRemoval: false,
    showPinModal: false,
    onPinValidAction: null,
  };

  componentDidMount() {
    const { navigation } = this.props;
    this.willFocus = navigation.addListener(
      'willFocus',
      () => { this.setState({ forceHideRemoval: false }); },
    );

    this.didBlur = navigation.addListener(
      'didBlur',
      () => { this.setState({ forceHideRemoval: true }); },
    );
  }

  componentWillUnmount() {
    this.didBlur.remove();
    this.willFocus.remove();
  }


  shouldComponentUpdate(nextProps: Props, nextState: State) {
    const isEq = isEqualWith(this.props, nextProps, (val1, val2) => {
      if (typeof val1 === 'function' && typeof val2 === 'function') return true;
      return undefined;
    }) && isEqual(this.state, nextState);
    return !isEq;
  }

  renderHeader = () => {
    const { balance, baseFiatCurrency } = this.props;
    const walletBalance = formatFiat(balance || 0, baseFiatCurrency);

    return (
      <ListHeaderWrapper>
        <HeaderTitle>{`Wallet balance ${walletBalance}`}</HeaderTitle>
      </ListHeaderWrapper>
    );
  };

  hideAsset = (asset) => {
    const { hideAsset } = this.props;
    Alert.alert(
      'Are you sure?',
      `This will hide ${asset.name} from your wallet`,
      [
        { text: 'Cancel', onPress: () => this.setState({ forceHideRemoval: true }), style: 'cancel' },
        { text: 'Hide', onPress: () => hideAsset(asset) },
      ],
    );
  };

  showNotRemovedToast = (asset) => {
    Toast.show({
      message: `${asset.name} is essential for Pillar Wallet`,
      type: 'info',
      title: 'This asset cannot be switched off',
    });
    this.setState({ forceHideRemoval: true });
  };

  handleCheckPinModalClose = () => {
    const { resetIncorrectPassword } = this.props;
    resetIncorrectPassword();
    this.setState({
      showPinModal: false,
    });
  };

  onBackPress = () => {
    const { setActiveBlockchainNetwork, navigation } = this.props;
    setActiveBlockchainNetwork(BLOCKCHAIN_NETWORK_TYPES.ETHEREUM);
    navigation.navigate(ASSETS);
  }

  initialiseBTC = (assetData: Object) => {
    return async (_: string, wallet: EthereumWallet) => {
      const { navigation, setActiveBlockchainNetwork, initializeBitcoinWallet } = this.props;
      this.setState({ showPinModal: false });
      await initializeBitcoinWallet(wallet);
      setActiveBlockchainNetwork(BLOCKCHAIN_NETWORK_TYPES.BITCOIN);
      navigation.navigate(ASSET, { assetData, onBackPress: this.onBackPress });
    };
  }

  navigateToBTCAsset = (assetData: Object) => {
    const { navigation, setActiveBlockchainNetwork, bitcoinAddresses } = this.props;
    const isInitialised = bitcoinAddresses.length > 0;
    if (isInitialised) {
      setActiveBlockchainNetwork(BLOCKCHAIN_NETWORK_TYPES.BITCOIN);
      navigation.navigate(ASSET, { assetData, onBackPress: this.onBackPress });
      return;
    }
    this.setState({ showPinModal: true, onPinValidAction: this.initialiseBTC(assetData) });
  };

  renderToken = ({ item: asset }) => {
    const { forceHideRemoval, onPinValidAction, showPinModal } = this.state;
    const {
      activeAccount,
      baseFiatCurrency,
      navigation,
      scrollViewRef,
    } = this.props;

    const {
      name,
      symbol,
      balanceInFiat,
      balance,
      iconMonoUrl,
      wallpaperUrl,
      decimals,
      iconUrl,
      patternUrl,
      paymentNetworkBalance,
      paymentNetworkBalanceInFiat,
    } = asset;

    const fullIconMonoUrl = iconMonoUrl ? `${SDK_PROVIDER}/${iconMonoUrl}?size=2` : '';
    const fullIconWallpaperUrl = `${SDK_PROVIDER}/${wallpaperUrl}${IS_IOS ? '?size=3' : ''}`;
    const fullIconUrl = iconUrl ? `${SDK_PROVIDER}/${iconUrl}?size=3` : '';
    const patternIcon = patternUrl ? `${SDK_PROVIDER}/${patternUrl}?size=3` : fullIconUrl;
    const formattedBalanceInFiat = formatFiat(balanceInFiat, baseFiatCurrency);
    const displayAmount = formatMoney(balance, 4);

    const {
      listed: isListed = true,
      disclaimer,
    } = assetsConfig[symbol] || {};

    const disableRemove = symbol === ETH || symbol === PLR;

    const props = {
      id: symbol,
      name: name || symbol,
      token: symbol,
      amount: displayAmount,
      balance,
      balanceInFiat: formattedBalanceInFiat,
      address: activeAccount && getAccountAddress(activeAccount),
      contractAddress: asset.address,
      icon: fullIconMonoUrl,
      wallpaper: fullIconWallpaperUrl,
      iconColor: fullIconUrl,
      isListed,
      disclaimer,
      paymentNetworkBalance,
      paymentNetworkBalanceFormatted: formatMoney(paymentNetworkBalance, 4),
      paymentNetworkBalanceInFiat: formatFiat(paymentNetworkBalanceInFiat, baseFiatCurrency),
      patternIcon,
      description: asset.description,
      decimals,
    };
    return (
      <Swipeout
        right={[{
          component: (
            <HideAssetButton
              onPress={() => disableRemove ? this.showNotRemovedToast(asset) : this.hideAsset(asset)}
              disabled={disableRemove}
            />
            ),
        }]}
        backgroundColor="transparent"
        sensitivity={10}
        close={forceHideRemoval}
        buttonWidth={80}
        onOpen={() => this.setState({ forceHideRemoval: false })}
        scroll={(shouldAllowScroll) => {
          if (scrollViewRef) scrollViewRef.setNativeProps({ scrollEnabled: shouldAllowScroll });
        }}
      >
        {symbol !== 'BTC' &&
          <ListItemWithImage
            onPress={() => {
              navigation.navigate(ASSET,
                {
                  assetData: {
                    ...props,
                    tokenType: TOKENS,
                  },
                },
              );
            }}
            address={props.address}
            label={name}
            avatarUrl={fullIconUrl}
            balance={{
              balance: formatAmount(balance),
              value: formattedBalanceInFiat,
              token: symbol,
            }}
            fallbackToGenericToken
          />
        }
        {symbol === 'BTC' &&
          <>
            <ListItemWithImage
              actionLabel="BTC Wallet"
              onPress={() => {
              this.navigateToBTCAsset({ ...props, tokenType: TOKENS });
            }}
              address={props.address}
              label={name}
              avatarUrl={fullIconUrl}
              fallbackToGenericToken
            />
            <CheckAuth
              onPinValid={onPinValidAction}
              revealMnemonic
              hideLoader
              modalProps={{
                isVisible: showPinModal,
                onModalHide: this.handleCheckPinModalClose,
              }}
            />
          </>
        }
      </Swipeout>
    );
  };

  renderSeparator = () => {
    return (
      <View
        style={{
          marginTop: -8,
          height: 0,
          width: '100%',
          backgroundColor: 'transparent',
        }}
      />
    );
  };

  render() {
    const {
      assets,
      baseFiatCurrency,
      rates,
      balances,
      paymentNetworkBalances,
    } = this.props;
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;

    const sortedAssets = Object.keys(assets)
      .map(id => assets[id])
      .map(({ symbol, ...rest }) => ({
        symbol,
        balance: getBalance(balances, symbol),
        paymentNetworkBalance: getBalance(paymentNetworkBalances, symbol),
        ...rest,
      }))
      .map(({ balance, symbol, paymentNetworkBalance, ...rest }) => ({ // eslint-disable-line
        balance,
        symbol,
        balanceInFiat: balance * getRate(rates, symbol, fiatCurrency),
        paymentNetworkBalance,
        paymentNetworkBalanceInFiat: paymentNetworkBalance * getRate(rates, symbol, fiatCurrency),
        ...rest,
      }))
      .sort((a, b) => b.balanceInFiat - a.balanceInFiat);

    return (
      <FlatList
        data={sortedAssets}
        keyExtractor={(item) => item.id}
        renderItem={this.renderToken}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        onEndReachedThreshold={0.5}
        style={{ width: '100%', height: '100%', flex: 1 }}
        ListHeaderComponent={this.renderHeader}
        contentContainerStyle={{ paddingTop: 4 }}
        scrollEnabled={false}
      />
    );
  }
}

const mapStateToProps = ({
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency, appearanceSettings: { assetsLayout } } },
  bitcoin: { data: { addresses: bitcoinAddresses, balances: bitcoinBalances } },
}: RootReducerState): $Shape<Props> => ({
  rates,
  baseFiatCurrency,
  assetsLayout,
  bitcoinAddresses,
  bitcoinBalances,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  paymentNetworkBalances: paymentNetworkAccountBalancesSelector,
  activeAccount: activeAccountSelector,
  assets: accountAssetsSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  hideAsset: (asset: Asset) => dispatch(hideAssetAction(asset)),
  setActiveBlockchainNetwork: (id: string) => dispatch(setActiveBlockchainNetworkAction(id)),
  initializeBitcoinWallet: (wallet: EthereumWallet) => dispatch(initializeBitcoinWalletAction(wallet)),
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
});

export default withNavigation(connect(combinedMapStateToProps, mapDispatchToProps)(AssetsList));
