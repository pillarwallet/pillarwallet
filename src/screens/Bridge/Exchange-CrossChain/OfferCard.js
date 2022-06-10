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

// Utils
import { useProviderConfig } from 'utils/exchange';
import { formatTokenValue, formatExchangeRate } from 'utils/format';
import { spacing, fontStyles } from 'utils/variables';

// Types
import type { ExchangeOffer } from 'models/Exchange';

type Props = {
  offer: ExchangeOffer,
  onPress: () => Promise<void>,
  disabled?: boolean,
};

function OfferCard({ offer, onPress, disabled }: Props) {
  const { t } = useTranslation();
  const config = useProviderConfig(offer.provider);

  const buttonTitle = formatTokenValue(offer.toAmount, offer.toAsset.symbol) ?? '';

  return (
    <TouchableContainer disabled={disabled} onPress={onPress}>
      <Row>
        <LeftColumn>
          <Label>{t('exchangeContent.label.exchangeRate')}</Label>
          <Value>{formatExchangeRate(offer.exchangeRate, offer.fromAsset.symbol, offer.toAsset.symbol)}</Value>
        </LeftColumn>

        <RightColumn>
          {!!config?.iconHorizontal && (
            <DynamicSizeImage imageSource={config.iconHorizontal} fallbackHeight={130} fallbackWidth={32} />
          )}
        </RightColumn>
      </Row>

      <Row topSeparator>
        <LeftColumn />

        <RightColumn>
          <Button title={buttonTitle} onPress={onPress} disabled={disabled} size="compact" />
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

const Value = styled(Text)`
  ${fontStyles.medium};
`;
