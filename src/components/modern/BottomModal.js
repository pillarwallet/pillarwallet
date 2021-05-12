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
import SafeAreaView from 'components/modern/SafeAreaViewWorkaround';
import SlideModal from 'components/Modals/SlideModal';
import Image from 'components/Image';
import Text from 'components/modern/Text';
import { Spacing } from 'components/modern/Layout';

// Utils
import { appFont, fontStyles, spacing } from 'utils/variables';

import type { ImageSource } from 'utils/types/react-native';

type Props = {|
  title?: ?string,
  iconSource?: ImageSource,
  children: React.Node,
|};

function BottomModal({ title, iconSource, children }: Props) {
  const renderIcon = () => {
    if (!iconSource) return null;

    return (
      <IconWrapper style={{ position: 'absolute', marginTop: -24 }}>
        <IconImage source={iconSource} />
      </IconWrapper>
    );
  };

  return (
    <SlideModal hideHeader noPadding centerFloatingItem={renderIcon()}>
      <SafeAreaContent>
        <Spacing h={iconSource ? 24 : spacing.small} />
        {!!title && <Title>{title}</Title>}
        <ChildrenWrapper>{children}</ChildrenWrapper>
      </SafeAreaContent>
    </SlideModal>
  );
}

export default BottomModal;

const SafeAreaContent = styled(SafeAreaView)`
  padding: ${spacing.large}px;
  align-items: center;
`;

const IconWrapper = styled.View`
  width: 100%;
  align-items: center;
`;

const IconImage = styled(Image)`
  width: 48px;
  height: 48px;
  border-radius: 24px;
`;

const Title = styled(Text)`
  margin-bottom: ${spacing.large}px;
  font-family: ${appFont.medium};
  ${fontStyles.medium};
`;

const ChildrenWrapper = styled.View`
  align-self: stretch;
  align-items: center;
`;
