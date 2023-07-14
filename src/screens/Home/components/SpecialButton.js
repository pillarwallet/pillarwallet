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

// Components
import Icon from 'components/core/Icon';
import Text from 'components/core/Text';

// Selectors
import { useOnboardingFetchingSelector } from 'selectors';

// Utils
import { spacing } from 'utils/variables';

// Types
import type { IconName } from 'components/core/Icon';

export type Props = {|
  title: string,
  iconName: IconName,
  onPress?: () => mixed,
|};

function SpecialButton({ title, iconName, onPress }: Props) {
  const isFetching = useOnboardingFetchingSelector();

  return (
    <ButtonContainer onPress={onPress}>
      <ItemView isFetching={isFetching}>
        <ItemIconWrapper>
          <Icon name={iconName} />
        </ItemIconWrapper>
        <ItemTitle>{title}</ItemTitle>
      </ItemView>
    </ButtonContainer>
  );
}

export default SpecialButton;

const ButtonContainer = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.basic050};
  border-radius: 20px;
  shadow-opacity: 0.05;
  shadow-color: #000;
  shadow-offset: 0 8px;
  shadow-radius: 16px;
  elevation: 6;
`;

const ItemView = styled.View`
  align-items: center;
  padding: ${spacing.mediumLarge}px ${spacing.mediumLarge}px ${spacing.medium}px;
  opacity: ${({ isFetching }) => (isFetching ? 0.5 : 1)};
`;

const ItemIconWrapper = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  margin-horizontal: ${spacing.largePlus}px;
`;

const ItemTitle = styled(Text)`
  margin-top: ${spacing.extraSmall}px;
  text-align: center;
`;
