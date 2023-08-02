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

import React, { useEffect } from 'react';
import { Keyboard } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import Text from 'components/core/Text';
import HeaderBlock from 'components/HeaderBlock';
import Image from 'components/Image';
import Icon from 'components/core/Icon';

// Utils
import { appFont, spacing, fontStyles } from 'utils/variables';
import { useDispatch } from 'react-redux';
import { setNotificationsVisibleStatus } from 'utils/getNotification';

// Actions
import { hasFCMPermission } from 'actions/notificationsActions';

// Assets
const smartWalletImage = require('assets/images/logo-get-notifications.png');
const logoBackgroundGif = require('assets/images/glow.gif');

interface Props {
  size?: number;
}

const LogoBackgroundGif = ({ size = 154 }: Props) => {
  const navigation = useNavigation();

  const imageSize = size * 2.1;

  return (
    <Container>
      <Image source={logoBackgroundGif} style={{ width: imageSize, height: imageSize }} />
      <Icon name="plr-white-logo" style={{ position: 'absolute' }} height={size} />
    </Container>
  );
};

export default LogoBackgroundGif;

const Container = styled.View`
  width: 100%;
  align-items: center;
  justify-content: center;
`;
