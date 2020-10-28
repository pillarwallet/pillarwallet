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
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import debounce from 'lodash.debounce';
import { utils, BigNumber as EthersBigNumber } from 'ethers';
import styled from 'styled-components/native';
import t from 'translations/translate';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import ValueInput from 'components/ValueInput';
import Button from 'components/Button';
import { Spacing } from 'components/Layout';
import FeeLabelToggle from 'components/FeeLabelToggle';
import { BaseText } from 'components/Typography';

// constants
import { SABLIER_WITHDRAW_REVIEW } from 'constants/navigationConstants';
import { ETH } from 'constants/assetsConstants';

// utils
import { getAssetDataByAddress, getAssetsAsList, isEnoughBalanceForTransactionFee } from 'utils/assets';
import { formatUnits } from 'utils/common';
import { spacing } from 'utils/variables';

// selectors
import { accountAssetsSelector } from 'selectors/assets';
import { accountBalancesSelector } from 'selectors/balances';

// actions
import { calculateSablierWithdrawTransactionEstimateAction } from 'actions/sablierActions';
import { resetEstimateTransactionAction } from 'actions/transactionEstimateActions';

// services
import { fetchStreamBalance } from 'services/sablier';

import type { NavigationScreenProp } from 'react-navigation';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Assets, Asset, Balances } from 'models/Asset';
import type { Stream } from 'models/Sablier';
import type { TransactionFeeInfo } from 'models/Transaction';


type Props = {
  calculateSablierWithdrawTransactionEstimate: (stream: Stream, amount: number, asset: Asset) => void,
  assets: Assets,
  supportedAssets: Asset[],
  navigation: NavigationScreenProp<*>,
  feeInfo: ?TransactionFeeInfo,
  isEstimating: boolean,
  balances: Balances,
  estimateErrorMessage: ?string,
  resetEstimateTransaction: () => void,
};

const FooterWrapper = styled.View`
  padding: 16px 20px;
  align-items: center;
  width: 100%;
`;

const InputWrapper = styled.View`
  padding: 16px 40px 0;
`;

const Withdraw = (props: Props) => {
  const {
    calculateSablierWithdrawTransactionEstimate,
    navigation,
    assets,
    supportedAssets,
    feeInfo,
    isEstimating,
    balances,
    estimateErrorMessage,
    resetEstimateTransaction,
  } = props;

  useEffect(() => {
    resetEstimateTransaction();
  }, []);

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [maxWithdraw, setMaxWithdraw] = useState(EthersBigNumber.from(0));
  const [isFetchingMaxWithdraw, setIsFetchingMaxWithdraw] = useState(true);

  const stream = navigation.getParam('stream');
  const { id: streamId, token, recipient } = stream;
  const assetData = getAssetDataByAddress(getAssetsAsList(assets), supportedAssets, token.id);

  let withdrawAmountInWei = 0;
  if (withdrawAmount) {
    withdrawAmountInWei = utils.parseUnits(withdrawAmount, assetData.decimals);
    if (withdrawAmountInWei.gt(maxWithdraw)) {
      withdrawAmountInWei = maxWithdraw;
    }
  }

  useEffect(() => {
    calculateSablierWithdrawTransactionEstimate(stream, withdrawAmountInWei, assetData);
  }, [withdrawAmount]);

  useEffect(() => {
    // the exact max amount to withdraw must be fetched from the blockchain
    // as we can only estimate due to the fact that the contract uses block.timestamp
    // eslint-disable-next-line
    fetchStreamBalance(streamId, recipient)
      .then((streamBalance) => {
        setMaxWithdraw(streamBalance);
        setIsFetchingMaxWithdraw(false);
      });
  }, []);

  const goToReviewScreen = () => {
    navigation.navigate(SABLIER_WITHDRAW_REVIEW, {
      withdrawAmountInWei,
      stream,
    });
  };

  const assetOptions = [assetData];

  const streamedAssetBalance: Balances = {
    [assetData.symbol]: { symbol: assetData.symbol, balance: formatUnits(maxWithdraw, assetData.decimals) },
  };

  let notEnoughForFee;
  if (feeInfo) {
    notEnoughForFee = !isEnoughBalanceForTransactionFee(balances, {
      txFeeInWei: feeInfo.fee,
      gasToken: feeInfo.gasToken,
    });
  }

  const errorMessage = notEnoughForFee
    ? t('error.notEnoughTokenForFee', { token: feeInfo?.gasToken?.symbol || ETH })
    : estimateErrorMessage;

  const isNextButtonDisabled = isEstimating
    || isFetchingMaxWithdraw
    || !withdrawAmount
    || !!errorMessage
    || !feeInfo;
  const nextButtonTitle = isEstimating ? t('label.gettingFee') : t('button.next');

  return (
    <ContainerWithHeader
      headerProps={{ centerItems: [{ title: t('sablierContent.title.withdrawScreen') }] }}
      footer={
        <FooterWrapper>
          {!!feeInfo && (
            <FeeLabelToggle
              labelText={t('label.fee')}
              txFeeInWei={feeInfo?.fee}
              gasToken={feeInfo?.gasToken}
              isLoading={isEstimating}
              hasError={!!errorMessage}
              showFiatDefault
            />
          )}
          {!!errorMessage && (
            <BaseText negative style={{ marginTop: spacing.medium }}>
              {errorMessage}
            </BaseText>
          )}
          <Spacing h={16} />
          <Button
            disabled={isNextButtonDisabled}
            title={nextButtonTitle}
            onPress={goToReviewScreen}
            block
          />
        </FooterWrapper>
      }
      minAvoidHeight={600}
    >
      <InputWrapper>
        <ValueInput
          value={withdrawAmount}
          onValueChange={setWithdrawAmount}
          assetData={assetData}
          customAssets={assetOptions}
          customBalances={streamedAssetBalance}
        />
      </InputWrapper>
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  assets: { supportedAssets },
  transactionEstimate: { isEstimating, feeInfo, errorMessage: estimateErrorMessage },
}: RootReducerState): $Shape<Props> => ({
  supportedAssets,
  isEstimating,
  feeInfo,
  estimateErrorMessage,
});

const structuredSelector = createStructuredSelector({
  assets: accountAssetsSelector,
  balances: accountBalancesSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  calculateSablierWithdrawTransactionEstimate: debounce((
    stream: Stream,
    amount: number,
    asset: Asset,
  ) => dispatch(calculateSablierWithdrawTransactionEstimateAction(stream, amount, asset)), 500),
  resetEstimateTransaction: () => dispatch(resetEstimateTransactionAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(Withdraw);
