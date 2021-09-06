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
import { Image } from 'react-native';
import Clipboard from '@react-native-community/clipboard';
import { useTranslation } from 'react-i18next';
import styled, { withTheme } from 'styled-components/native';

// components
import { BaseText } from 'components/legacy/Typography';
import Toast from 'components/Toast';

// utils
import { fontStyles, spacing } from 'utils/variables';
import { images } from 'utils/images';

// Types
import type { BaseTextProps } from 'components/legacy/Typography';
import type { Theme } from 'models/Theme';

const Container = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
`;

const Text = styled(BaseText)`
  ${fontStyles.regular};
  margin-right: ${spacing.small}px;
`;

type Props = {|
  ...BaseTextProps,
  theme: Theme,
  textToCopy?: string,
|};

const hitSlop = {
  top: 15, bottom: 15, left: 15, right: 15,
};

const TextWithCopy = ({
  theme,
  children,
  textToCopy,
  ...rest
}: Props) => {
  const { t } = useTranslation();

  const handleCopyToClipboard = () => {
    const text = textToCopy ?? (typeof children === 'string' ? children : undefined);
    if (!text) return;

    Clipboard.setString(text);
    Toast.show({ message: t('toast.addressCopiedToClipboard'), emoji: 'ok_hand' });
  };

  return (
    <Container hitSlop={hitSlop} onPress={handleCopyToClipboard}>
      <Text {...rest}>{children}</Text>
      <Image source={images(theme).copy} />
    </Container>
  );
};

export default withTheme(TextWithCopy);
