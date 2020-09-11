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
import { ValueSelectorCard } from 'components/ValueSelectorCard';
import { BaseText } from 'components/Typography';
import Button from 'components/Button';
import { Spacing } from 'components/Layout';
import FeeLabelToggle from 'components/FeeLabelToggle';

// constants
import { SABLIER_WITHDRAW_REVIEW } from 'constants/navigationConstants';

// utils
import { getAssetDataByAddress, getAssetsAsList, isEnoughBalanceForTransactionFee } from 'utils/assets';
import { formatUnits } from 'utils/common';
import { buildTxFeeInfo } from 'utils/smartWallet';

// selectors
import { accountAssetsSelector } from 'selectors/assets';
import { useGasTokenSelector } from 'selectors/smartWallet';
import { accountBalancesSelector } from 'selectors/balances';

// actions
import { calculateSablierWithdrawTransactionEstimateAction } from 'actions/sablierActions';

// services
import { fetchStreamBalance } from 'services/sablier';

import type { NavigationScreenProp } from 'react-navigation';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Assets, Asset, Rates, Balances } from 'models/Asset';
import type { Stream } from 'models/Sablier';


type Props = {
  calculateSablierWithdrawTransactionEstimate: (stream: Stream, amount: number, asset: Asset) => void,
  assets: Assets,
  supportedAssets: Asset[],
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: ?string,
  rates: Rates,
  withdrawTransactionEstimate: ?Object,
  isCalculatingWithdrawTransactionEstimate: boolean,
  useGasToken: boolean,
  balances: Balances,
};

const FooterWrapper = styled.View`
  padding: 16px 20px;
  align-items: center;
  width: 100%;
`;

const Withdraw = (props: Props) => {
  const {
    calculateSablierWithdrawTransactionEstimate,
    navigation,
    assets,
    supportedAssets,
    baseFiatCurrency,
    rates,
    withdrawTransactionEstimate,
    isCalculatingWithdrawTransactionEstimate,
    useGasToken,
    balances,
  } = props;

  const [withdrawAmountInWei, setWithdrawAmount] = useState(0);
  const [maxWithdraw, setMaxWithdraw] = useState(EthersBigNumber.from(0));
  const [isFetchingMaxWithdraw, setIsFetchingMaxWithdraw] = useState(true);

  const stream = navigation.getParam('stream');
  const { id: streamId, token, recipient } = stream;
  const assetData = getAssetDataByAddress(getAssetsAsList(assets), supportedAssets, token.id);

  useEffect(() => {
    calculateSablierWithdrawTransactionEstimate(stream, withdrawAmountInWei, assetData);
  }, [withdrawAmountInWei]);

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

  const onValueChanged = (value: Object) => {
    if (!value?.input) {
      setWithdrawAmount(0);
      return;
    }
    const valueInWei = utils.parseUnits(value?.input, assetData.decimals);
    if (valueInWei.gt(maxWithdraw)) {
      setWithdrawAmount(maxWithdraw);
    } else {
      setWithdrawAmount(valueInWei);
    }
  };

  const assetOptions = [assetData];

  const streamedAssetBalance: Balances = {
    [assetData.symbol]: { symbol: assetData.symbol, balance: formatUnits(maxWithdraw, assetData.decimals) },
  };

  const txFeeInfo = buildTxFeeInfo(withdrawTransactionEstimate, useGasToken);
  const isEnoughForFee = !!txFeeInfo?.fee && isEnoughBalanceForTransactionFee(balances, {
    txFeeInWei: txFeeInfo.fee,
    gasToken: txFeeInfo.gasToken,
  });

  const isNextButtonDisabled = isCalculatingWithdrawTransactionEstimate
    || isFetchingMaxWithdraw
    || !withdrawAmountInWei
    || !isEnoughForFee
    || (!!txFeeInfo?.fee && !txFeeInfo.fee.gt(0));
  const nextButtonTitle = isCalculatingWithdrawTransactionEstimate ? t('label.gettingFee') : t('button.next');

  return (
    <ContainerWithHeader
      headerProps={{ centerItems: [{ title: t('sablierContent.title.withdrawScreen') }] }}
      footer={
        <FooterWrapper>
          <FeeLabelToggle
            labelText={t('label.fee')}
            txFeeInWei={txFeeInfo?.fee}
            gasToken={txFeeInfo?.gasToken}
            isLoading={isCalculatingWithdrawTransactionEstimate}
            showFiatDefault
          />
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
      <ValueSelectorCard
        preselectedAsset={assetData.symbol}
        customOptions={assetOptions}
        balances={streamedAssetBalance}
        baseFiatCurrency={baseFiatCurrency}
        rates={rates}
        maxLabel={t('button.max')}
        getFormValue={onValueChanged}
        isLoading={isFetchingMaxWithdraw}
      />
      <BaseText regular secondary center>
        {t('sablierContent.paragraph.receiveOnWithdrawal', { token: assetData.symbol })}
      </BaseText>
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  assets: { supportedAssets },
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
  sablier: { withdrawTransactionEstimate, isCalculatingWithdrawTransactionEstimate },
}: RootReducerState): $Shape<Props> => ({
  supportedAssets,
  rates,
  baseFiatCurrency,
  withdrawTransactionEstimate,
  isCalculatingWithdrawTransactionEstimate,
});

const structuredSelector = createStructuredSelector({
  assets: accountAssetsSelector,
  useGasToken: useGasTokenSelector,
  balances: accountBalancesSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  calculateSablierWithdrawTransactionEstimate: debounce((stream: Stream, amount: number, asset: Asset) =>
    dispatch(calculateSablierWithdrawTransactionEstimateAction(stream, amount, asset)), 500),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(Withdraw);
