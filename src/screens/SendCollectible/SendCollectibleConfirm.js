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

import React, { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { utils } from 'ethers';
import { createStructuredSelector } from 'reselect';
import get from 'lodash.get';
import { getEnv } from 'configs/envConfig';
import t from 'translations/translate';

// actions
import { estimateTransactionAction, resetEstimateTransactionAction } from 'actions/transactionEstimateActions';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Table, { TableRow, TableLabel, TableAmount, TableTotal, TableUser, TableFee } from 'components/Table';
import Button from 'components/Button';
import { Spacing, ScrollWrapper } from 'components/Layout';
import CollectibleReviewSummary from 'components/ReviewSummary/CollectibleReviewSummary';
import { Paragraph } from 'components/Typography';
import Toast from 'components/Toast';

// constants
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { ETH } from 'constants/assetsConstants';

// utils
import { isEnoughBalanceForTransactionFee } from 'utils/assets';
import { spacing } from 'utils/variables';
import { themedColors } from 'utils/themes';
import { reportErrorLog } from 'utils/common';

// services
import { fetchRinkebyETHBalance } from 'services/assets';

// selectors
import { accountBalancesSelector } from 'selectors/balances';

// types
import type { CollectibleTransactionPayload, TransactionFeeInfo } from 'models/Transaction';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { AssetData, Balances } from 'models/Asset';


type Props = {
  navigation: NavigationScreenProp<*>,
  keyBasedWalletAddress: string,
  balances: Balances,
  isOnline: boolean,
  feeInfo: ?TransactionFeeInfo,
  isEstimating: boolean,
  estimateErrorMessage: ?string,
  resetEstimateTransaction: () => void,
  estimateTransaction: (recipient: string, assetData: AssetData) => void,
};

const WarningMessage = styled(Paragraph)`
  text-align: center;
  color: ${themedColors.negative};
  padding-bottom: ${spacing.small}px;
`;

const SendCollectibleConfirm = ({
  isOnline,
  balances,
  navigation,
  resetEstimateTransaction,
  estimateTransaction,
  keyBasedWalletAddress,
  feeInfo,
  isEstimating,
  estimateErrorMessage,
}: Props) => {
  const isKovanNetwork = getEnv().NETWORK_PROVIDER === 'kovan';
  const receiverEnsName = navigation.getParam('receiverEnsName');
  const assetData = navigation.getParam('assetData', {});
  const receiver = navigation.getParam('receiver');
  const navigationSource = navigation.getParam('source');

  const {
    name,
    tokenType,
    id: tokenId,
    contractAddress,
  } = assetData;

  const transactionPayload: $Shape<CollectibleTransactionPayload> = {
    to: receiver,
    receiverEnsName,
    name,
    contractAddress,
    tokenType,
    tokenId,
  };

  /**
   * we're fetching Rinkeby ETH if current network is Kovan because
   * our used collectibles in testnets are sent only using Rinkeby
   * so if we're not on Rinkeby itself we can only check Rinkeby balance
   * using this additional call
   */
  const [rinkebyEth, setRinkebyEth] = useState(0);
  const fetchRinkebyEth = () => fetchRinkebyETHBalance(keyBasedWalletAddress)
    .then(setRinkebyEth)
    .catch((error) => {
      reportErrorLog('SendCollectibleConfirm screen fetchRinkebyEth failed', { error, keyBasedWalletAddress });
      return null;
    });

  useEffect(() => {
    resetEstimateTransaction();
    estimateTransaction(receiver, assetData);
    if (isKovanNetwork) fetchRinkebyEth();
  }, []);

  const handleFormSubmit = () => {
    Keyboard.dismiss();

    if (!feeInfo) {
      Toast.show({
        message: t('toast.cannotSendCollectible'),
        emoji: 'woman-shrugging',
        supportLink: true,
      });
      return;
    }

    const { fee: txFeeInWei, gasToken } = feeInfo;

    let transactionPayloadUpdated = {
      ...transactionPayload,
      txFeeInWei,
    };

    if (gasToken) transactionPayloadUpdated = { ...transactionPayloadUpdated, gasToken };

    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, {
      transactionPayload: transactionPayloadUpdated,
      source: navigationSource,
    });
  };

  let isEnoughForFee = true;

  if (feeInfo) {
    // rinkeby testnet fee check
    const txFee = utils.formatEther(feeInfo.fee.toString());
    const canProceedKovanTesting = isKovanNetwork && parseFloat(rinkebyEth) > parseFloat(txFee);

    // fee
    const balanceCheckTransaction = {
      txFeeInWei: feeInfo.fee,
      amount: 0,
      gasToken: feeInfo.gasToken,
    };
    isEnoughForFee = canProceedKovanTesting || isEnoughBalanceForTransactionFee(balances, balanceCheckTransaction);
  }

  const feeSymbol = get(feeInfo?.gasToken, 'symbol', ETH);
  const errorMessage = isEnoughForFee
    ? estimateErrorMessage
    : t('error.notEnoughTokenForFee', { token: feeSymbol });

  // confirm button
  const isConfirmDisabled = isEstimating || !isOnline || !feeInfo || !!errorMessage;
  const confirmButtonTitle = isEstimating
    ? t('label.gettingFee')
    : t('transactions.button.send');

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
        <CollectibleReviewSummary collectible={assetData} text={t('transactions.label.youAreSending')} />
        <Spacing h={32} />
        <Table>
          <TableRow>
            <TableLabel>{t('transactions.label.recipient')}</TableLabel>
            <TableUser address={receiver} />
          </TableRow>
          <TableRow>
            <TableLabel>{t('transactions.label.ethFee')}</TableLabel>
            <TableFee txFeeInWei={feeInfo?.fee} gasToken={feeInfo?.gasToken} />
          </TableRow>
          <TableRow>
            <TableLabel>{t('transactions.label.pillarFee')}</TableLabel>
            <TableAmount amount={0} />
          </TableRow>
          {isKovanNetwork && (
            <TableRow>
              <TableLabel style={{ flex: 1 }}>
                {/* eslint-disable i18next/no-literal-string */}
                Balance in Rinkeby ETH (visible in dev and staging while on Kovan)
              </TableLabel>
              <TableAmount amount={rinkebyEth} token={ETH} />
            </TableRow>
          )}
          <TableRow>
            <TableTotal>{t('transactions.label.totalFee')}</TableTotal>
            <TableFee txFeeInWei={feeInfo?.fee} gasToken={feeInfo?.gasToken} />
          </TableRow>
        </Table>
        <Spacing h={40} />
        {!!errorMessage && <WarningMessage small>{errorMessage}</WarningMessage>}
        <Button
          disabled={isConfirmDisabled}
          onPress={handleFormSubmit}
          title={confirmButtonTitle}
        />
      </ScrollWrapper>
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  session: { data: { isOnline } },
  wallet: { data: walletData },
  transactionEstimate: {
    feeInfo,
    isEstimating,
    errorMessage: estimateErrorMessage,
  },
}: RootReducerState): $Shape<Props> => ({
  keyBasedWalletAddress: walletData?.address,
  isOnline,
  feeInfo,
  isEstimating,
  estimateErrorMessage,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  resetEstimateTransaction: () => dispatch(resetEstimateTransactionAction()),
  estimateTransaction: (
    recipient: string,
    assetData: AssetData,
  ) => dispatch(estimateTransactionAction(recipient, 0, null, assetData)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(SendCollectibleConfirm);
