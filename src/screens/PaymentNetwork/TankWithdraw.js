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
import styled from 'styled-components/native';
import debounce from 'lodash.debounce';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';
import isEmpty from 'lodash.isempty';

// actions
import { resetEstimateTransactionAction } from 'actions/transactionEstimateActions';
import { estimateTokenWithdrawFromAccountDepositTransactionAction } from 'actions/etherspotActions';
import { fetchAssetsBalancesAction } from 'actions/assetsActions';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { BaseText } from 'components/Typography';
import FeeLabelToggle from 'components/FeeLabelToggle';
import Button from 'components/Button';
import ValueInput from 'components/ValueInput';

// constants
import { ETH } from 'constants/assetsConstants';
import { TANK_WITHDRAW_CONFIRM } from 'constants/navigationConstants';
import { PPN_TOKEN } from 'configs/assetsConfig';

// selectors
import { accountBalancesSelector } from 'selectors/balances';
import { accountAssetsSelector } from 'selectors/assets';
import { availableStakeSelector } from 'selectors/paymentNetwork';

// utils
import { spacing } from 'utils/variables';
import { getAssetData, getAssetsAsList, isEnoughBalanceForTransactionFee } from 'utils/assets';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Assets, Balances } from 'models/Asset';
import type { TransactionFeeInfo } from 'models/Transaction';


type Props = {
  balances: Balances,
  navigation: NavigationScreenProp<*>,
  isEstimating: boolean,
  feeInfo: ?TransactionFeeInfo,
  estimateTokenWithdrawTransaction: (amount: number) => void,
  estimateErrorMessage: ?string,
  resetEstimateTransaction: () => void,
  accountAssets: Assets,
  fetchAssetsBalances: () => void,
  availableStake: number,
  isOnline: boolean,
};

const FeeInfo = styled.View`
  align-items: center;
  margin-bottom: ${spacing.large}px;
`;

const FooterInner = styled.View`
  padding: ${spacing.large}px;
  width: 100%;
  justify-content: center;
  align-items: center;
`;

const InputWrapper = styled.View`
  padding: 24px 40px 0;
  z-index: 10;
`;

const TankWithdraw = ({
  navigation,
  balances,
  feeInfo,
  isEstimating,
  estimateTokenWithdrawTransaction,
  estimateErrorMessage,
  resetEstimateTransaction,
  accountAssets,
  fetchAssetsBalances,
  availableStake,
  isOnline,
}: Props) => {
  useEffect(() => {
    resetEstimateTransaction();
    fetchAssetsBalances();
  }, []);

  const [withdrawAmount, setWithdrawAmount] = useState(null);
  const [inputValid, setInputValid] = useState(false);

  const PPNAsset = getAssetData(getAssetsAsList(accountAssets), [], PPN_TOKEN);

  useEffect(() => {
    if (!withdrawAmount || isEmpty(PPNAsset) || !inputValid) return;
    estimateTokenWithdrawTransaction(withdrawAmount);
  }, [withdrawAmount, PPNAsset, inputValid]);

  const accountDepositBalance: Balances = { [PPN_TOKEN]: { symbol: PPN_TOKEN, balance: availableStake.toString() } };

  let notEnoughForFee;
  if (feeInfo) {
    notEnoughForFee = !isEnoughBalanceForTransactionFee(balances, {
      txFeeInWei: feeInfo.fee,
      amount: withdrawAmount,
      decimals: PPNAsset.decimals,
      symbol: PPNAsset.symbol,
      gasToken: feeInfo.gasToken,
    });
  }

  const errorMessage = notEnoughForFee
    ? t('error.notEnoughTokenForFee', { token: feeInfo?.gasToken?.symbol || ETH })
    : estimateErrorMessage;

  const showNextButton = withdrawAmount !== null; // only if amount input touched
  const isNextButtonDisabled = !!isEstimating
    || !withdrawAmount
    || !!errorMessage
    || !inputValid
    || !feeInfo
    || !isOnline;
  const nextButtonTitle = isEstimating ? t('label.gettingFee') : t('button.next');
  const onNextButtonPress = () => navigation.navigate(TANK_WITHDRAW_CONFIRM, { amount: withdrawAmount, asset: PPNAsset });

  return (
    <ContainerWithHeader
      navigation={navigation}
      headerProps={{ centerItems: [{ title: t('ppnContent.title.withdrawFromTokenTankScreen', { token: PPN_TOKEN }) }] }}
      footer={(
        <FooterInner>
          <FeeInfo alignItems="center">
            {feeInfo && (
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
          </FeeInfo>
          {showNextButton && (
            <Button
              disabled={isNextButtonDisabled}
              title={nextButtonTitle}
              onPress={onNextButtonPress}
            />
          )}
        </FooterInner>
      )}
      minAvoidHeight={600}
    >
      {!!PPNAsset && (
        <InputWrapper>
          <ValueInput
            value={withdrawAmount || ''} // cannot be null
            onValueChange={setWithdrawAmount}
            assetData={PPNAsset}
            customAssets={[]}
            customBalances={accountDepositBalance}
            onFormValid={setInputValid}
          />
        </InputWrapper>
      )}
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  session: { data: { isOnline } },
  transactionEstimate: { feeInfo, isEstimating, errorMessage: estimateErrorMessage },
}: RootReducerState): $Shape<Props> => ({
  isEstimating,
  feeInfo,
  estimateErrorMessage,
  isOnline,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  accountAssets: accountAssetsSelector,
  availableStake: availableStakeSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  estimateTokenWithdrawTransaction: debounce(
    () => dispatch(estimateTokenWithdrawFromAccountDepositTransactionAction()),
    200,
  ),
  resetEstimateTransaction: () => dispatch(resetEstimateTransactionAction()),
  fetchAssetsBalances: () => dispatch(fetchAssetsBalancesAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(TankWithdraw);
