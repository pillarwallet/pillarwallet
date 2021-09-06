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
import Icon, { type IconName } from 'components/core/Icon';
import Text from 'components/core/Text';

// Utils
import { fontStyles, spacing } from 'utils/variables';

type Props = {|
  title: string,
  icon: IconName,
  onPress: () => mixed,
  value?: string,
  valueColor?: string,
|};

const SettingsItem = ({ title, icon, onPress, value, valueColor }: Props) => {
  return (
    <Container>
      <TouchableContainer onPress={onPress}>
        <Icon name={icon} width={16} height={16} style={styles.icon} />
        <Title>{title}</Title>
        <Value $color={valueColor}>{value}</Value>
      </TouchableContainer>
    </Container>
  );
};

export default SettingsItem;

const styles = {
  icon: {
    marginRight: spacing.small,
  },
};

const Container = styled.View``;

const TouchableContainer = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: ${spacing.large}px ${spacing.large}px 18px ${spacing.large}px;
`;

const Title = styled(Text)`
  flex: 1;
  ${fontStyles.medium};
`;

const Value = styled(Text)`
  color: ${({ theme, $color }) => $color || theme.colors.secondaryText};
`;
