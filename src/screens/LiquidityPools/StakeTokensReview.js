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
import Toast from 'components/Toast';

import { getStakeTransactions } from 'utils/liquidityPools';

import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';

import { activeAccountAddressSelector } from 'selectors';

import type { TransactionFeeInfo } from 'models/Transaction';
import type { RootReducerState } from 'reducers/rootReducer';


type Props = {
  navigation: NavigationScreenProp<*>,
  feeInfo: ?TransactionFeeInfo,
  accountAddress: string,
};

const MainWrapper = styled.View`
  padding: 32px 20px;
`;

const StakeTokensReviewScreen = ({
  navigation,
  feeInfo,
  accountAddress,
}: Props) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const {
    poolToken, amount, pool,
  } = navigation.state.params;

  const onNextButtonPress = async () => {
    if (isSubmitted) return;
    setIsSubmitted(true);

    if (!feeInfo?.fee) {
      Toast.show({
        message: t('toast.cannotStakeTokens'),
        emoji: 'woman-shrugging',
        supportLink: true,
      });
      return;
    }

    const stakeTransactions = await getStakeTransactions(
      pool,
      accountAddress,
      amount,
      poolToken,
      feeInfo?.fee,
    );

    let transactionPayload = stakeTransactions[0];

    if (stakeTransactions.length > 1) {
      transactionPayload = {
        ...transactionPayload,
        sequentialSmartWalletTransactions: stakeTransactions.slice(1),
      };
    }

    if (feeInfo?.gasToken) transactionPayload.gasToken = feeInfo?.gasToken;

    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, { transactionPayload });
    setIsSubmitted(false);
  };

  return (
    <ContainerWithHeader
      navigation={navigation}
      headerProps={{ centerItems: [{ title: t('liquidityPoolsContent.title.stakeTokensReview') }] }}
      putContentInScrollView
    >
      <MainWrapper>
        <TokenReviewSummary
          assetSymbol={poolToken.symbol}
          text={t('liquidityPoolsContent.label.youAreStaking')}
          amount={amount}
        />
        <Spacing h={26} />
        <Table>
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
          title={t('liquidityPoolsContent.button.stake')}
          onPress={onNextButtonPress}
        />
      </MainWrapper>
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  transactionEstimate: { feeInfo },
}: RootReducerState): $Shape<Props> => ({
  feeInfo,
});

const structuredSelector = createStructuredSelector({
  accountAddress: activeAccountAddressSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(StakeTokensReviewScreen);
