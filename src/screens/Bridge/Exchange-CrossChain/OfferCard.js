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
import styled from 'styled-components/native';
import { useTranslation } from 'translations/translate';

// Components
import Button from 'components/core/Button';
import Text from 'components/core/Text';
import DynamicSizeImage from 'components/DynamicSizeImage';
import { TableFee } from 'components/legacy/Table';
import Spinner from 'components/Spinner';

// Utils
import { useProviderConfig } from 'utils/exchange';
import { formatTokenValue, formatFiatValue } from 'utils/format';
import { spacing, fontStyles } from 'utils/variables';
import { getAssetValueInFiat } from 'utils/rates';
import { getAccountAddress } from 'utils/accounts';
import { isHighGasFee } from 'utils/transactions';

// Types
import type { ExchangeOffer } from 'models/Exchange';
import type { Asset, AssetOption } from 'models/Asset';

// Selectors
import { useRootSelector, useFiatCurrency, useChainRates, useActiveAccount } from 'selectors';
import { gasThresholdsSelector } from 'redux/selectors/gas-threshold-selector';

// Hooks
import { useTransactionsEstimate } from 'hooks/transactions';

// Local
import { getSortingValue, appendFeeCaptureTransactionIfNeeded } from './utils';

type Props = {
  offer: ExchangeOffer,
  onPress: () => Promise<void>,
  disabled?: boolean,
  crossChainTxs?: any[],
  onEstimateFail?: () => void,
  gasFeeAsset: Asset | AssetOption,
  onFetchSortingOfferInfo?: (offerInfo: ExchangeOffer) => void,
};

function OfferCard({
  offer,
  onPress,
  disabled,
  crossChainTxs,
  onEstimateFail,
  gasFeeAsset,
  onFetchSortingOfferInfo,
}: Props) {
  const { t } = useTranslation();
  const config = useProviderConfig(offer.provider);
  const activeAccount: any = useActiveAccount();
  const fiatCurrency = useFiatCurrency();
  const gasThresholds = useRootSelector(gasThresholdsSelector);
  const [offerInfo, setOfferInfo] = React.useState(null);

  React.useEffect(() => {
    async function call() {
      const addTxsOffer = await appendFeeCaptureTransactionIfNeeded(offer, getAccountAddress(activeAccount));
      setOfferInfo(addTxsOffer);
    }
    call();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offer]);

  const { chain, toChain, toAsset, toAmount } = offer;

  const rates = useChainRates(toChain || chain);
  const currency = useFiatCurrency();

  const fiatValue = getAssetValueInFiat(toAmount, toAsset?.address, rates, currency) ?? null;
  const formattedFiatValue = formatFiatValue(fiatValue, currency);

  const {
    feeInfo,
    errorMessage: estimationErrorMessage,
    isEstimating,
  } = useTransactionsEstimate(chain, crossChainTxs || offerInfo?.transactions, true, gasFeeAsset);

  const chainRates = useChainRates(chain);

  const highFee = isHighGasFee(chain, feeInfo?.fee, feeInfo?.gasToken, chainRates, fiatCurrency, gasThresholds);

  const buttonTitle = formatTokenValue(offer.toAmount, offer.toAsset.symbol) ?? '';

  // eslint-disable-next-line i18next/no-literal-string
  const title = `${buttonTitle}  •  ${formattedFiatValue || ''}`;

  React.useEffect(() => {
    if (estimationErrorMessage) {
      onEstimateFail && onEstimateFail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estimationErrorMessage]);

  React.useEffect(() => {
    onFetchSortingOfferInfo &&
      onFetchSortingOfferInfo({
        ...offer,
        sortingValue: getSortingValue(toChain || chain, feeInfo, chainRates, fiatCurrency, fiatValue),
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feeInfo, estimationErrorMessage, isEstimating]);

  if (estimationErrorMessage) {
    return null;
  }

  return (
    <TouchableContainer disabled={disabled || isEstimating} onPress={onPress}>
      <Row>
        <LeftColumn />

        <RightColumn>
          {!!config?.iconHorizontal && (
            <DynamicSizeImage imageSource={config.iconHorizontal} fallbackHeight={130} fallbackWidth={32} />
          )}
        </RightColumn>
      </Row>

      <Row topSeparator>
        <LeftColumn>
          {isEstimating ? (
            <EmptyStateWrapper>
              <Spinner size={20} />
            </EmptyStateWrapper>
          ) : (
            <>
              <Label>{t('exchangeContent.label.estFee')}</Label>
              <TableFee txFeeInWei={feeInfo?.fee} gasToken={feeInfo?.gasToken} chain={chain} highFee={highFee} />
            </>
          )}
        </LeftColumn>

        <RightColumn>
          <Button
            title={title}
            onPress={onPress}
            disabled={disabled || isEstimating}
            size="compact"
            style={{ borderRadius: 6 }}
          />
        </RightColumn>
      </Row>
    </TouchableContainer>
  );
}

export default OfferCard;

const TouchableContainer = styled.TouchableOpacity`
  margin-bottom: ${spacing.mediumLarge}px;
  padding: 0 ${spacing.mediumLarge}px;
  background-color: ${({ theme }) => theme.colors.card};
  border-radius: 6px;
`;

const Row = styled.View`
  flex-direction: row;
  align-items: center;
  min-height: 70px;
  padding: 10px 0;
  ${({ theme, topSeparator }) => topSeparator && `border-top-width: 1px; border-top-color: ${theme.colors.border};`}
`;

const LeftColumn = styled.View`
  flex: 1;
  align-items: flex-start;
`;

const RightColumn = styled.View`
  align-items: flex-end;
  margin-left: ${spacing.mediumLarge}px;
`;

const Label = styled(Text)`
  ${fontStyles.regular};
  color: ${({ theme }) => theme.colors.secondaryText};
`;

const EmptyStateWrapper = styled.View`
  justify-content: center;
  align-items: center;
`;
