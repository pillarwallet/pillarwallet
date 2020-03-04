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
import { FlatList } from 'react-native';
import { SafeAreaView } from 'react-navigation';
import styled, { withTheme } from 'styled-components/native';
import SlideModal from 'components/Modals/SlideModal';
import { getThemeColors, themedColors } from 'utils/themes';
import { MediumText, BaseText } from 'components/Typography';
import Icon from 'components/Icon';
import { spacing, fontStyles } from 'utils/variables';
import type { Theme } from 'models/Theme';

type ItemType = {
  label: string,
  key: string,
  onPress: () => void,
  value?: string,
  chevron?: boolean,
}

type Props = {
  theme: Theme,
  onModalClose: (?() => void) => void,
  isVisible: boolean,
  items: ItemType[],
};

const MainContainer = styled.View`
  padding: 20px ${spacing.layoutSides}px 30px;
`;

const ItemContainer = styled.TouchableOpacity`
  flex-direction: row;
  padding: 20px 0;
  align-items: center;
  justify-content: space-between;
`;

const ChevronIcon = styled(Icon)`
  color: ${themedColors.secondaryText};
  ${fontStyles.tiny};
`;

const Item = ({
  label, onPress, value, chevron,
}) => (
  <ItemContainer onPress={onPress}>
    <MediumText big>{label}</MediumText>
    {!!value && <BaseText medium secondary>{value}</BaseText>}
    {chevron && <ChevronIcon name="chevron-right" />}
  </ItemContainer>
);

class ActionModal extends React.Component<Props> {
  renderItem = ({ item }) => {
    const { onModalClose } = this.props;
    return (
      <Item
        {...item}
        onPress={() => onModalClose(item.onPress)}
      />
    );
  }

  render() {
    const {
      theme, onModalClose, isVisible, items,
    } = this.props;
    const colors = getThemeColors(theme);

    return (
      <SlideModal
        isVisible={isVisible}
        noClose
        background={colors.card}
        hideHeader
        onModalHide={() => onModalClose()}
        sideMargins={spacing.large}
      >
        <SafeAreaView>
          <MainContainer>
            <FlatList
              data={items}
              renderItem={this.renderItem}
              keyExtractor={item => item.key}
            />
          </MainContainer>
        </SafeAreaView>
      </SlideModal>
    );
  }
}

export default withTheme(ActionModal);
