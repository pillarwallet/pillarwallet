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

// Components
import Icon, { type IconName } from 'components/core/Icon';
import Image from 'components/Image';
import SafeAreaView from 'components/layout/SafeAreaViewWorkaround';
import SlideModal from 'components/Modals/SlideModal';
import Text from 'components/core/Text';

// utils
import { formatDate } from 'utils/date';
import { useThemeColors } from 'utils/themes';
import { fontStyles, spacing } from 'utils/variables';

type Props = {|
  date?: Date,
  title: ?string,
  subtitle?: ?string,
  subtitleColor?: ?string,
  iconUrl?: ?string,
  iconName?: IconName,
  iconColor?: string,
  iconBorderColor?: string,
  iconComponent?: React.Node,
  customIconProps?: Object,
  onSubtitlePress?: () => mixed,
  children?: React.Node,
|};

const BaseEventDetails = ({
  date,
  title,
  subtitle,
  subtitleColor,
  iconUrl,
  iconName,
  iconColor,
  iconBorderColor,
  iconComponent,
  children,
  onSubtitlePress,
  customIconProps = {},
}: Props) => {
  const colors = useThemeColors();

  return (
    <SlideModal hideHeader>
      <SafeAreaContent>
        <Timestamp>{formatDate(date, DATE_FORMAT)}</Timestamp>

        <Title>{title}</Title>
        {!!subtitle && (
          <SubtitleButton onPress={onSubtitlePress} disabled={!onSubtitlePress}>
            <Subtitle color={subtitleColor}>{subtitle}</Subtitle>
          </SubtitleButton>
        )}

        <IconWrapper>
          {!!iconUrl && (
            <IconImageWrapper>
              <IconImage source={{ uri: iconUrl }} />
            </IconImageWrapper>
          )}

          {!!iconName && (
            <IconCircle $color={iconBorderColor ?? colors.neutralWeak}>
              <Icon name={iconName} color={iconColor ?? colors.neutral} width={40} height={40} {...customIconProps} />
            </IconCircle>
          )}

          {iconComponent}
        </IconWrapper>

        <ChildrenWrapper>{children}</ChildrenWrapper>
      </SafeAreaContent>
    </SlideModal>
  );
};

export default BaseEventDetails;

const DATE_FORMAT = 'MMMM d, yyyy HH:mm';

const SafeAreaContent = styled(SafeAreaView)`
  padding: ${spacing.large}px 0;
  align-items: center;
`;

const Timestamp = styled(Text)`
  ${fontStyles.tiny};
  margin-bottom: ${spacing.small}px;
  color: ${({ theme }) => theme.colors.neutral};
`;

const Title = styled(Text)`
  ${fontStyles.medium};
`;

const Subtitle = styled(Text)`
  color: ${({ theme, color }) => color ?? theme.colors.basic030};
`;

const SubtitleButton = styled.TouchableOpacity``;

const IconWrapper = styled.View`
  margin-top: ${spacing.large}px;
`;

const IconImageWrapper = styled.View`
  justify-content: center;
  align-items: center;
  width: 64px;
  height: 64px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.neutralWeak};
  border-radius: 32px;
  background-color: ${({ theme }) => theme.colors.neutralWeak};
  overflow: hidden;
`;

const IconImage = styled(Image)`
  width: 64px;
  height: 64px;
`;

const IconCircle = styled.View`
  justify-content: center;
  align-items: center;
  width: 64px;
  height: 64px;
  border-width: 1px;
  border-color: ${({ $color }) => $color};
  border-radius: 32px;
`;

const ChildrenWrapper = styled.View`
  align-self: stretch;
  align-items: center;
  margin-top: ${spacing.medium}px;
`;
