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
import { useDebounce } from 'use-debounce';

// components
import ContainerWithHeader from 'components/legacy/Layout/ContainerWithHeader';
import { Spacing } from 'components/legacy/Layout';
import { BaseText } from 'components/legacy/Typography';
import Button from 'components/legacy/Button';
import ValueInput from 'components/legacy/ValueInput';
import Icon from 'components/legacy/Icon';
import FeeLabelToggle from 'components/FeeLabelToggle';
import Table, { TableRow, TableLabel } from 'components/legacy/Table';

// constants
import { ETH } from 'constants/assetsConstants';
import { LIQUIDITY_POOLS_ADD_LIQUIDITY_REVIEW } from 'constants/navigationConstants';
import { CHAIN } from 'constants/chainConstants';

// utils
import { formatAmount } from 'utils/common';
import {
  findAssetByAddress,
  getAssetOption,
  isEnoughBalanceForTransactionFee,
  mapAssetToAssetData,
} from 'utils/assets';
import { getPoolStats, calculateProportionalAssetValues, getShareOfPool } from 'utils/liquidityPools';

// selectors
import { accountEthereumWalletAssetsBalancesSelector } from 'selectors/balances';
import { ethereumSupportedAssetsSelector } from 'selectors/assets';
import { useChainRates, useFiatCurrency } from 'selectors';

// actions
import { resetEstimateTransactionAction } from 'actions/transactionEstimateActions';
import { calculateAddLiquidityTransactionEstimateAction } from 'actions/liquidityPoolsActions';

// types
import type { Asset } from 'models/Asset';
import type { TransactionFeeInfo } from 'models/Transaction';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { LiquidityPoolsReducerState } from 'reducers/liquidityPoolsReducer';
import type { LiquidityPool } from 'models/LiquidityPools';
import type { WalletAssetsBalances } from 'models/Balances';


type Props = {
  navigation: NavigationScreenProp<*>,
  supportedAssets: Asset[],
  isEstimating: boolean,
  feeInfo: ?TransactionFeeInfo,
  estimateErrorMessage: ?string,
  resetEstimateTransaction: () => void,
  calculateAddLiquidityTransactionEstimate: (
    pool: LiquidityPool,
    tokenAmounts: string[],
    poolTokenAmount: string,
    tokensAssets: Asset[],
  ) => void,
  balances: WalletAssetsBalances,
  liquidityPoolsReducer: LiquidityPoolsReducerState,
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

const ExchangeIcon = styled(Icon)`
  color: ${({ theme }) => theme.colors.primaryAccent130};
  font-size: 16px;
`;

const Row = styled.View`
  flex-direction: row;
  align-items: center;
`;

const AddLiquidityScreen = ({
  navigation,
  supportedAssets,
  feeInfo,
  isEstimating,
  estimateErrorMessage,
  resetEstimateTransaction,
  balances,
  calculateAddLiquidityTransactionEstimate,
  liquidityPoolsReducer,
}: Props) => {
  useEffect(() => {
    resetEstimateTransaction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [assetsValues, setAssetsValues] = useState(['', '']);
  const [fieldsValid, setFieldsValid] = useState([true, true]);
  const [poolTokenAmount, setPoolTokenAmount] = useState('0');

  const rates = useChainRates(CHAIN.ETHEREUM);
  const fiatCurrency = useFiatCurrency();

  const { pool } = navigation.state.params;
  const poolStats = getPoolStats(pool, liquidityPoolsReducer);

  const tokensData = pool.tokensProportions.map(({ address }) => findAssetByAddress(supportedAssets, address));
  const poolTokenData = findAssetByAddress(supportedAssets, pool.uniswapPairAddress);

  const [debouncedAssetsValues] = useDebounce(assetsValues, 500);
  useEffect(() => {
    if (!tokensData.every((token) => token != null)) return;
    if (!assetsValues.every((f) => !!parseFloat(f))) return;
    if (!fieldsValid.every((f) => f)) return;
    calculateAddLiquidityTransactionEstimate(pool, assetsValues, poolTokenAmount, tokensData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedAssetsValues, fieldsValid]);

  const onAssetValueChange = (newValue: string, tokenIndex: number) => {
    const assetsAmounts = calculateProportionalAssetValues(
      pool, parseFloat(newValue) || 0, tokenIndex, liquidityPoolsReducer,
    );
    setPoolTokenAmount(formatAmount(assetsAmounts.pop()));
    const formattedAssetsValues = assetsAmounts
      .map((amount, i) => i === tokenIndex ? newValue : formatAmount(amount));
    setAssetsValues(formattedAssetsValues);
  };

  const renderTokenInput = (tokenIndex: number) => {
    return (
      <ValueInput
        assetData={mapAssetToAssetData(tokensData[tokenIndex])}
        customAssets={[getAssetOption(tokensData[tokenIndex], balances, rates, fiatCurrency, CHAIN.ETHEREUM)]}
        value={assetsValues[tokenIndex]}
        onValueChange={(newValue: string) => onAssetValueChange(newValue, tokenIndex)}
        onFormValid={(isValid: boolean) => {
          const newFieldsValid = [...fieldsValid];
          newFieldsValid[tokenIndex] = isValid;
          setFieldsValid(newFieldsValid);
        }}
      />
    );
  };

  let notEnoughForFee;
  if (feeInfo) {
    notEnoughForFee = tokensData.some((token, i) => {
      const balanceCheckTransaction = {
        txFeeInWei: feeInfo.fee,
        amount: assetsValues[i],
        decimals: token?.decimals,
        symbol: token?.symbol,
        gasToken: feeInfo.gasToken,
      };
      return !isEnoughBalanceForTransactionFee(balances, balanceCheckTransaction, CHAIN.ETHEREUM);
    });
  }

  const errorMessage = notEnoughForFee
    ? t('error.notEnoughTokenForFee', { token: feeInfo?.gasToken?.symbol || ETH })
    : estimateErrorMessage;

  const nextButtonTitle = isEstimating ? t('label.gettingFee') : t('button.next');
  const isNextButtonDisabled = !!isEstimating
    || !assetsValues.every(f => !!parseFloat(f))
    || !!errorMessage
    || !fieldsValid.every(f => f)
    || !feeInfo;

  const shareOfPool = getShareOfPool(pool, assetsValues.map(f => parseFloat(f) || 0), liquidityPoolsReducer);

  const onNextButtonPress = () => navigation.navigate(
    LIQUIDITY_POOLS_ADD_LIQUIDITY_REVIEW,
    {
      tokensData,
      poolToken: poolTokenData,
      tokensValues: assetsValues,
      poolTokenValue: poolTokenAmount,
      shareOfPool,
      pool,
    },
  );

  return (
    <ContainerWithHeader
      headerProps={{ centerItems: [{ title: t('liquidityPoolsContent.title.addLiquidity') }] }}
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
        {renderTokenInput(1)}
        <StyledIcon name="plus" />
        {renderTokenInput(0)}
        <StyledIcon name="equal" />
        <ValueInput
          assetData={poolTokenData}
          customAssets={[poolTokenData]}
          value={poolTokenAmount}
          disabled
          hideMaxSend
        />
        <Table>
          <TableRow>
            <TableLabel>{t('exchangeContent.label.exchangeRate')}</TableLabel>
            <Row>
              <ExchangeIcon name="exchange" />
              <Spacing w={4} />
              <BaseText>
                {t('exchangeContent.label.exchangeRateLayout', {
                  rate: poolStats && (parseFloat(poolStats.tokensPrices[tokensData[1]?.symbol])).toFixed(2),
                  toAssetCode: tokensData[1]?.symbol,
                  fromAssetCode: tokensData[0]?.symbol,
                })}
              </BaseText>
            </Row>
          </TableRow>
          <TableRow>
            <TableLabel>{t('liquidityPoolsContent.label.shareOfPool')}</TableLabel>
            <BaseText>
              {t('percentValue', { value: formatAmount(shareOfPool) })}
            </BaseText>
          </TableRow>
        </Table>
      </MainContainer>
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  transactionEstimate: { feeInfo, isEstimating, errorMessage: estimateErrorMessage },
  liquidityPools: liquidityPoolsReducer,
}: RootReducerState): $Shape<Props> => ({
  isEstimating,
  feeInfo,
  estimateErrorMessage,
  liquidityPoolsReducer,
});

const structuredSelector = createStructuredSelector({
  balances: accountEthereumWalletAssetsBalancesSelector,
  supportedAssets: ethereumSupportedAssetsSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  resetEstimateTransaction: () => dispatch(resetEstimateTransactionAction()),
  calculateAddLiquidityTransactionEstimate: (
    pool: LiquidityPool,
    tokenAmounts: string[],
    poolTokenAmount: string,
    tokensAssets: Asset[],
  ) => dispatch(
    calculateAddLiquidityTransactionEstimateAction(pool, tokenAmounts, poolTokenAmount, tokensAssets),
  ),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(AddLiquidityScreen);
