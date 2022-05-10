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
import { useDispatch } from 'react-redux';

// Actions
import { dismissAccountSwitchTooltipAction } from 'actions/appSettingsActions';

// Components
import ProfileImage from 'components/ProfileImage';
import Icon from 'components/core/Icon';
import Text from 'components/core/Text';
import Modal from 'components/Modal';

// Selectors
import { useAccounts } from 'selectors';

// Utils
import { fontStyles, spacing } from 'utils/variables';
import { hitSlop20 } from 'utils/common';
import { useThemeColors } from 'utils/themes';

// Screen
import AccountsModal from 'src/screens/Accounts';

type Props = {
  user: ?string,
  address?: string,
};

const UserNameAndImage = ({ user, address }: Props) => {
  const navigation = useNavigation();
  const colors = useThemeColors();
  const dispatch = useDispatch();

  const canSwitchAccount = useAccounts().length > 1;

  const onAccountSwitchPress = () => {
    dispatch(dismissAccountSwitchTooltipAction());
    Modal.open(() => <AccountsModal navigation={navigation} name={user} />);
  };

  return (
    <Wrapper onPress={canSwitchAccount ? onAccountSwitchPress : null} hitSlop={hitSlop20}>
      <ProfileImage userName={!user ? address : user} diameter={24} />

      {user && <UserName>{user}</UserName>}

      {!user && (
        <Address numberOfLines={1} ellipsizeMode="middle">
          {address}
        </Address>
      )}

      {canSwitchAccount && <Icon name="select" color={colors.basic020} />}
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

const Address = styled(Text)`
  ${fontStyles.medium};
  margin-left: ${spacing.small}px;
  flex-shrink: 1;
`;
