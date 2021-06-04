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
import styled from 'styled-components/native';
import t from 'translations/translate';

// Components
import ExchangeRateText from 'components/modern/ExchangeRateText';
import Table, { TableRow, TableLabel, TableAmount, TableFee } from 'components/Table';
import { BaseText } from 'components/Typography';
import { Spacing } from 'components/Layout';

// Constants
import { ALLOWED_SLIPPAGE } from 'constants/exchangeConstants';

// Utils
import { useProviderConfig } from 'utils/exchange';
import { useChainsConfig } from 'utils/uiConfig';

// Types
import type { ExchangeOffer } from 'models/Exchange';
import type { TransactionFeeInfo } from 'models/Transaction';

type Props = {
  offer: ExchangeOffer,
  feeInfo: ?TransactionFeeInfo,
};

const DetailsTable = ({ offer, feeInfo }: Props) => {
  const { exchangeRate, fromAsset, toAsset } = offer;

  const chainConfig = useChainsConfig().ethereum;
  const providerConfig = useProviderConfig(offer.provider);
  const providerName = providerConfig?.title ?? offer.provider;

  return (
    <>
      <Table title={t('exchangeContent.label.exchangeDetails')}>
        <TableRow>
          <TableLabel>{t('exchangeContent.label.network')}</TableLabel>
          <BaseText regular color={chainConfig.color}>
            {' '}
            {chainConfig.title}
          </BaseText>
        </TableRow>
        <TableRow>
          <TableLabel>{t('exchangeContent.label.exchangeRate')}</TableLabel>
          <Row>
            <ExchangeRateText rate={exchangeRate} fromSymbol={fromAsset.symbol} toSymbol={toAsset.symbol} />
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
          <TableLabel tooltip={t('exchangeContent.tooltip.feeFormat', { provider: providerName })}>
            {t('transactions.label.allowancePlusEthFee')}
          </TableLabel>
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
    </>
  );
};

export default DetailsTable;

const Row = styled.View`
  flex-direction: row;
  align-items: center;
`;
