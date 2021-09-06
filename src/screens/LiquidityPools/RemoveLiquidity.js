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
import ContainerWithHeader from 'components/legacy/Layout/ContainerWithHeader';
import { Spacing } from 'components/legacy/Layout';
import { BaseText } from 'components/legacy/Typography';
import Button from 'components/legacy/Button';
import ValueInput from 'components/legacy/ValueInput';
import Icon from 'components/legacy/Icon';
import FeeLabelToggle from 'components/FeeLabelToggle';

// constants
import { ETH } from 'constants/assetsConstants';
import { LIQUIDITY_POOLS_REMOVE_LIQUIDITY_REVIEW } from 'constants/navigationConstants';
import { CHAIN } from 'constants/chainConstants';

// utils
import { formatAmount, addressAsKey } from 'utils/common';
import {
  findAssetByAddress,
  getAssetOption,
  isEnoughBalanceForTransactionFee,
  mapAssetToAssetData,
} from 'utils/assets';
import { getPoolStats, calculateProportionalAssetAmountsForRemoval } from 'utils/liquidityPools';

// selectors
import { accountEthereumWalletAssetsBalancesSelector } from 'selectors/balances';
import { useChainRates, useChainSupportedAssets, useFiatCurrency } from 'selectors';

// actions
import { resetEstimateTransactionAction } from 'actions/transactionEstimateActions';
import { calculateRemoveLiquidityTransactionEstimateAction } from 'actions/liquidityPoolsActions';

// types
import type { Asset } from 'models/Asset';
import type { TransactionFeeInfo } from 'models/Transaction';
import type { LiquidityPool } from 'models/LiquidityPools';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { LiquidityPoolsReducerState } from 'reducers/liquidityPoolsReducer';
import type { WalletAssetsBalances } from 'models/Balances';


type Props = {
  navigation: NavigationScreenProp<*>,
  isEstimating: boolean,
  feeInfo: ?TransactionFeeInfo,
  estimateErrorMessage: ?string,
  resetEstimateTransaction: () => void,
  calculateRemoveLiquidityTransactionEstimate: (
    pool: LiquidityPool,
    tokenAmount: string,
    poolAsset: Asset,
    tokensAssets: Asset[],
    obtainedAssetsValues: string[],
  ) => void,
  balances: WalletAssetsBalances,
  liquidityPoolsState: LiquidityPoolsReducerState,
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

const RemoveLiquidityScreen = ({
  navigation,
  feeInfo,
  isEstimating,
  estimateErrorMessage,
  resetEstimateTransaction,
  balances,
  calculateRemoveLiquidityTransactionEstimate,
  liquidityPoolsState,
}: Props) => {
  useEffect(() => {
    resetEstimateTransaction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [obtainedAssetsValues, setObtainedAssetsValues] = useState(['', '']);
  const [poolTokenAmount, setPoolTokenAmount] = useState('');
  const [obtainedTokenFieldsValid, setObtainedTokenFieldsValid] = useState([true, true]);
  const [poolTokenFieldValid, setPoolTokenFieldValid] = useState(true);
  const ethereumSupportedAssets = useChainSupportedAssets(CHAIN.ETHEREUM);

  const rates = useChainRates(CHAIN.ETHEREUM);
  const fiatCurrency = useFiatCurrency();

  const { pool } = navigation.state.params;
  const poolStats = getPoolStats(pool, liquidityPoolsState);

  const tokensData = pool.tokensProportions
    .map(({ address: assetAddress }) => findAssetByAddress(ethereumSupportedAssets, assetAddress));

  const poolTokenData = findAssetByAddress(ethereumSupportedAssets, pool.uniswapPairAddress);

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
      pool,
      poolTokenAmount,
      poolTokenData,
      tokensData,
      obtainedAssetsValues,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolTokenAmount, obtainedTokenFieldsValid, poolTokenFieldValid]);

  const onPoolTokenAmountChange = (newValue: string) => {
    const amounts = calculateProportionalAssetAmountsForRemoval(pool, newValue || '0', null, liquidityPoolsState);
    setPoolTokenAmount(newValue);
    setObtainedAssetsValues(amounts.pairTokens.map((amount) => formatAmount(amount)));
  };

  const onObtainedAssetValueChange = (tokenIndex: number, newValue: string, newPercent: number | void) => {
    // Ensure we will withdraw everything if user want to remove max value.
    if (newPercent === 100) {
      onPoolTokenAmountChange(poolStats?.userLiquidityTokenBalance.toFixed() ?? '0');
      return;
    }

    const amounts = calculateProportionalAssetAmountsForRemoval(pool, newValue || '0', tokenIndex, liquidityPoolsState);
    setPoolTokenAmount(formatAmount(amounts.poolToken));
    setObtainedAssetsValues(amounts.pairTokens.map((amount, i) =>
      i === tokenIndex ? newValue : formatAmount(amount),
    ));
  };

  const renderTokenInput = (tokenIndex: number) => {
    const poolTokenSymbol = poolTokenData?.symbol;
    if (!poolTokenSymbol) return null;
    const maxAmountBurned = poolStats?.userLiquidityTokenBalance.toNumber() ?? 0;
    const totalAmount = parseFloat(poolStats?.totalSupply);
    const tokenPool = parseFloat(poolStats?.tokensLiquidity[pool.tokensProportions[tokenIndex].symbol]);

    const tokenMaxWithdrawn = ((tokenPool * maxAmountBurned) / totalAmount);

    const { symbol: assetSymbol, address: assetAddress } = tokensData[tokenIndex];
    const customBalances: WalletAssetsBalances = {
      [addressAsKey(assetAddress)]: {
        balance: formatAmount(tokenMaxWithdrawn, tokensData[tokenIndex]?.decimals),
        symbol: assetSymbol,
        address: assetAddress,
      },
    };

    return (
      <ValueInput
        assetData={mapAssetToAssetData(tokensData[tokenIndex])}
        customAssets={[getAssetOption(tokensData[tokenIndex], balances, rates, fiatCurrency, CHAIN.ETHEREUM)]}
        value={obtainedAssetsValues[tokenIndex]}
        onValueChange={(newValue: string, newPercent: number | void) =>
          onObtainedAssetValueChange(tokenIndex, newValue, newPercent)
        }
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
    const balanceCheckTransaction = {
      txFeeInWei: feeInfo.fee,
      amount: 0,
      gasToken: feeInfo.gasToken,
    };
    notEnoughForFee = !isEnoughBalanceForTransactionFee(balances, balanceCheckTransaction, CHAIN.ETHEREUM);
  }

  const errorMessage = notEnoughForFee
    ? t('error.notEnoughTokenForFee', { token: feeInfo?.gasToken?.symbol || ETH })
    : estimateErrorMessage;

  const nextButtonTitle = isEstimating ? t('label.gettingFee') : t('button.next');
  const isNextButtonDisabled = !!isEstimating
    || !!errorMessage
    || !obtainedTokenFieldsValid.every(f => f)
    || !poolTokenFieldValid
    || !parseFloat(poolTokenAmount)
    || !feeInfo;

  const onNextButtonPress = () => navigation.navigate(
    LIQUIDITY_POOLS_REMOVE_LIQUIDITY_REVIEW,
    {
      obtainedTokensData: tokensData,
      poolToken: poolTokenData,
      obtainedTokensValues: obtainedAssetsValues,
      poolTokenValue: poolTokenAmount,
      pool,
    },
  );

  const poolTokenCustomBalances = poolTokenData && {
    [addressAsKey(poolTokenData.address)]: {
      balance: poolStats?.userLiquidityTokenBalance.toFixed(),
      symbol: poolTokenData.symbol,
      address: poolTokenData.address,
    },
  };

  return (
    <ContainerWithHeader
      headerProps={{ centerItems: [{ title: t('liquidityPoolsContent.title.removeLiquidity') }] }}
      inset={{ bottom: 0 }}
      putContentInScrollView
      footer={(
        <FooterInner>
          <FeeInfo>
            {feeInfo && (
              <FeeLabelToggle
                labelText={t('label.fee')}
                txFeeInWei={feeInfo?.fee}
                gasToken={feeInfo?.gasToken}
                chain={CHAIN.ETHEREUM}
                isLoading={isEstimating}
                hasError={!!errorMessage}
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
          customAssets={[poolTokenData]}
          value={poolTokenAmount}
          onValueChange={onPoolTokenAmountChange}
          onFormValid={setPoolTokenFieldValid}
          customBalances={poolTokenCustomBalances}
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
  transactionEstimate: { feeInfo, isEstimating, errorMessage: estimateErrorMessage },
  liquidityPools: liquidityPoolsState,
}: RootReducerState): $Shape<Props> => ({
  isEstimating,
  feeInfo,
  estimateErrorMessage,
  liquidityPoolsState,
});

const structuredSelector = createStructuredSelector({
  balances: accountEthereumWalletAssetsBalancesSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  resetEstimateTransaction: () => dispatch(resetEstimateTransactionAction()),
  calculateRemoveLiquidityTransactionEstimate: debounce((
    pool: LiquidityPool,
    tokenAmount: string,
    poolAsset: Asset,
    tokensAssets: Asset[],
    obtainedAssetsValues: string[],
  ) => dispatch(
    calculateRemoveLiquidityTransactionEstimateAction(
      pool, tokenAmount, poolAsset, tokensAssets, obtainedAssetsValues,
    )), 500),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(RemoveLiquidityScreen);
