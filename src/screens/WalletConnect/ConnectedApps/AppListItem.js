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
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import Text from 'components/modern/Text';
import Image from 'components/Image';

// Utils
import { useThemeColors } from 'utils/themes';
import { spacing } from 'utils/variables';
import { useChainsConfig } from 'utils/uiConfig';

// Types
import type { Chain } from 'models/Chain';

type Props = {|
  title: string,
  chain: Chain,
  iconUrl: ?string,
  onPress?: () => mixed,
|};

function AppListItem({ title, chain, iconUrl, onPress }: Props) {
  const { t } = useTranslationWithPrefix('walletConnect.connectedApps');
  const colors = useThemeColors();

  const config = useChainsConfig()[chain];

  return (
    <TouchableContainer onPress={onPress}>
      <IconContainer>{!!iconUrl && <IconImage source={{ uri: iconUrl }} />}</IconContainer>

      <TitleContainer>
        <Text variant="medium" numberOfLines={1}>{title}</Text>
        <Text color={colors.secondaryText}>{config?.title}</Text>
      </TitleContainer>

      <RightAddOn>
        <Text variant="medium" color={colors.secondaryText}>
          {t('connected')}
        </Text>
      </RightAddOn>
    </TouchableContainer>
  );
}

export default AppListItem;

const TouchableContainer = styled.TouchableOpacity`
  flex-direction: row;
  padding: 14px ${spacing.large}px;
  min-height: 64px;
`;

const IconContainer = styled.View`
  justify-content: center;
  align-items: center;
  margin-right: ${spacing.medium}px;
  width: 48px;
`;

const IconImage = styled(Image)`
  width: 48px;
  height: 48px;
  border-radius: 24px;
`;

const TitleContainer = styled.View`
  flex: 1;
  justify-content: center;
`;

const RightAddOn = styled.View`
  justify-content: center;
  margin-left: ${spacing.medium}px;
`;
