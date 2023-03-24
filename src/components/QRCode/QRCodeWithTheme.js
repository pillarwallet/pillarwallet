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
import * as React from 'react';
import QRCode from 'react-native-qrcode-svg';
import { withTheme } from 'styled-components/native';
import { getColorByThemeOutsideStyled } from 'utils/themes';
import type { Theme } from 'models/Theme';

type Props = {
  value: string,
  size: number,
  theme: Theme,
  getRef?: (ref: QRCode) => void,
};

const QRCodeWithTheme = (props: Props) => {
  const { value, size, theme, getRef } = props;
  return (
    <QRCode
      getRef={getRef}
      value={value}
      size={size}
      color={getColorByThemeOutsideStyled(theme.current, { lightKey: 'basic010', darkKey: 'basic070' })}
      backgroundColor={getColorByThemeOutsideStyled(theme.current, { lightKey: 'basic050', darkKey: 'basic000' })}
    />
  );
};

export default withTheme(QRCodeWithTheme);
