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
import { BigNumber } from 'bignumber.js';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import styled from 'styled-components/native';
import t from 'translations/translate';
import { format as formatDate } from 'date-fns';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Button from 'components/Button';
import { Spacing } from 'components/Layout';
import Table, { TableRow, TableLabel, TableAmount, TableTotal, TableUser, TableFee } from 'components/Table';
import TokenReviewSummary from 'components/ReviewSummary/TokenReviewSummary';
import { BaseText } from 'components/Typography';
import Icon from 'components/Icon';

import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { SABLIER_CREATE_STREAM } from 'constants/sablierConstants';
import { getCreateStreamFeeAndTransaction } from 'services/sablier';
import {
  countDownDHMS,
  formatUnits,
} from 'utils/common';
import { getAssetData, getAssetsAsList, isEnoughBalanceForTransactionFee } from 'utils/assets';
import { getTimestamp } from 'utils/sablier';
import { themedColors } from 'utils/themes';
import { activeAccountAddressSelector } from 'selectors';
import { accountAssetsSelector } from 'selectors/assets';
import { useGasTokenSelector } from 'selectors/smartWallet';
import { accountBalancesSelector } from 'selectors/balances';

import type { Assets, Asset, Balances } from 'models/Asset';
import type { RootReducerState } from 'reducers/rootReducer';
import type { NavigationScreenProp } from 'react-navigation';
import type { EnsRegistry } from 'reducers/ensRegistryReducer';
import type { GasToken } from 'models/Transaction';


type Props = {
  navigation: NavigationScreenProp<*>,
  activeAccountAddress: string,
  assets: Assets,
  supportedAssets: Asset[],
  useGasToken: boolean,
  ensRegistry: EnsRegistry,
  balances: Balances,
};

type State = {
  isFetchingTransactionFee: boolean,
  txFeeInWei: ?BigNumber,
  gasToken: ?GasToken,
  transactionPayload: ?Object,
};

const RootContainer = styled.View`
  padding: 16px 20px;
`;

const ClockIcon = styled(Icon)`
  color: ${themedColors.labelTertiary};
  font-size: 14px;
`;

class NewStreamReview extends React.Component<Props, State> {
  state = {
    isFetchingTransactionFee: true,
    txFeeInWei: 0,
    gasToken: null,
    transactionPayload: null,
  }

  async componentDidMount() {
    const {
      navigation, activeAccountAddress, assets, supportedAssets, useGasToken,
    } = this.props;
    const {
      startDate, endDate, receiverAddress, assetValue, assetSymbol,
    } = navigation.state.params;

    const assetData = getAssetData(getAssetsAsList(assets), supportedAssets, assetSymbol);

    const {
      txFeeInWei,
      gasToken,
      transactionPayload,
    } = await getCreateStreamFeeAndTransaction(
      activeAccountAddress,
      receiverAddress,
      assetValue,
      assetData,
      getTimestamp(startDate),
      getTimestamp(endDate),
      useGasToken,
    );

    this.setState({
      isFetchingTransactionFee: false,
      gasToken,
      transactionPayload,
      txFeeInWei,
    });
  }

  onSubmit = () => {
    const { transactionPayload } = this.state;

    this.props.navigation.navigate(SEND_TOKEN_PIN_CONFIRM, {
      transactionPayload,
      goBackDismiss: true,
      transactionType: SABLIER_CREATE_STREAM,
    });
  }

  render() {
    const {
      navigation, ensRegistry, balances, assets, supportedAssets,
    } = this.props;
    const { isFetchingTransactionFee, txFeeInWei, gasToken } = this.state;
    const {
      assetSymbol, assetValue, receiverAddress, startDate, endDate,
    } = navigation.state.params;
    const assetData = getAssetData(getAssetsAsList(assets), supportedAssets, assetSymbol);
    const { days, hours, minutes } = countDownDHMS(endDate.getTime() - startDate.getTime());

    const startStreamButtonTitle = isFetchingTransactionFee
      ? t('label.gettingFee')
      : t('sablierContent.button.startStream');
    const isEnoughForFee = !!txFeeInWei && isEnoughBalanceForTransactionFee(balances, {
      txFeeInWei,
      amount: assetValue,
      decimals: assetData?.decimals,
      symbol: assetSymbol,
      gasToken,
    });
    const isStartStreamButtonDisabled = !!isFetchingTransactionFee
    || !isEnoughForFee
    || (!!txFeeInWei && !txFeeInWei.gt(0));

    return (
      <ContainerWithHeader
        inset={{ bottom: 'never' }}
        headerProps={{ centerItems: [{ title: t('sablierContent.title.newStreamReviewScreen') }] }}
        putContentInScrollView
      >
        <RootContainer>
          <TokenReviewSummary
            assetSymbol={assetSymbol}
            text={t('sablierContent.label.youAreStreaming')}
            amount={formatUnits(assetValue, assetData.decimals)}
          />
          <Spacing h={36} />
          <Table title={t('sablierContent.label.streamDetails')}>
            <TableRow>
              <TableLabel>{t('transactions.label.recipient')}</TableLabel>
              <TableUser ensName={ensRegistry[receiverAddress]} address={receiverAddress} />
            </TableRow>
            <TableRow>
              <TableLabel>{t('sablierContent.label.startTime')}</TableLabel>
              <BaseText regular>{formatDate(startDate, 'ddd D, MMMM H:mm')}</BaseText>
            </TableRow>
            <TableRow>
              <TableLabel>{t('sablierContent.label.endTime')}</TableLabel>
              <BaseText regular>{formatDate(endDate, 'ddd D, MMMM H:mm')}</BaseText>
            </TableRow>
            <TableRow>
              <TableLabel>{t('sablierContent.label.estStreamTime')}</TableLabel>
              <BaseText><ClockIcon name="pending" /> {t('timeDaysHoursMinutes', { days, hours, minutes })}</BaseText>
            </TableRow>
          </Table>
          <Spacing h={38} />
          <Table title={t('transactions.label.fees')}>
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
          <Spacing h={50} />
          <Button
            title={startStreamButtonTitle}
            onPress={this.onSubmit}
            disabled={isStartStreamButtonDisabled}
          />
        </RootContainer>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  assets: { supportedAssets },
  ensRegistry: { data: ensRegistry },
}: RootReducerState): $Shape<Props> => ({
  supportedAssets,
  ensRegistry,
});

const structuredSelector = createStructuredSelector({
  activeAccountAddress: activeAccountAddressSelector,
  assets: accountAssetsSelector,
  useGasToken: useGasTokenSelector,
  balances: accountBalancesSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(NewStreamReview);
