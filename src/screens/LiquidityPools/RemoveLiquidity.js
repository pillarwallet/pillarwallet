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
import styled from 'styled-components/native';
import { createStructuredSelector } from 'reselect';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';
import debounce from 'lodash.debounce';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { Spacing } from 'components/Layout';
import { BaseText } from 'components/Typography';
import Button from 'components/Button';
import ValueInput from 'components/ValueInput';
import Icon from 'components/Icon';
import FeeLabelToggle from 'components/FeeLabelToggle';

// constants
import { ETH, WETH } from 'constants/assetsConstants';
import { LIQUIDITY_POOLS_REMOVE_LIQUIDITY_REVIEW } from 'constants/navigationConstants';

// utils
import { formatAmount } from 'utils/common';
import { isEnoughBalanceForTransactionFee, getBalance } from 'utils/assets';

// selectors
import { accountBalancesSelector } from 'selectors/balances';

// actions
import { resetEstimateTransactionAction } from 'actions/transactionEstimateActions';
import { calculateRemoveLiquidityTransactionEstimateAction } from 'actions/liquidityPoolsActions';

// types
import type { Asset, Balances } from 'models/Asset';
import type { TransactionFeeInfo } from 'models/Transaction';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';


type Props = {
  navigation: NavigationScreenProp<*>,
  supportedAssets: Asset[],
  isEstimating: boolean,
  feeInfo: ?TransactionFeeInfo,
  estimateErrorMessage: ?string,
  poolsData: {[string]: Object},
  resetEstimateTransaction: () => void,
  calculateRemoveLiquidityTransactionEstimate: (
    tokenAmount: number,
    poolAsset: Asset,
    erc20Token: Asset,
  ) => void,
  balances: Balances,
};

const MainContainer = styled.View`
  padding: 24px 20px;
`;

const StyledIcon = styled(Icon)`
  font-size: 20px;
  color: ${({ theme }) => theme.colors.basic010};
  align-self: center;
  margin: 24px 0; 
`;

const FeeInfo = styled.View`
  align-items: center;
`;

const FooterInner = styled.View`
  width: 100%;
  justify-content: center;
  align-items: center;
  padding: 24px 20px;
`;

const AddLiquidityScreen = ({
  navigation,
  supportedAssets,
  feeInfo,
  isEstimating,
  estimateErrorMessage,
  resetEstimateTransaction,
  balances,
  calculateRemoveLiquidityTransactionEstimate,
  poolsData,
}: Props) => {
  useEffect(() => {
    resetEstimateTransaction();
  }, []);
  const [obtainedAssetsValues, setObtainedAssetsValues] = useState(['', '']);
  const [poolTokenAmount, setPoolTokenAmount] = useState('');
  const [obtainedTokenFieldsValid, setObtainedTokenFieldsValid] = useState([true, true]);
  const [poolTokenFieldValid, setPoolTokenFieldValid] = useState(true);

  const { poolAddress } = navigation.state.params;
  const poolData = poolsData[poolAddress];

  const handleWETH = (symbol: string) => symbol === WETH ? ETH : symbol;

  const tokensData = [
    supportedAssets.find(asset => asset.symbol === handleWETH(poolData.token0.symbol)),
    supportedAssets.find(asset => asset.symbol === handleWETH(poolData.token1.symbol)),
  ];

  const poolTokenData = supportedAssets.find(asset => asset.symbol === 'UNI-V2');

  useEffect(() => {
    if (
      !parseFloat(poolTokenAmount) ||
      !obtainedTokenFieldsValid.every(f => f) ||
      !poolTokenFieldValid ||
      !poolTokenData
    ) {
      return;
    }
    const erc20Token = tokensData[1];
    if (!erc20Token) return;

    calculateRemoveLiquidityTransactionEstimate(
      parseFloat(poolTokenAmount),
      poolTokenData,
      erc20Token,
    );
  }, [poolTokenAmount, obtainedTokenFieldsValid, poolTokenFieldValid]);

  const onObtainedAssetValueChange = (newValue: string, tokenIndex: number) => {
    const totalAmount = parseFloat(poolData.totalSupply);
    const token0Pool = parseFloat(poolData.reserve0);
    const token1Pool = parseFloat(poolData.reserve1);
    let token0WithdrawnFormatted;
    let token1WithdrawnFormatted;
    let amountBurnedFormatted;

    if (tokenIndex === 0) {
      const token0Withdrawn = parseFloat(newValue) || 0;
      const amountBurned = (token0Withdrawn * totalAmount) / token0Pool;
      amountBurnedFormatted = formatAmount(amountBurned);
      token0WithdrawnFormatted = newValue;
      token1WithdrawnFormatted = formatAmount((token1Pool * amountBurned) / totalAmount);
    } else {
      const token1Withdrawn = parseFloat(newValue) || 0;
      const amountBurned = (token1Withdrawn * totalAmount) / token1Pool;
      amountBurnedFormatted = formatAmount(amountBurned);
      token1WithdrawnFormatted = newValue;
      token0WithdrawnFormatted = formatAmount((token0Pool * amountBurned) / totalAmount);
    }

    setObtainedAssetsValues([token0WithdrawnFormatted, token1WithdrawnFormatted]);
    setPoolTokenAmount(amountBurnedFormatted);
  };

  const onPoolTokenAmountChange = (newValue: string) => {
    const amountBurned = parseFloat(newValue) || 0;
    const totalAmount = parseFloat(poolData.totalSupply);
    const token0Pool = parseFloat(poolData.reserve0);
    const token1Pool = parseFloat(poolData.reserve1);

    const token0Withdrawn = formatAmount((token0Pool * amountBurned) / totalAmount);
    const token1Withdrawn = formatAmount((token1Pool * amountBurned) / totalAmount);

    setObtainedAssetsValues([token0Withdrawn, token1Withdrawn]);
    setPoolTokenAmount(newValue);
  };

  const renderTokenInput = (tokenIndex: number) => {
    const poolTokenSymbol = poolTokenData?.symbol;
    if (!poolTokenSymbol) return null;
    const maxAmountBurned = getBalance(balances, poolTokenSymbol);
    const totalAmount = parseFloat(poolData.totalSupply);
    const tokenPool = parseFloat(tokenIndex === 0 ? poolData.reserve0 : poolData.reserve1);

    const tokenMaxWithdrawn = ((tokenPool * maxAmountBurned) / totalAmount);

    const tokenSymbol = tokensData[tokenIndex]?.symbol;
    const customBalances = tokenSymbol && {
      [tokenSymbol]: {
        balance: tokenMaxWithdrawn,
        symbol: tokenSymbol,
      },
    };
    return (
      <ValueInput
        assetData={tokensData[tokenIndex]}
        value={obtainedAssetsValues[tokenIndex]}
        onValueChange={(newValue: string) => onObtainedAssetValueChange(newValue, tokenIndex)}
        onFormValid={(isValid: boolean) => {
          const newFieldsValid = [...obtainedTokenFieldsValid];
          newFieldsValid[tokenIndex] = isValid;
          setObtainedTokenFieldsValid(newFieldsValid);
        }}
        customBalances={customBalances}
      />
    );
  };

  let notEnoughForFee;
  if (feeInfo) {
    notEnoughForFee = tokensData.some((token, i) => {
      return !isEnoughBalanceForTransactionFee(balances, {
        txFeeInWei: feeInfo.fee,
        amount: obtainedAssetsValues[i],
        decimals: token?.decimals,
        symbol: token?.symbol,
        gasToken: feeInfo.gasToken,
      });
    });
  }

  const errorMessage = notEnoughForFee
    ? t('error.notEnoughTokenForFee', { token: feeInfo?.gasToken?.symbol || ETH })
    : estimateErrorMessage;

  const nextButtonTitle = isEstimating ? t('label.gettingFee') : t('button.next');
  const isNextButtonDisabled = !!isEstimating
    || !obtainedAssetsValues.every(f => !!parseFloat(f))
    || !!errorMessage
    || !obtainedTokenFieldsValid.every(f => f)
    || !poolTokenFieldValid
    || !feeInfo;

  const onNextButtonPress = () => navigation.navigate(
    LIQUIDITY_POOLS_REMOVE_LIQUIDITY_REVIEW,
    {
      obtainedTokensData: tokensData,
      poolToken: poolTokenData,
      obtainedTokensValues: obtainedAssetsValues,
      poolTokenValue: poolTokenAmount,
    },
  );

  return (
    <ContainerWithHeader
      headerProps={{ centerItems: [{ title: t('liquidityPoolsContent.title.removeLiquidity') }] }}
      inset={{ bottom: 0 }}
      footer={(
        <FooterInner>
          <FeeInfo>
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
              <BaseText negative center>
                {errorMessage}
              </BaseText>
            )}
          </FeeInfo>
          <Spacing h={20} />
          <Button
            disabled={isNextButtonDisabled}
            title={nextButtonTitle}
            onPress={onNextButtonPress}
          />
        </FooterInner>
      )}
    >
      <MainContainer>
        <ValueInput
          assetData={poolTokenData}
          value={poolTokenAmount}
          onValueChange={onPoolTokenAmountChange}
          onFormValid={setPoolTokenFieldValid}
        />
        <StyledIcon name="direct" />
        {renderTokenInput(1)}
        <StyledIcon name="plus" />
        {renderTokenInput(0)}
      </MainContainer>
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  assets: { supportedAssets },
  transactionEstimate: { feeInfo, isEstimating, errorMessage: estimateErrorMessage },
  liquidityPools: { poolsData },
}: RootReducerState): $Shape<Props> => ({
  supportedAssets,
  isEstimating,
  feeInfo,
  estimateErrorMessage,
  poolsData,
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
  calculateRemoveLiquidityTransactionEstimate: debounce((
    tokenAmount: number,
    poolAsset: Asset,
    erc20Token: Asset,
  ) => dispatch(calculateRemoveLiquidityTransactionEstimateAction(tokenAmount, poolAsset, erc20Token)), 500),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(AddLiquidityScreen);
