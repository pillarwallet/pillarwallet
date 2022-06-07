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

// Utils
import { useThemeColors } from 'utils/themes';
import { fontStyles, spacing } from 'utils/variables';
import { hitSlop20 } from 'utils/common';

export type Props = {|
  title: string,
  onPress: ?() => mixed,
  value?: ?string,
  isDeployed?: boolean,
  onPressDeploy: () => mixed,
  visibleBalance?: boolean,
|};

function CategoryListItem({ title, onPress, value, isDeployed, visibleBalance, onPressDeploy }: Props) {
  const colors = useThemeColors();

  return (
    <Container onPress={onPress}>
      {!isDeployed && (
        <DeployContainer>
          <Title onPress={onPress}>{title}</Title>
          <HazardIcon
            name="warning"
            width={16}
            height={16}
            color={colors.hazardIconColor}
            hitSlop={hitSlop20}
            onPress={onPressDeploy}
          />
        </DeployContainer>
      )}
      {isDeployed && <Title style={{ flex: 1 }}>{title}</Title>}
      {!!value && <Value>{visibleBalance ? value : '***'}</Value>}
    </Container>
  );
}

export default CategoryListItem;

const Container = styled.TouchableOpacity`
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

const DeployContainer = styled.View`
  flex: 1;
  flex-direction: row;
  align-items: center;
`;

const HazardIcon = styled(Icon)`
  margin-left: 8px;
`;

const Title = styled(Text)`
  margin: ${spacing.mediumLarge}px 0 ${spacing.mediumLarge}px 36px;
  ${fontStyles.medium};
`;

const Value = styled(Text)`
  ${fontStyles.medium};
  font-variant: tabular-nums;
`;
