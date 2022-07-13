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
import { View } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { useDispatch } from 'react-redux';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';
import { isEmpty } from 'lodash';

// Components
import { Container, Content, Spacing } from 'components/layout/Layout';
import CheckAuth from 'components/CheckAuth';
import HeaderBlock from 'components/HeaderBlock';
import Text from 'components/core/Text';
import Banner from 'components/Banner/Banner';

// Selectors
import { useRootSelector } from 'selectors';
import { useIsWalletBackedUp } from 'selectors/wallets';

// Actions
import { resetIncorrectPasswordAction } from 'actions/authActions';

// Utils
import { getKeychainDataObject } from 'utils/keychain';
import { appFont, fontStyles, spacing } from 'utils/variables';

// Types
import type { WalletObject } from 'models/Wallet';

// Local
import AppearanceSetting from './components/AppearanceSetting';
import LanguageSetting from './components/LanguageSetting';
import CurrencySetting from './components/CurrencySetting';
import BiometricLoginSetting from './components/BiometricLoginSetting';
import ChangePinSetting from './components/ChangePinSetting';
import ViewBackupPhraseSetting from './components/ViewBackupPhraseSetting';
import BackupWalletSetting from './components/BackupWalletSetting';
import ImportFlowSetting from './components/ImportFlowSetting';

const Settings = () => {
  const { t } = useTranslationWithPrefix('menu.settings');
  const navigation = useNavigation();
  const isBackedUp = useIsWalletBackedUp();
  const screenName = navigation.state.routeName;
  const { showPinModal, pin, wallet, onPinValid } = useWalletData();

  if (showPinModal) {
    return (
      <CheckAuth
        enforcePin
        onPinValid={onPinValid}
        revealMnemonic
        headerProps={{ onBack: () => navigation.goBack() }}
      />
    );
  }

  return (
    <Container>
      <HeaderBlock centerItems={[{ title: t('title') }]} navigation={navigation} noPaddingTop />

      <Content paddingHorizontal={0}>
        {!isBackedUp && (
          <View>
            <Header>{t('walletBackup')}</Header>
            <BackupWalletSetting wallet={wallet} />
            <ImportFlowSetting wallet={wallet} />
          </View>
        )}

        <Header>{t('appSettings')}</Header>

        <AppearanceSetting />
        <LanguageSetting />
        <CurrencySetting />
        <BiometricLoginSetting wallet={wallet} pin={pin} />
        <ChangePinSetting />

        <Spacing h={spacing.large} />

        {isBackedUp && (
          <View>
            <Header>{t('walletBackup')}</Header>
            <ViewBackupPhraseSetting wallet={wallet} />
            <ImportFlowSetting wallet={wallet} />
          </View>
        )}
        <Banner screenName={screenName} />
      </Content>
    </Container>
  );
};

export default Settings;

const useWalletData = () => {
  const dispatch = useDispatch();

  const useBiometrics = useRootSelector((root) => root.appSettings.data.useBiometrics);

  const [showPinModal, setShowPinModal] = React.useState(false);
  const [pin, setPin] = React.useState<?string>(null);
  const [wallet, setWallet] = React.useState<?WalletObject>(null);

  React.useEffect(() => {
    const retrieveWalletObject = async () => {
      dispatch(resetIncorrectPasswordAction());

      if (!useBiometrics) {
        setShowPinModal(true);
        return;
      }

      const keychainData = await getKeychainDataObject();
      if (isEmpty(keychainData)) {
        setShowPinModal(true);
        return;
      }

      const { pin: walletPin, ...restWalletInfo } = keychainData;
      setPin(walletPin);
      setWallet(restWalletInfo);
    };

    retrieveWalletObject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const onPinValid = (walletPin: string, { mnemonic, privateKey }) => {
    setShowPinModal(false);
    setPin(walletPin);
    setWallet({ mnemonic: mnemonic?.phrase, privateKey });
  };

  return { showPinModal, pin, wallet, onPinValid };
};

const Header = styled(Text)`
  margin: 12px ${spacing.large}px ${spacing.small}px;
  font-family: ${appFont.medium};
  ${fontStyles.big};
`;
