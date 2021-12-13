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
import styled from 'styled-components/native';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslationWithPrefix } from 'translations/translate';
import { useNavigation } from 'react-navigation-hooks';

// components
import Text from 'components/core/Text';
import Icon from 'components/legacy/Icon';

// constants
import { ENS_MIGRATION_CONFIRM } from 'constants/navigationConstants';

// selectors
import { isEnsMigrationNeededSelector } from 'selectors/archanova';
import { useRootSelector } from 'selectors';

// utils
import { appFont, fontStyles, spacing } from 'utils/variables';
import { useThemeColors } from 'utils/themes';

// types
import type { ViewStyleProp } from 'utils/types/react-native';

// assets
const migrateEnsIcon = require('assets/icons/migrate_ens_name.png');


type Props = {|
  style?: ViewStyleProp,
|};

const MigrateEnsBanner = ({ style }: Props) => {
  const colors = useThemeColors();
  const isEnsMigrationNeeded = useRootSelector(isEnsMigrationNeededSelector);
  const [isVisible, setIsVisible] = useState(isEnsMigrationNeeded);
  const { t } = useTranslationWithPrefix('migrateENSContent');
  const navigation = useNavigation();

  const onProceed = () => navigation.navigate(ENS_MIGRATION_CONFIRM);

  const onClose = () => setIsVisible(false);

  // banner is only hidden from current session, app reopen should bring banner back
  if (!isVisible) return null;

  const GRADIENT_COLORS = [colors.patriarchPurple, colors.darkMagenta];

  return (
    <Wrapper onPress={onProceed} style={style}>
      <BackgroundGradient colors={GRADIENT_COLORS} locations={[0.05, 0.65]} useAngle angle={284}>
        <ContentIcon source={migrateEnsIcon} />
        <Summary>
          <Title>{t('banner.title')}</Title>
        </Summary>
      </BackgroundGradient>
      <CloseButton onPress={onClose}>
        <CloseIcon name="rounded-close" />
      </CloseButton>
    </Wrapper>
  );
};

const BackgroundGradient = styled(LinearGradient)`
  flex-direction: row;
  background-color: green;
  border-radius: 20px;
`;

const ContentIcon = styled.Image`
  margin-right: ${spacing.mediumLarge}px;
`;

const Summary = styled.View`
  flex: 1;
`;

const Title = styled(Text)`
  font-family: '${appFont.archiaMedium}';
  ${fontStyles.big};
  margin-top: ${spacing.mediumLarge}px;
  color: #fcfdff;
  margin-bottom: ${spacing.small}px;
`;

const CloseButton = styled.TouchableOpacity`
  position: absolute;
  top: -10px;
  right: 5px;
  border-radius: 15px;
  height: 60px;
  width: 60px;
  padding: 15px;
  justify-content: center;
  align-items: center;
`;

const Wrapper = styled.TouchableOpacity`
  position: relative;
`;

const CloseIcon = styled(Icon)`
  color: #fff;
  font-size: 20px;
`;

export default MigrateEnsBanner;
