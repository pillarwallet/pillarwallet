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

import React from 'react';
import { Image } from 'react-native';
import Clipboard from '@react-native-community/clipboard';
import SafeAreaView from 'react-native-safe-area-view';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';
import t from 'translations/translate';

// Components
import { Container } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import Button from 'components/core/Button';
import MnemonicPhrase from 'components/MnemonicPhrase';
import Toast from 'components/Toast';
import Text from 'components/core/Text';

// Actions
import { backupWalletAction } from 'actions/walletActions';

// Utils
import { appFont, spacing, fontSizes } from 'utils/variables';

// Types
import type { Dispatch } from 'reducers/rootReducer';

type Props = {
  navigation: NavigationScreenProp<*>,
  backupWallet: () => void,
};

// Assets
const walletBackupImage = require('assets/images/logo-wallet-backup.png');

const BackupPhraseValidate = ({ navigation, backupWallet }: Props) => {
  const wallet = navigation.getParam('unlockedwallet', null);

  const mnemonicPhrase = wallet?.mnemonic;
  const walletPrivateKey = wallet?.privateKey;

  const handleCopyToClipboard = (copiedText: ?string, isPrivateKey?: boolean) => {
    Clipboard.setString(copiedText);
    Toast.show({
      message: isPrivateKey ? t('toast.privateKeyCopiedToClipboard') : t('toast.seedPhraseCopiedToClipboard'),
      emoji: 'ok_hand',
      autoClose: true,
    });
  };

  const handlePassedValidation = () => {
    backupWallet();
    navigation.dismiss();
    Toast.show({
      message: t('toast.walletBackedUp'),
      emoji: 'the_horns',
    });
  };

  return (
    <Container>
      <HeaderBlock centerItems={[{ title: t('title.seedPhrase') }]} navigation={navigation} noPaddingTop />
      <NonScrollableContent>
        <LogoContainer>
          <Logo source={walletBackupImage} />
        </LogoContainer>
        {mnemonicPhrase ? (
          <MnemonicPhrase phrase={mnemonicPhrase} />
        ) : (
          <PrivateKeyWrapper>{walletPrivateKey}</PrivateKeyWrapper>
        )}
        <Button
          title={mnemonicPhrase ? t('button.savedPhrase') : t('button.savedPrivateKey')}
          style={styles.button}
          onPress={handlePassedValidation}
          size="large"
        />
        {mnemonicPhrase ? null : (
          <Button
            title={t('button.copyToClipboard')}
            variant="text"
            style={styles.button}
            size="large"
            onPress={() => handleCopyToClipboard(walletPrivateKey, true)}
          />
        )}
      </NonScrollableContent>
    </Container>
  );
};

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  backupWallet: () => dispatch(backupWalletAction()),
});

export default connect(null, mapDispatchToProps)(BackupPhraseValidate);

const styles = {
  button: {
    marginBottom: spacing.small,
  },
};

const NonScrollableContent = styled(SafeAreaView)`
  flex: 1;
  padding: 0 ${spacing.large}px;
`;

const LogoContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const Logo = styled(Image)`
  align-self: center;
`;

const PrivateKeyWrapper = styled(Text)`
  padding: ${spacing.largePlus}px 0px;
  font-family: ${appFont.medium};
  font-size: ${fontSizes.large}px;
  color: ${({ theme }) => theme.colors.tertiaryText};
  text-align: center;
`;
