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
import { BigNumber } from 'bignumber.js';
import styled from 'styled-components/native';

// Components
import FiatValueView from 'components/display/FiatValueView';
import FiatChangeView from 'components/display/FiatChangeView';
import TokenIcon from 'components/display/TokenIcon';
import Text from 'components/core/Text';

// Selectors
import { useFiatCurrency } from 'selectors';

// Utils
import { spacing } from 'utils/variables';
import { useThemeColors } from 'utils/themes';

type Props = {|
  title: ?string,
  subtitle: ?string,
  iconUrl: ?string,
  value: ?BigNumber,
  change?: ?BigNumber,
  share?: BigNumber,
  onPress?: () => mixed,
|};

function LiquidityPoolListItem({ title, subtitle, iconUrl, value, change, onPress }: Props) {
  const colors = useThemeColors();
  const currency = useFiatCurrency();

  return (
    <TouchableContainer onPress={onPress} disabled={!onPress}>
      <TokenIcon url={iconUrl} setMarginRight />

      <TitleContainer>
        <Text variant="medium" numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && <Text color={colors.secondaryText}>{subtitle}</Text>}
      </TitleContainer>

      <RightAddOn>
        <FiatValueView value={value} currency={currency} variant="medium" />
        <FiatChangeView value={value} change={change} currency={currency} />
      </RightAddOn>
    </TouchableContainer>
  );
}

export default LiquidityPoolListItem;

const TouchableContainer = styled.TouchableOpacity`
  flex-direction: row;
  padding: ${spacing.small}px ${spacing.large}px;
  min-height: 64px;
`;

const TitleContainer = styled.View`
  flex: 1;
  justify-content: center;
`;

const RightAddOn = styled.View`
  justify-content: center;
  align-items: flex-end;
  margin-left: ${spacing.medium}px;
`;
