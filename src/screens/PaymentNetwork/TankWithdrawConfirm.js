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
import { ZERO_ADDRESS } from '@netgum/utils';

// constants
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { ETH } from 'constants/assetsConstants';

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
import type { TransactionFeeInfo } from 'models/Transaction';


type Props = {
  navigation: NavigationScreenProp<*>,
  feeInfo: ?TransactionFeeInfo,
  accountAddress: string,
  isOnline: boolean,
};

const WithdrawWrapper = styled.View`
  padding: 16px 20px;
`;

const TankWithdrawConfirm = ({ navigation, feeInfo, isOnline }: Props) => {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const withdrawAmount: string = navigation.getParam('amount');
  const PPNAsset: Asset = navigation.getParam('asset');

  const { symbol } = PPNAsset;

  const showUnableToWithdrawToast = () => {
    Toast.show({
      message: t('toast.cannotWithdrawFromTank'),
      emoji: 'woman-shrugging',
      supportLink: true,
    });
    setIsSubmitted(false);
  };

  const onNextButtonPress = async () => {
    if (isSubmitted) return;
    setIsSubmitted(true);

    /**
     * separate from other toast below as next etherspot call locks the
     * state in back-end so we don't want to lock unless it was really estimated
     */
    if (!feeInfo) {
      showUnableToWithdrawToast();
      return;
    }

    const tokenWithdrawTransaction = await etherspot.buildTokenWithdrawFromAccountDepositTransaction(
      PPNAsset,
      withdrawAmount,
    );

    if (!tokenWithdrawTransaction) {
      showUnableToWithdrawToast();
      return;
    }

    const { to, data } = tokenWithdrawTransaction;
    const { gasToken, fee: txFeeInWei } = feeInfo;

    let transactionPayload = {
      to,
      amount: 0,
      data,
      txFeeInWei,
      symbol: ETH,
      decimals: 18,
      contractAddress: ZERO_ADDRESS,
    };

    if (gasToken) transactionPayload = { ...transactionPayload, gasToken };

    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, { transactionPayload });

    setIsSubmitted(false);
  };

  return (
    <ContainerWithHeader
      navigation={navigation}
      headerProps={{ centerItems: [{ title: t('ppnContent.title.withdrawFromTokenTankScreen', { token: symbol }) }] }}
      minAvoidHeight={200}
    >
      <WithdrawWrapper>
        <TokenReviewSummary
          assetSymbol={symbol}
          text={t('ppnContent.label.youAreWithdrawingFromTokenTank', { token: symbol })}
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
          disabled={isSubmitted || !isOnline}
          isLoading={isSubmitted}
          title={t('ppnContent.button.withdraw')}
          onPress={onNextButtonPress}
        />
      </WithdrawWrapper>
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

export default connect(mapStateToProps)(TankWithdrawConfirm);
