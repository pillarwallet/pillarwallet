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
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';
import t from 'translations/translate';

// constants
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';

// components
import Toast from 'components/Toast';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import TokenReviewSummary from 'components/ReviewSummary/TokenReviewSummary';
import { Spacing } from 'components/Layout';
import Table, {
  TableAmount,
  TableFee,
  TableLabel,
  TableRow,
  TableTotal,
} from 'components/Table';
import Button from 'components/Button';

// services
import etherspot from 'services/etherspot';

// types
import type { RootReducerState } from 'reducers/rootReducer';
import type { Asset } from 'models/Asset';
import type {
  TransactionFeeInfo,
  TransactionPayload,
} from 'models/Transaction';


type Props = {
  navigation: NavigationScreenProp<*>,
  feeInfo: ?TransactionFeeInfo,
  accountAddress: string,
  isOnline: boolean,
};

const DepositWrapper = styled.View`
  padding: 16px 20px;
`;

const FundTankConfirm = ({ navigation, feeInfo, isOnline }: Props) => {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const fundAmount: number = navigation.getParam('amount');
  const PPNAsset: Asset = navigation.getParam('asset');

  const { symbol, address: contractAddress, decimals } = PPNAsset;

  const onNextButtonPress = async () => {
    if (isSubmitted) return;
    setIsSubmitted(true);

    const accountTokenDeposit = await etherspot.getAccountTokenDeposit(contractAddress);

    if (!feeInfo || !accountTokenDeposit) {
      Toast.show({
        message: t('toast.cannotFundTank'),
        emoji: 'woman-shrugging',
        supportLink: true,
      });
      setIsSubmitted(false);
      return;
    }

    const transactionPayload: TransactionPayload = {
      to: accountTokenDeposit.address,
      amount: fundAmount,
      txFeeInWei: feeInfo.fee,
      symbol,
      contractAddress,
      decimals,
    };

    if (feeInfo?.gasToken) transactionPayload.gasToken = feeInfo.gasToken;

    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, { transactionPayload });

    setIsSubmitted(false);
  };

  return (
    <ContainerWithHeader
      navigation={navigation}
      headerProps={{ centerItems: [{ title: t('ppnContent.title.fundTankConfirmScreen') }] }}
      minAvoidHeight={200}
    >
      <DepositWrapper>
        <TokenReviewSummary
          assetSymbol={symbol}
          text={t('ppnContent.label.youAreFundingTokenTank', { token: symbol })}
          amount={fundAmount}
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
          disabled={isSubmitted || !isOnline}
          isLoading={isSubmitted}
          title={t('ppnContent.button.fundTank')}
          onPress={onNextButtonPress}
        />
      </DepositWrapper>
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  session: { data: { isOnline } },
  transactionEstimate: { feeInfo },
}: RootReducerState): $Shape<Props> => ({
  feeInfo,
  isOnline,
});

export default connect(mapStateToProps)(FundTankConfirm);
