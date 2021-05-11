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
import Icon from 'components/modern/Icon';
import Text from 'components/modern/Text';

// Utils
import { useThemeColors } from 'utils/themes';
import { fontStyles, spacing } from 'utils/variables';

export type Props = {|
  title: string,
  onPress: ?() => mixed,
  value?: ?string,
  isDeployed?: boolean,
|};

function CategoryListItem({ title, onPress, value, isDeployed = true }: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <Container onPress={onPress}>
      <Title>{title}</Title>

      {isDeployed && !!value && (
        <ValueContainer>
          <Value>{value}</Value>
        </ValueContainer>
      )}

      {!isDeployed && (
        <ValueContainer>
          <DeployValue>{t('button.deploy')}</DeployValue>
          <Icon name="question" width={14} height={14} color={colors.labelTertiary} />
        </ValueContainer>
      )}
    </Container>
  );
}

export default CategoryListItem;

const Container = styled.TouchableOpacity`
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

const Title = styled(Text)`
  flex: 1;
  margin: ${spacing.mediumLarge}px 0 ${spacing.mediumLarge}px 36px;
  ${fontStyles.medium};
`;

const ValueContainer = styled.View`
  flex-direction: row;
  align-items: center;
`;

const Value = styled(Text)`
  ${fontStyles.medium};
  font-variant: tabular-nums;
`;

const DeployValue = styled(Text)`
  ${fontStyles.medium};
  margin-right: ${spacing.small}px;
`;
