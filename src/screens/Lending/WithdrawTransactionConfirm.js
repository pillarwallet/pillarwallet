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
import t from 'translations/translate';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import FeeLabelToggle from 'components/FeeLabelToggle';
import Button from 'components/Button';
import { BaseText, MediumText } from 'components/Typography';
import ProfileImage from 'components/ProfileImage';

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
import { getAaveWithdrawTransaction } from 'utils/aave';
import { getRate } from 'utils/assets';

// types
import type { RootReducerState } from 'reducers/rootReducer';
import type { DepositedAsset, Rates } from 'models/Asset';
import type { User } from 'models/User';


type Props = {
  baseFiatCurrency: ?string,
  rates: Rates,
  navigation: NavigationScreenProp<*>,
  withdrawTransactionEstimate: ?Object,
  useGasToken: boolean,
  accountAddress: string,
  user: User,
};

const FeeInfo = styled.View`
  align-items: center;
  margin-bottom: ${spacing.large}px;
`;

const BottomWrapper = styled.View`
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
  margin-top: ${spacing.large}px;
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

const WithdrawTransactionConfirm = ({
  navigation,
  rates,
  withdrawTransactionEstimate,
  useGasToken,
  baseFiatCurrency,
  accountAddress,
  user,
}: Props) => {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const withdrawAmount: number = navigation.getParam('amount');
  const depositedAsset: DepositedAsset = navigation.getParam('asset');
  const { symbol: depositedAssetSymbol } = depositedAsset;

  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
  const valueInFiat = parseFloat(withdrawAmount) * getRate(rates, depositedAssetSymbol, fiatCurrency);
  const valueInFiatFormatted = formatFiat(valueInFiat, fiatCurrency);

  const txFeeInfo = buildTxFeeInfo(withdrawTransactionEstimate, useGasToken);
  const onNextButtonPress = async () => {
    if (isSubmitted) return;
    setIsSubmitted(true);

    const transactionPayload = await getAaveWithdrawTransaction(
      accountAddress,
      withdrawAmount,
      depositedAsset,
      txFeeInfo?.fee || new BigNumber(0),
    );

    if (txFeeInfo.gasToken) transactionPayload.gasToken = txFeeInfo.gasToken;

    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, { transactionPayload });
    setIsSubmitted(false);
  };

  const { profileImage, lastUpdateTime, username } = user;
  const userImageUri = profileImage ? `${profileImage}?t=${lastUpdateTime || 0}` : null;

  return (
    <ContainerWithHeader
      navigation={navigation}
      headerProps={{ centerItems: [{ title: t('aaveContent.title.withdrawConfirmationScreen') }] }}
      footer={
        <BottomWrapper>
          <FeeInfo alignItems="center">
            <FeeLabelToggle
              labelText={t('label.fee')}
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
            title={t('aaveContent.button.confirmWithdrawal')}
            onPress={onNextButtonPress}
          />
        </BottomWrapper>
      }
      minAvoidHeight={200}
    >
      <DepositWrapper>
        <CachedImage
          style={{ width: 64, height: 64, marginBottom: spacing.small }}
          source={aaveImage}
          resizeMode="contain"
        />
        <BaseText fontSize={15}>{t('aaveDeposit')}</BaseText>
        <CachedImage
          style={{ width: 17, height: 41, marginTop: spacing.small }}
          source={arrowDownGrey}
          resizeMode="contain"
        />
        <ProfileImage
          style={{ marginTop: spacing.large, marginBottom: spacing.small }}
          uri={userImageUri}
          userName={username}
          diameter={64}
          noShadow
          borderWidth={0}
        />
        <BaseText fontSize={15}>{username}</BaseText>
        <TokenValueWrapper>
          <TokenValue>{formatAmountDisplay(withdrawAmount)}</TokenValue>
          <TokenSymbol>{depositedAssetSymbol}</TokenSymbol>
        </TokenValueWrapper>
        <ValueInFiat secondary>{valueInFiatFormatted}</ValueInFiat>
      </DepositWrapper>
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  lending: { withdrawTransactionEstimate },
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
  user: { data: user },
}: RootReducerState): $Shape<Props> => ({
  rates,
  baseFiatCurrency,
  withdrawTransactionEstimate,
  user,
});

const structuredSelector = createStructuredSelector({
  useGasToken: useGasTokenSelector,
  accountAddress: activeAccountAddressSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(WithdrawTransactionConfirm);
