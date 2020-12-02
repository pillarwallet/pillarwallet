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
import { createStructuredSelector } from 'reselect';
import debounce from 'lodash.debounce';
import t from 'translations/translate';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { Spacing } from 'components/Layout';
import ValueInput from 'components/ValueInput';
import Button from 'components/Button';
import FeeLabelToggle from 'components/FeeLabelToggle';

import { isEnoughBalanceForTransactionFee } from 'utils/assets';
import { noop } from 'utils/common';

import { calculateRariClaimTransactionEstimateAction } from 'actions/rariActions';
import { resetEstimateTransactionAction } from 'actions/transactionEstimateActions';

import { ETH } from 'constants/assetsConstants';
import { RARI_CLAIM_RGT_REVIEW } from 'constants/navigationConstants';
import { RARI_GOVERNANCE_TOKEN_DATA } from 'constants/rariConstants';

import { accountBalancesSelector } from 'selectors/balances';

import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { NavigationScreenProp } from 'react-navigation';
import type { TransactionFeeInfo } from 'models/Transaction';
import type { Balances } from 'models/Asset';


type Props = {
  navigation: NavigationScreenProp<*>,
  feeInfo: ?TransactionFeeInfo,
  isEstimating: boolean,
  estimateErrorMessage: ?string,
  balances: Balances,
  userUnclaimedRgt: number,
  calculateRariClaimTransactionEstimate: (amount: number) => void,
  resetEstimateTransaction: () => void,
};

const FooterWrapper = styled.View`
  padding: 24px 20px;
  align-items: center;
  width: 100%;
`;

const ValueInputWrapper = styled.View`
  padding: 24px 40px;
  align-items: center;
`;

const RariClaimRgtScreen = ({
  navigation, feeInfo, isEstimating, estimateErrorMessage, balances, userUnclaimedRgt,
  calculateRariClaimTransactionEstimate, resetEstimateTransaction,
}: Props) => {
  useEffect(() => {
    resetEstimateTransaction();
  }, []);

  const [assetValue, setAssetValue] = useState('');
  const [inputValid, setInputValid] = useState(false);

  const customBalances = {
    [RARI_GOVERNANCE_TOKEN_DATA.symbol]: {
      symbol: RARI_GOVERNANCE_TOKEN_DATA.symbol,
      balance: userUnclaimedRgt,
    },
  };

  useEffect(() => {
    if (!assetValue || !inputValid) return;
    calculateRariClaimTransactionEstimate(assetValue);
  }, [assetValue, inputValid]);

  let notEnoughForFee = false;
  if (feeInfo && parseFloat(assetValue)) {
    notEnoughForFee = !isEnoughBalanceForTransactionFee(balances, {
      txFeeInWei: feeInfo.fee,
      amount: assetValue,
      decimals: RARI_GOVERNANCE_TOKEN_DATA.decimals,
      symbol: RARI_GOVERNANCE_TOKEN_DATA.symbol,
      gasToken: feeInfo.gasToken,
    });
  }

  const errorMessage = notEnoughForFee
    ? t('error.notEnoughTokenForFee', { token: feeInfo?.gasToken?.symbol || ETH })
    : estimateErrorMessage;

  const onNextButtonPress = () => {
    navigation.navigate(RARI_CLAIM_RGT_REVIEW, {
      amount: assetValue,
    });
  };

  const nextButtonTitle = isEstimating ? t('label.gettingFee') : t('button.next');
  const isNextButtonDisabled = !!isEstimating
      || !assetValue
      || !!errorMessage
      || !inputValid
      || !feeInfo;

  return (
    <ContainerWithHeader
      inset={{ bottom: 'never' }}
      headerProps={{
        centerItems: [{ title: t('rariContent.title.claimRgtScreen') }],
      }}
      footer={(
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
          <Spacing h={16} />
          <Button
            title={nextButtonTitle}
            onPress={onNextButtonPress}
            block
            disabled={isNextButtonDisabled}
          />
        </FooterWrapper>
      )}
    >
      <ValueInputWrapper>
        <ValueInput
          assetData={RARI_GOVERNANCE_TOKEN_DATA}
          customAssets={[RARI_GOVERNANCE_TOKEN_DATA]}
          onAssetDataChange={noop}
          value={assetValue}
          onValueChange={setAssetValue}
          onFormValid={setInputValid}
          customBalances={customBalances}
        />
      </ValueInputWrapper>
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  transactionEstimate: { feeInfo, isEstimating, errorMessage: estimateErrorMessage },
  rari: { userUnclaimedRgt },
}: RootReducerState): $Shape<Props> => ({
  feeInfo,
  estimateErrorMessage,
  isEstimating,
  userUnclaimedRgt,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
});

const combinedMapStateToProps = (state: RootReducerState, props: Props): $Shape<Props> => ({
  ...structuredSelector(state, props),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  calculateRariClaimTransactionEstimate: debounce((
    amount: number,
  ) => dispatch(calculateRariClaimTransactionEstimateAction(amount)), 500),
  resetEstimateTransaction: () => dispatch(resetEstimateTransactionAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(RariClaimRgtScreen);
