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
import { Keyboard, Dimensions } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';
import messaging from '@react-native-firebase/messaging';

// Components
import ContainerWithHeader from 'components/legacy/Layout/ContainerWithHeader';
import Button from 'components/core/Button';
import Text from 'components/core/Text';
import IconWithBackgroundGif from 'components/Gif/IconWithBackgroundGif';
import { Spacing } from 'components/legacy/Layout';
import { MediumText } from 'components/legacy/Typography';
import Toast from 'components/Toast';

// Utils
import { spacing, fontStyles } from 'utils/variables';
import { useDispatch } from 'react-redux';
import { setNotificationsVisibleStatus } from 'utils/getNotification';

// Actions
import { hasFCMPermission } from 'actions/notificationsActions';

const { height } = Dimensions.get('window');

function GetNotifincations() {
  const { t, tRoot } = useTranslationWithPrefix('getNotifications');
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const nextRoute = navigation.getParam('nextRouteName');

  useEffect(() => {
    Keyboard.dismiss();
  }, [navigation]);

  const skip = async () => {
    await setNotificationsVisibleStatus(dispatch, false);
    navigation.navigate(nextRoute);
  };

  const onNotificationRequest = async () => {
    const authorizationStatus = await messaging().requestPermission();
    if (authorizationStatus) {
      if (await hasFCMPermission()) {
        await setNotificationsVisibleStatus(dispatch, true);
        navigation.navigate(nextRoute);
      } else {
        errorToast();
      }
    } else {
      errorToast();
    }
  };

  const errorToast = () =>
    Toast.show({
      message: tRoot('notification.notification_error'),
      emoji: 'hushed',
    });

  return (
    <ContainerWithHeader headerProps={{ noBack: true }}>
      <ContentWrapper contentContainerStyle={{ padding: spacing.large, flexGrow: 1 }}>
        <IconWithBackgroundGif />
        <Spacing h={height * 0.05} />
        <MediumText fontSize={24} style={{ textAlign: 'center' }}>
          {t('title')}
        </MediumText>
        <Spacing h={60} />
        <RowContainer>
          <Text variant="big">💎</Text>
          <Body>{t('pillarReceiveMessage')}</Body>
        </RowContainer>
        <Spacing h={20} />
        <RowContainer>
          <Text variant="big">💬</Text>
          <Body>{t('latestUpdateMessage')}</Body>
        </RowContainer>

        <Spacing h={60} />

        <Button title={tRoot('button.enable')} onPress={onNotificationRequest} style={styles.button} size="large" />
        <Button title={tRoot('button.skip')} variant="text" onPress={skip} size="large" />
      </ContentWrapper>
    </ContainerWithHeader>
  );
}

export default GetNotifincations;

const styles = {
  button: {
    marginBottom: spacing.small,
  },
};

const RowContainer = styled.View`
  padding: 9px ${spacing.layoutSides}px;
  align-items: flex-start;
  justify-content: flex-start;
  flex-direction: row;
`;

const ContentWrapper = styled.ScrollView`
  flex: 1;
`;

const Body = styled(Text)`
  margin-left: ${spacing.largePlus}px;
  color: ${({ theme }) => theme.colors.tertiaryText};
  ${fontStyles.medium};
`;
