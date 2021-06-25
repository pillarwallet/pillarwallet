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

import React from 'react';
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components/native';
import Instabug from 'instabug-reactnative';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import { Container, Content } from 'components/modern/Layout';
import HeaderBlock from 'components/HeaderBlock';
import MigrateEnsBanner from 'components/Banners/MigrateEnsBanner';
import MigrateWalletBanner from 'components/Banners/MigrateWalletBanner';
import WalletMigrationArchanovaBanner from 'screens/WalletMigrationArchanova/Banner';

// Constants
import { MENU_SETTINGS, CONTACTS_FLOW } from 'constants/navigationConstants';

// Utils
import { useThemeColors } from 'utils/themes';
import { spacing } from 'utils/variables';

// Assets
import PillarLogo from 'assets/images/svg/pillar-logo-small.svg';

// Local
import MenuItem from './components/MenuItem';
import MenuFooter from './components/MenuFooter';
import SocialMediaLinks from './components/SocialMediaLinks';

const Menu = () => {
  const { t } = useTranslationWithPrefix('menu');
  const colors = useThemeColors();
  const navigation = useNavigation();

  const goToSettings = () => navigation.navigate(MENU_SETTINGS);
  const goToInviteFriends = () => navigation.navigate(CONTACTS_FLOW);
  const goToSupportChat = () => Instabug.show();

  return (
    <Container>
      <HeaderBlock
        leftItems={[{ close: true }]}
        centerItems={[{ custom: <PillarLogo fill={colors.pillarText} /> }]}
        navigation={navigation}
      />

      <Content paddingHorizontal={0}>
        <MenuItemsContainer>
          <MenuItem title={t('item.settings')} icon="settings" onPress={goToSettings} />
          <MenuItem title={t('item.addressBook')} icon="contacts" onPress={goToInviteFriends} />
          <MenuItem title={t('item.supportChat')} icon="message" onPress={goToSupportChat} />
        </MenuItemsContainer>

        <SocialMediaLinks />

        <BannersContainer>
          <MigrateEnsBanner style={styles.banner} />
          <WalletMigrationArchanovaBanner style={styles.banner} />
          <MigrateWalletBanner style={styles.banner} />
        </BannersContainer>

        <FlexSpacer />
        <MenuFooter />
      </Content>
    </Container>
  );
};

export default Menu;

const styles = {
  banner: {
    marginTop: spacing.medium,
  },
};

const MenuItemsContainer = styled.View``;

const BannersContainer = styled.View`
  padding: ${spacing.medium}px ${spacing.large}px ${spacing.large}px;
`;

const FlexSpacer = styled.View`
  flex-grow: 1;
`;
