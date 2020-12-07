// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

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

import React from 'react';
import styled, { withTheme } from 'styled-components/native';

// components
import QRCodeWithTheme from 'components/QRCode/QRCodeWithTheme';
import { BaseText } from 'components/Typography';
import Spinner from 'components/Spinner';

// utils
import { fontStyles } from 'utils/variables';
import { themedColors } from 'utils/themes';

// models
import type { Theme } from 'models/Theme';

import t from 'translations/translate';
import WBTCCafeWarning from './WBTCCafeWarning';


const Wrapper = styled.View`
  width: 100%;
  align-items: center;
`;

const AddressWrapper = styled.View`
  width: 100%;
  flex-direction: row;
  padding: 5px;
  margin-top: 25px;
`;

const TextWrapper = styled.View`
  margin-left: 10px;
  justify-content: space-between;
  flex: 1;
`;

const Text = styled(BaseText)`
  ${fontStyles.regular};
  color: ${({ color }) => color};
`;

type Props = {
  amount: string,
  theme: Theme,
  address?: string,
  error?: boolean,
};

const WBTCCafeAddress = ({
  amount, address, error,
}: Props) => {
  if (error) return null;
  if (!address && !error) return <Wrapper><Spinner size={30} /></Wrapper>;

  return (
    <Wrapper>
      <AddressWrapper>
        <QRCodeWithTheme size={70} value={address} />
        <TextWrapper>
          <Text color={themedColors.secondaryText}>
            {t('wbtcCafe.sendBtc', { amount })}
          </Text>
          <Text color={themedColors.text}>{t('wbtcCafe.useOnce')}</Text>
        </TextWrapper>
      </AddressWrapper>
      <WBTCCafeWarning />
    </Wrapper>
  );
};

export default withTheme(WBTCCafeAddress);
