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
import Table, { TableRow, TableLabel } from 'components/Table';

// constants
import { ETH, WETH } from 'constants/assetsConstants';
import { LIQUIDITY_POOLS_ADD_LIQUIDITY_REVIEW } from 'constants/navigationConstants';

// utils
import { formatAmount } from 'utils/common';
import { isEnoughBalanceForTransactionFee } from 'utils/assets';

// selectors
import { accountBalancesSelector } from 'selectors/balances';

// actions
import { resetEstimateTransactionAction } from 'actions/transactionEstimateActions';
import { calculateAddLiquidityTransactionEthEstimateAction } from 'actions/liquidityPoolsActions';

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
  calculateAddLiquidityTransactionEthEstimate: (
    tokenAmount: number,
    tokenAsset: Asset,
    ethAmount: number,
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
  calculateAddLiquidityTransactionEthEstimate,
  poolsData,
}: Props) => {
  useEffect(() => {
    resetEstimateTransaction();
  }, []);
  const [assetsValues, setAssetsValues] = useState(['', '']);
  const [poolTokenAmount, setPoolTokenAmount] = useState('0');
  const [fieldsValid, setFieldsValid] = useState([true, true]);

  const { poolAddress } = navigation.state.params;
  const poolData = poolsData[poolAddress];

  const handleWETH = (symbol: string) => symbol === WETH ? ETH : symbol;

  const tokensData = [
    supportedAssets.find(asset => asset.symbol === handleWETH(poolData.token0.symbol)),
    supportedAssets.find(asset => asset.symbol === handleWETH(poolData.token1.symbol)),
  ];

  // TODO: change it once we have kovan uniswap subgraph
  const poolTokenData = supportedAssets.find(asset => asset.symbol === 'UNI-V2');

  useEffect(() => {
    if (!assetsValues.every(f => !!parseFloat(f)) || !fieldsValid.every(f => f)) return;
    const erc20Token = tokensData[1];
    if (!erc20Token) return;
    calculateAddLiquidityTransactionEthEstimate(
      parseFloat(assetsValues[1]),
      erc20Token,
      parseFloat(assetsValues[0]),
    );
  }, [assetsValues, fieldsValid]);

  const onAssetValueChange = (newValue: string, tokenIndex: number) => {
    if (!poolData) return;
    const totalAmount = parseFloat(poolData.totalSupply);
    const token0Pool = parseFloat(poolData.reserve0);
    const token1Pool = parseFloat(poolData.reserve1);
    let token0Deposited;
    let token0DepositedFormatted;
    let token1DepositedFormatted;
    if (tokenIndex === 1) {
      const token1Deposited = parseFloat(newValue) || 0;
      token1DepositedFormatted = newValue;
      token0Deposited = (token1Deposited * token0Pool) / token1Pool;
      token0DepositedFormatted = formatAmount(token0Deposited);
    } else {
      token0DepositedFormatted = newValue;
      token0Deposited = parseFloat(newValue) || 0;
      const token1Deposited = (token0Deposited * token1Pool) / token0Pool;
      token1DepositedFormatted = formatAmount(token1Deposited);
    }
    const amountMinted = (totalAmount * token0Deposited) / token0Pool;
    setPoolTokenAmount(formatAmount(amountMinted));
    setAssetsValues([token0DepositedFormatted, token1DepositedFormatted]);
  };

  const renderTokenInput = (tokenIndex: number) => {
    return (
      <ValueInput
        assetData={tokensData[tokenIndex]}
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
      return !isEnoughBalanceForTransactionFee(balances, {
        txFeeInWei: feeInfo.fee,
        amount: assetsValues[i],
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
    || !assetsValues.every(f => !!parseFloat(f))
    || !!errorMessage
    || !fieldsValid.every(f => f)
    || !feeInfo;

  const shareOfPool = (parseFloat(assetsValues[0] || 0) / parseFloat(poolData?.reserve0)) * 100;

  const onNextButtonPress = () => navigation.navigate(
    LIQUIDITY_POOLS_ADD_LIQUIDITY_REVIEW,
    {
      tokensData,
      poolToken: poolTokenData,
      tokensValues: assetsValues,
      poolTokenValue: poolTokenAmount,
      shareOfPool,
    },
  );

  return (
    <ContainerWithHeader
      headerProps={{ centerItems: [{ title: t('liquidityPoolsContent.title.addLiquidity') }] }}
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
        {renderTokenInput(1)}
        <StyledIcon name="plus" />
        {renderTokenInput(0)}
        {/* TODO: render = */}
        <ValueInput
          assetData={poolTokenData}
          value={poolTokenAmount}
          disabled
        />
        <Table>
          <TableRow>
            <TableLabel>{t('exchangeContent.label.exchangeRate')}</TableLabel>
            <Row>
              <ExchangeIcon name="exchange" />
              <Spacing w={4} />
              <BaseText>
                {t('exchangeContent.label.exchangeRateLayout', {
                  rate: (parseFloat(poolData?.token1Price)).toFixed(2),
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
  calculateAddLiquidityTransactionEthEstimate: debounce((
    tokenAmount: number,
    tokenAsset: Asset,
    ethAmount: number,
  ) => dispatch(calculateAddLiquidityTransactionEthEstimateAction(tokenAmount, tokenAsset, ethAmount)), 500),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(AddLiquidityScreen);
