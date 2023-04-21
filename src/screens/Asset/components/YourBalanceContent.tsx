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
import { useTranslation } from 'translations/translate';

// Utils
import { useThemeColors } from 'utils/themes';

// Components
import Text from 'components/core/Text';
import { Spacing } from 'components/legacy/Layout';

// Local
import { BalanceLoader } from './Loaders';

const YourBalanceContent = () => {
  const colors = useThemeColors();
  const { t } = useTranslation();

  return (
    <Container>
      <RowContainer>
        <Text variant={'small'} color={colors.tertiaryText}>
          {'Your Balance'}
        </Text>
        <Text variant={'small'} color={colors.tertiaryText}>
          {'24 H'}
        </Text>
      </RowContainer>
      <Spacing h={5} />
      <BalanceLoader />
    </Container>
  );
};

const TAG = 'YOUR-BALANCE';

export default YourBalanceContent;

const Container = styled.View`
  width: 90%;
`;

const RowContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;
