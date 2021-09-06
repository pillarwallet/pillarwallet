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
import { SvgCssUri } from 'react-native-svg';

// Components
import Icon, { type IconName } from 'components/core/Icon';
import Image from 'components/Image';
import Text from 'components/core/Text';
import TransactionStatusIcon from 'components/display/TransactionStatusIcon';

// Utils
import { useThemeColors } from 'utils/themes';
import { spacing } from 'utils/variables';
import { isSvgImage } from 'utils/images';

// Types
import type { TransactionStatus } from 'models/History';

type Props = {|
  title: ?string,
  subtitle?: ?string,
  subtitleColor?: ?string,
  iconUrl?: ?string,
  iconName?: IconName,
  iconColor?: string,
  iconBorderColor?: string,
  iconComponent?: React.Node,
  valueComponent?: React.Node,
  status?: TransactionStatus,
  onPress?: () => mixed,
  onSubtitlePress?: () => mixed,
  customIconProps?: Object,
|};

function HistoryListItem({
  title,
  subtitle,
  subtitleColor,
  iconUrl,
  iconName,
  iconColor,
  iconBorderColor,
  iconComponent,
  valueComponent,
  status,
  onPress,
  onSubtitlePress,
  customIconProps = {},
}: Props) {
  const colors = useThemeColors();
  const isSvg = isSvgImage(iconUrl);

  return (
    <TouchableContainer onPress={onPress} disabled={!onPress}>
      <LeftColumn>
        {!!iconUrl && (
          <IconImageWrapper>
            {isSvg && <SvgCssUri uri={iconUrl} width="100%" height="100%" />}
            {!isSvg && <IconImage source={{ uri: iconUrl }} />}
          </IconImageWrapper>
        )}
        {!!iconName && (
          <IconCircle $color={iconBorderColor ?? colors.neutralWeak}>
            <Icon name={iconName} color={iconColor ?? colors.neutral} {...customIconProps} />
          </IconCircle>
        )}
        {iconComponent}
      </LeftColumn>

      <MiddleColumn>
        <Text variant="medium" numberOfLines={1}>
          {title}
        </Text>

        {!!subtitle && (
          <SubtitleButton onPress={onSubtitlePress} disabled={!onSubtitlePress}>
            <Text color={subtitleColor ?? colors.basic030}>{subtitle}</Text>
          </SubtitleButton>
        )}
      </MiddleColumn>

      {valueComponent && <RightColumn>{valueComponent}</RightColumn>}

      <StatusIcon status={status} size={16} />
    </TouchableContainer>
  );
}

export default HistoryListItem;

const TouchableContainer = styled.TouchableOpacity`
  flex-direction: row;
  padding: ${spacing.small}px ${spacing.large}px;
  background-color: ${({ theme }) => theme.colors.basic070};
  min-height: 64px;
`;

const SubtitleButton = styled.TouchableOpacity``;

const LeftColumn = styled.View`
  justify-content: center;
  margin-right: ${spacing.medium}px;
  width: 48px;
`;

const MiddleColumn = styled.View`
  flex: 1;
  justify-content: center;
`;

const RightColumn = styled.View`
  justify-content: center;
  align-items: flex-end;
  margin-left: ${spacing.medium}px;
`;

const IconImageWrapper = styled.View`
  justify-content: center;
  align-items: center;
  width: 48px;
  height: 48px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.neutralWeak};
  border-radius: 24px;
  background-color: ${({ theme }) => theme.colors.neutralWeak};
  overflow: hidden;
`;

const IconImage = styled(Image)`
  width: 48px;
  height: 48px;
`;

const IconCircle = styled.View`
  justify-content: center;
  align-items: center;
  width: 48px;
  height: 48px;
  border-width: 1px;
  border-color: ${({ $color }) => $color};
  border-radius: 24px;
`;

const StatusIcon = styled(TransactionStatusIcon)`
  align-self: center;
  margin-left: 6px;
`;
