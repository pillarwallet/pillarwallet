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
import { useTranslation } from 'react-i18next';
import Clipboard from '@react-native-community/clipboard';
import styled from 'styled-components/native';

// components
import Icon from 'components/modern/Icon';
import Text from 'components/modern/Text';
import Toast from 'components/Toast';

// utils
import { spacing } from 'utils/variables';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';

type Props = {|
  children?: React.Node | string,
  textToCopy?: string,
  style?: ViewStyleProp,
  iconColor?: string,
|};

const TextWithCopy = ({
  children,
  textToCopy,
  style,
  iconColor,
}: Props) => {
  const { t } = useTranslation();

  const handleCopyToClipboard = () => {
    if (!textToCopy) return;

    Clipboard.setString(textToCopy);
    Toast.show({ message: t('toast.addressCopiedToClipboard'), emoji: 'ok_hand' });
  };

  return (
    <Container hitSlop={hitSlop} onPress={handleCopyToClipboard} style={style}>
      {typeof children === 'string' ? <Text>{children}</Text> : children}
      {textToCopy != null && <CopyIcon name="copy" color={iconColor} width={18} height={18} />}
    </Container>
  );
};

const hitSlop = {
  top: 15,
  bottom: 15,
  left: 15,
  right: 15,
};

const Container = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
`;

const CopyIcon = styled(Icon)`
  margin-left: ${spacing.small}px;
`;

export default TextWithCopy;
