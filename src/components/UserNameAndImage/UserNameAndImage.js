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
import { withNavigation } from 'react-navigation';

import ProfileImage from 'components/ProfileImage';
import { MediumText } from 'components/Typography';

import { MANAGE_USERS_FLOW } from 'constants/navigationConstants';

import { spacing } from 'utils/variables';

import type { NavigationScreenProp } from 'react-navigation';
import type { ExternalProfileImageProps } from 'components/ProfileImage';
import type { User } from 'models/User';


type Props = {
  user: User,
  navigation: NavigationScreenProp<*>,
  userProps: ExternalProfileImageProps,
  profileImageWidth?: number,
  wrapperStyle?: Object,
};


const UserWrapper = styled.TouchableOpacity`
  padding: 0 ${spacing.medium}px;
  flex-direction: row;
  align-items: center;
`;

const UserName = styled(MediumText)`
  margin-left: 10px;
  flex-wrap: wrap;
  flex-shrink: 1;
`;


const UserNameAndImage = (props: Props) => {
  const {
    user = {},
    navigation,
    userProps = {},
    profileImageWidth = 24,
    wrapperStyle,
  } = props;
  const { profileImage, lastUpdateTime, username } = user;
  const userImageUri = profileImage ? `${profileImage}?t=${lastUpdateTime || 0}` : null;
  return (
    <UserWrapper onPress={() => navigation.navigate(MANAGE_USERS_FLOW)} style={wrapperStyle}>
      <ProfileImage
        uri={userImageUri}
        userName={username}
        diameter={profileImageWidth}
        noShadow
        borderWidth={0}
        {...userProps}
      />
      {!!username && <UserName>{username}</UserName>}
    </UserWrapper>
  );
};

export default withNavigation(UserNameAndImage);
