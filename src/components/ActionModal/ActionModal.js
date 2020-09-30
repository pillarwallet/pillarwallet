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
import { TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-navigation';
import styled, { withTheme } from 'styled-components/native';
import SlideModal from 'components/Modals/SlideModal';
import { getThemeColors, themedColors } from 'utils/themes';
import { MediumText, BaseText } from 'components/Typography';
import Icon from 'components/Icon';
import { spacing, fontStyles } from 'utils/variables';
import { noop } from 'utils/common';
import type { Theme } from 'models/Theme';

type ItemType = {
  label: string,
  key: string,
  onPress?: () => void,
  value?: string,
  chevron?: boolean,
  isDisabled?: boolean,
}

type OwnProps = {|
  items: ItemType[],
  doNotCloseOnPress?: boolean,
  storybook?: boolean,
|};

type Props = {|
  ...OwnProps,
  theme: Theme,
|};

type ItemProps = {
  label: string,
  onPress: Function,
  value: string,
  chevron?: boolean,
  isDisabled?: boolean,
  paragraph?: React.Node,
  children?: React.Node,
};


const MainContainer = styled.View`
  padding: 20px ${spacing.layoutSides}px 30px;
`;

const ItemContainer = styled.View`
  padding: 20px 0;
  opacity: ${({ disabled }) => disabled ? 0.5 : 1};
`;

const Row = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const ChevronIcon = styled(Icon)`
  color: ${themedColors.secondaryText};
  ${fontStyles.tiny};
`;

const Paragraph = styled(BaseText)`
  color: ${themedColors.secondaryText};
  ${fontStyles.medium};
  margin-top: 8px;
`;


const Item = ({
  label, onPress, value, chevron, isDisabled, paragraph, children,
}: ItemProps) => (
  <TouchableWithoutFeedback onPress={onPress} disabled={isDisabled}>
    <ItemContainer disabled={isDisabled}>
      <Row>
        <MediumText big>{label}</MediumText>
        {!!value && <BaseText medium secondary>{value}</BaseText>}
        {chevron && <ChevronIcon name="chevron-right" />}
      </Row>
      {!!paragraph && <Paragraph>{paragraph}</Paragraph>}
      {children}
    </ItemContainer>
  </TouchableWithoutFeedback>
);

class ActionModal extends React.Component<Props> {
  modalRef = React.createRef();

  renderItem = (item) => {
    const { doNotCloseOnPress } = this.props;
    const { onPress = noop } = item;
    return (
      <Item
        {...item}
        onPress={() => {
          onPress();
          if (!doNotCloseOnPress && this.modalRef.current) this.modalRef.current.close();
        }}
      />
    );
  };

  renderContent = () => {
    const { items } = this.props;
    return (
      <SafeAreaView>
        <MainContainer>
          {items.map(this.renderItem)}
        </MainContainer>
      </SafeAreaView>
    );
  };

  render() {
    const {
      theme,
      storybook,
    } = this.props;
    const colors = getThemeColors(theme);

    if (storybook) return this.renderContent();

    return (
      <SlideModal
        ref={this.modalRef}
        noClose
        backgroundColor={colors.card}
        hideHeader
        sideMargins={spacing.large}
      >
        {this.renderContent()}
      </SlideModal>
    );
  }
}

export default (withTheme(ActionModal): React.AbstractComponent<OwnProps>);
