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
import { Keyboard } from 'react-native';
import t from 'translations/translate';
import { useNavigation, useNavigationParam } from 'react-navigation-hooks';

// constants
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { CHAIN } from 'constants/chainConstants';

// components
import Table, { TableRow, TableLabel, TableAmount, TableTotal, TableUser, TableFee } from 'components/Table';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Button from 'components/Button';
import { Spacing, ScrollWrapper } from 'components/Layout';
import TokenReviewSummary from 'components/ReviewSummary/TokenReviewSummary';
import { BaseText } from 'components/Typography';

// utils
import { useChainsConfig } from 'utils/uiConfig';

// selectors
import { useRootSelector } from 'selectors';

// types
import type { TransactionPayload } from 'models/Transaction';


const SendTokenConfirm = () => {
  const session = useRootSelector(({ session: sessionState }) => sessionState.data);
  const navigation = useNavigation();

  const source: ?string = useNavigationParam('source');
  const transactionPayload: TransactionPayload = useNavigationParam('transactionPayload');

  const { chain = CHAIN.ETHEREUM } = transactionPayload;
  const { title: chainTitle, color: chainColor } = useChainsConfig()[chain];

  const handleFormSubmit = () => {
    Keyboard.dismiss();
    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, { transactionPayload, source });
  };

  const {
    amount,
    to,
    receiverEnsName,
    txFeeInWei,
    symbol,
    gasToken,
  } = transactionPayload;

  return (
    <ContainerWithHeader
      headerProps={{
        centerItems: [{ title: t('transactions.title.review') }],
      }}
    >
      <ScrollWrapper
        disableAutomaticScroll
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16 }}
        disableOnAndroid
      >
        <TokenReviewSummary assetSymbol={symbol} text={t('transactions.label.youAreSending')} amount={amount} />
        <Spacing h={32} />
        <Table>
          <TableRow>
            <TableLabel>{t('transactions.label.network')}</TableLabel>
            <BaseText color={chainColor} regular>{chainTitle}</BaseText>
          </TableRow>
          <TableRow>
            <TableLabel>{t('transactions.label.recipient')}</TableLabel>
            <TableUser ensName={receiverEnsName} address={to} />
          </TableRow>
          <TableRow>
            <TableLabel>{t('transactions.label.ethFee')}</TableLabel>
            <TableFee txFeeInWei={txFeeInWei} gasToken={gasToken} />
          </TableRow>
          <TableRow>
            <TableLabel>{t('transactions.label.pillarFee')}</TableLabel>
            <TableAmount amount={0} />
          </TableRow>
          <TableRow>
            <TableTotal>{t('transactions.label.totalFee')}</TableTotal>
            <TableFee txFeeInWei={txFeeInWei} gasToken={gasToken} />
          </TableRow>
        </Table>
        <Spacing h={40} />
        <Button
          disabled={!session.isOnline}
          onPress={handleFormSubmit}
          title={t('transactions.button.send')}
        />
      </ScrollWrapper>
    </ContainerWithHeader>
  );
};

export default SendTokenConfirm;
