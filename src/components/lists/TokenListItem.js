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
import { TouchableOpacity } from 'react-native';
import { BigNumber } from 'bignumber.js';
import styled from 'styled-components/native';
import { useTranslation } from 'react-i18next';

// Components
import Text from 'components/core/Text';
import TokenIcon from 'components/display/TokenIcon';

// Selectors
import { useChainRates, useFiatCurrency } from 'selectors';

// Utils
import { formatTokenValue, formatFiatValue } from 'utils/format';
import { getAssetValueInFiat, getAssetPriceInFiat } from 'utils/rates';
import { fontStyles, spacing } from 'utils/variables';
import { useChainConfig } from 'utils/uiConfig';

// Constants
import { CHAIN } from 'constants/chainConstants';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';
import type { Chain } from 'models/Chain';

type Props = {|
  chain: Chain,
  name: ?string,
  iconUrl: ?string,
  address?: string,
  symbol?: string,
  balance?: ?BigNumber,
  onPress?: () => mixed,
  onPressBalance?: () => mixed,
  subtitle?: string,
  leftAddOn?: React.Node,
  style?: ViewStyleProp,
|};

/**
 * Standard token list item displaying icon, name, and optionally balance, subtitle and left add-on (e.g. checkbox).
 */
function TokenListItem({
  chain,
  name,
  symbol,
  address,
  iconUrl,
  balance,
  onPress,
  onPressBalance,
  leftAddOn,
  style,
}: Props) {
  const rates = useChainRates(chain);
  const currency = useFiatCurrency();
  const { t } = useTranslation();

  const balanceInFiat = getAssetValueInFiat(balance, address, rates, currency);
  const tokenPriceInFiat: any = getAssetPriceInFiat(address, rates, currency);

  const formattedBalance = formatTokenValue(balance, symbol);
  const formattedBalanceInFiat = formatFiatValue(balanceInFiat ?? 0, currency);

  const config = useChainConfig(chain || CHAIN.ETHEREUM);

  const networkName = chain ? config.title : undefined;

  return (
    <Container
      onPress={onPress}
      disabled={!onPress}
      style={style}
      hitSlop={{ top: spacing.medium, bottom: spacing.medium }}
    >
      {!!leftAddOn && <LeftAddOn>{leftAddOn}</LeftAddOn>}

      <TokenIcon url={iconUrl} chain={chain} setMarginRight />

      <TitleContainer>
        <Title numberOfLines={1}>{name + (tokenPriceInFiat ?? '')}</Title>
        {!!chain && <Subtitle numberOfLines={1}>{t('label.on_network', { network: networkName })}</Subtitle>}
      </TitleContainer>

      <BalanceWrapper onPress={onPressBalance} disabled={!onPressBalance}>
        <BalanceFiatValue numberOfLines={1}>{formattedBalanceInFiat ?? ' '}</BalanceFiatValue>
        <BalanceTokenValue numberOfLines={1}>{balanceInFiat ? formattedBalance : symbol}</BalanceTokenValue>
      </BalanceWrapper>
    </Container>
  );
}

export default TokenListItem;

const Container = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  padding: ${spacing.medium}px ${spacing.large}px;
  min-height: 76px;
`;

const LeftAddOn = styled.View`
  align-self: stretch;
  justify-content: center;
  align-items: center;
  margin-right: ${spacing.large}px;
`;

const TitleContainer = styled.View`
  flex: 1;
  justify-content: center;
  padding-left: 10px;
`;

const Title = styled(Text)`
  ${fontStyles.medium};
`;

const Subtitle = styled(Text)`
  color: ${({ theme }) => theme.colors.secondaryText};
`;

const BalanceWrapper = styled(TouchableOpacity)`
  margin-left: ${spacing.medium}px;
  justify-content: flex-end;
  align-items: flex-end;
`;

const BalanceFiatValue = styled(Text)`
  ${fontStyles.medium};
  font-variant: tabular-nums;
`;

const BalanceTokenValue = styled(Text)`
  color: ${({ theme }) => theme.colors.secondaryText};
  font-variant: tabular-nums;
`;
