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
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';

// Components
import Image from 'components/Image';
import SlideModal from 'components/Modals/SlideModal';
import Text from 'components/modern/Text';

// utils
import { formatDate } from 'utils/date';
import { fontStyles, spacing } from 'utils/variables';

type Props = {|
  date?: Date,
  title: ?string,
  subtitle?: ?string,
  iconUrl?: ?string,
  event?: ?string,
  children?: React.Node,
|};

const BaseLayout = ({
  date,
  title,
  subtitle,
  iconUrl,
  event,
  children,
}: Props) => {
  return (
    <SlideModal hideHeader>
      <SafeAreaContent forceInset={{ bottom: 'always' }}>
        <Timestamp>{formatDate(date, DATE_FORMAT)}</Timestamp>

        <Title>{title}</Title>
        <Subtitle>{subtitle}</Subtitle>

        {!!iconUrl && (
          <IconImageWrapper>
            <IconImage source={{ uri: iconUrl }} />
          </IconImageWrapper>
        )}

        <Event>{event}</Event>

        <ChildrenWrapper>{children}</ChildrenWrapper>
      </SafeAreaContent>
    </SlideModal>
  );
};

export default BaseLayout;

const DATE_FORMAT = 'MMMM D, YYYY HH:mm';

const SafeAreaContent = styled(SafeAreaView)`
  padding: ${spacing.large}px;
  align-items: center;
`;

const Timestamp = styled(Text)`
  ${fontStyles.tiny};
  margin-bottom: ${spacing.small}px;
`;

const Title = styled(Text)`
  ${fontStyles.medium};
`;

const Subtitle = styled(Text)`
  color: ${({ theme }) => theme.colors.basic030};
`;

const IconImageWrapper = styled.View`
  margin: ${spacing.large}px;
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

const Event = styled(Text)`
  ${fontStyles.large};
`;

const ChildrenWrapper = styled.View`
  align-self: stretch;
  align-items: stretch;
  margin-top: ${spacing.extraLarge}px;
`;
