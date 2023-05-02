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
import React from 'react';
import styled from 'styled-components/native';

// Utils
import { useThemeColors } from 'utils/themes';

// Components
import Text from 'components/core/Text';
import { Spacing } from 'components/legacy/Layout';

const HeaderContent = () => {
  const colors = useThemeColors();

  return (
    <>
      <Text variant="large">$0.04</Text>
      <Spacing h={6} />
      <RowContainer>
        <Text variant="small" color={colors.tertiaryText}>
          Past Week
        </Text>
        <Spacing w={4} />
        <Text variant="regular" color={colors.caribbeanGreen}>
          +1.2% ($0.00012)
        </Text>
      </RowContainer>
      <RowContainer>
        <Text variant="small" color={colors.tertiaryText}>
          Volume 24h:
        </Text>
        <Spacing w={4} />
        <Text variant="small" color={colors.basic000}>
          $867
        </Text>
        <Spacing w={4} />
        <Text variant="small" color={colors.caribbeanGreen}>
          +12%
        </Text>
      </RowContainer>
    </>
  );
};

export default HeaderContent;

const RowContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: 90%;
`;
