// @flow
import * as React from 'react';
import { Animated, Easing, Share, RefreshControl, Platform } from 'react-native';
import { baseColors, fontSizes, spacing } from 'utils/variables';
import styled from 'styled-components/native';
import { transparentize } from 'polished';
import type { NavigationScreenProp } from 'react-navigation';
import { Transition } from 'react-navigation-fluid-transitions';
import { connect } from 'react-redux';
import { fetchAssetsBalancesAction } from 'actions/assetsActions';
import { fetchTransactionsHistoryAction } from 'actions/historyActions';
import type { Transaction } from 'models/Transaction';
import type { Assets, Balances } from 'models/Asset';
import AssetCard from 'components/AssetCard';
import LinearGradient from 'react-native-linear-gradient';
import AssetButtons from 'components/AssetButtons';
import ActivityFeed from 'components/ActivityFeed';

import Header from 'components/Header';
import { Container, ScrollWrapper } from 'components/Layout';
import { Paragraph, BaseText } from 'components/Typography';
import { SEND_TOKEN_FROM_ASSET_FLOW } from 'constants/navigationConstants';
import { defaultFiatCurrency } from 'constants/assetsConstants';
import { TRANSACTIONS } from 'constants/activityConstants';
import { formatMoney } from 'utils/common';
import { getBalance } from 'utils/assets';
import assetsConfig from 'configs/assetsConfig';
import ReceiveModal from './ReceiveModal';

const RECEIVE = 'RECEIVE';

const AssetDescriptionToggleWrapperColors = [transparentize(1, baseColors.white), baseColors.white];

const AssetDescriptionToggleWrapperActiveColors = [
  transparentize(1, baseColors.white),
  transparentize(1, baseColors.white),
];

const activeModalResetState = {
  type: null,
  opts: {
    address: '',
    token: '',
    tokenName: '',
  },
};

type Props = {
  fetchAssetsBalances: (assets: Assets, walletAddress: string) => Function,
  fetchTransactionsHistory: (walletAddress: string, asset: string, indexFrom?: number) => Function,
  history: Transaction[],
  assets: Assets,
  balances: Balances,
  wallet: Object,
  rates: Object,
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: ?string,
  contacts: Object,
  resetHideRemoval: Function,
};

type State = {
  assetDescriptionExpanded: boolean,
  activeModal: {
    type: string | null,
    opts: {
      address?: string,
      token?: string,
      tokenName?: string,
      formValues?: Object,
    },
  },
};

const AssetCardWrapper = styled.View`
  flex: 1;
  padding: ${Platform.select({
    ios: 0,
    android: '0 10px',
  })}
`;

const AssetDescriptionWrapper = styled.View`
  height: ${props => (props.expanded ? 'auto' : '24px')};
  padding: 0 ${spacing.rhythm - 2}px;
  z-index: 10;
`;

const AssetDescriptionToggle = styled.TouchableOpacity`
  padding: ${spacing.rhythm / 2}px;
`;

const AssetDescriptionToggleText = styled(BaseText)`
  font-size: ${fontSizes.small};
  color: ${baseColors.electricBlue};
  line-height: 18px;
`;

const AssetDescriptionToggleWrapper = styled(LinearGradient)`
  position: absolute;
  bottom: ${props => (props.expanded ? '-6px' : '-6px')};
  right: 0;
  padding-left: 40px;
`;

const AssetDescription = styled(Paragraph)`
  padding-bottom: ${spacing.rhythm}px;
`;
class AssetScreen extends React.Component<Props, State> {
  state = {
    activeModal: activeModalResetState,
    assetDescriptionExpanded: false,
  };

  static navigationOptions = {
    transitionConfig: {
      duration: 200,
      timing: Animated.timing,
      easing: Easing.easing,
    },
  };

  componentDidMount() {
    const { fetchTransactionsHistory, wallet, navigation } = this.props;
    const { assetData, resetHideRemoval } = navigation.state.params;
    fetchTransactionsHistory(wallet.address, assetData.token);
    resetHideRemoval();
  }

  handleCardTap = () => {
    this.props.navigation.goBack();
  };

  handleOpenShareDialog = (address: string) => {
    Share.share({ title: 'Public address', message: address });
  };

  goToSendTokenFlow = (assetData: Object) => {
    this.props.navigation.navigate(SEND_TOKEN_FROM_ASSET_FLOW, {
      assetData,
    });
  };

  openReceiveTokenModal = assetData => {
    this.setState({
      activeModal: {
        type: RECEIVE,
        opts: { address: assetData.address },
      },
    });
  };

  handleScrollWrapperEndDrag = e => {
    const { fetchTransactionsHistory, wallet, history } = this.props;
    const {
      assetData: { token },
    } = this.props.navigation.state.params;
    const layoutHeight = e.nativeEvent.layoutMeasurement.height;
    const contentHeight = e.nativeEvent.contentSize.height;
    const offsetY = e.nativeEvent.contentOffset.y;
    const indexFrom = history.filter(({ asset }) => asset === token).length;

    if (layoutHeight + offsetY + 200 >= contentHeight) {
      fetchTransactionsHistory(wallet.address, token, indexFrom);
    }
  };

  toggleAssetDescription = () => {
    this.setState({
      assetDescriptionExpanded: !this.state.assetDescriptionExpanded,
    });
  };

  render() {
    const {
      assets,
      rates,
      balances,
      wallet,
      fetchAssetsBalances,
      fetchTransactionsHistory,
      baseFiatCurrency,
      navigation,
    } = this.props;
    const { assetDescriptionExpanded } = this.state;
    const { assetData } = this.props.navigation.state.params;
    const { token } = assetData;
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const balance = getBalance(balances, token);
    const isWalletEmpty = balance <= 0;
    const totalInFiat = rates[token] ? balance * rates[token][fiatCurrency] : 0;
    const formattedBalanceInFiat = formatMoney(totalInFiat);
    const displayAmount = formatMoney(balance, 4);
    const shouldAssetDescriptionToggleShow = assetData.description.length > 40;
    const displayBalanceInFiat = {
      amount: formattedBalanceInFiat,
      currency: fiatCurrency,
    };
    const {
      listed: isListed = true,
      send: isSendActive = true,
      receive: isReceiveActive = true,
      disclaimer,
    } = assetsConfig[assetData.token] || {};
    return (
      <Container>
        <Header onClose={this.handleCardTap} />
        <ScrollWrapper
          onScrollEndDrag={this.handleScrollWrapperEndDrag}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                fetchAssetsBalances(assets, wallet.address);
                fetchTransactionsHistory(wallet.address, assetData.token);
              }}
            />
          }
        >
          <AssetCardWrapper>
            <Transition shared={assetData.name}>
              <AssetCard
                id={assetData.token}
                name={assetData.name}
                token={assetData.token}
                amount={displayAmount}
                balanceInFiat={displayBalanceInFiat}
                color={assetData.color}
                onPress={this.handleCardTap}
                address={assetData.address}
                icon={assetData.icon}
                wallpaper={assetData.wallpaper}
                isListed={isListed}
                disclaimer={disclaimer}
                horizontalPadding
              />
            </Transition>
            <AssetButtons
              onPressReceive={() => this.openReceiveTokenModal({ ...assetData, balance })}
              onPressSend={() => this.goToSendTokenFlow(assetData)}
              noBalance={isWalletEmpty}
              isSendDisabled={!isSendActive}
              isReceiveDisabled={!isReceiveActive}
            />
            <AssetDescriptionWrapper expanded={assetDescriptionExpanded}>
              <AssetDescription small light>
                {assetData.description}
              </AssetDescription>
              <AssetDescriptionToggleWrapper
                colors={
                  assetDescriptionExpanded
                    ? AssetDescriptionToggleWrapperActiveColors
                    : AssetDescriptionToggleWrapperColors
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 0.5, y: 0 }}
                expanded={assetDescriptionExpanded}
              >
                {shouldAssetDescriptionToggleShow && (
                  <AssetDescriptionToggle onPress={this.toggleAssetDescription}>
                    <AssetDescriptionToggleText>
                      {assetDescriptionExpanded ? 'Less' : 'More'}
                    </AssetDescriptionToggleText>
                  </AssetDescriptionToggle>
                )}
              </AssetDescriptionToggleWrapper>
            </AssetDescriptionWrapper>
          </AssetCardWrapper>

          <ActivityFeed
            feedTitle="transactions."
            navigation={navigation}
            activeTab={TRANSACTIONS}
            additionalFiltering={data => data.filter(({ asset }) => asset === assetData.token)}
          />
        </ScrollWrapper>

        <ReceiveModal
          isVisible={this.state.activeModal.type === RECEIVE}
          onModalHide={() => {
            this.setState({ activeModal: activeModalResetState });
          }}
          address={assetData.address}
          token={assetData.token}
          tokenName={assetData.name}
          handleOpenShareDialog={this.handleOpenShareDialog}
        />
      </Container>
    );
  }
}

const mapStateToProps = ({
  wallet: { data: wallet },
  contacts: { data: contacts },
  assets: { data: assets, balances },
  rates: { data: rates },
  history: { data: history },
  appSettings: { data: { baseFiatCurrency } },
}) => ({
  wallet,
  contacts,
  assets,
  balances,
  rates,
  history,
  baseFiatCurrency,
});

const mapDispatchToProps = (dispatch: Function) => ({
  fetchAssetsBalances: (assets, walletAddress) => {
    dispatch(fetchAssetsBalancesAction(assets, walletAddress));
  },
  fetchTransactionsHistory: (walletAddress, asset, indexFrom) => {
    dispatch(fetchTransactionsHistoryAction(walletAddress, asset, indexFrom));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(AssetScreen);
