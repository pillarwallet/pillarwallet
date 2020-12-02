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
import { connect } from 'react-redux';
import t from 'translations/translate';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { Spacing } from 'components/Layout';
import Button from 'components/Button';
import Table, { TableRow, TableLabel, TableAmount, TableTotal, TableFee, TableUser } from 'components/Table';
import TokenReviewSummary from 'components/ReviewSummary/TokenReviewSummary';

import { defaultFiatCurrency } from 'constants/assetsConstants';
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { RARI_TOKENS_DATA } from 'constants/rariConstants';

import { formatFiat } from 'utils/common';
import { convertUSDToFiat } from 'utils/assets';

import type { RootReducerState } from 'reducers/rootReducer';
import type { TransactionFeeInfo } from 'models/Transaction';
import type { NavigationScreenProp } from 'react-navigation';
import type { EnsRegistry } from 'reducers/ensRegistryReducer';
import type { Rates } from 'models/Asset';
import type { RariPool } from 'models/RariPool';


type Props = {
  navigation: NavigationScreenProp<*>,
  feeInfo: ?TransactionFeeInfo,
  ensRegistry: EnsRegistry,
  rariFundBalance: {[RariPool]: number},
  rariTotalSupply: {[RariPool]: number},
  rates: Rates,
  baseFiatCurrency: ?string,
};

const rariLogo = require('assets/images/rari_logo.png');

const MainContainer = styled.View`
  padding: 16px 20px;
`;

const RariTransferReviewScreen = ({
  navigation,
  feeInfo,
  ensRegistry,
  rariFundBalance,
  rariTotalSupply,
  rates,
  baseFiatCurrency,
}: Props) => {
  const {
    transactionPayload, amount, rariPool, receiverAddress,
  } = navigation.state.params;

  const onNextButtonPress = () => navigation.navigate(SEND_TOKEN_PIN_CONFIRM, { transactionPayload });
  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;

  const amountInUSD = (rariFundBalance[rariPool] / rariTotalSupply[rariPool]) * amount;
  const fiatAmount = convertUSDToFiat(amountInUSD, rates, fiatCurrency);
  const formattedFiatAmount = formatFiat(fiatAmount, fiatCurrency);

  return (
    <ContainerWithHeader
      inset={{ bottom: 'never' }}
      headerProps={{
        centerItems: [{ title: t('rariContent.title.transferReviewScreen') }],
      }}
    >
      <MainContainer>
        <TokenReviewSummary
          assetSymbol={RARI_TOKENS_DATA[rariPool].symbol}
          amount={amount}
          text={t('rariContent.label.youAreTransfering')}
          assetIcon={rariLogo}
          fiatAmount={formattedFiatAmount}
        />
        <Spacing h={34} />
        <Table title={t('rariContent.label.transferDetails')}>
          <TableRow>
            <TableLabel>{t('transactions.label.recipient')}</TableLabel>
            <TableUser ensName={ensRegistry[receiverAddress]} address={receiverAddress} />
          </TableRow>
        </Table>
        <Spacing h={20} />

        <Table title={t('transactions.label.fees')}>
          <TableRow>
            <TableLabel>{t('transactions.label.allowancePlusEthFee')}</TableLabel>
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
        <Button title={t('rariContent.button.transfer')} onPress={onNextButtonPress} />
      </MainContainer>
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  transactionEstimate: { feeInfo },
  ensRegistry: { data: ensRegistry },
  rari: {
    rariFundBalance,
    rariTotalSupply,
  },
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
}: RootReducerState): $Shape<Props> => ({
  feeInfo,
  ensRegistry,
  rariFundBalance,
  rariTotalSupply,
  rates,
  baseFiatCurrency,
});

export default connect(mapStateToProps)(RariTransferReviewScreen);
