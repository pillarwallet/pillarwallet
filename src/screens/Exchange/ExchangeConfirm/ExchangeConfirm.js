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
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components/native';
import { useTranslation } from 'translations/translate';

// Components
import { Container, Content, Spacing } from 'components/modern/Layout';
import HeaderBlock from 'components/HeaderBlock';
import Button from 'components/modern/Button';
import Text from 'components/modern/Text';
import Toast from 'components/Toast';
import TransactionDeploymentWarning from 'components/other/TransactionDeploymentWarning';

// Constants
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { TRANSACTION_TYPE } from 'constants/transactionsConstants';

// Hooks
import { useTransactionsEstimate, useTransactionFeeCheck } from 'hooks/transactions';

// Selectors
import {
  useRootSelector,
  useFiatCurrency,
  useChainRates,
} from 'selectors';

// Utils
import { getFormattedBalanceInFiat } from 'utils/assets';
import { useProviderConfig } from 'utils/exchange';
import { mapTransactionsToTransactionPayload } from 'utils/transactions';
import { spacing } from 'utils/variables';

// Types
import type { ExchangeOffer } from 'models/Exchange';

// Local
import ExchangeScheme from './ExchangeScheme';
import DetailsTable from './DetailsTable';


const ExchangeConfirmScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const offer: ExchangeOffer = navigation.getParam('offer');
  const { fromAsset, toAsset, fromAmount, toAmount, provider, chain } = offer;
  const toAssetSymbol = toAsset.symbol;

  const fiatCurrency = useFiatCurrency();
  const isOnline = useRootSelector((root) => root.session.data.isOnline);

  const chainRates = useChainRates(chain);

  const { feeInfo, errorMessage: estimationErrorMessage, isEstimating } = useTransactionsEstimate(
    chain,
    offer.transactions,
  );
  const { errorMessage: notEnoughForFeeErrorMessage } = useTransactionFeeCheck(chain, feeInfo, fromAsset, fromAmount);

  const providerConfig = useProviderConfig(provider);

  const confirmTransaction = () => {
    if (!feeInfo) {
      Toast.show({
        message: t('toast.cannotExchangeAsset'),
        emoji: 'woman-shrugging',
        supportLink: true,
      });

      return;
    }

    const transactionPayload = mapTransactionsToTransactionPayload(chain, offer.transactions);

    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, {
      transactionPayload,
      toAssetSymbol,
      goBackDismiss: true,
      transactionType: TRANSACTION_TYPE.EXCHANGE,
    });
  };

  const formattedToValueInFiat = getFormattedBalanceInFiat(fiatCurrency, toAmount, chainRates, toAsset.address);

  const errorMessage = estimationErrorMessage || notEnoughForFeeErrorMessage;

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
          <DetailsTable offer={offer} feeInfo={feeInfo} />

          <Spacing h={24} />

          <TransactionDeploymentWarning chain={chain} style={styles.transactionDeploymentWarning} />

          {!!errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}

          <Button
            title={isEstimating ? t('label.gettingFee') : t('button.next')}
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
