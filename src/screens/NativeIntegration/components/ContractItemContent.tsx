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

// Utils
import { spacing, appFont } from 'utils/variables';
import { useThemeColors } from 'utils/themes';

// Components
import Text from 'components/core/Text';

interface Props {
  item: Object | any;
  onPress: () => void;
}

function ContractItemContent({ item, onPress }: Props) {
  const colors = useThemeColors();
  const iconUrl = item.data.icon.url;
  const title = item.data.name[0].text;
  const description = item.data.description[0].text;

  return (
    <Button key={item.toString()} onPress={onPress}>
      <ImageIcon source={{ uri: iconUrl }} />
      <ContentView>
        <Text variant="big" style={styles.titleStyle}>
          {title}
        </Text>
        <Text color={colors.tertiaryText}>{description}</Text>
      </ContentView>
    </Button>
  );
}

export default ContractItemContent;

const styles = {
  titleStyle: {
    fontFamily: appFont.medium,
  },
};

const Button = styled.TouchableOpacity`
  align-items: center;
  justify-content: center;
  flex-direction: row;
  padding: 16px 20px 16px 20px;
`;

const ImageIcon = styled.Image`
  width: 48;
  height: 48;
  border-radius: 24px;
  background-color: lightgrey;
`;

const ContentView = styled.View`
  flex: 1;
  padding: 0 ${spacing.medium}px 0 ${spacing.medium}px;
`;
