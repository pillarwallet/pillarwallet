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
import { Alert } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { useDispatch } from 'react-redux';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import Button from 'components/core/Button';

// Constants
import { MENU_SYSTEM_INFORMATION, BACKUP_WALLET_IN_SETTINGS_FLOW, LEGAL_SCREEN } from 'constants/navigationConstants';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';

// Selectors
import { useRootSelector } from 'selectors';

// Actions
import { logoutAction } from 'actions/authActions';

// Services
import { firebaseRemoteConfig } from 'services/firebase';

// Utils
import { useThemeColors } from 'utils/themes';
import { objectFontStyles, spacing } from 'utils/variables';

const MenuFooter = () => {
  const { t, tRoot } = useTranslationWithPrefix('menu.footer');
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const colors = useThemeColors();

  const walletBackupStatus = useRootSelector((root) => root.wallet.backupStatus);

  const privacyPolicyDocumentId = firebaseRemoteConfig.getString(REMOTE_CONFIG.PRISMIC_PRIVACY_POLICY_DOCUMENT_ID);
  const termsOfServiceDocumentId = firebaseRemoteConfig.getString(REMOTE_CONFIG.PRISMIC_TERMS_OF_POLICY_DOCUMENT_ID);

  const goToSystemInformation = () => navigation.navigate(MENU_SYSTEM_INFORMATION);

  const openLegalScreen = (documentId: string, documentName: string) =>
    navigation.navigate(LEGAL_SCREEN, { prismicDocumentId: documentId, prismicDocumentName: documentName });

  const handleSignOut = () => {
    const isWalletBackedUp = walletBackupStatus.isImported || walletBackupStatus.isBackedUp || __DEV__;
    if (isWalletBackedUp) {
      Alert.alert(tRoot('alert.logOut.title'), tRoot('alert.logOut.message'), [
        { text: tRoot('alert.logOut.button.cancel') },
        { text: tRoot('alert.logOut.button.ok'), onPress: () => dispatch(logoutAction()) },
      ]);
    } else {
      Alert.alert(
        tRoot('alert.attemptToLogOutWithoutBackup.title'),
        tRoot('alert.attemptToLogOutWithoutBackup.message'),
        [
          { text: tRoot('alert.attemptToLogOutWithoutBackup.button.cancel') },
          {
            text: tRoot('alert.attemptToLogOutWithoutBackup.button.backup'),
            onPress: () => navigation.navigate(BACKUP_WALLET_IN_SETTINGS_FLOW),
          },
        ],
      );
    }
  };

  return (
    <Container>
      <LeftColumn>
        <Button
          title={t('privacyPolicy')}
          onPress={() => openLegalScreen(privacyPolicyDocumentId, t('privacyPolicy'))}
          variant="text"
          size="compact"
          style={styles.button}
          titleStyle={styles.buttonTitle}
          titleColor={colors.secondaryText}
          testID={`${TAG}-button-privacy_policy`}
          // eslint-disable-next-line i18next/no-literal-string
          accessibilityLabel={`${TAG}-button-privacy_policy`}
        />
        <Button
          title={t('termsOfService')}
          onPress={() => openLegalScreen(termsOfServiceDocumentId, t('termsOfService'))}
          variant="text"
          size="compact"
          style={styles.button}
          titleStyle={styles.buttonTitle}
          titleColor={colors.secondaryText}
          testID={`${TAG}-button-terms_of_service`}
          // eslint-disable-next-line i18next/no-literal-string
          accessibilityLabel={`${TAG}-button-terms_of_service`}
        />
        <Button
          title={t('systemInformation')}
          onPress={goToSystemInformation}
          variant="text"
          size="compact"
          style={styles.button}
          titleStyle={styles.buttonTitle}
          titleColor={colors.secondaryText}
          testID={`${TAG}-button-system_information`}
          // eslint-disable-next-line i18next/no-literal-string
          accessibilityLabel={`${TAG}-button-system_information`}
        />
      </LeftColumn>

      <RightColumn>
        <Button
          title={t('signOut')}
          leftIcon="logout"
          onPress={handleSignOut}
          variant="destructive"
          size="compact"
          style={styles.button}
          titleStyle={styles.buttonTitle}
          testID={`${TAG}-button-logout`}
          // eslint-disable-next-line i18next/no-literal-string
          accessibilityLabel={`${TAG}-button-logout`}
        />
      </RightColumn>
    </Container>
  );
};

export default MenuFooter;

const styles = {
  button: {
    paddingLeft: spacing.large,
    paddingRight: spacing.large,
  },
  buttonTitle: {
    ...objectFontStyles.regular,
  },
};

const Container = styled.View`
  flex-direction: row;
  align-items: flex-end;
`;

const LeftColumn = styled.View`
  align-items: flex-start;
`;

const RightColumn = styled.View`
  flex: 1;
  align-items: flex-end;
`;

const TAG = 'MenuFooter';
