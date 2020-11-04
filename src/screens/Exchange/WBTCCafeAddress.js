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
import React, { useState, useEffect } from 'react';
import { Clipboard } from 'react-native';
import Emoji from 'react-native-emoji';
import styled, { withTheme } from 'styled-components/native';

// components
import QRCodeWithTheme from 'components/QRCode/QRCodeWithTheme';
import { BaseText } from 'components/Typography';
import Toast from 'components/Toast';
import Spinner from 'components/Spinner';

// utils
import { fontStyles, fontSizes } from 'utils/variables';
import { themedColors } from 'utils/themes';

// models
import type { Theme } from 'models/Theme';

import t from 'translations/translate';

const Wrapper = styled.View`
  width: 100%;
  align-items: center;
`;

const AddressWrapper = styled.View`
  width: 100%;
  flex-direction: row;
  padding: 5px;
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

const InfoWrapper = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: 15px;
`;

type Props = {
  amount: string;
  theme: Theme;
}

const WBTCCafeAddress = ({ amount }: Props) => {
  const [btcAddress, setBtcAddress] = useState('');
  useEffect(() => {
    if (!btcAddress) {
      const address = 'testAddress'; // TODO: getGatewayAddress();
      setBtcAddress(address);
    }
  });

  const handleCopy = () => {
    Clipboard.setString(btcAddress);
    const message = t('toast.addressCopiedToClipboard');
    Toast.show({ message, emoji: 'ok_hand' });
  };

  if (!btcAddress) {
    return <Wrapper><Spinner height={30} width={30} /></Wrapper>;
  }

  return (
    <Wrapper>
      <AddressWrapper>
        <QRCodeWithTheme size={70} value={btcAddress} />
        <TextWrapper>
          <Text color={themedColors.text}>
            {t('wbtcCafe.sendBtc', { amount })}
          </Text>
          <Text color={themedColors.link} onPress={handleCopy}>
            {t('wbtcCafe.copy')}
          </Text>
        </TextWrapper>
      </AddressWrapper>
      <InfoWrapper>
        <Emoji name="point_up" style={{ fontSize: fontSizes.regular, marginRight: 5 }} />
        <Text color={themedColors.secondaryText}>{t('wbtcCafe.useOnce')}</Text>
      </InfoWrapper>
    </Wrapper>
  );
};

export default withTheme(WBTCCafeAddress);
