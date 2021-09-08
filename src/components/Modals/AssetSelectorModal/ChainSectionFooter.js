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
import styled from 'styled-components/native';
import { useTranslation } from 'translations/translate';

// Components
import Icon from 'components/core/Icon';
import Text from 'components/core/Text';

// Utils
import { useThemeColors } from 'utils/themes';
import { appFont, fontStyles, spacing } from 'utils/variables';

type Props = {|
  showMore: boolean,
  onPress: () => mixed,
|};

function ChainSectionFooter({ showMore, onPress }: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <Container>
      {showMore && (
        <ItemContainer onPress={onPress}>
          <Icon name="dots" color={colors.link} style={styles.icon} />
          <ItemText>{t('button.more')}</ItemText>
        </ItemContainer>
      )}
    </Container>
  );
}

export default ChainSectionFooter;

const styles = {
  icon: {
    padding: 12,
    marginRight: 12,
  },
};

const Container = styled.View`
  background-color: ${({ theme }) => theme.colors.background};
  align-items: stretch;
  padding-bottom: ${spacing.large}px;
`;

const ItemContainer = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 6px ${spacing.large}px;
`;

const ItemText = styled(Text)`
  font-family: ${appFont.medium};
  ${fontStyles.medium};
  color: ${({ theme }) => theme.colors.link};
`;

