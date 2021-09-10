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
/* eslint-disable i18next/no-literal-string */

import * as React from 'react';
import { Image } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import styled, { ThemeProvider } from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';

// Contants
import { DARK_THEME } from 'constants/appSettingsConstants';
import { KEY_BASED_ASSET_TRANSFER_CHOOSE } from 'constants/navigationConstants';

// Components
import { Spacing } from 'components/legacy/Layout';
import Button from 'components/legacy/Button';
import { Container, Content } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import Text from 'components/core/Text';
import EmojiCard from 'components/other/EmojiCard';

// Utils
import { appFont, fontStyles, spacing } from 'utils/variables';
import { getThemeByType } from 'utils/themes';


const smartWalletImage = require('assets/images/smart-wallet-migration.png');

function KeyBasedAssetTransferIntro() {
  const navigation = useNavigation();
  const darkTheme = getThemeByType(DARK_THEME);

  const { t } = useTranslationWithPrefix('smartWalletContent.intro');

  const navigateToMigration = () => {
    navigation.navigate(KEY_BASED_ASSET_TRANSFER_CHOOSE);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Container style={{ backgroundColor: darkTheme.colors.basic090 }}>
        <HeaderBlock
          wrapperStyle={{ backgroundColor: darkTheme.colors.basic090 }}
          navigation={navigation}
          noPaddingTop
        />
        <Content>
          <Title>{t('title')}</Title>
          <Spacing h={spacing.largePlus} />
          <Body>{t('header')}</Body>

          <Logo source={smartWalletImage} />

          <Subtitle>{t('upgrade.subtitle')}</Subtitle>
          <Body>{t('upgrade.body')}</Body>

          <Spacing h={spacing.medium} />

          <EmojiCard title={t('benefits.secure')} emoji="🔐" />
          <EmojiCard title={t('benefits.ensName')} emoji="⚛️" />
          <EmojiCard title={t('benefits.betterApp')} emoji="⚡" />

          <Spacing h={spacing.extraLarge} />

          <Body>{t('footer')}</Body>

          <Spacing h={48} />

          <Button title={t('button.upgrade')} onPress={navigateToMigration} />

          <Spacing h={spacing.large} />
        </Content>
      </Container>
    </ThemeProvider>
  );
}

export default KeyBasedAssetTransferIntro;


const Title = styled(Text)`
  font-family: "${appFont.medium}";
  ${fontStyles.large};
  margin: 0px 50px;
  text-align: center;
`;

const Subtitle = styled(Text)`
  font-size: 20px;
  line-height: 24px;
  text-align: center;
  margin-bottom: ${spacing.medium}px;
`;

const Body = styled(Text)`
  ${fontStyles.medium};
  color: ${({ theme }) => theme.colors.basic030};
  text-align: center;
  margin-horizontal: ${spacing.medium}px;
`;

const Logo = styled(Image)`
  align-self: center;
  margin-top: 42px;
  margin-bottom: 56px;
`;
