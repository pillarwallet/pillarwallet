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
import styled from 'styled-components/native';
import { FlatList, RefreshControl } from 'react-native';
import { SDK_PROVIDER } from 'react-native-dotenv';
import type { NavigationScreenProp } from 'react-navigation';
import get from 'lodash.get';
import { BigNumber } from 'bignumber.js';
import { format as formatDate } from 'date-fns';

// actions
import { fetchAvailableTxToSettleAction } from 'actions/smartWalletActions';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { Label, BaseText, Paragraph } from 'components/Typography';
import Button from 'components/Button';
import Separator from 'components/Separator';
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

// utils
import { baseColors, fontSizes, spacing } from 'utils/variables';
import { formatFiat, formatAmount } from 'utils/common';
import { getRate } from 'utils/assets';

import { createStructuredSelector } from 'reselect';
import { accountAssetsSelector } from 'selectors/assets';


type Props = {
  navigation: NavigationScreenProp<*>,
  assetsOnNetwork: Object[],
  paymentNetworkBalances: Balances,
  baseFiatCurrency: string,
  rates: Rates,
  assets: Assets,
  session: Object,
  estimateSettleBalance: Function,
  availableToSettleTx: Object[],
  isFetched: boolean,
  fetchAvailableTxToSettle: Function,
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
  color: ${baseColors.coolGrey};
  font-size: ${fontSizes.extraExtraSmall}px;
`;

const genericToken = require('assets/images/tokens/genericToken.png');

class SettleBalance extends React.Component<Props, State> {
  state = {
    txToSettle: [],
  };

  componentDidMount() {
    this.props.fetchAvailableTxToSettle();
  }

  renderItem = ({ item }) => {
    const { txToSettle } = this.state;
    const { baseFiatCurrency, assets, rates } = this.props;

    const tokenSymbol = get(item, 'token.symbol', ETH);
    const value = get(item, 'value', new BigNumber(0));

    const assetInfo = {
      ...(assets[tokenSymbol] || {}),
      symbol: tokenSymbol,
      value,
      hash: item.hash,
      createdAt: item.createdAt,
    };

    const fullIconUrl = `${SDK_PROVIDER}/${assetInfo.iconUrl}?size=3`;
    const formattedAmount = formatAmount(assetInfo.value.toString());
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const totalInFiat = assetInfo.value.toNumber() * getRate(rates, assetInfo.symbol, fiatCurrency);
    const formattedAmountInFiat = formatFiat(totalInFiat, baseFiatCurrency);
    const isToday = new Date().toDateString() === item.createdAt.toDateString();
    const time = isToday
      ? `Today at ${formatDate(item.createdAt, 'HH:mm')}`
      : formatDate(item.createdAt, 'MMMM D, YYYY HH:mm');

    return (
      <ListItemWithImage
        label={assetInfo.name}
        subtext={time}
        itemImageUrl={fullIconUrl || genericToken}
        fallbackSource={genericToken}
        onPress={() => this.toggleItemToTransfer(assetInfo)}
        customAddon={
          <AddonWrapper>
            <BalanceWrapper>
              <TankAssetBalance amount={formattedAmount} monoColor />
              <ValueInFiat>
                {formattedAmountInFiat}
              </ValueInFiat>
            </BalanceWrapper>
            <Checkbox
              onPress={() => this.toggleItemToTransfer(assetInfo)}
              checked={!!txToSettle.find(({ hash }) => hash === assetInfo.hash)}
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
        title: 'Error',
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

    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: 'Settle balances' }] }}
        keyboardAvoidFooter={(
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
        {!showSpinner && (
          <React.Fragment>
            <Paragraph light small center style={{ paddingTop: 15 }}>
              You can settle up to {MAX_TX_TO_SETTLE} transactions at once
            </Paragraph>
            <FlatList
              keyExtractor={item => item.hash}
              data={availableToSettleTx}
              renderItem={this.renderItem}
              ItemSeparatorComponent={() => <Separator spaceOnLeft={82} />}
              contentContainerStyle={{
                flexGrow: 1,
                paddingTop: 10,
              }}
              refreshControl={
                <RefreshControl
                  refreshing={false}
                  onRefresh={() => {
                    this.props.fetchAvailableTxToSettle();
                  }}
                />
              }
            />
          </React.Fragment>)}
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
  session: { data: session },
  paymentNetwork: { availableToSettleTx: { data: availableToSettleTx, isFetched } },
}) => ({
  rates,
  baseFiatCurrency,
  session,
  availableToSettleTx,
  isFetched,
});

const structuredSelector = createStructuredSelector({
  assets: accountAssetsSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch) => ({
  fetchAvailableTxToSettle: () => dispatch(fetchAvailableTxToSettleAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(SettleBalance);
