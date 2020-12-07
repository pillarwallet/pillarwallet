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
import t from 'translations/translate';
import { createStructuredSelector } from 'reselect';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { Spacing } from 'components/Layout';
import Button from 'components/Button';
import Table, { TableRow, TableLabel, TableAmount, TableTotal, TableFee } from 'components/Table';
import TokenReviewSummary from 'components/ReviewSummary/TokenReviewSummary';
import Toast from 'components/Toast';
import { BaseText } from 'components/Typography';

import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { RARI_GOVERNANCE_TOKEN_DATA } from 'constants/rariConstants';
import { defaultFiatCurrency } from 'constants/assetsConstants';

import { getRariClaimRgtTransaction, getClaimRtgFee } from 'utils/rari';
import { formatFiat, reportErrorLog } from 'utils/common';

import { activeAccountAddressSelector } from 'selectors';

import type { RootReducerState } from 'reducers/rootReducer';
import type { TransactionFeeInfo } from 'models/Transaction';
import type { NavigationScreenProp } from 'react-navigation';


type Props = {
  navigation: NavigationScreenProp<*>,
  feeInfo: ?TransactionFeeInfo,
  accountAddress: string,
  baseFiatCurrency: ?string,
  rtgPrice: {
    [string]: number,
  },
};

const rariLogo = require('assets/images/rari_logo.png');

const MainContainer = styled.View`
  padding: 16px 20px;
`;

const RariClaimRgtReview = ({
  navigation, feeInfo, accountAddress, baseFiatCurrency, rtgPrice,
}: Props) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isFetchingFee, setIsFetchingFee] = useState(false);
  const [claimFee, setClaimFee] = useState(null);

  useEffect(() => {
    setIsFetchingFee(true);
    getClaimRtgFee().then((fee) => {
      if (fee === null) {
        Toast.show({
          message: t('toast.rariFetchDataFailed'),
          emoji: 'hushed',
          supportLink: true,
          autoClose: false,
        });
      }
      setClaimFee(fee);
      setIsFetchingFee(false);
    }).catch((error) => {
      reportErrorLog("Rari service failed: can't fetch claim rtg fee", error);
      Toast.show({
        message: t('toast.rariFetchDataFailed'),
        emoji: 'hushed',
        supportLink: true,
        autoClose: false,
      });
      setIsFetchingFee(false);
    });
  }, []);

  const { amount } = navigation.state.params;

  const onNextButtonPress = async () => {
    if (isSubmitted) return;
    setIsSubmitted(true);

    if (!feeInfo?.fee) {
      Toast.show({
        message: t('toast.cannotDepositAsset'),
        emoji: 'woman-shrugging',
        supportLink: true,
      });
      setIsSubmitted(false);
      return;
    }

    let transactionPayload = await getRariClaimRgtTransaction(
      accountAddress,
      amount,
      feeInfo?.fee,
    );

    if (!transactionPayload) {
      Toast.show({
        message: t('toast.cannotDepositAsset'),
        emoji: 'woman-shrugging',
        supportLink: true,
      });
      setIsSubmitted(false);
      return;
    }

    if (feeInfo?.gasToken) transactionPayload = { ...transactionPayload, gasToken: feeInfo?.gasToken };

    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, { transactionPayload });
    setIsSubmitted(false);
  };

  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;

  const fiatAmount = amount * rtgPrice[fiatCurrency];
  const formattedFiatAmount = formatFiat(fiatAmount, fiatCurrency);


  return (
    <ContainerWithHeader
      inset={{ bottom: 'never' }}
      headerProps={{
        centerItems: [{ title: t('rariContent.title.claimRgtReviewScreen') }],
      }}
    >
      <MainContainer>
        <TokenReviewSummary
          assetSymbol={RARI_GOVERNANCE_TOKEN_DATA.symbol}
          amount={amount}
          text={t('rariContent.label.youAreClaiming')}
          assetIcon={rariLogo}
          fiatAmount={formattedFiatAmount}
        />
        <Spacing h={34} />
        {!!claimFee && (
          <>
            <Table title={t('rariContent.label.claimingDetails')}>
              <TableRow>
                <TableLabel tooltip={t('rariContent.tooltip.burnTakeback')}>
                  {t('rariContent.label.burnTakeback')}
                </TableLabel>
                <BaseText>{t('percentValue', { value: (claimFee * 100).toFixed(2) })}</BaseText>
              </TableRow>
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
            <TableFee txFeeInWei={feeInfo?.fee} gasToken={feeInfo?.gasToken} />
          </TableRow>
        </Table>
        <Spacing h={48} />
        <Button title={t('rariContent.button.claimRewards')} onPress={onNextButtonPress} isLoading={isFetchingFee} />
      </MainContainer>
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  transactionEstimate: { feeInfo },
  appSettings: { data: { baseFiatCurrency } },
  rari: { rtgPrice },
}: RootReducerState): $Shape<Props> => ({
  feeInfo,
  baseFiatCurrency,
  rtgPrice,
});

const structuredSelector = createStructuredSelector({
  accountAddress: activeAccountAddressSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(RariClaimRgtReview);
