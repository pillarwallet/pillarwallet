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
import { Linking } from 'react-native';
import styled from 'styled-components/native';

// Constants
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';

// Utils
import { useIsDarkTheme } from 'utils/themes';
import { spacing } from 'utils/variables';

// Services
import { firebaseRemoteConfig } from 'services/firebase';

// Assets
import LogoDiscord from 'assets/images/logo-discord.svg';
import LogoTwitter from 'assets/images/logo-twitter.svg';
import LogoYouTube from 'assets/images/logo-youtube.svg';

const SocialMediaLinks = () => {
  const isDarkTheme = useIsDarkTheme();

  const discordUrl = firebaseRemoteConfig.getString(REMOTE_CONFIG.APP_SOCIAL_DISCORD);
  const twitterUrl = firebaseRemoteConfig.getString(REMOTE_CONFIG.APP_SOCIAL_TWITTER);
  const youTubeUrl = firebaseRemoteConfig.getString(REMOTE_CONFIG.APP_SOCIAL_YOUTUBE);

  const openUrl = (url: string) => Linking.openURL(url);

  return (
    <Container>
      <TouchableWrapper
        onPress={() => openUrl(discordUrl)}
        testID={`${TAG}-button-discord`}
        // eslint-disable-next-line i18next/no-literal-string
        accessibilityLabel={`${TAG}-button-discord`}
      >
        <LogoDiscord fill={isDarkTheme ? discordColors.dark : discordColors.light} style={styles.discord} />
      </TouchableWrapper>
      <TouchableWrapper
        onPress={() => openUrl(twitterUrl)}
        testID={`${TAG}-button-twitter`}
        // eslint-disable-next-line i18next/no-literal-string
        accessibilityLabel={`${TAG}-button-twitter`}
      >
        <LogoTwitter />
      </TouchableWrapper>
      <TouchableWrapper
        onPress={() => openUrl(youTubeUrl)}
        testID={`${TAG}-button-youtube`}
        // eslint-disable-next-line i18next/no-literal-string
        accessibilityLabel={`${TAG}-button-youtube`}
      >
        <LogoYouTube />
      </TouchableWrapper>
    </Container>
  );
};

export default SocialMediaLinks;

const discordColors = {
  light: '#000000',
  dark: '#e7e7e7',
};

const styles = {
  // Align discord logo vertically as on design
  discord: {
    marginTop: 6,
  },
};

const Container = styled.View`
  flex-direction: row;
  align-items: center;
  margin: ${spacing.medium}px ${spacing.small}px;
`;

const TouchableWrapper = styled.TouchableOpacity`
  margin: ${spacing.medium}px;
`;

const TAG = 'SocialMediaLinks';
