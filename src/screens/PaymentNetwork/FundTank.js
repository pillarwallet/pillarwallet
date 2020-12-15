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
import { estimateAccountDepositTokenTransactionAction } from 'actions/etherspotActions';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { BaseText } from 'components/Typography';
import FeeLabelToggle from 'components/FeeLabelToggle';
import Button from 'components/Button';
import ValueInput from 'components/ValueInput';

// constants
import { ETH } from 'constants/assetsConstants';
import { FUND_CONFIRM } from 'constants/navigationConstants';
import { PPN_TOKEN } from 'configs/assetsConfig';

// selectors
import { accountBalancesSelector } from 'selectors/balances';
import { accountAssetsSelector } from 'selectors/assets';

// utils
import { spacing } from 'utils/variables';
import {
  getAssetData,
  getAssetsAsList,
  isEnoughBalanceForTransactionFee,
} from 'utils/assets';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Assets, Balances } from 'models/Asset';
import type { TransactionFeeInfo } from 'models/Transaction';
import {
  fetchAccountAssetsBalancesAction,
  fetchAssetsBalancesAction,
} from 'actions/assetsActions';
import { fetchERC20Balance } from 'services/assets';


type Props = {
  balances: Balances,
  navigation: NavigationScreenProp<*>,
  isEstimating: boolean,
  feeInfo: ?TransactionFeeInfo,
  estimateAccountDepositTokenTransaction: (amount: number) => void,
  estimateErrorMessage: ?string,
  resetEstimateTransaction: () => void,
  accountAssets: Assets,
  fetchAssetsBalances: () => void,
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

const FundTank = ({
  navigation,
  balances,
  feeInfo,
  isEstimating,
  estimateAccountDepositTokenTransaction,
  estimateErrorMessage,
  resetEstimateTransaction,
  accountAssets,
  fetchAssetsBalances,
}: Props) => {
  useEffect(() => {
    resetEstimateTransaction();
    fetchAssetsBalances();
  }, []);

  const [fundAmount, setFundAmount] = useState(null);
  const [inputValid, setInputValid] = useState(false);

  const PPNAsset = getAssetData(getAssetsAsList(accountAssets), [], PPN_TOKEN);

  useEffect(() => {
    if (!fundAmount || isEmpty(PPNAsset) || !inputValid) return;
    estimateAccountDepositTokenTransaction(fundAmount);
  }, [fundAmount, PPNAsset, inputValid]);

  let notEnoughForFee;
  if (feeInfo) {
    notEnoughForFee = !isEnoughBalanceForTransactionFee(balances, {
      txFeeInWei: feeInfo.fee,
      amount: fundAmount,
      decimals: PPNAsset.decimals,
      symbol: PPNAsset.symbol,
      gasToken: feeInfo.gasToken,
    });
  }

  const errorMessage = notEnoughForFee
    ? t('error.notEnoughTokenForFee', { token: feeInfo?.gasToken?.symbol || ETH })
    : estimateErrorMessage;

  const showNextButton = fundAmount !== null; // only if amount input touched
  const isNextButtonDisabled = !!isEstimating
    || !fundAmount
    || !!errorMessage
    || !inputValid
    || !feeInfo;
  const nextButtonTitle = isEstimating ? t('label.gettingFee') : t('button.next');
  const onNextButtonPress = () => navigation.navigate(FUND_CONFIRM, { amount: fundAmount, asset: PPNAsset });

  return (
    <ContainerWithHeader
      navigation={navigation}
      headerProps={{ centerItems: [{ title: t('ppnContent.title.fundTokenTankScreen', { token: PPN_TOKEN }) }] }}
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
            value={fundAmount || ''} // cannot be null
            onValueChange={setFundAmount}
            assetData={PPNAsset}
            customAssets={[]}
            onFormValid={setInputValid}
          />
        </InputWrapper>
      )}
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  transactionEstimate: { feeInfo, isEstimating, errorMessage: estimateErrorMessage },
}: RootReducerState): $Shape<Props> => ({
  isEstimating,
  feeInfo,
  estimateErrorMessage,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  accountAssets: accountAssetsSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  estimateAccountDepositTokenTransaction: debounce(
    (amount: number) => dispatch(estimateAccountDepositTokenTransactionAction(amount)),
    200,
  ),
  resetEstimateTransaction: () => dispatch(resetEstimateTransactionAction()),
  fetchAssetsBalances: () => dispatch(fetchAssetsBalancesAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(FundTank);
