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
import { format as formatDate } from 'date-fns';

// actions
import {
  estimateTransactionsAction,
  resetEstimateTransactionAction,
} from 'actions/transactionEstimateActions';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Button from 'components/Button';
import { Spacing } from 'components/Layout';
import Table, { TableRow, TableLabel, TableAmount, TableTotal, TableUser, TableFee } from 'components/Table';
import TokenReviewSummary from 'components/ReviewSummary/TokenReviewSummary';
import { BaseText } from 'components/Typography';
import Icon from 'components/Icon';
import Toast from 'components/Toast';

// constants
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { SABLIER_CREATE_STREAM } from 'constants/sablierConstants';
import { ETH } from 'constants/assetsConstants';
import { CHAIN } from 'constants/chainConstants';

// services
import { getSablierCreateStreamTransaction } from 'services/sablier';

// utils
import { countDownDHMS, formatUnits } from 'utils/common';
import { getAssetData, getAssetsAsList, isEnoughBalanceForTransactionFee } from 'utils/assets';
import { getTimestamp } from 'utils/sablier';
import { themedColors } from 'utils/themes';

// selectors
import { activeAccountAddressSelector } from 'selectors';
import {
  accountEthereumAssetsSelector,
  ethereumSupportedAssetsSelector,
} from 'selectors/assets';
import { accountEthereumWalletAssetsBalancesSelector } from 'selectors/balances';

// types
import type { AssetsBySymbol, Asset } from 'models/Asset';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { NavigationScreenProp } from 'react-navigation';
import type { EnsRegistry } from 'reducers/ensRegistryReducer';
import type { TransactionFeeInfo, TransactionToEstimate } from 'models/Transaction';
import type { WalletAssetsBalances } from 'models/Balances';


type Props = {
  navigation: NavigationScreenProp<*>,
  activeAccountAddress: string,
  assets: AssetsBySymbol,
  supportedAssets: Asset[],
  ensRegistry: EnsRegistry,
  balances: WalletAssetsBalances,
  feeInfo: ?TransactionFeeInfo,
  isEstimating: boolean,
  estimateErrorMessage: ?string,
  estimateTransactions: (transactions: TransactionToEstimate[]) => void,
  resetEstimateTransaction: () => void,
};

const RootContainer = styled.View`
  padding: 16px 20px;
`;

const ClockIcon = styled(Icon)`
  color: ${themedColors.labelTertiary};
  font-size: 14px;
`;

class NewStreamReview extends React.Component<Props> {
  transactionPayload: ?Object;
  asset: Asset;

  async componentDidMount() {
    const {
      navigation,
      resetEstimateTransaction,
      estimateTransactions,
      activeAccountAddress,
    } = this.props;

    resetEstimateTransaction();

    const {
      startDate,
      endDate,
      receiverAddress,
      assetValue,
    } = navigation.state.params;

    this.transactionPayload = await getSablierCreateStreamTransaction(
      activeAccountAddress,
      receiverAddress,
      assetValue,
      this.getAsset(),
      getTimestamp(startDate),
      getTimestamp(endDate),
    );

    const { to, data: transactionData, sequentialTransactions } = this.transactionPayload;
    const transactions = [{ to, value: 0, data: transactionData }];

    sequentialTransactions.forEach((sequential) => {
      transactions.push({ to: sequential.to, value: sequential.value, data: sequential.data });
    });

    estimateTransactions(transactions);
  }

  getAsset = () => {
    const { assets, supportedAssets, navigation } = this.props;
    const { assetSymbol } = navigation.state.params;
    return getAssetData(getAssetsAsList(assets), supportedAssets, assetSymbol);
  }

  onSubmit = () => {
    const { feeInfo } = this.props;

    if (!feeInfo) {
      Toast.show({
        message: t('toast.cannotCreateStream'),
        emoji: 'woman-shrugging',
        supportLink: true,
      });
      return;
    }

    const { fee: txFeeInWei, gasToken } = feeInfo;

    const transactionPayload = {
      ...this.transactionPayload,
      txFeeInWei,
      gasToken,
    };

    this.props.navigation.navigate(SEND_TOKEN_PIN_CONFIRM, {
      transactionPayload,
      goBackDismiss: true,
      transactionType: SABLIER_CREATE_STREAM,
    });
  }

  render() {
    const {
      navigation,
      ensRegistry,
      balances,
      isEstimating,
      feeInfo,
      estimateErrorMessage,
    } = this.props;

    const asset = this.getAsset();
    const {
      assetSymbol, assetValue, receiverAddress, startDate, endDate,
    } = navigation.state.params;
    const { days, hours, minutes } = countDownDHMS(endDate.getTime() - startDate.getTime());

    const startStreamButtonTitle = isEstimating
      ? t('label.gettingFee')
      : t('sablierContent.button.startStream');

    let notEnoughForFee;
    if (feeInfo) {
      const balanceCheckTransaction = {
        txFeeInWei: feeInfo?.fee,
        amount: assetValue,
        decimals: asset.decimals,
        symbol: assetSymbol,
        gasToken: feeInfo?.gasToken,
      };
      notEnoughForFee = !isEnoughBalanceForTransactionFee(balances, balanceCheckTransaction, CHAIN.ETHEREUM);
    }

    const errorMessage = notEnoughForFee
      ? t('error.notEnoughTokenForFee', { token: feeInfo?.gasToken?.symbol || ETH })
      : estimateErrorMessage;

    const isStartStreamButtonDisabled = isEstimating
      || !!errorMessage
      || !feeInfo;

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
            amount={formatUnits(assetValue, asset.decimals)}
            chain={CHAIN.ETHEREUM}
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
              <TableFee txFeeInWei={feeInfo?.fee} gasToken={feeInfo?.gasToken} chain={CHAIN.ETHEREUM} />
            </TableRow>
            <TableRow>
              <TableLabel>{t('transactions.label.pillarFee')}</TableLabel>
              <TableAmount amount={0} chain={CHAIN.ETHEREUM} />
            </TableRow>
            <TableRow>
              <TableTotal>{t('transactions.label.totalFee')}</TableTotal>
              <TableFee txFeeInWei={feeInfo?.fee} gasToken={feeInfo?.gasToken} chain={CHAIN.ETHEREUM} />
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
  ensRegistry: { data: ensRegistry },
  transactionEstimate: { isEstimating, feeInfo, errorMessage: estimateErrorMessage },
}: RootReducerState): $Shape<Props> => ({
  ensRegistry,
  isEstimating,
  feeInfo,
  estimateErrorMessage,
});

const structuredSelector = createStructuredSelector({
  activeAccountAddress: activeAccountAddressSelector,
  assets: accountEthereumAssetsSelector,
  balances: accountEthereumWalletAssetsBalancesSelector,
  supportedAssets: ethereumSupportedAssetsSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  estimateTransactions: (
    transactions: TransactionToEstimate[],
  ) => dispatch(estimateTransactionsAction(transactions, CHAIN.ETHEREUM)),
  resetEstimateTransaction: () => dispatch(resetEstimateTransactionAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(NewStreamReview);
