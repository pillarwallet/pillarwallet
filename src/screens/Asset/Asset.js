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
import { Share, RefreshControl } from 'react-native';
import isEqual from 'lodash.isequal';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';
import { createStructuredSelector } from 'reselect';

// components
import AssetButtons from 'components/AssetButtons';
import ActivityFeed from 'components/ActivityFeed';
import SlideModal from 'components/Modals/SlideModal';
import Header from 'components/Header';
import { Container, ScrollWrapper, Wrapper } from 'components/Layout';
import AssetPattern from 'components/AssetPattern';
import { BoldText, BaseText, Paragraph } from 'components/Typography';
import Button from 'components/Button';

// actions
import { fetchAssetsBalancesAction } from 'actions/assetsActions';
import { fetchTransactionsHistoryAction } from 'actions/historyActions';

// models
import type { Transaction } from 'models/Transaction';
import type { Assets, Balances } from 'models/Asset';
import type { SmartWalletStatus } from 'models/SmartWalletStatus';
import type { Accounts } from 'models/Account';

// constants
import { SEND_TOKEN_FROM_ASSET_FLOW } from 'constants/navigationConstants';
import { defaultFiatCurrency } from 'constants/assetsConstants';
import { TRANSACTIONS } from 'constants/activityConstants';
import { SMART_WALLET_UPGRADE_STATUSES } from 'constants/smartWalletConstants';

// utils
import { baseColors, spacing, fontSizes } from 'utils/variables';
import { formatMoney, getCurrencySymbol } from 'utils/common';
import { getBalance, getRate } from 'utils/assets';
import { getSmartWalletStatus } from 'utils/smartWallet';

// configs
import assetsConfig from 'configs/assetsConfig';

// selectors
import { accountBalancesSelector } from 'selectors/balances';
import { accountHistorySelector } from 'selectors/history';

// local components
import ReceiveModal from './ReceiveModal';


const RECEIVE = 'RECEIVE';

const activeModalResetState = {
  type: null,
  opts: {
    address: '',
    token: '',
    tokenName: '',
  },
};

type Props = {
  fetchAssetsBalances: (assets: Assets) => Function,
  fetchTransactionsHistory: (asset: string, indexFrom?: number) => Function,
  history: Transaction[],
  assets: Assets,
  balances: Balances,
  rates: Object,
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: ?string,
  contacts: Object,
  resetHideRemoval: Function,
  smartWalletState: Object,
  accounts: Accounts,
};

type State = {
  activeModal: {
    type: string | null,
    opts: {
      address?: string,
      token?: string,
      tokenName?: string,
      formValues?: Object,
    },
  },
  showDescriptionModal: boolean,
};

const AssetCardWrapper = styled.View`
  flex: 1;
  justify-content: flex-start;
  padding-top: 5px;
  padding-bottom: 30px;
  background-color: ${baseColors.snowWhite};
  border-top-width: 1px;
  border-bottom-width: 1px;
  border-color: ${baseColors.mediumLightGray};
  margin-top: 4px;
`;

const DataWrapper = styled.View`
  margin: 0 ${spacing.large}px ${spacing.large}px;
  justify-content: center;
`;

const TokenValue = styled(BoldText)`
  font-size: ${fontSizes.semiGiant}px;
  text-align: center;
`;

const ValueInFiat = styled(BaseText)`
  font-size: ${fontSizes.extraExtraSmall}px;
  text-align: center;
  color: ${baseColors.darkGray};
  margin-top: 5px;
`;

const Disclaimer = styled(BaseText)`
  font-size: ${fontSizes.extraSmall}px;
  text-align: center;
  color: ${baseColors.burningFire};
  margin-top: 5px;
`;

const Description = styled(Paragraph)`
  padding-bottom: 80px;
  line-height: ${fontSizes.mediumLarge};
`;

const MessageTitle = styled(BoldText)`
  font-size: ${fontSizes.small}px;
  text-align: center;
`;

const Message = styled(BaseText)`
  padding-top: 10px;
  font-size: ${fontSizes.tiny}px;
  color: ${baseColors.darkGray};
  text-align: center;
`;

class AssetScreen extends React.Component<Props, State> {
  state = {
    activeModal: activeModalResetState,
    showDescriptionModal: false,
  };

  componentDidMount() {
    const { fetchTransactionsHistory, navigation } = this.props;
    const { assetData, resetHideRemoval } = navigation.state.params;
    fetchTransactionsHistory(assetData.token);
    resetHideRemoval();
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    const isFocused = this.props.navigation.isFocused();
    if (!isFocused) {
      return false;
    }
    const isEq = isEqual(this.props, nextProps) && isEqual(this.state, nextState);
    return !isEq;
  }

  handleCardTap = () => {
    this.props.navigation.goBack();
  };

  handleOpenShareDialog = (address: string) => {
    Share.share({ title: 'Public address', message: address });
  };

  goToSendTokenFlow = (assetData: Object) => {
    this.props.navigation.navigate(SEND_TOKEN_FROM_ASSET_FLOW, { assetData });
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
    const { fetchTransactionsHistory, history } = this.props;
    const {
      assetData: { token },
    } = this.props.navigation.state.params;
    const layoutHeight = e.nativeEvent.layoutMeasurement.height;
    const contentHeight = e.nativeEvent.contentSize.height;
    const offsetY = e.nativeEvent.contentOffset.y;
    const indexFrom = history.filter(({ asset }) => asset === token).length;

    if (layoutHeight + offsetY + 200 >= contentHeight) {
      fetchTransactionsHistory(token, indexFrom);
    }
  };

  render() {
    const {
      assets,
      rates,
      balances,
      fetchAssetsBalances,
      fetchTransactionsHistory,
      baseFiatCurrency,
      navigation,
      smartWalletState,
      accounts,
    } = this.props;
    const { showDescriptionModal } = this.state;
    const { assetData } = this.props.navigation.state.params;
    const { token } = assetData;
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const balance = getBalance(balances, token);
    const isWalletEmpty = balance <= 0;
    const totalInFiat = balance * getRate(rates, token, fiatCurrency);
    const formattedBalanceInFiat = formatMoney(totalInFiat);
    const displayAmount = formatMoney(balance, 4);
    const currencySymbol = getCurrencySymbol(fiatCurrency);

    const {
      listed: isListed = true,
      send: isAssetConfigSendActive = true,
      receive: isReceiveActive = true,
      disclaimer,
    } = assetsConfig[assetData.token] || {};

    const smartWalletStatus: SmartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);
    const sendingBlockedMessage = smartWalletStatus.sendingBlockedMessage || {};
    const isSendActive = isAssetConfigSendActive && !Object.keys(sendingBlockedMessage).length;

    return (
      <Container color={baseColors.white} inset={{ bottom: 0 }}>
        <Header
          onBack={this.handleCardTap}
          title={assetData.name}
          onNextPress={() => { this.setState({ showDescriptionModal: true }); }}
          nextIcon="info-circle-inverse"
          nextIconSize={fontSizes.extraLarge}
        />
        <ScrollWrapper
          onScrollEndDrag={this.handleScrollWrapperEndDrag}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                fetchAssetsBalances(assets);
                fetchTransactionsHistory(assetData.token);
              }}
            />
          }
        >
          <AssetPattern
            token={assetData.token}
            icon={assetData.iconColor}
            contractAddress={assetData.contractAddress}
            isListed={isListed}
          />
          <DataWrapper>
            <TokenValue>
              {`${displayAmount} ${token}`}
            </TokenValue>
            {!!isListed &&
            <ValueInFiat>
              {`${currencySymbol}${formattedBalanceInFiat}`}
            </ValueInFiat>}
            {!isListed &&
            <Disclaimer>
              {disclaimer}
            </Disclaimer>
            }
          </DataWrapper>
          <AssetCardWrapper>
            { /*
            <View style={{ paddingHorizontal: spacing.mediumLarge, paddingTop: 10 }}>
              <TruncatedText lines={1} text={assetData.description} />
           </View
           > */}
            <AssetButtons
              onPressReceive={() => this.openReceiveTokenModal({ ...assetData, balance })}
              onPressSend={() => this.goToSendTokenFlow(assetData)}
              noBalance={isWalletEmpty}
              isSendDisabled={!isSendActive}
              isReceiveDisabled={!isReceiveActive}
            />
            {!isSendActive &&
            <Wrapper regularPadding style={{ marginTop: 30, alignItems: 'center' }}>
              <MessageTitle>{ sendingBlockedMessage.title }</MessageTitle>
              <Message>{ sendingBlockedMessage.message }</Message>
              {smartWalletStatus.status === SMART_WALLET_UPGRADE_STATUSES.ACCOUNT_CREATED &&
              <Button
                marginTop="20px"
                height={52}
                title="Deploy Smart Wallet"
                onPress={() => {
                  // TODO: navigate to last upgrade step?
                }}
              />
              }
            </Wrapper>
            }
          </AssetCardWrapper>
          <ActivityFeed
            feedTitle="transactions."
            navigation={navigation}
            activeTab={TRANSACTIONS}
            additionalFiltering={data => data.filter(({ asset }) => asset === assetData.token)}
            backgroundColor={baseColors.white}
            noBorder
            wrapperStyle={{ marginTop: 10 }}
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
        <SlideModal
          title={assetData.name}
          isVisible={showDescriptionModal}
          onModalHide={() => { this.setState({ showDescriptionModal: false }); }}
        >
          <Description small light>{assetData.description}</Description>
        </SlideModal>
      </Container>
    );
  }
}

const mapStateToProps = ({
  contacts: { data: contacts },
  assets: { data: assets },
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
  smartWallet: smartWalletState,
  accounts: { data: accounts },
}) => ({
  contacts,
  assets,
  rates,
  baseFiatCurrency,
  smartWalletState,
  accounts,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  history: accountHistorySelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Function) => ({
  fetchAssetsBalances: (assets) => {
    dispatch(fetchAssetsBalancesAction(assets));
  },
  fetchTransactionsHistory: (asset, indexFrom) => {
    dispatch(fetchTransactionsHistoryAction(asset, indexFrom));
  },
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(AssetScreen);
