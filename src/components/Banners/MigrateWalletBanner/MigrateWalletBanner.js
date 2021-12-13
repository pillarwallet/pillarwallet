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
import { TouchableOpacity } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components/native';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import Text from 'components/core/Text';

// Constants
import { KEY_BASED_ASSET_TRANSFER_INTRO, KEY_BASED_ASSET_TRANSFER_STATUS } from 'constants/navigationConstants';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';

// Selectors
import { useRootSelector } from 'selectors';
import { keyBasedWalletHasPositiveBalanceSelector } from 'selectors/balances';
import { hasKeyBasedAssetsTransferInProgressSelector } from 'selectors/wallets';

// Utils
import { appFont, fontStyles, spacing } from 'utils/variables';
import { useThemeColors } from 'utils/themes';

// Services
import { firebaseRemoteConfig } from 'services/firebase';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';

const smartWalletIcon = require('assets/icons/migrate_key_wallet.png');

type Props = {|
  style?: ViewStyleProp,
|};

function MigrateWalletBanner({ style }: Props) {
  const colors = useThemeColors();
  const { t } = useTranslationWithPrefix('smartWalletContent.banner');
  const navigation = useNavigation();

  const keyBasedWalletHasPositiveBalance = useRootSelector(keyBasedWalletHasPositiveBalanceSelector);
  const hasKeyBasedAssetsTransferInProgress = useRootSelector(hasKeyBasedAssetsTransferInProgressSelector);

  const isKeyBasedAssetsMigrationEnabled = firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.KEY_BASED_ASSETS_MIGRATION);
  const showKeyBasedWalletMigration =
    (hasKeyBasedAssetsTransferInProgress || keyBasedWalletHasPositiveBalance) && isKeyBasedAssetsMigrationEnabled;

  if (!showKeyBasedWalletMigration) return null;

  const handlePress = () => {
    navigation.navigate(
      hasKeyBasedAssetsTransferInProgress ? KEY_BASED_ASSET_TRANSFER_STATUS : KEY_BASED_ASSET_TRANSFER_INTRO,
    );
  };

  const GRADIENT_COLORS = [colors.darkViolet, colors.darkBlackViolet];

  return (
    <TouchableOpacity onPress={handlePress} style={style}>
      <BackgroundGradient colors={GRADIENT_COLORS} locations={[0.05, 0.65]} useAngle angle={283}>
        <Icon source={smartWalletIcon} />

        <Summary>
          <Title>{t('title')}</Title>
        </Summary>
      </BackgroundGradient>
    </TouchableOpacity>
  );
}

const BackgroundGradient = styled(LinearGradient)`
  flex-direction: row;
  background-color: green;
  border-radius: 20px;
`;

const Icon = styled.Image`
  margin-right: ${spacing.mediumLarge}px;
`;

const Summary = styled.View`
  flex: 1;
`;

const Title = styled(Text)`
  font-family: '${appFont.medium}';
  margin-top: ${spacing.mediumLarge}px;
  ${fontStyles.big};
  color: #fcfdff;
  margin-bottom: ${spacing.small}px;
  margin-right: ${spacing.small}px;
`;

export default MigrateWalletBanner;
