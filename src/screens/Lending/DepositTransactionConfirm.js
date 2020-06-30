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
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import styled from 'styled-components/native';
import { BigNumber } from 'bignumber.js';
import { CachedImage } from 'react-native-cached-image';
import type { NavigationScreenProp } from 'react-navigation';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import FeeLabelToggle from 'components/FeeLabelToggle';
import Button from 'components/Button';
import { BaseText, MediumText } from 'components/Typography';

// constants
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { defaultFiatCurrency } from 'constants/assetsConstants';

// selectors
import { useGasTokenSelector } from 'selectors/smartWallet';
import { activeAccountAddressSelector } from 'selectors';

// utils
import { fontStyles, spacing } from 'utils/variables';
import { buildTxFeeInfo } from 'utils/smartWallet';
import { formatAmountDisplay, formatFiat } from 'utils/common';
import { getAaveDepositTransactions } from 'utils/aave';
import { getRate } from 'utils/assets';

// types
import type { RootReducerState } from 'reducers/rootReducer';
import type { AssetToDeposit, Rates } from 'models/Asset';


type Props = {
  baseFiatCurrency: ?string,
  rates: Rates,
  navigation: NavigationScreenProp<*>,
  depositTransactionEstimate: ?Object,
  useGasToken: boolean,
  accountAddress: string,
};

const FeeInfo = styled.View`
  align-items: center;
  margin-bottom: ${spacing.large}px;
`;

const BottomWrapper = styled.View`
  margin-top: 64px;
  padding: ${spacing.large}px;
  width: 100%;
  justify-content: center;
  align-items: center;
`;

const DepositWrapper = styled.View`
  padding: 64px ${spacing.large}px ${spacing.large}px;
  width: 100%;
  justify-content: center;
  align-items: center;
`;

const TokenValueWrapper = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

const TokenValue = styled(MediumText)`
  ${fontStyles.giant};
`;

const TokenSymbol = styled(MediumText)`
  ${fontStyles.medium};
  margin-top: 14px;
  margin-left: ${spacing.small}px;
`;

const ValueInFiat = styled(BaseText)`
  ${fontStyles.small};
  text-align: center;
  margin-bottom: ${spacing.rhythm}px;
`;

const aaveImage = require('assets/images/apps/aave.png');
const arrowDownGrey = require('assets/icons/arrow_down_grey.png');

const DepositTransactionConfirm = ({
  navigation,
  rates,
  depositTransactionEstimate,
  useGasToken,
  baseFiatCurrency,
  accountAddress,
}: Props) => {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const depositAmount: number = navigation.getParam('amount');
  const depositAsset: AssetToDeposit = navigation.getParam('asset');
  const { symbol: depositAssetSymbol } = depositAsset;

  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
  const valueInFiat = parseFloat(depositAmount) * getRate(rates, depositAssetSymbol, fiatCurrency);
  const valueInFiatFormatted = formatFiat(valueInFiat, fiatCurrency);

  const txFeeInfo = buildTxFeeInfo(depositTransactionEstimate, useGasToken);
  const onNextButtonPress = async () => {
    if (isSubmitted) return;
    setIsSubmitted(true);

    const aaveDepositTransactions = await getAaveDepositTransactions(
      accountAddress,
      depositAmount,
      depositAsset,
      txFeeInfo?.fee || new BigNumber(0),
    );

    let transactionPayload = aaveDepositTransactions[0];

    // check if there's approve transaction
    if (aaveDepositTransactions.length > 1) {
      transactionPayload = {
        ...transactionPayload,
        sequentialSmartWalletTransactions: aaveDepositTransactions.slice(1), // take the rest except first,
      };
    }

    if (txFeeInfo.gasToken) transactionPayload.gasToken = txFeeInfo.gasToken;

    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, { transactionPayload });
    setIsSubmitted(false);
  };

  return (
    <ContainerWithHeader
      navigation={navigation}
      headerProps={{ centerItems: [{ title: 'Review' }] }}
      minAvoidHeight={200}
    >
      <DepositWrapper>
        <TokenValueWrapper>
          <TokenValue>{formatAmountDisplay(depositAmount)}</TokenValue>
          <TokenSymbol>{depositAssetSymbol}</TokenSymbol>
        </TokenValueWrapper>
        <ValueInFiat secondary>{valueInFiatFormatted}</ValueInFiat>
        <CachedImage
          style={{ width: 17, height: 41, marginBottom: spacing.small }}
          source={arrowDownGrey}
          resizeMode="contain"
        />
        <CachedImage
          style={{ width: 64, height: 64, marginBottom: spacing.large }}
          source={aaveImage}
          resizeMode="contain"
        />
        <BaseText fontSize={15}>Aave Deposit</BaseText>
      </DepositWrapper>
      <BottomWrapper>
        <FeeInfo alignItems="center">
          <FeeLabelToggle
            labelText="Fee"
            txFeeInWei={txFeeInfo?.fee}
            gasToken={txFeeInfo?.gasToken}
            showFiatDefault
          />
        </FeeInfo>
        <Button
          regularText
          block
          disabled={isSubmitted}
          isLoading={isSubmitted}
          title="Confirm deposit"
          onPress={onNextButtonPress}
        />
      </BottomWrapper>
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  lending: { depositTransactionEstimate },
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
}: RootReducerState): $Shape<Props> => ({
  rates,
  baseFiatCurrency,
  depositTransactionEstimate,
});

const structuredSelector = createStructuredSelector({
  useGasToken: useGasTokenSelector,
  accountAddress: activeAccountAddressSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(DepositTransactionConfirm);
