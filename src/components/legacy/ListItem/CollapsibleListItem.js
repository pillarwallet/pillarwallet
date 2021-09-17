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
import { Animated, Easing } from 'react-native';
import styled from 'styled-components/native';
import Collapsible from 'react-native-collapsible';

import { fontSizes, fontStyles, spacing } from 'utils/variables';
import { themedColors } from 'utils/themes';
import { BaseText } from 'components/legacy/Typography';
import Icon from 'components/legacy/Icon';
import NativeTouchable from 'components/NativeTouchable';

type Props = {
  label?: string,
  onPress?: ?Function,
  open?: boolean,
  collapseContent?: React.Node,
  customToggle?: React.Node,
  wrapperStyle?: Object,
  toggleWrapperStyle?: Object,
  collapsePadding?: Object,
  noPadding?: boolean,
  collapseWrapperStyle?: Object,
  noRipple?: boolean,
}

const ItemLabelHolder = styled.View`
  display: flex;
  flex: 1;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const InnerWrapper = styled.View`
  flex: 1;
  flex-wrap: wrap;
`;

const ListItem = styled.View`
  flex-direction: column; 
  justify-content: space-between;
`;

const ListItemMainPart = styled.View`
  flex: 1;
  flex-direction: row; 
  align-items: center;
  justify-content: center;
`;

const CustomToggleWrapper = styled.View`
  flex: 1;
  flex-direction: row; 
  align-items: center;
  justify-content: space-between;
`;

const ItemLabel = styled(BaseText)`
  ${fontStyles.medium};
`;

const ListAddon = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-right: ${spacing.large}px;
  margin-left: ${spacing.large}px;
  margin-top: 2px;
`;

const CollapseWrapper = styled.View`
  width: 100%;
  ${props => props.noPadding ? '' : 'padding: 4px 16px 10px 36px;'}
`;

const ChevronIcon = styled(Icon)`
  font-size: ${fontSizes.tiny}px;
  color: ${themedColors.secondaryText};
  align-self: center;
`;

export default class CollapsibleListItem extends React.Component<Props> {
  spinValue = new Animated.Value(0);

  componentDidMount() {
    this.animateChevron();
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.open !== this.props.open) this.animateChevron();
  }

  animateChevron = () => {
    const { open } = this.props;
    const rotateAngle = open ? 1 : 0;

    Animated.timing(
      this.spinValue,
      {
        toValue: rotateAngle,
        duration: 300,
        easing: Easing.linear,
        useNativeDriver: true,
      },
    ).start();
  };

  renderToggleArrow = (shouldRender: boolean) => {
    const spinAngle = this.spinValue.interpolate({
      inputRange: [0, 1],
      outputRange: (['90deg', '-90deg']: string[]),
    });

    if (shouldRender) {
      return (
        <ListAddon>
          <Animated.View
            style={{ transform: [{ rotate: spinAngle }] }}
          >
            <ChevronIcon name="chevron-right" />
          </Animated.View>
        </ListAddon>
      );
    }
    return null;
  };

  renderSectionToggle = () => {
    const {
      label = '',
      customToggle,
      collapseContent,
      toggleWrapperStyle,
    } = this.props;
    if (customToggle) {
      return (
        <CustomToggleWrapper style={toggleWrapperStyle}>
          {customToggle}
          {this.renderToggleArrow(!!collapseContent)}
        </CustomToggleWrapper>
      );
    }

    return (
      <ListItemMainPart style={toggleWrapperStyle}>
        <ItemLabelHolder style={{ paddingVertical: 14, paddingLeft: spacing.mediumLarge }}>
          <InnerWrapper>
            <ItemLabel>{label}</ItemLabel>
          </InnerWrapper>
          {this.renderToggleArrow(!!collapseContent)}
        </ItemLabelHolder>
      </ListItemMainPart>
    );
  };

  render() {
    const {
      onPress,
      open,
      collapseContent,
      wrapperStyle,
      noPadding,
      collapseWrapperStyle,
      noRipple,
    } = this.props;

    return (
      <ListItem style={wrapperStyle}>
        <NativeTouchable onPress={onPress} disabled={!collapseContent} noRipple={noRipple}>
          {this.renderSectionToggle()}
        </NativeTouchable>
        <Collapsible collapsed={!open}>
          <CollapseWrapper noPadding={noPadding} style={collapseWrapperStyle}>
            {collapseContent}
          </CollapseWrapper>
        </Collapsible>
      </ListItem>
    );
  }
}
