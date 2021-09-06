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
import Clipboard from '@react-native-community/clipboard';
import styled from 'styled-components/native';

// components
import Icon from 'components/core/Icon';
import Text from 'components/core/Text';
import Toast from 'components/Toast';

// utils
import { hitSlop20 } from 'utils/common';
import { spacing } from 'utils/variables';

// Types
import type { ViewStyleProp, TextStyleProp } from 'utils/types/react-native';

type Props = {|
  children?: React.Node | string,
  textToCopy?: string,
  style?: ViewStyleProp,
  iconColor?: string,
  toastText?: string,
  textStyle?: TextStyleProp,
  adjustsFontSizeToFit?: boolean,
  numberOfLines?: number,
|};

const TextWithCopy = ({
  children,
  textToCopy,
  style,
  iconColor,
  toastText,
  textStyle,
  adjustsFontSizeToFit,
  numberOfLines,
}: Props) => {
  const copyToClipboard = () => {
    if (!textToCopy) return;

    Clipboard.setString(textToCopy);

    if (toastText) {
      Toast.show({ message: toastText, emoji: 'ok_hand' });
    }
  };

  return (
    <TouchableContainer onPress={copyToClipboard} disabled={!textToCopy} hitSlop={hitSlop20} style={style}>
      {typeof children === 'string' ? (
        <Text adjustsFontSizeToFit={adjustsFontSizeToFit} numberOfLines={numberOfLines} style={textStyle}>
          {children}
        </Text>
      ) : (
        children
      )}
      {!!textToCopy && <CopyIcon name="copy" color={iconColor} width={18} height={18} />}
    </TouchableContainer>
  );
};

const TouchableContainer = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
`;

const CopyIcon = styled(Icon)`
  margin-left: ${spacing.small}px;
`;

export default TextWithCopy;
