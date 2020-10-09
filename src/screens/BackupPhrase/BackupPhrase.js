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
import React, { useState } from 'react';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';
import t from 'translations/translate';

// constants
import { BACKUP_PHRASE_VALIDATE } from 'constants/navigationConstants';

// components
import { Paragraph } from 'components/Typography';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ScrollWrapper } from 'components/Layout';
import MnemonicPhrase from 'components/MnemonicPhrase';
import Button from 'components/Button';
import CheckAuth from 'components/CheckAuth';

// actions
import { resetIncorrectPasswordAction } from 'actions/authActions';

// utils
import { spacing } from 'utils/variables';
import { themedColors } from 'utils/themes';

// types
import type { Dispatch } from 'reducers/rootReducer';
import type { EthereumWallet } from 'models/Wallet';


const FooterWrapper = styled.View`
  justify-content: center;
  align-items: center;
  padding: ${spacing.large}px;
  width: 100%;
  background-color: ${themedColors.surface};
`;

type Props = {
  navigation: NavigationScreenProp<*>,
  resetIncorrectPassword: () => void
};

const BackupPhrase = ({
  navigation,
  resetIncorrectPassword,
}: Props) => {
  // mnemonicPhrase can be passed from unlocked screen, otherwise unlock will render here
  const unlockedMnemonicPhrase = navigation.getParam('mnemonicPhrase', null);

  const [pinIsValid, setPinIsValid] = useState(!!unlockedMnemonicPhrase);
  const [mnemonicPhrase, setMnemonicPhrase] = useState(unlockedMnemonicPhrase);

  const handleScreenDismissal = () => {
    resetIncorrectPassword();
    navigation.goBack(null);
  };

  const onPinValid = (decryptedWallet: ?EthereumWallet) => {
    setPinIsValid(true);
    setMnemonicPhrase(decryptedWallet?.mnemonic);
  };

  if (!pinIsValid || !mnemonicPhrase) {
    return (
      <CheckAuth
        revealMnemonic
        enforcePin
        onPinValid={(pin, walletObj) => onPinValid(walletObj)}
        headerProps={{ onClose: handleScreenDismissal }}
      />
    );
  }

  return (
    <ContainerWithHeader
      headerProps={{ centerItems: [{ title: t('title.backupPhrase') }] }}
      footer={(
        <FooterWrapper>
          <Button
            onPress={() => navigation.navigate(BACKUP_PHRASE_VALIDATE, { mnemonicPhrase })}
            title={t('button.next')}
          />
        </FooterWrapper>
      )}
    >
      <ScrollWrapper regularPadding>
        <Paragraph style={{ marginTop: spacing.medium }}>
          {t('paragraph.instructionsOnBackingUpBackupPhase')}
        </Paragraph>
        <MnemonicPhrase phrase={mnemonicPhrase} />
      </ScrollWrapper>
    </ContainerWithHeader>
  );
};

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
});

export default connect(null, mapDispatchToProps)(BackupPhrase);
