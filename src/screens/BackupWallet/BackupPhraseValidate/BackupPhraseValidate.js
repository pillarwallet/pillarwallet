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
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import { Container } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import Button from 'components/core/Button';
import MnemonicPhrase from 'components/MnemonicPhrase';
import Toast from 'components/Toast';

// Actions
import { backupWalletAction } from 'actions/walletActions';

// Utils
import { spacing } from 'utils/variables';

// Types
import type { Dispatch } from 'reducers/rootReducer';

type Props = {
  navigation: NavigationScreenProp<*>,
  resetIncorrectPassword: () => void,
  backupWallet: () => void,
};

const smartWalletImage = require('assets/images/logo-wallet-backup.png');

const BackupPhraseValidate = ({ navigation, backupWallet }: Props) => {
  const { t, tRoot } = useTranslationWithPrefix('backupWallet.backupWallet');

  const mnemonicPhrase = navigation.getParam('mnemonicPhrase', null);

  const handleCopyToClipboard = (seedPhrase: string) => {
    Clipboard.setString(seedPhrase);
    Toast.show({ message: tRoot('toast.seedPhraseCopiedToClipboard'), emoji: 'ok_hand' });
  };

  const handlePassedValidation = () => {
    backupWallet();
    navigation.dismiss();
    Toast.show({
      message: tRoot('toast.walletBackedUp'),
      emoji: 'the_horns',
    });
  };

  return (
    <Container>
      <HeaderBlock centerItems={[{ title: t('seedPhrase') }]} navigation={navigation} noPaddingTop />
      <NonScrollableContent>
        <LogoContainer>
          <Logo source={smartWalletImage} />
        </LogoContainer>
        <MnemonicPhrase phrase={mnemonicPhrase} />
        <Button title={t('button.savedPhrase')} style={styles.button} onPress={handlePassedValidation} size="large" />
        <Button
          title={t('button.copyToClipboard')}
          variant="text"
          style={styles.button}
          size="large"
          onPress={() => handleCopyToClipboard(mnemonicPhrase)}
        />
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
    marginBottom: spacing.large,
  },
};

const NonScrollableContent = styled(SafeAreaView)`
  flex: 1;
  padding: 0 ${spacing.large}px;
`;

const LogoContainer = styled.View`
  flex: 1;
  margin: 28px 0px;
  justify-content: center;
  align-items: center;
`;

const Logo = styled(Image)`
  align-self: center;
`;
