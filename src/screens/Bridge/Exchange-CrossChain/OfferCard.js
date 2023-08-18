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
import RadioButton from 'components/RadioButton';
import { BaseText } from 'components/legacy/Typography';

// Constants
import { OFFERS } from 'constants/exchangeConstants';

// Utils
import { useProviderConfig, getFeeInfoFromList } from 'utils/exchange';
import { formatTokenValue, formatFiatValue } from 'utils/format';
import { spacing, fontStyles } from 'utils/variables';
import { getAssetValueInFiat } from 'utils/rates';
import { getAccountAddress } from 'utils/accounts';
import { isHighGasFee } from 'utils/transactions';
import { nFormatter } from 'utils/common';

// Types
import type { ExchangeOffer } from 'models/Exchange';
import type { Asset, AssetOption } from 'models/Asset';
import type { TransactionFeeInfo } from 'models/Transaction';

// Selectors
import { useRootSelector, useFiatCurrency, useChainRates, useActiveAccount, useExchangeGasFee } from 'selectors';
import { gasThresholdsSelector } from 'redux/selectors/gas-threshold-selector';

// Hooks
import { useTransactionsEstimate } from 'hooks/transactions';
import useIsMounted from 'hooks/useMounted';

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
  isSelected?: ?boolean,
  onFeeInfo?: (feeInfo: ?TransactionFeeInfo) => void,
  onEstimating?: (estimating: boolean) => void,
  isVisible: boolean,
  isLoading?: boolean,
};

function OfferCard({
  offer,
  onPress,
  disabled,
  crossChainTxs,
  onEstimateFail,
  gasFeeAsset,
  onFetchSortingOfferInfo,
  isSelected,
  onFeeInfo,
  onEstimating,
  isVisible,
  isLoading,
}: Props) {
  const { t } = useTranslation();
  const config = useProviderConfig(offer.provider);
  const activeAccount: any = useActiveAccount();
  const fiatCurrency = useFiatCurrency();
  const gasThresholds = useRootSelector(gasThresholdsSelector);
  const gasFeeList = useExchangeGasFee();

  const isMounted = useIsMounted();

  const [offerInfo, setOfferInfo] = React.useState(null);

  React.useEffect(() => {
    const call = async () => {
      const addTxsOffer = await appendFeeCaptureTransactionIfNeeded(offer, getAccountAddress(activeAccount));
      if (isMounted && addTxsOffer) setOfferInfo(addTxsOffer);
    };
    call();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offer]);

  const { chain, toChain, toAsset, toAmount } = offer;

  const gasFeeInfo = getFeeInfoFromList(gasFeeList, offer, gasFeeAsset);

  const rates = useChainRates(toChain || chain);
  const currency = useFiatCurrency();

  const fiatValue = getAssetValueInFiat(toAmount, toAsset?.address, rates, currency) ?? null;
  const formattedFiatValue = formatFiatValue(fiatValue, currency);

  const {
    feeInfo: offerFeeInfo,
    errorMessage,
    isEstimating: isOfferEstimating,
  } = useTransactionsEstimate(chain, crossChainTxs || offerInfo?.transactions, true, gasFeeAsset);

  const feeInfo = gasFeeInfo ? gasFeeInfo?.feeInfo : offerFeeInfo;
  const estimationErrorMessage = gasFeeInfo ? gasFeeInfo?.errorMessage : errorMessage;
  const isEstimating = gasFeeInfo ? gasFeeInfo?.isEstimating : isOfferEstimating;

  const chainRates = useChainRates(chain);

  const highFee = isHighGasFee(chain, feeInfo?.fee, feeInfo?.gasToken, chainRates, fiatCurrency, gasThresholds);

  const title = React.useMemo(() => {
    if (crossChainTxs) {
      const crossChainButtonTitle = `${nFormatter(Number(offer.toAmount), 4)} ${offer.toAsset.symbol}` ?? '';
      // eslint-disable-next-line i18next/no-literal-string
      return `${crossChainButtonTitle}  •  ${formattedFiatValue || ''}`;
    }
    const buttonTitle = formatTokenValue(offer.toAmount, offer.toAsset.symbol) ?? '';
    // eslint-disable-next-line i18next/no-literal-string
    return `${buttonTitle}  •  ${formattedFiatValue || ''}`;
  }, [formattedFiatValue, crossChainTxs, offer]);

  React.useEffect(() => {
    if (estimationErrorMessage) {
      onEstimateFail && onEstimateFail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estimationErrorMessage]);

  React.useEffect(() => {
    if (isSelected) return;
    if (typeof onEstimating === 'function') onEstimating(isEstimating);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEstimating]);

  React.useEffect(() => {
    if (isSelected && (isEstimating || !feeInfo)) return;
    onFeeInfo && onFeeInfo(feeInfo);
    onFetchSortingOfferInfo &&
      onFetchSortingOfferInfo({
        ...offer,
        feeInfo,
        sortingValue: getSortingValue(toChain || chain, feeInfo, chainRates, fiatCurrency, fiatValue),
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feeInfo, estimationErrorMessage, isEstimating]);

  if (estimationErrorMessage || !isVisible || (!isSelected && isEstimating) || isLoading) {
    return null;
  }

  const crossChainTxsGasFee = offer?.gasCost ?? null;

  return (
    <TouchableContainer disabled={disabled || isEstimating} onPress={onPress}>
      <Row>
        <LeftColumn>
          <Label>{t('exchangeContent.label.estTime')}</Label>
          <BaseText>{t('label.half_min')}</BaseText>
        </LeftColumn>

        <RightColumn>
          <Row style={{ minHeight: 20 }}>
            {!!config?.iconHorizontal && (
              <DynamicSizeImage imageSource={config.iconHorizontal} fallbackHeight={130} fallbackWidth={32} />
            )}
            <RadioButton type={OFFERS} visible={isSelected} style={{ marginRight: 0, marginLeft: 12 }} />
          </Row>
        </RightColumn>
      </Row>

      <Row topSeparator>
        {!!crossChainTxsGasFee && (
          <LeftColumn>
            <>
              <Label>{t('transactionNotification.gas')}</Label>
              <Text>{crossChainTxsGasFee}</Text>
            </>
          </LeftColumn>
        )}
        <LeftColumn>
          {isEstimating ? (
            <EmptyStateWrapper>
              <Spinner size={20} />
            </EmptyStateWrapper>
          ) : (
            <>
              <Label>
                {crossChainTxs ? t('smartWalletContent.confirm.fees.header') : t('exchangeContent.label.estFee')}
              </Label>
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
  background-color: ${({ theme }) => theme.colors.basic050};
  border-radius: 20px;
`;

const Row = styled.View`
  flex-direction: row;
  align-items: center;
  min-height: 70px;
  padding: 10px 0;
  ${({ theme, topSeparator }) => topSeparator && `border-top-width: 1px; border-top-color: ${theme.colors.card};`}
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
