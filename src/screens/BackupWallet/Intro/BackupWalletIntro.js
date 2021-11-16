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

import React, { useState } from 'react';
import { Image } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';

// Constants
import { BACKUP_PHRASE_VALIDATE } from 'constants/navigationConstants';

// Components
import { Container, Content } from 'components/layout/Layout';
import Button from 'components/core/Button';
import HeaderBlock from 'components/HeaderBlock';
import Text from 'components/core/Text';
import CheckAuth from 'components/CheckAuth';

// Types
import type { WalletObject } from 'models/Wallet';

// Utils
import { appFont, fontStyles, spacing, fontSizes } from 'utils/variables';

// Assets
const smartWalletImage = require('assets/images/logo-wallet-migration.png');

type Props = {
  resetIncorrectPassword: () => void,
};

function BackupWalletIntro({ resetIncorrectPassword }: Props) {
  const { t, tRoot } = useTranslationWithPrefix('backupWallet.intro');
  const navigation = useNavigation();
  const wallet = navigation.getParam('wallet', null);

  const [pinIsValid, setPinIsValid] = useState(!!wallet);
  const [unlockedwallet, setUnlockedWallet] = React.useState<?WalletObject>(wallet);

  const mnemonicPhrase = unlockedwallet?.mnemonic;

  const handleScreenDismissal = () => {
    resetIncorrectPassword();
    navigation.goBack(null);
  };

  const onPinValid = (walletPin: ?string, { mnemonic, privateKey }) => {
    setPinIsValid(true);
    setUnlockedWallet({ mnemonic: mnemonic?.phrase, privateKey });
  };

  if (!pinIsValid || !mnemonicPhrase) {
    return (
      <CheckAuth
        revealMnemonic
        enforcePin
        onPinValid={onPinValid}
        headerProps={{ onClose: handleScreenDismissal }}
      />
    );
  }

  const navigateToBackupPhrase = () => {
    navigation.navigate(BACKUP_PHRASE_VALIDATE, { unlockedwallet });
  };

  const close = () => {
    navigation.dismiss();
  };

  return (
    <Container>
      <HeaderBlock leftItems={[{ close: true }]} navigation={navigation} noPaddingTop />

      <Content>
        <LogoContainer>
          <Logo source={smartWalletImage} />
        </LogoContainer>
        {mnemonicPhrase ? <Title>{t('title')}</Title> : <Title>{tRoot('title.privateKey')}</Title>}
        <Subtitle>{t('subtitle')}</Subtitle>

        {mnemonicPhrase ? <Body>{t('seedPhraseWarning')}</Body> : <Body>{t('privateKeyWarning')}</Body>}

        <Button title={tRoot('button.continue')} onPress={navigateToBackupPhrase} style={styles.button} size="large" />
        <Button title={tRoot('button.notNow')} variant="text" onPress={close} size="large" />
      </Content>
    </Container>
  );
}

export default BackupWalletIntro;

const styles = {
  button: {
    marginBottom: spacing.small,
  },
};

const LogoContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const Logo = styled(Image)`
  align-self: center;
`;

const Title = styled(Text)`
  margin: ${spacing.medium}px 0 0;
  font-family: ${appFont.medium};
  font-size: ${fontSizes.large}px;
  text-align: center;
`;

const Subtitle = styled(Text)`
  margin: ${spacing.extraSmall}px 0 0;
  color: ${({ theme }) => theme.colors.negative};
  text-align: center;
`;

const Body = styled(Text)`
  margin: ${spacing.largePlus}px 0;
  color: ${({ theme }) => theme.colors.tertiaryText};
  ${fontStyles.medium};
  text-align: center;
`;
