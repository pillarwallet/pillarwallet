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
import styled from 'styled-components/native';
import { useNavigation } from 'react-navigation-hooks';

// Components
import ProfileImage from 'components/ProfileImage';
import Icon from 'components/modern/Icon';
import Text from 'components/modern/Text';

// Contants
import { ACCOUNTS } from 'constants/navigationConstants';

// Selectors
import { useSmartWalletAccounts } from 'selectors';

// Utils
import { fontStyles, spacing } from 'utils/variables';
import { hitSlop20 } from 'utils/common';
import { useThemeColors } from 'utils/themes';

// Types
import type { User } from 'models/User';

type Props = {
  user: User,
};

const UserNameAndImage = ({ user }: Props) => {
  const navigation = useNavigation();
  const colors = useThemeColors();
  const { username } = user;

  const accountCount = useSmartWalletAccounts().length;

  return (
    <Wrapper onPress={() => navigation.navigate(ACCOUNTS)} hitSlop={hitSlop20}>
      <ProfileImage userName={username} diameter={24} />

      {!!username && <UserName>{username}</UserName>}

      {accountCount > 1 && <Icon name="select" color={colors.basic020} />}
    </Wrapper>
  );
};

export default UserNameAndImage;

const Wrapper = styled.TouchableOpacity`
  padding: 0 ${spacing.medium}px;
  flex-direction: row;
  align-items: center;
`;

const UserName = styled(Text)`
  ${fontStyles.medium};
  margin-left: ${spacing.small}px;
  flex-wrap: wrap;
  flex-shrink: 1;
`;
