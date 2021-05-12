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
import BottomModal from 'components/modern/BottomModal';
import Text from 'components/modern/Text';

// Utils
import { appFont, fontStyles, spacing } from 'utils/variables';

// Types
import type { WalletConnectApp } from 'models/WalletConnect';

type Props = {|
  app: WalletConnectApp,
|};

function AppDetailsModal({ app }: Props) {
  return (
    <BottomModal iconSource={{ uri: app.iconUrl }}>
      <Title>{app.title}</Title>
      <Description>
        Decentralized, community-run ecosystem built on top of Ethereum and other blockchains. The core products include
        an automated market-making (AMM), decentralized exchange (DEX), Decentralized Money Market (DMM), Yield
        Instruments, and Staking Derivatives.
      </Description>
    </BottomModal>
  );
}

export default AppDetailsModal;

const Title = styled(Text)`
  font-family: ${appFont.medium};
  font-size: 20px;
`;

const Description = styled(Text)`
  margin: ${spacing.large}px 0 0;
  text-align: center;
  color: ${({ theme }) => theme.colors.secondaryText};
`;
