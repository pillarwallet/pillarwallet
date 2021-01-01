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

import React, { useState, useEffect } from 'react';
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import { utils } from 'ethers';
import t from 'translations/translate';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { Spacing } from 'components/Layout';
import Button from 'components/Button';
import Table, { TableRow, TableLabel, TableAmount, TableTotal, TableFee } from 'components/Table';
import TokenReviewSummary from 'components/ReviewSummary/TokenReviewSummary';
import { BaseText } from 'components/Typography';
import Toast from 'components/Toast';

import { ETH, defaultFiatCurrency } from 'constants/assetsConstants';
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';

import { formatUnits, formatFiat } from 'utils/common';
import { getFormattedRate } from 'utils/assets';
import { getWithdrawalFeeRate } from 'utils/rari';

import type { RootReducerState } from 'reducers/rootReducer';
import type { TransactionFeeInfo } from 'models/Transaction';
import type { Rates } from 'models/Asset';
import type { NavigationScreenProp } from 'react-navigation';


type Props = {
  navigation: NavigationScreenProp<*>,
  feeInfo: ?TransactionFeeInfo,
  baseFiatCurrency: ?string,
  rates: Rates,
};

const MainContainer = styled.View`
  padding: 16px 20px;
`;

const RariWithdrawReviewScreen = ({
  navigation, feeInfo, baseFiatCurrency, rates,
}: Props) => {
  const {
    transactionPayload, assetSymbol, amount, exchangeFeeBN, slippage, rariPool,
  } = navigation.state.params;

  const [withdrawalFeeRate, setWithdrawalFeeRate] = useState(null);
  useEffect(() => {
    getWithdrawalFeeRate(rariPool)
      .then((_withdrawalFeeRate) => {
        if (!_withdrawalFeeRate) {
          Toast.show({
            message: t('toast.rariWithdrawFeeRateFailed'),
            emoji: 'hushed',
          });
        }
        setWithdrawalFeeRate(_withdrawalFeeRate);
      })
      .catch(() => {});
  }, []);

  const onNextButtonPress = () => navigation.navigate(SEND_TOKEN_PIN_CONFIRM, { transactionPayload });

  const formattedExchangeFee = utils.formatEther(exchangeFeeBN);

  const decimals = feeInfo?.gasToken?.decimals || 18;
  const fee = feeInfo?.fee;
  const formattedFee = fee ? formatUnits(fee.toString(), decimals) : '0';

  const summaryTitles = {
    STABLE_POOL: t('rariContent.label.youAreWithdrawingFromStablePool'),
    YIELD_POOL: t('rariContent.label.youAreWithdrawingFromYieldPool'),
    ETH_POOL: t('rariContent.label.youAreWithdrawingFromEthPool'),
  };

  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;

  const withdrawalFee = assetSymbol && getFormattedRate(
    rates, amount * parseFloat(formatUnits(withdrawalFeeRate || '0', 18)), assetSymbol, fiatCurrency);

  return (
    <ContainerWithHeader
      inset={{ bottom: 'never' }}
      headerProps={{
        centerItems: [{ title: t('rariContent.title.withdrawReviewScreen') }],
      }}
    >
      <MainContainer>
        <TokenReviewSummary
          assetSymbol={assetSymbol}
          amount={amount}
          text={summaryTitles[rariPool]}
        />
        <Spacing h={34} />
        {(slippage || exchangeFeeBN.gt(0) || withdrawalFeeRate) && (
          <>
            <Table title={t('rariContent.label.withdrawDetails')}>
              {!!slippage && (
                <TableRow>
                  <TableLabel>{t('rariContent.label.maxSlippage')} </TableLabel>
                  <BaseText regular> {t('percentValue', { value: slippage.toFixed(2) })}</BaseText>
                </TableRow>
              )}
              {exchangeFeeBN.gt(0) && (
                <TableRow>
                  <TableLabel tooltip={t('rariContent.tooltip.rariExchangeFee')}>
                    {t('rariContent.label.rariExchangeFee')}
                  </TableLabel>
                  <TableAmount amount={formattedExchangeFee} token={ETH} />
                </TableRow>
              )}
              {withdrawalFeeRate && (
                <TableRow>
                  <TableLabel tooltip={t('rariContent.tooltip.rariWithdrawalFee')}>
                    {t('rariContent.label.rariWithdrawalFee')}
                  </TableLabel>
                  <BaseText>{formatFiat(withdrawalFee, fiatCurrency)}</BaseText>
                </TableRow>
              )}
            </Table>
            <Spacing h={20} />
          </>
        )}

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
            <TableAmount amount={(+formattedExchangeFee) + (+formattedFee)} token={ETH} />
          </TableRow>
        </Table>
        <Spacing h={48} />
        <Button title={t('rariContent.button.withdraw')} onPress={onNextButtonPress} />
      </MainContainer>
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

export default connect(mapStateToProps)(RariWithdrawReviewScreen);
