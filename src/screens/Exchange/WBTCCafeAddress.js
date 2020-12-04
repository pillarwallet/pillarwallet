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
/* eslint-disable i18next/no-literal-string */
import React from 'react';
import { Image, View } from 'react-native';
import styled, { withTheme } from 'styled-components/native';

// components
import QRCodeWithTheme from 'components/QRCode/QRCodeWithTheme';
import { BaseText } from 'components/Typography';
import Spinner from 'components/Spinner';

// utils
import { fontStyles } from 'utils/variables';
import { themedColors } from 'utils/themes';
import { images } from 'utils/images';

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

const InfoWrapper = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: 25px;
  margin-bottom: 40px;
  width: 100%;
`;

type Props = {
  amount: string;
  theme: Theme;
  address?: string;
  error?: boolean;
}

const WBTCCafeAddress = ({
  amount, address, error, theme,
}: Props) => {
  if (error) return null;
  if (!address && !error) return <Wrapper><Spinner size={30} /></Wrapper>;

  const { infoIcon } = images(theme);

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
      <InfoWrapper>
        <Image source={infoIcon} style={{ height: 27, width: 27, marginRight: 15 }} />
        <View style={{ flex: 1 }}>
          <Text color={themedColors.secondaryText}>{t('wbtcCafe.warning')}</Text>
        </View>
      </InfoWrapper>
    </Wrapper>
  );
};

export default withTheme(WBTCCafeAddress);
