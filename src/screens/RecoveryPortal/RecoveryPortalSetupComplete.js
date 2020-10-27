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
import { connect } from 'react-redux';
import { Alert } from 'react-native';
import styled from 'styled-components/native';
import { useBackHandler } from '@react-native-community/hooks';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';

// constants
import { BACKUP_WALLET_IN_SETTINGS_FLOW } from 'constants/navigationConstants';

// components
import { ScrollWrapper, Wrapper } from 'components/Layout';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Button from 'components/Button';
import { MediumText, Paragraph } from 'components/Typography';
import Animation from 'components/Animation';

// util
import { fontStyles, spacing } from 'utils/variables';

// models, types
import type { Theme } from 'models/Theme';
import type { RootReducerState } from 'reducers/rootReducer';


type Props = {
  navigation: NavigationScreenProp,
  isBackedUp: boolean,
  isImported: boolean,
  theme: Theme,
};

const animationSuccess = require('assets/animations/transactionSentConfirmationAnimation.json');

const Title = styled(MediumText)`
  ${fontStyles.large};
  text-align: center;
  margin-bottom: ${spacing.small}px;
`;

const skipPrompt = (callback) => Alert.alert(
  t('auth:title.areYouSure'),
  t('auth:recoveryPortal.alert.skippingPrivateKeyBackup'),
  [
    { text: t('auth:button.confirmSkip'), onPress: () => callback() },
    { text: t('auth:button.dismiss'), style: 'cancel' },
  ],
  { cancelable: true },
);

const RecoveryPortalSetupComplete = ({
  isBackedUp,
  isImported,
  navigation,
}: Props) => {
  const isWalletBackupNeeded = !isImported && !isBackedUp;
  const dismissNavigation = () => navigation.dismiss();

  useBackHandler(() => {
    dismissNavigation();
    return true;
  });

  return (
    <ContainerWithHeader
      headerProps={{
        centerItems: [{ title: t('auth:recoveryPortal.title.recoveryPortal') }],
        rightItems: [{ close: true }],
        noBack: true,
        onClose: dismissNavigation,
      }}
    >
      <ScrollWrapper contentContainerStyle={{ paddingVertical: spacing.large }}>
        <Wrapper flex={1} center regularPadding>
          <Animation source={animationSuccess} />
          <Title center>{t('auth:recoveryPortal.title.recoveryDeviceSetupComplete')}</Title>
          <Paragraph small>{t('auth:recoveryPortal.paragraph.importantToBackupPrivateKey')}</Paragraph>
          {isWalletBackupNeeded &&
            <Button
              title={t('auth:button.backupSeedPhrase')}
              onPress={() => navigation.navigate(BACKUP_WALLET_IN_SETTINGS_FLOW)}
              marginTop={50}
              marginBottom={spacing.large}
            />
          }
          {isWalletBackupNeeded &&
            <Button
              title={t('auth:button.skipAtOwnRisk')}
              onPress={() => skipPrompt(dismissNavigation)}
              danger
              transparent
            />
          }
          {!isWalletBackupNeeded &&
            <Button
              title={t('auth:button.magic')}
              onPress={() => navigation.dismiss()}
              marginTop={50}
            />
          }
        </Wrapper>
      </ScrollWrapper>
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  wallet: { backupStatus: { isBackedUp, isImported } },
}: RootReducerState): $Shape<Props> => ({
  isBackedUp,
  isImported,
});

export default connect(mapStateToProps)(RecoveryPortalSetupComplete);
