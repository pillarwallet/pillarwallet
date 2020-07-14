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
import { SafeAreaView } from 'react-navigation';
import styled, { withTheme } from 'styled-components/native';
import SlideModal from 'components/Modals/SlideModal';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import { getThemeColors, themedColors } from 'utils/themes';
import { spacing } from 'utils/variables';
import type { Theme } from 'models/Theme';

type ItemType = {
  label: string,
  key: string,
  onPress: () => void,
  value?: string,
  isDisabled?: boolean,
  hide?: boolean,
}

type Props = {
  theme: Theme,
  onModalClose: (?() => void) => void,
  isVisible: boolean,
  items: ItemType[],
  doNotCloseOnPress?: boolean,
};

type ItemProps = {
  label: string,
  onPress: Function,
  value: string,
  isDisabled?: boolean,
  iconName?: string,
};


const MainContainer = styled.View`
  padding: 20px ${spacing.layoutSides}px 30px;
`;

const Item = ({
  label, onPress, isDisabled, iconName,
}: ItemProps) => (
  <ListItemWithImage
    label={label}
    disabled={isDisabled}
    onPress={onPress}
    diameter={48}
    iconName={iconName}
    iconColor={themedColors.link}
    iconDiameter={24}
  />
);

class ActionOptionsModal extends React.Component<Props> {
  renderItem = (item) => {
    const { onModalClose, doNotCloseOnPress } = this.props;
    const { onPress } = item;
    return (
      <Item
        {...item}
        onPress={() => doNotCloseOnPress ? onPress() : onModalClose(onPress)}
      />
    );
  };

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
        onModalHide={onModalClose}
      >
        <SafeAreaView>
          <MainContainer>
            {items.filter(({ hide }) => !hide).map(this.renderItem)}
          </MainContainer>
        </SafeAreaView>
      </SlideModal>
    );
  }
}

export default withTheme(ActionOptionsModal);
