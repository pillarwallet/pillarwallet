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
import { createStructuredSelector } from 'reselect';
import styled from 'styled-components/native';
import { BigNumber } from 'bignumber.js';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Button from 'components/Button';
import Table, { TableRow, TableLabel, TableAmount, TableTotal, TableFee } from 'components/Table';
import TokenReviewSummary from 'components/ReviewSummary/TokenReviewSummary';
import { Spacing } from 'components/Layout';

// constants
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';

// selectors
import { activeAccountAddressSelector } from 'selectors';

// utils
import { getAaveWithdrawTransaction } from 'utils/aave';

// types
import type { RootReducerState } from 'reducers/rootReducer';
import type { DepositedAsset } from 'models/Asset';
import type { TransactionFeeInfo } from 'models/Transaction';


type Props = {
  navigation: NavigationScreenProp<*>,
  feeInfo: ?TransactionFeeInfo,
  accountAddress: string,
};

const DepositWrapper = styled.View`
  padding: 16px 10px;
`;

const WithdrawTransactionConfirm = ({
  navigation,
  feeInfo,
  accountAddress,
}: Props) => {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const withdrawAmount: number = navigation.getParam('amount');
  const depositedAsset: DepositedAsset = navigation.getParam('asset');
  const { symbol: depositedAssetSymbol } = depositedAsset;

  const onNextButtonPress = async () => {
    if (isSubmitted) return;
    setIsSubmitted(true);

    const transactionPayload = await getAaveWithdrawTransaction(
      accountAddress,
      withdrawAmount,
      depositedAsset,
      feeInfo?.fee || new BigNumber(0),
    );

    if (feeInfo?.gasToken) transactionPayload.gasToken = feeInfo?.gasToken;

    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, { transactionPayload });
    setIsSubmitted(false);
  };

  return (
    <ContainerWithHeader
      navigation={navigation}
      headerProps={{ centerItems: [{ title: t('aaveContent.title.withdrawConfirmationScreen') }] }}
      minAvoidHeight={200}
    >
      <DepositWrapper>
        <TokenReviewSummary
          assetSymbol={depositedAssetSymbol}
          text={t('aaveContent.label.youAreWithdrawing')}
          amount={withdrawAmount}
        />
        <Spacing h={42} />
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
        <Spacing h={50} />
        <Button
          regularText
          block
          disabled={isSubmitted}
          isLoading={isSubmitted}
          title={t('aaveContent.button.confirmWithdrawal')}
          onPress={onNextButtonPress}
        />
      </DepositWrapper>
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

export default connect(combinedMapStateToProps)(WithdrawTransactionConfirm);
