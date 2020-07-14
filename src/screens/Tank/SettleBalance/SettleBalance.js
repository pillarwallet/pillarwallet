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
import styled, { withTheme } from 'styled-components/native';
import { RefreshControl } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import get from 'lodash.get';
import { BigNumber } from 'bignumber.js';

// actions
import { fetchAvailableTxToSettleAction } from 'actions/smartWalletActions';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { Label, BaseText, Paragraph } from 'components/Typography';
import Button from 'components/Button';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import TankAssetBalance from 'components/TankAssetBalance';
import Checkbox from 'components/Checkbox';
import Spinner from 'components/Spinner';
import Toast from 'components/Toast';

// constants
import { defaultFiatCurrency, ETH } from 'constants/assetsConstants';
import { SETTLE_BALANCE_CONFIRM } from 'constants/navigationConstants';

// types
import type { Assets, Balances, Rates } from 'models/Asset';
import type { TxToSettle } from 'models/PaymentNetwork';
import type { Theme } from 'models/Theme';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';

// utils
import {
  fontStyles,
  spacing,
  fontSizes,
} from 'utils/variables';
import {
  formatFiat,
  formatAmount,
  groupAndSortByDate,
} from 'utils/common';
import { getRate } from 'utils/assets';
import { getThemeColors, themedColors } from 'utils/themes';

import { createStructuredSelector } from 'reselect';
import { accountAssetsSelector } from 'selectors/assets';

type Props = {
  navigation: NavigationScreenProp<*>,
  assetsOnNetwork: Object[],
  paymentNetworkBalances: Balances,
  baseFiatCurrency: ?string,
  rates: Rates,
  assets: Assets,
  session: Object,
  estimateSettleBalance: Function,
  availableToSettleTx: Object[],
  isFetched: boolean,
  fetchAvailableTxToSettle: Function,
  theme: Theme,
};

type State = {
  txToSettle: TxToSettle[],
};

const MAX_TX_TO_SETTLE = 5;

export const LoadingSpinner = styled(Spinner)`
  padding-top: 20px;
  align-items: center;
  justify-content: center;
`;

const FooterInner = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;
  width: 100%;
  padding: ${spacing.large}px;
`;

const AddonWrapper = styled.View`
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
`;

const BalanceWrapper = styled.View`
  flex-direction: column;
  justify-content: center;
  align-items: flex-end;
`;

const ValueInFiat = styled(BaseText)`
  font-size: ${fontSizes.regular}px;
  color: ${themedColors.secondaryText};
`;

const SubtitleView = styled.View`
  background-color: ${themedColors.card};
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;
  padding: 30px ${spacing.rhythm}px 25px;
  border-bottom-width: 1px;
  border-color: ${themedColors.border};
`;

const UnsettledTransactionsList = styled.SectionList`
  width: 100%;
  flex: 1;
`;

const SectionHeaderWrapper = styled.View`
  width: 100%;
  padding: ${spacing.small}px ${spacing.large}px;
`;

const SectionHeader = styled(BaseText)`
  ${fontStyles.regular};
  color: ${themedColors.secondaryText};
`;

class SettleBalance extends React.Component<Props, State> {
  state = {
    txToSettle: [],
  };

  componentDidMount() {
    this.props.fetchAvailableTxToSettle();
  }

  renderItem = ({ item }) => {
    const {
      baseFiatCurrency,
      assets,
      rates,
      theme,
    } = this.props;
    const { txToSettle } = this.state;
    const colors = getThemeColors(theme);

    const tokenSymbol = get(item, 'token.symbol', ETH);
    const value = get(item, 'value', new BigNumber(0));
    const senderAddress = get(item, 'senderAddress', '');

    const assetInfo = {
      ...(assets[tokenSymbol] || {}),
      symbol: tokenSymbol,
      value,
      hash: item.hash,
      createdAt: item.createdAt,
    };

    const nameOrAddress = `${senderAddress.slice(0, 6)}…${senderAddress.slice(-6)}`;
    const formattedAmount = formatAmount(assetInfo.value.toString());
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const totalInFiat = assetInfo.value.toNumber() * getRate(rates, assetInfo.symbol, fiatCurrency);
    const formattedAmountInFiat = formatFiat(totalInFiat, baseFiatCurrency);
    const isChecked = txToSettle.some(({ hash }) => hash === assetInfo.hash);
    const isDisabled = !isChecked && txToSettle.length === MAX_TX_TO_SETTLE;
    // const itemValue = `${formattedValue} ${notification.asset}`;
    return (
      <ListItemWithImage
        onPress={() => this.toggleItemToTransfer(assetInfo)}
        label={nameOrAddress}
        avatarUrl=""
        valueColor={colors.positive}
        imageUpdateTimeStamp={0}
        customAddon={
          <AddonWrapper>
            <BalanceWrapper>
              <TankAssetBalance
                amount={formattedAmount}
                token={tokenSymbol}
                monoColor
              />
              <ValueInFiat>
                {formattedAmountInFiat}
              </ValueInFiat>
            </BalanceWrapper>
            <Checkbox
              onPress={() => this.toggleItemToTransfer(assetInfo)}
              checked={isChecked}
              disabled={isDisabled}
              rounded
              wrapperStyle={{ width: 24, marginRight: 4, marginLeft: 12 }}
            />
          </AddonWrapper>
        }
        rightColumnInnerStyle={{ flexDirection: 'row' }}
      />
    );
  };

  toggleItemToTransfer = (tx: Object) => {
    const { txToSettle } = this.state;
    let updatedTxToSettle;
    if (txToSettle.find(({ hash }) => hash === tx.hash)) {
      updatedTxToSettle = txToSettle.filter(({ hash }) => hash !== tx.hash);
    } else if (txToSettle.length === MAX_TX_TO_SETTLE) {
      Toast.show({
        message: `You can settle only ${MAX_TX_TO_SETTLE} transactions at once`,
        type: 'info',
        title: 'Warning',
      });
      return;
    } else {
      updatedTxToSettle = [...txToSettle, tx];
    }
    this.setState({ txToSettle: updatedTxToSettle });
  };

  goToConfirm = () => {
    const { navigation } = this.props;
    const { txToSettle } = this.state;
    navigation.navigate(SETTLE_BALANCE_CONFIRM, { txToSettle });
  };

  render() {
    const {
      session,
      availableToSettleTx,
      isFetched,
    } = this.props;
    const { txToSettle } = this.state;
    const showSpinner = !isFetched;
    const formattedFeedData = groupAndSortByDate(availableToSettleTx, 0);
    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: 'Settle transactions' }] }}
        footer={(
          <FooterInner style={{ alignItems: 'center' }}>
            <Label>&nbsp;</Label>
            {!!txToSettle.length && (
              <Button
                small
                disabled={!session.isOnline}
                title="Next"
                onPress={this.goToConfirm}
              />
            )}
          </FooterInner>
        )}
      >
        {showSpinner && <LoadingSpinner />}
        {!showSpinner &&
          <React.Fragment>
            <SubtitleView>
              <Paragraph light small>Transactions available to settle</Paragraph>
              <Paragraph style={{ textAlign: 'right', marginLeft: 4 }} small>
                {txToSettle.length} of {MAX_TX_TO_SETTLE}
              </Paragraph>
            </SubtitleView>
            <UnsettledTransactionsList
              sections={formattedFeedData}
              initialNumToRender={6}
              renderSectionHeader={({ section }) => (
                <SectionHeaderWrapper>
                  <SectionHeader>{section.title}</SectionHeader>
                </SectionHeaderWrapper>
              )}
              renderItem={this.renderItem}
              getItemLayout={(data, index) => ({
                length: 70,
                offset: 70 * index,
                index,
              })}
              maxToRenderPerBatch={7}
              onEndReachedThreshold={0.5}
              keyExtractor={item => item.hash}
              contentContainerStyle={{ flexGrow: 1, paddingTop: 10 }}
              removeClippedSubviews
              stickySectionHeadersEnabled={false}
              refreshControl={
                <RefreshControl
                  refreshing={false}
                  onRefresh={() => {
                    this.props.fetchAvailableTxToSettle();
                  }}
                />
              }
            />
          </React.Fragment>
        }
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
  session: { data: session },
  paymentNetwork: { availableToSettleTx: { data: availableToSettleTx, isFetched } },
}: RootReducerState): $Shape<Props> => ({
  rates,
  baseFiatCurrency,
  session,
  availableToSettleTx,
  isFetched,
});

const structuredSelector = createStructuredSelector({
  assets: accountAssetsSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchAvailableTxToSettle: () => dispatch(fetchAvailableTxToSettleAction()),
});

export default withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(SettleBalance));
