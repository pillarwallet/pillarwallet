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
import Text from 'components/modern/Text';
import TextWithCopy from 'components/modern/TextWithCopy';

// Selectors
import { useRootSelector, activeAccountAddressSelector } from 'selectors';

// Utils
import { formatHexAddress } from 'utils/format';
import { useThemeColors } from 'utils/themes';

type Props = {
  address?: string,
};

/**
 * Display address with copy feature. By default displays current account address.
 */
function WalletAddress({ address }: Props) {
  const accountAddress = useRootSelector(activeAccountAddressSelector);
  const resultAddress = address ?? accountAddress;

  const colors = useThemeColors();

  return (
    <TextWithCopy textToCopy={resultAddress} iconColor={colors.buttonTextTitle}>
      <Address>{formatHexAddress(resultAddress)}</Address>
    </TextWithCopy>
  );
}

export default WalletAddress;

const Address = styled(Text)`
  color: ${({ theme }) => theme.colors.secondaryText};
  font-variant: tabular-nums;
`;
