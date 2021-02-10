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
import { useTranslation } from 'react-i18next';
import Clipboard from '@react-native-community/clipboard';
import styled, { withTheme } from 'styled-components/native';

import Toast from 'components/Toast';
import { BaseText } from 'components/Typography';

import { fontStyles, spacing } from 'utils/variables';
import { images } from 'utils/images';

const Container = styled.View`
  flex-direction: row;
  align-items: center;
`;

const Text = styled(BaseText)`
  ${fontStyles.regular};
  margin-right: ${spacing.small}px;
`;

type TextProps = React.ElementConfig<typeof BaseText>;

type Props = $Rest<TextProps, { children: any }>;

const TextWithCopy = ({ theme, children, ...rest }: Props) => {
  const { t } = useTranslation();

  const handleCopyToClipboard = (address: string) => {
    Clipboard.setString(address);
    Toast.show({ message: t('toast.addressCopiedToClipboard'), emoji: 'ok_hand' });
  };

  return (
    <Container>
      <Text {...rest} onPress={() => handleCopyToClipboard(children)}>
        {children}
      </Text>
      <Image source={images(theme).copy} />
    </Container>
  );
};

export default withTheme(TextWithCopy);
