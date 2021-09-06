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
import styled from 'styled-components/native';

import SlideModal from 'components/Modals/SlideModal';
import { BaseText, MediumText } from 'components/legacy/Typography';
import ListItemWithImage from 'components/legacy/ListItem/ListItemWithImage';

import { compactFalsy } from 'utils/array';
import { themedColors } from 'utils/themes';
import { spacing } from 'utils/variables';

type ItemType = {
  label: string,
  key: string,
  iconName?: string,
  onPress: () => void,
  value?: string,
  isDisabled?: boolean,
  hide?: boolean,
}

type Props = {|
  items: (?ItemType | false)[],
  title?: string,
  footer?: React.Node,
|};

const MainContainer = styled(SafeAreaView)`
  padding: 24px 0 40px;
`;

class ActionOptionsModal extends React.Component<Props> {
  renderItem = (item: ItemType) => {
    const {
      label,
      onPress,
      isDisabled,
      iconName,
      key,
    } = item;

    return (
      <ListItemWithImage
        key={key}
        customLabel={(
          <BaseText medium>{label}</BaseText>
        )}
        disabled={isDisabled}
        onPress={onPress}
        diameter={48}
        iconName={iconName}
        iconColor={themedColors.link}
        iconDiameter={24}
        padding="5px 14px"
      />
    );
  };

  render() {
    const { title, footer } = this.props;
    const items = compactFalsy(this.props.items);

    return (
      <SlideModal
        noClose
        hideHeader
      >
        <MainContainer>
          {!!title &&
          <MediumText
            style={{ paddingBottom: 22, paddingHorizontal: spacing.layoutSides }}
            center
            big
          >
            {title}
          </MediumText>}
          {items.filter(({ hide }) => !hide).map(this.renderItem)}
        </MainContainer>
        {footer}
      </SlideModal>
    );
  }
}

export default ActionOptionsModal;
