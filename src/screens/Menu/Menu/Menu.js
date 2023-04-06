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
import { Linking } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components/native';
import { Replies, BugReporting } from 'instabug-reactnative';
import { useTranslationWithPrefix } from 'translations/translate';
import { switchEnvironments } from 'configs/envConfig';

// Components
import { Container, Content } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import MigrateEnsBanner from 'components/Banners/MigrateEnsBanner';
import MigrateWalletBanner from 'components/Banners/MigrateWalletBanner';
import Banner from 'components/Banner/Banner';

// Screens
import WalletMigrationArchanovaBanner from 'screens/WalletMigrationArchanova/Banner';

// Constants
import { MENU_SETTINGS, CONTACTS_FLOW, STORYBOOK, ADD_TOKENS } from 'constants/navigationConstants';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';

// Selectors
import { useIsWalletBackedUp } from 'selectors/wallets';
import { useRootSelector } from 'selectors';
import { accountAssetsBalancesSelector } from 'selectors/balances';
import { useSupportedChains } from 'selectors/chains';

// Services
import { firebaseRemoteConfig } from 'services/firebase';

// Utils
import { useIsDarkTheme, useThemeColors } from 'utils/themes';
import { spacing } from 'utils/variables';
import { getWalletPlrBalance } from 'utils/balances';
import { sum } from 'utils/bigNumber';

// Assets
import PillarLogo from 'assets/images/pillar-logo-small.svg';
import PillarLogoDark from 'assets/images/pillar-logo-small-dark.svg';

// Local
import MenuItem from './components/MenuItem';
import MenuFooter from './components/MenuFooter';
import SocialMediaLinks from './components/SocialMediaLinks';

const Menu = () => {
  const { t, tRoot } = useTranslationWithPrefix('menu');
  const isDarkTheme = useIsDarkTheme();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const isBackedUp = useIsWalletBackedUp();
  const accountBalances = useRootSelector(accountAssetsBalancesSelector);
  const chains = useSupportedChains();
  const plrbalance = getWalletPlrBalance(accountBalances, chains);
  const enoughPlrBalance = sum(plrbalance).gt(9999);
  const screenName = navigation.state.routeName;

  const knowledgebaseUrl = firebaseRemoteConfig.getString(REMOTE_CONFIG.KNOWLEDGEBASE_URL);

  const [repliesFlag, setRepliesFlag] = useState(false);

  Replies.hasChats((previousChat) => {
    if (previousChat) {
      setRepliesFlag(true);
    }
  });

  const goToSettings = () => navigation.navigate(MENU_SETTINGS);
  const goToInviteFriends = () => navigation.navigate(CONTACTS_FLOW);
  const goToStorybook = () => navigation.navigate(STORYBOOK);
  const goToManageTokenLists = () => navigation.navigate(ADD_TOKENS);

  const goToSupportConversations = () => Replies.show();
  const goToKnowledgebase = () => Linking.openURL(knowledgebaseUrl);
  const goToEmailSupport = () =>
    BugReporting.showWithOptions(BugReporting.reportType.question, [BugReporting.option.emailFieldOptional]);

  let clickCount = 0;
  const handleSecretClick = () => {
    clickCount++;
    if (clickCount === 16) {
      // on the 16th click switch network and reset.
      clickCount = 0;
      switchEnvironments();
    }
  };

  return (
    <Container>
      <HeaderBlock
        leftItems={[{ close: true }]}
        centerItems={[{ custom: isDarkTheme ? <PillarLogoDark /> : <PillarLogo />, onPress: handleSecretClick }]}
        navigation={navigation}
        noPaddingTop
      />

      <Content paddingHorizontal={0}>
        <MenuItem
          title={t('item.settings')}
          icon="settings"
          value={!isBackedUp ? tRoot('menu.settings.backupNotFinishedWarning') : ''}
          valueColor={colors.negative}
          onPress={goToSettings}
          testID={`${TAG}-button-settings`}
          // eslint-disable-next-line i18next/no-literal-string
          accessibilityLabel={`${TAG}-button-settings`}
        />
        <MenuItem title={t('item.tokens')} icon="tokens" onPress={goToManageTokenLists} />
        <MenuItem title={t('item.addressBook')} icon="contacts" onPress={goToInviteFriends} />
        <MenuItem
          title={enoughPlrBalance ? t('item.liveChatSupport') : t('item.emailSupport')}
          subtitle={!enoughPlrBalance ? t('item.liveChatActivate') : ''}
          icon="message"
          onPress={goToEmailSupport}
          testID={`${TAG}-button-email_support`}
          // eslint-disable-next-line i18next/no-literal-string
          accessibilityLabel={`${TAG}-button-email_support`}
        />
        {repliesFlag && enoughPlrBalance ? (
          <MenuItem
            title={t('item.supportConversations')}
            icon="message"
            onPress={goToSupportConversations}
            testID={`${TAG}-button-support_conversations`}
            // eslint-disable-next-line i18next/no-literal-string
            accessibilityLabel={`${TAG}-button-support_conversations`}
          />
        ) : null}
        <MenuItem
          title={t('item.knowledgebase')}
          icon="info"
          onPress={goToKnowledgebase}
          testID={`${TAG}-button-knowledge_base`}
          // eslint-disable-next-line i18next/no-literal-string
          accessibilityLabel={`${TAG}-button-knowledge_base`}
        />
        {__DEV__ && (
          <MenuItem
            title={t('item.storybook')}
            icon="lifebuoy"
            onPress={goToStorybook}
            testID={`${TAG}-button-storybook`}
            // eslint-disable-next-line i18next/no-literal-string
            accessibilityLabel={`${TAG}-button-storybook`}
          />
        )}

        <SocialMediaLinks />

        <Banner screenName={screenName} bottomPosition />

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

const BannersContainer = styled.View`
  padding: ${spacing.medium}px ${spacing.large}px ${spacing.large}px;
`;

const FlexSpacer = styled.View`
  flex-grow: 1;
`;

const TAG = 'Menu';
