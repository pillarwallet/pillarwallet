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
import { TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import { useTranslation } from 'react-i18next';

// Components
import Text from 'components/core/Text';
import TokenIcon from 'components/display/TokenIcon';

// Utils
import { fontStyles, spacing } from 'utils/variables';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';
import type { Chain } from 'models/Chain';
import type { Asset } from 'models/Asset';

type Props = {
  chain: Chain;
  name: string;
  logoURI: string;
  tokens: Asset[];
  onPress?: () => void;
  style?: ViewStyleProp;
};

function AddTokenListItem({ chain, name, logoURI, onPress, style, tokens }: Props) {
  const { t } = useTranslation();

  return (
    <Container
      onPress={onPress}
      disabled={!onPress}
      style={style}
      hitSlop={{ top: spacing.medium, bottom: spacing.medium }}
    >
      <TokenIcon url={logoURI} chain={chain} setMarginRight />

      <TitleContainer>
        <NormalText numberOfLines={1}>{name}</NormalText>
      </TitleContainer>

      <NormalText numberOfLines={1}>{t('label.number_of_tokens', { tokens: tokens?.length || 0 })}</NormalText>
    </Container>
  );
}

export default AddTokenListItem;

const Container = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  padding: ${spacing.medium}px ${spacing.large}px;
  min-height: 76px;
`;

const TitleContainer = styled.View`
  flex: 1;
  justify-content: center;
  padding-left: 10px;
`;

const NormalText = styled(Text)`
  ${fontStyles.medium};
`;
