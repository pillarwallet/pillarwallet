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

import * as React from 'react';
import styled, { withTheme } from 'styled-components/native';


import { BaseText } from 'components/Typography';
import IconButton from 'components/IconButton';

import type { Theme } from 'models/Theme';

import { getThemeColors, themedColors } from 'utils/themes';
import { fontStyles, fontSizes } from 'utils/variables';

const PoolTicketsWrapper = styled.View`
  flex-direction: row;
  justify-content: center;
  padding: 0 10px;
  margin: 0;
`;

const Text = styled(BaseText)`
  ${({ label }) => label ? fontStyles.regular : fontStyles.large};
  letter-spacing: 0.18px;
  color: ${({ label }) => label ? themedColors.secondaryText : themedColors.text};
`;

const ActionCircleButton = styled(IconButton)`
  height: 24px;
  width: 24px;
  border-radius: 12px;
  margin: 0 0 0 10px;
  justify-content: center;
  align-items: center;
  background: ${({ theme }) => theme.colors.activeTabBarIcon};
  opacity: ${({ active }) => active ? '1' : '0.5'};
`;

type Props = {
  theme: Theme,
};

const PoolCard = (props: Props) => {
  const {
    theme,
  } = props;

  const colors = getThemeColors(theme);

  const canAdd = true;
  const canSubtract = false;

  return (
    <PoolTicketsWrapper
      style={{
          marginTop: 40,
          paddingHorizontal: 74,
        }}
    >
      <Text label>Purchase tickets for pool</Text>
      <ActionCircleButton
        color={colors.control}
        margin={0}
        active={canSubtract}
        icon="count-minus"
        fontSize={fontSizes.large}
        onPress={() => {}}
      />
      <Text>0 Tickets</Text>
      <ActionCircleButton
        color={colors.control}
        margin={0}
        active={canAdd}
        icon="count-plus"
        fontSize={fontSizes.large}
        onPress={() => {}}
      />
      <Text label>0.00 ETH fee</Text>
    </PoolTicketsWrapper>
  );
};

export default withTheme(PoolCard);
