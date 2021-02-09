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
import { useDebounce } from 'use-debounce';
import isEmpty from 'lodash.isempty';
import t from 'translations/translate';

import { getEnv } from 'configs/envConfig';
import { blockedTokenAddresses } from 'configs/rariConfig';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { Spacing } from 'components/Layout';
import ValueInput from 'components/ValueInput';
import Button from 'components/Button';
import FeeLabelToggle from 'components/FeeLabelToggle';
import Toast from 'components/Toast';

import { getRariWithdrawTransaction, getMaxWithdrawAmount } from 'utils/rari';
import { isEnoughBalanceForTransactionFee, addressesInclude } from 'utils/assets';
import { reportErrorLog, formatUnits } from 'utils/common';

import { calculateRariWithdrawTransactionEstimateAction } from 'actions/rariActions';
import { resetEstimateTransactionAction, setEstimatingTransactionAction } from 'actions/transactionEstimateActions';

import { ETH, POPULAR_EXCHANGE_TOKENS } from 'constants/assetsConstants';
import { RARI_WITHDRAW_REVIEW } from 'constants/navigationConstants';
import { RARI_POOLS } from 'constants/rariConstants';

import { accountAssetsSelector } from 'selectors/assets';
import { activeAccountAddressSelector } from 'selectors/selectors';
import { accountBalancesSelector } from 'selectors/balances';

import { NotEnoughLiquidityError } from 'services/0x';

import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { NavigationScreenProp } from 'react-navigation';
import type { TransactionFeeInfo } from 'models/Transaction';
import type { Asset, Balances, Assets } from 'models/Asset';
import type { Option } from 'models/Selector';
import type { RariPool } from 'models/RariPool';

type Props = {
  assets: Assets,
  navigation: NavigationScreenProp<*>,
  feeInfo: ?TransactionFeeInfo,
  isEstimating: boolean,
  estimateErrorMessage: ?string,
  resetEstimateTransaction: () => void,
  balances: Balances,
  setEstimatingTransaction: (boolean) => void,
  calculateRariWithdrawTransactionEstimate: Object => void,
  activeAccountAddress: string,
  supportedAssets: Asset[],
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

const getCustomAssetOptions = (supportedAssets: Asset[], rariPool: RariPool): Option[] => {
  const poolAssets = rariPool === RARI_POOLS.ETH_POOL
    ? supportedAssets.filter(asset => asset.symbol === ETH)
    : supportedAssets;

  const allowedAssets = poolAssets.filter(
    asset => !addressesInclude(blockedTokenAddresses, asset.address),
  );

  return allowedAssets.map(({ iconUrl, ...rest }) => {
    const imageUrl = iconUrl ? `${getEnv().SDK_PROVIDER}/${iconUrl}?size=3` : '';
    return {
      ...rest,
      value: rest.symbol,
      iconUrl,
      icon: iconUrl,
      imageUrl,
    };
  });
};


const RariWithdrawScreen = ({
  assets, navigation, feeInfo, isEstimating, estimateErrorMessage,
  resetEstimateTransaction, balances, setEstimatingTransaction, calculateRariWithdrawTransactionEstimate,
  activeAccountAddress, supportedAssets,
}) => {
  useEffect(() => {
    resetEstimateTransaction();
  }, []);

  const [selectedAsset, setSelectedAsset] = useState(assets[ETH]);
  const [assetValue, setAssetValue] = useState('');
  const [inputValid, setInputValid] = useState(false);
  const [transactionData, setTransactionData] = useState(null);
  const [isCalculatingMaxAmount, setIsCalculatingMaxAmount] = useState(false);
  const [customBalances, setCustomBalances] = useState({});

  const [debouncedAssetValue] = useDebounce(assetValue, 500);

  const rariPool = navigation.getParam('rariPool');

  let notEnoughForFee = false;
  if (feeInfo && parseFloat(assetValue)) {
    notEnoughForFee = !isEnoughBalanceForTransactionFee(balances, {
      txFeeInWei: feeInfo.fee,
      amount: assetValue,
      decimals: selectedAsset?.decimals,
      symbol: selectedAsset?.symbol,
      gasToken: feeInfo.gasToken,
    });
  }

  const errorMessage = notEnoughForFee
    ? t('error.notEnoughTokenForFee', { token: feeInfo?.gasToken?.symbol || ETH })
    : estimateErrorMessage;

  useEffect(() => {
    if (!assetValue || !parseFloat(assetValue) || !selectedAsset) return;
    setEstimatingTransaction(true);
    getRariWithdrawTransaction(rariPool, activeAccountAddress, assetValue, selectedAsset)
      .then(txsAndExchangeFee => {
        if (!txsAndExchangeFee) {
          Toast.show({
            message: t('toast.rariServiceFailed'),
            emoji: 'hushed',
          });
          return;
        }
        const { withdrawTransaction, exchangeFeeBN: _exchangeFeeBN, slippage: _slippage } = txsAndExchangeFee;
        setTransactionData({
          transactionPayload: withdrawTransaction,
          exchangeFeeBN: _exchangeFeeBN,
          slippage: _slippage,
        });
        calculateRariWithdrawTransactionEstimate(withdrawTransaction);
      })
      .catch((error) => {
        if (error instanceof NotEnoughLiquidityError) {
          Toast.show({
            message: t('toast.rariNotEnoughLiquidity'),
            emoji: 'hushed',
          });
        } else {
          reportErrorLog('Rari service failed: Error creating transaction payload', { error });
          Toast.show({
            message: t('toast.rariServiceFailed'),
            emoji: 'hushed',
          });
        }
      });
  }, [debouncedAssetValue, selectedAsset]);

  useEffect(() => {
    if (!selectedAsset) return;
    setIsCalculatingMaxAmount(true);
    // we set balance to a very high number to avoid showing user "insufficient balance" error
    // when switching assets before we even fetch the max
    setCustomBalances({ [selectedAsset.symbol]: { symbol: selectedAsset.symbol, balance: 1e18 }, ...customBalances });
    // eslint-disable-next-line promise/catch-or-return
    getMaxWithdrawAmount(rariPool, selectedAsset, activeAccountAddress)
      .then((maxWithdrawAmount) => {
        if (!maxWithdrawAmount) {
          Toast.show({
            message: t('toast.rariServiceFailed'),
            emoji: 'hushed',
          });
          return;
        }
        setCustomBalances({
          ...customBalances,
          [selectedAsset.symbol]: {
            symbol: selectedAsset.symbol,
            balance: formatUnits(maxWithdrawAmount, selectedAsset.decimals),
          },
        });
      })
      .catch((error) => {
        if (error instanceof NotEnoughLiquidityError) {
          Toast.show({
            message: t('toast.rariNotEnoughLiquidity'),
            emoji: 'hushed',
          });
        } else {
          reportErrorLog('Rari service failed: Error getting max balance', { error });
          Toast.show({
            message: t('toast.rariServiceFailed'),
            emoji: 'hushed',
          });
        }
      })
      .then(() => setIsCalculatingMaxAmount(false));
  }, [selectedAsset]);

  const onNextButtonPress = () => {
    navigation.navigate(RARI_WITHDRAW_REVIEW, {
      rariPool,
      assetSymbol: selectedAsset.symbol,
      amount: assetValue,
      ...transactionData,
    });
  };

  const nextButtonTitle = isEstimating ? t('label.gettingFee') : t('button.next');
  const isNextButtonDisabled = !!isEstimating
      || !assetValue
      || !!errorMessage
      || !inputValid
      || !feeInfo;

  const customAssets = getCustomAssetOptions(supportedAssets, rariPool);

  const popularOptions = POPULAR_EXCHANGE_TOKENS
    .map(popularSymbol => customAssets.find(({ symbol }) => symbol === popularSymbol))
    .filter(asset => !!asset && !isEmpty(asset));

  const horizontalOptions = [{
    title: t('label.popular'),
    data: popularOptions,
  }];

  return (
    <ContainerWithHeader
      inset={{ bottom: 'never' }}
      headerProps={{
        centerItems: [{ title: t('rariContent.title.withdrawScreen') }],
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
          assetData={selectedAsset}
          onAssetDataChange={setSelectedAsset}
          value={assetValue}
          onValueChange={setAssetValue}
          onFormValid={setInputValid}
          customBalances={customBalances}
          hideMaxSend={isCalculatingMaxAmount}
          customAssets={customAssets}
          horizontalOptions={horizontalOptions}
        />
      </ValueInputWrapper>
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  assets: { supportedAssets },
  transactionEstimate: { feeInfo, isEstimating, errorMessage: estimateErrorMessage },
}: RootReducerState): $Shape<Props> => ({
  supportedAssets,
  feeInfo,
  estimateErrorMessage,
  isEstimating,
});

const structuredSelector = createStructuredSelector({
  assets: accountAssetsSelector,
  activeAccountAddress: activeAccountAddressSelector,
  balances: accountBalancesSelector,
});

const combinedMapStateToProps = (state: RootReducerState, props: Props): $Shape<Props> => ({
  ...structuredSelector(state, props),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  calculateRariWithdrawTransactionEstimate: debounce((
    rariWithdrawTransaction: Object,
  ) => dispatch(calculateRariWithdrawTransactionEstimateAction(rariWithdrawTransaction)), 500),
  resetEstimateTransaction: () => dispatch(resetEstimateTransactionAction()),
  setEstimatingTransaction: (isEstimating: boolean) => dispatch(setEstimatingTransactionAction(isEstimating)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(RariWithdrawScreen);
