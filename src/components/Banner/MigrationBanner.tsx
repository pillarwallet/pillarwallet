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
import React, { FC } from 'react';
import styled, { withTheme } from 'styled-components/native';

// Components
import Text from 'components/core/Text';

// Types
import type { Theme } from 'models/Theme';

// Utils
import { appFont, fontStyles, spacing } from 'utils/variables';
import { getThemeColors } from 'utils/themes';
import { isValidURL } from 'utils/validators';
import { reportOrWarn } from 'utils/common';
import { isEtherspotAccount } from 'utils/accounts';

// Constants
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';

// Services
import { firebaseRemoteConfig } from 'services/firebase';
import { useActiveAccount } from 'selectors';
import { Linking } from 'react-native';

interface IBanner {
  theme: Theme;
}

const MigrationBanner: FC<IBanner> = ({ theme }) => {
  const colors = getThemeColors(theme);
  const activeAccount = useActiveAccount();
  const isEtherspotAcc = isEtherspotAccount(activeAccount);

  const isVisible = firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.APP_MIGRATION_BANNER_ENABLED);
  const title = firebaseRemoteConfig.getString(REMOTE_CONFIG.APP_MIGRATION_BANNER_TITLE);
  const content = firebaseRemoteConfig.getString(REMOTE_CONFIG.APP_MIGRATION_BANNER_CONTENT);
  const ctaName = firebaseRemoteConfig.getString(REMOTE_CONFIG.APP_MIGRATION_BANNER_CTA_NAME);
  const ctaUrl = firebaseRemoteConfig.getString(REMOTE_CONFIG.APP_MIGRATION_BANNER_CTA_HREF);

  const openLink = (url: string) => {
    if (isValidURL(url)) {
      Linking.openURL(url);
    } else {
      reportOrWarn(`Migration Banner: navigation failed to open: ${url}`);
    }
  };

  if (!isVisible || !isEtherspotAcc) return null;
  return (
    <TouchableContainer key={'migration_button'} onPress={() => openLink(ctaUrl)}>
      <Container style={{ backgroundColor: colors.red }}>
        <Summary>
          <Title color={colors.white}>{title + `\n` + content}</Title>
          <SubTitle color={colors.white}>{ctaName}</SubTitle>
        </Summary>
      </Container>
    </TouchableContainer>
  );
};

export default withTheme(MigrationBanner);

const TouchableContainer = styled.TouchableOpacity`
  margin-horizontal: ${spacing.mediumLarge}px;
  margin-top: ${spacing.mediumLarge}px;
`;

const Container = styled.ImageBackground`
  flex-direction: row;
  padding-top: ${spacing.medium}px;
  padding-bottom: ${spacing.mediumLarge}px;
  padding-horizontal: ${spacing.largePlus}px;
  border-radius: 20px;
  align-items: center;
`;

const Summary = styled.View`
  flex: 1;
`;

const Title = styled(Text)`
  font-family: '${appFont.medium}';
  ${fontStyles.medium};
`;

const SubTitle = styled(Text)`
  ${fontStyles.small};
`;
