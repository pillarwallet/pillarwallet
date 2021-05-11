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
import Text from 'components/modern/Text';

// utils
import { appFont, fontStyles, spacing } from 'utils/variables';

type Props = {|
  title: string,
  children: React.Node,
|};

function BottomModal({ title, children }: Props) {
  return (
    <SlideModal hideHeader>
      <SafeAreaContent>
        <Title>{title}</Title>
        <ChildrenWrapper>{children}</ChildrenWrapper>
      </SafeAreaContent>
    </SlideModal>
  );
}

export default BottomModal;

const SafeAreaContent = styled(SafeAreaView)`
  padding: ${spacing.large}px 0;
  align-items: center;
`;

const Title = styled(Text)`
  margin: ${spacing.small}px 0 ${spacing.large}px;
  font-family: "${appFont.medium}";
  ${fontStyles.medium};
`;

const ChildrenWrapper = styled.View`
  align-self: stretch;
  align-items: center;
`;
