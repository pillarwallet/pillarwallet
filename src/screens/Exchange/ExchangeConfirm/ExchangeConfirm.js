// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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

import * as React from 'react';
import { Platform } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components/native';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'translations/translate';

// Components
import { Container, Content, Spacing } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import Text from 'components/core/Text';
import TransactionDeploymentWarning from 'components/other/TransactionDeploymentWarning';
import SwipeButton from 'components/SwipeButton/SwipeButton';
import WarningBlock from 'components/HighGasFeeModals/WarningBlock';

// Constants
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { TRANSACTION_TYPE } from 'constants/transactionsConstants';

// Hooks
import { useTransactionsEstimate, useTransactionFeeCheck } from 'hooks/transactions';

// Selectors
import { useRootSelector, useFiatCurrency, useChainRates, useActiveAccount } from 'selectors';
import { gasThresholdsSelector } from 'redux/selectors/gas-threshold-selector';

// Utils
import { getFormattedBalanceInFiat } from 'utils/assets';
import { useProviderConfig } from 'utils/exchange';
import { mapTransactionsToTransactionPayload, showTransactionRevertedToast, isHighGasFee } from 'utils/transactions';
import { spacing } from 'utils/variables';
import { useThemeColors } from 'utils/themes';
import { isLogV2AppEvents } from 'utils/environment';
import { currentDate, currentTime } from 'utils/date';
import { getAccountType } from 'utils/accounts';

// Actions
import { appsFlyerlogEventAction } from 'actions/analyticsActions';

// Types
import type { ExchangeOffer } from 'models/Exchange';

// Local
import ExchangeScheme from './ExchangeScheme';
import DetailsTable from './DetailsTable';

const ExchangeConfirmScreen = () => {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const activeAccount = useActiveAccount();

  const offer: ExchangeOffer = navigation.getParam('offer');
  const { fromAsset, toAsset, fromAmount, toAmount, provider, chain: chainName } = offer;
  const toAssetSymbol = toAsset.symbol;

  const isOnline = useRootSelector((root) => root.session.data.isOnline);
  const fiatCurrency = useFiatCurrency();
  const gasThresholds = useRootSelector(gasThresholdsSelector);

  const chainRates = useChainRates(chainName);

  const {
    feeInfo,
    errorMessage: estimationErrorMessage,
    isEstimating,
  } = useTransactionsEstimate(chainName, offer.transactions);
  const { errorMessage: notEnoughForFeeErrorMessage } = useTransactionFeeCheck(
    chainName,
    feeInfo,
    fromAsset,
    fromAmount,
  );

  const providerConfig = useProviderConfig(provider);

  const confirmTransaction = () => {
    if (!feeInfo) {
      showTransactionRevertedToast();
      return;
    }

    const transactionPayload = mapTransactionsToTransactionPayload(chainName, offer.transactions);

    if (activeAccount && isLogV2AppEvents) {
      dispatch(
        appsFlyerlogEventAction(`swap_completed_${fromAsset?.symbol}_${toAsset?.symbol}`, {
          tokenPair: `${fromAsset?.symbol}_${toAsset?.symbol}`,
          chain: chainName,
          amount_swapped: fromAmount,
          date: currentDate(),
          time: currentTime(),
          platform: Platform.OS,
          address: toAsset.address,
          walletType: getAccountType(activeAccount),
        }),
      );
    }

    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, {
      transactionPayload,
      toAssetSymbol,
      goBackDismiss: true,
      transactionType: TRANSACTION_TYPE.EXCHANGE,
    });
  };

  const formattedToValueInFiat = getFormattedBalanceInFiat(fiatCurrency, toAmount, chainRates, toAsset.address);

  const errorMessage = estimationErrorMessage || notEnoughForFeeErrorMessage;

  const highFee = isHighGasFee(chainName, feeInfo?.fee, feeInfo?.gasToken, chainRates, fiatCurrency, gasThresholds);

  return (
    <Container>
      <HeaderBlock centerItems={[{ title: t('exchangeContent.title.confirm') }]} navigation={navigation} noPaddingTop />

      <Content paddingHorizontal={0} contentContainerStyle={styles.contentContainerStyle}>
        <ExchangeScheme
          fromValue={fromAmount}
          fromSymbol={fromAsset.symbol}
          toValue={toAmount}
          toSymbol={toAsset.symbol}
          toValueInFiat={formattedToValueInFiat}
          imageSource={providerConfig?.iconVertical}
        />

        <ContentWrapper>
          <DetailsTable offer={offer} feeInfo={feeInfo} highFee={highFee} />

          {highFee && (
            <WarningBlock
              text={t('transactions.highGasFee.warningLabel')}
              icon="small-warning"
              backgroundColor={colors.negative}
              right={10}
            />
          )}

          <Spacing h={24} />

          <TransactionDeploymentWarning chain={chainName} style={styles.transactionDeploymentWarning} />

          {!!errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}

          <SwipeButton
            confirmTitle={isEstimating ? t('label.gettingFee') : t('button.swap')}
            warning={highFee}
            onPress={confirmTransaction}
            disabled={!isOnline || !feeInfo || !!errorMessage || isEstimating}
          />
        </ContentWrapper>
      </Content>
    </Container>
  );
};

export default ExchangeConfirmScreen;

const styles = {
  contentContainerStyle: {
    paddingTop: spacing.large,
  },
  transactionDeploymentWarning: {
    paddingBottom: spacing.largePlus,
    paddingRight: 40,
  },
};

const ContentWrapper = styled.View`
  padding: 36px ${spacing.large}px 10px;
`;

const ErrorMessage = styled(Text)`
  margin-bottom: 15px;
  text-align: center;
  color: ${({ theme }) => theme.colors.negative};
`;
