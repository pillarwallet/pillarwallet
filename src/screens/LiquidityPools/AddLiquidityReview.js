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
import React, { useState } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { createStructuredSelector } from 'reselect';
import t from 'translations/translate';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import TokenReviewSummary from 'components/ReviewSummary/TokenReviewSummary';
import Table, { TableRow, TableLabel, TableAmount, TableTotal, TableFee } from 'components/Table';
import { Spacing } from 'components/Layout';
import Button from 'components/Button';
import { BaseText } from 'components/Typography';
import Toast from 'components/Toast';

import { formatAmount, formatFiat } from 'utils/common';
import { getFormattedRate, getRate } from 'utils/assets';
import { getAddLiquidityTransactions } from 'utils/liquidityPools';

import { defaultFiatCurrency } from 'constants/assetsConstants';
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';

import { activeAccountAddressSelector } from 'selectors';

import type { Rates } from 'models/Asset';
import type { TransactionFeeInfo } from 'models/Transaction';
import type { RootReducerState } from 'reducers/rootReducer';


type Props = {
  navigation: NavigationScreenProp<*>,
  feeInfo: ?TransactionFeeInfo,
  baseFiatCurrency: ?string,
  rates: Rates,
  accountAddress: string,
};

const MainWrapper = styled.View`
  padding: 32px 20px;
`;

const AddLiquidityReviewScreen = ({
  navigation,
  feeInfo,
  baseFiatCurrency,
  rates,
  accountAddress,
}: Props) => {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    tokensData, poolToken, tokensValues, poolTokenValue, shareOfPool, pool,
  } = navigation.state.params;

  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
  const totalValue = tokensData.reduce((sum, token, i) => {
    sum += tokensValues[i] * getRate(rates, token.symbol, fiatCurrency);
    return sum;
  }, 0);

  const tokensValuesInFiat = tokensData.map((token, i) => {
    return getFormattedRate(rates, tokensValues[i], token.symbol, fiatCurrency);
  });

  const onNextButtonPress = async () => {
    if (isSubmitted) return;
    setIsSubmitted(true);

    if (!feeInfo?.fee) {
      Toast.show({
        message: t('toast.cannotAddLiquidity'),
        emoji: 'woman-shrugging',
        supportLink: true,
      });
      return;
    }

    const addLiquidityTransactions = await getAddLiquidityTransactions(
      accountAddress,
      pool,
      tokensValues,
      poolTokenValue,
      tokensData,
      feeInfo?.fee,
    );

    let transactionPayload = addLiquidityTransactions[0];

    if (addLiquidityTransactions.length > 1) {
      transactionPayload = {
        ...transactionPayload,
        sequentialSmartWalletTransactions: addLiquidityTransactions.slice(1),
      };
    }

    if (feeInfo?.gasToken) transactionPayload.gasToken = feeInfo?.gasToken;

    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, { transactionPayload });
    setIsSubmitted(false);
  };

  return (
    <ContainerWithHeader
      navigation={navigation}
      headerProps={{ centerItems: [{ title: t('liquidityPoolsContent.title.addLiquidityReview') }] }}
      putContentInScrollView
    >
      <MainWrapper>
        <TokenReviewSummary
          assetSymbol={poolToken.symbol}
          text={t('liquidityPoolsContent.label.youAreAddingLiquidity')}
          amount={poolTokenValue}
          fiatAmount={formatFiat(totalValue)}
        />
        <Spacing h={8} />
        <BaseText regular secondary center>
          {t('liquidityPoolsContent.label.shareOfPool')}{' '}
          <BaseText>{t('percentValue', { value: formatAmount(shareOfPool) })}</BaseText>
        </BaseText>
        <Spacing h={28} />
        <Table title={t('liquidityPoolsContent.label.tokenAllocation')}>
          {tokensData.map((token, i) => (
            <TableRow key={token.symbol}>
              <TableLabel>{token.name}</TableLabel>
              <BaseText regular>
                {t('tokenValue', { value: formatAmount(tokensValues[i]), token: token.symbol })}{' '}
                <BaseText secondary>{tokensValuesInFiat[i]}</BaseText>
              </BaseText>
            </TableRow>
        ))}
        </Table>
        <Spacing h={20} />
        <Table title={t('transactions.label.fees')}>
          <TableRow>
            <TableLabel>{t('transactions.label.ethFee')}</TableLabel>
            <TableFee txFeeInWei={feeInfo?.fee} gasToken={feeInfo?.gasToken} />
          </TableRow>
          <TableRow>
            <TableLabel>{t('transactions.label.pillarFee')}</TableLabel>
            <TableAmount amount={0} />
          </TableRow>
          <TableRow>
            <TableTotal>{t('transactions.label.totalFee')}</TableTotal>
            <TableFee txFeeInWei={feeInfo?.fee} gasToken={feeInfo?.gasToken} />
          </TableRow>
        </Table>
        <Spacing h={48} />
        <Button
          title={t('liquidityPoolsContent.button.addLiquidity')}
          onPress={onNextButtonPress}
        />
      </MainWrapper>
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  transactionEstimate: { feeInfo },
  appSettings: { data: { baseFiatCurrency } },
  rates: { data: rates },
}: RootReducerState): $Shape<Props> => ({
  feeInfo,
  baseFiatCurrency,
  rates,
});

const structuredSelector = createStructuredSelector({
  accountAddress: activeAccountAddressSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(AddLiquidityReviewScreen);
