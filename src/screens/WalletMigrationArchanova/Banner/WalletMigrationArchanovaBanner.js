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
import { WALLET_MIGRATION_ARCHANOVA_INTRO, WALLET_MIGRATION_ARCHANOVA_STATUS } from 'constants/navigationConstants';

// Selectors
import { useRootSelector } from 'selectors';
import {
  showWalletMigrationArchanovaSelector,
  hasPendingMigrationTransactionsSelector,
} from 'selectors/walletMigrationArchanova';

// Utils
import { appFont, fontStyles, spacing } from 'utils/variables';
import { useThemeColors } from 'utils/themes';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';

const smartWalletIcon = require('assets/icons/smart-wallet-migrate.png');

type Props = {|
  style?: ViewStyleProp,
|};

function WalletMigrationArchanovaBanner({ style }: Props) {
  const colors = useThemeColors();
  const { t } = useTranslationWithPrefix('walletMigrationArchanova.banner');
  const navigation = useNavigation();

  const showMigrationBanner = useRootSelector(showWalletMigrationArchanovaSelector);
  const hasPendingMigrationTransactions = useRootSelector(hasPendingMigrationTransactionsSelector);

  if (!showMigrationBanner) return null;

  const handlePress = () => {
    if (hasPendingMigrationTransactions) {
      navigation.navigate(WALLET_MIGRATION_ARCHANOVA_STATUS);
    } else {
      navigation.navigate(WALLET_MIGRATION_ARCHANOVA_INTRO);
    }
  };

  const GRADIENT_COLORS = [colors.darkLimeGreen, colors.darkBlackLimeGreen];

  return (
    <TouchableOpacity onPress={handlePress} style={style}>
      <BackgroundGradient colors={GRADIENT_COLORS} locations={[0.05, 0.65]} useAngle angle={284}>
        <Icon source={smartWalletIcon} />

        <Summary>
          <Title>{t('title')}</Title>
        </Summary>
      </BackgroundGradient>
    </TouchableOpacity>
  );
}

export default WalletMigrationArchanovaBanner;

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
