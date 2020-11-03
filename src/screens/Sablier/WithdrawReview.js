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
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import styled from 'styled-components/native';
import t from 'translations/translate';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Button from 'components/Button';
import { Spacing } from 'components/Layout';
import Table, { TableRow, TableLabel, TableAmount, TableTotal, TableUser, TableFee } from 'components/Table';
import TokenReviewSummary from 'components/ReviewSummary/TokenReviewSummary';

import { findEnsNameCaseInsensitive, formatUnits } from 'utils/common';
import { getAssetDataByAddress, getAssetsAsList } from 'utils/assets';
import { accountAssetsSelector } from 'selectors/assets';
import { activeAccountAddressSelector } from 'selectors';
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { getSablierWithdrawTransaction } from 'services/sablier';
import type { NavigationScreenProp } from 'react-navigation';
import type { RootReducerState } from 'reducers/rootReducer';
import type { Assets, Asset } from 'models/Asset';
import type { EnsRegistry } from 'reducers/ensRegistryReducer';
import type { TransactionFeeInfo } from 'models/Transaction';


type Props = {
  navigation: NavigationScreenProp<*>,
  feeInfo: ?TransactionFeeInfo,
  accountAddress: string,
  ensRegistry: EnsRegistry,
  assets: Assets,
  supportedAssets: Asset[],
};

const MainContainer = styled.View`
  padding: 16px 20px;
`;

const WithdrawReview = ({
  navigation,
  accountAddress,
  ensRegistry,
  assets,
  supportedAssets,
  feeInfo,
}: Props) => {
  const { withdrawAmountInWei, stream } = navigation.state.params;

  const assetAddress = stream.token.id;
  const assetData = getAssetDataByAddress(getAssetsAsList(assets), supportedAssets, assetAddress);

  const onNextButtonPress = () => {
    let transactionPayload = getSablierWithdrawTransaction(
      accountAddress,
      withdrawAmountInWei,
      assetData,
      stream,
    );

    if (feeInfo?.gasToken) {
      transactionPayload = {
        ...transactionPayload,
        gasToken: feeInfo?.gasToken,
      };
    }

    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, {
      transactionPayload,
      goBackDismiss: true,
    });
  };

  const withdrawAmount = formatUnits(withdrawAmountInWei, assetData.decimals);

  return (
    <ContainerWithHeader
      headerProps={{ centerItems: [{ title: t('sablierContent.title.withdrawReviewScreen') }] }}
    >
      <MainContainer>
        <TokenReviewSummary
          assetSymbol={assetData.symbol}
          text={t('sablierContent.label.youAreWithdrawing')}
          amount={withdrawAmount}
        />
        <Spacing h={42} />
        <Table>
          <TableRow>
            <TableLabel>{t('transactions.label.sender')}</TableLabel>
            <TableUser ensName={findEnsNameCaseInsensitive(ensRegistry, stream.sender)} address={stream.sender} />
          </TableRow>
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
        <Button title={t('sablierContent.button.confirmWithdraw')} block onPress={onNextButtonPress} />
      </MainContainer>
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  ensRegistry: { data: ensRegistry },
  assets: { supportedAssets },
}: RootReducerState): $Shape<Props> => ({
  ensRegistry,
  supportedAssets,
});

const structuredSelector = createStructuredSelector({
  accountAddress: activeAccountAddressSelector,
  assets: accountAssetsSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(WithdrawReview);
