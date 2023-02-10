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
import { TextInput as RNTextInput } from 'react-native';

// Utils
import { useThemeColors, useIsDarkTheme } from 'utils/themes';
import { appFont, fontSizes } from 'utils/variables';

// Types
import type { TextInputProps } from 'utils/types/react-native';

type Props = TextInputProps;
type Instance = typeof RNTextInput;

/**
 * TextInput styled to use default font and color. This is intened to use as single line input only!
 */
const TextInput = React.forwardRef<Props, Instance>(({ style, ...rest }, ref: any) => {
  const colors = useThemeColors();
  const isDarkTheme = useIsDarkTheme();

  // eslint-disable-next-line i18next/no-literal-string
  const keyboardAppearance = isDarkTheme ? 'dark' : 'light';

  const styleList = React.useMemo(() => [styles.base, { color: colors.text }, style], [style, colors.text]);

  return (
    <RNTextInput
      ref={ref}
      keyboardAppearance={keyboardAppearance}
      // `placeholder` is needed for Android to avoid slight increase in height when input is empty.
      placeholder=""
      placeholderTextColor={colors.secondaryText}
      disableFullscreenUI
      underlineColorAndroid="transparent"
      {...rest}
      multiline={false}
      style={styleList}
      onLayout={() => {
        if (!ref) return;
        ref.current?.focus();
      }}
    />
  );
});

export default TextInput;

const styles = {
  base: {
    fontFamily: appFont.regular,
    fontSize: fontSizes.regular,

    // Reset Android defaults
    paddingVertical: 0,
  },
};
