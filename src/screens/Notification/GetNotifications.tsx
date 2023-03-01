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
import { Image, Keyboard } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import { Container, Content } from 'components/layout/Layout';
import Button from 'components/core/Button';
import Text from 'components/core/Text';
import HeaderBlock from 'components/HeaderBlock';

// Utils
import { appFont, spacing, fontStyles } from 'utils/variables';
import { useDispatch } from 'react-redux';
import { setNotificationsVisibleStatus } from 'utils/getNotification';

// Actions
import { hasFCMPermission } from 'actions/notificationsActions';

// Assets
const smartWalletImage = require('assets/images/logo-get-notifications.png');

function GetNotifincations() {
  const { t, tRoot } = useTranslationWithPrefix('getNotifications');
  const dispatch = useDispatch();
  const navigation = useNavigation();

  useEffect(() => {
    Keyboard.dismiss();
  }, [navigation]);

  const close = async () => {
    await setNotificationsVisibleStatus(dispatch, navigation, false);
  };

  const onNotificationRequest = async () => {
    if (await hasFCMPermission()) {
      await setNotificationsVisibleStatus(dispatch, navigation, true);
    }
  };

  return (
    <Container>
      <HeaderBlock leftItems={[{ close: false }]} navigation={navigation} noPaddingTop />
      <Content>
        <LogoContainer>
          <Logo source={smartWalletImage} resizeMode="contain" />
        </LogoContainer>
        <Title>{t('title')}</Title>
        <Body>{t('description')}</Body>
        <Button title={tRoot('button.enable')} onPress={onNotificationRequest} style={styles.button} size="large" />
        <Button title={tRoot('button.cancel')} variant="text" onPress={close} size="large" />
      </Content>
    </Container>
  );
}

export default GetNotifincations;

const styles = {
  button: {
    marginBottom: spacing.small,
  },
};

const LogoContainer = styled.View`
  justify-content: center;
  align-items: center;
  margin-top: 59px;
`;

const Logo = styled(Image)`
  align-self: center;
  width: 75%;
  height: 245px;
`;

const Title = styled(Text)`
  margin: 62px 0 8px 0;
  font-family: ${appFont.medium};
  ${fontStyles.large};
  text-align: center;
`;

const Body = styled(Text)`
  margin: ${spacing.small}px 33px ${spacing.largePlus}px 33px;
  color: ${({ theme }) => theme.colors.tertiaryText};
  ${fontStyles.medium};
  text-align: center;
`;
