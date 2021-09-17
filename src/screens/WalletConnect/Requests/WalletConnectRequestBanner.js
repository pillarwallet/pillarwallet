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
import Image from 'components/Image';
import Text from 'components/core/Text';
import Modal from 'components/Modal';
import WalletConnectRequestModal from 'screens/WalletConnect/CallRequest';

// Utils
import { fontStyles, spacing } from 'utils/variables';
import { formatRequestType } from 'utils/walletConnect';

// Local
import { type RequestItem } from './selectors';

type Props = {|
  request: RequestItem,
|};

function WalletConnectRequestBanner({ request }: Props) {
  const showRequestModal = () => {
    Modal.open(() => <WalletConnectRequestModal request={request.callRequest} />);
  };

  return (
    <TouchableContainer onPress={showRequestModal}>
      <IconImage source={{ uri: request.iconUrl }} />

      <Column>
        <Title numberOfLines={1}>{request.title}</Title>
        <Subtitle>{formatRequestType(request.type)}</Subtitle>
      </Column>
    </TouchableContainer>
  );
}

export default WalletConnectRequestBanner;

const TouchableContainer = styled.TouchableOpacity`
  flex-direction: row;
  margin: ${spacing.medium / 2}px ${spacing.layoutSides}px;
  padding: ${spacing.large}px;
  background-color: ${({ theme }) => theme.colors.basic050};
  border-radius: 30px;
  shadow-opacity: 0.07;
  shadow-color: #000;
  shadow-offset: 0 6px;
  shadow-radius: 20px;
  elevation: 6;
`;

const IconImage = styled(Image)`
  width: 48px;
  height: 48px;
  border-radius: 24px;
`;

const Column = styled.View`
  flex: 1;
  margin-left: ${spacing.mediumLarge}px;
`;

const Title = styled(Text)`
  ${fontStyles.medium};
`;

const Subtitle = styled(Text)`
  color: ${({ theme }) => theme.colors.secondaryText};
`;
