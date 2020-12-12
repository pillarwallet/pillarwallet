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

import React from 'react';
import styled, { withTheme } from 'styled-components/native';
import Table, { TableRow, TableLabel, TableAmount, TableFee } from 'components/Table';
import type { TransactionFeeInfo } from 'models/Transaction';
import t from 'translations/translate';
import Button from 'components/Button';
import Icon from 'components/Icon';
import { BaseText } from 'components/Typography';
import { Spacing } from 'components/Layout';
import type { OfferOrder } from 'models/Offer';
import { ALLOWED_SLIPPAGE } from 'constants/exchangeConstants';
import type { Theme } from 'models/Theme';

type Props = {
  errorMessage: ?string,
  isOnline: boolean,
  feeInfo: ?TransactionFeeInfo,
  isEstimating: boolean,
  onPress: () => void,
  offerOrder: OfferOrder,
  theme: Theme,
};

export const TableWrapper = styled.View`
  padding: 0 20px;
`;

export const ExchangeIcon = styled(Icon)`
  color: ${({ theme }) => theme.colors.primaryAccent130};
  font-size: 16px;
  margin-right: 4px;
`;

const Row = styled.View`
  flex-direction: row;
  align-items: center;
`;

const ConfirmationTable = (props: Props) => {
  const {
    errorMessage, isOnline, feeInfo, isEstimating, onPress, offerOrder,
  } = props;
  const {
    payQuantity, receiveQuantity, fromAsset, toAsset,
  } = offerOrder;
  return (
    <TableWrapper>
      <Table title={t('exchangeContent.label.exchangeDetails')}>
        <TableRow>
          <TableLabel>{t('exchangeContent.label.exchangeRate')}</TableLabel>
          <Row>
            <ExchangeIcon name="exchange" />
            <BaseText regular>
              {t('exchangeContent.label.exchangeRateLayout', {
                rate: (parseFloat(receiveQuantity) / parseFloat(payQuantity)).toPrecision(2),
                toAssetCode: toAsset.code || toAsset.symbol,
                fromAssetCode: fromAsset.code || fromAsset.symbol,
              })}
            </BaseText>
          </Row>
        </TableRow>
        <TableRow>
          <TableLabel>{t('exchangeContent.label.maxSlippage')}</TableLabel>
          <BaseText regular> {t('percentValue', { value: ALLOWED_SLIPPAGE })}</BaseText>
        </TableRow>
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
          <TableLabel>{t('transactions.label.totalFee')}</TableLabel>
          <TableFee txFeeInWei={feeInfo?.fee} gasToken={feeInfo?.gasToken} />
        </TableRow>
      </Table>
      <Spacing h={48} />
      {!!errorMessage && <BaseText style={{ marginBottom: 15 }} center secondary>{errorMessage}</BaseText>}
      <Button
        disabled={!isOnline || !!errorMessage || !feeInfo || isEstimating}
        onPress={onPress}
        title={isEstimating ? t('label.gettingFee') : t('button.confirm')}
      />
    </TableWrapper>
  );
};

export default withTheme(ConfirmationTable);
