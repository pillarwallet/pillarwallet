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
import { TouchableNativeFeedback, Platform, StyleSheet } from 'react-native';
import styled from 'styled-components/native';

import { baseColors, fontSizes, fontStyles, spacing } from 'utils/variables';
import { BaseText } from 'components/Typography';

import Icon from 'components/Icon';

const StyledItemTouchable = styled.TouchableHighlight`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
`;

const StyledItemView = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const ItemRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: ${spacing.large}px;
  min-height: 90px;
`;

const TextWrapper = styled.View`
`;

const ContentWrapper = styled.View`
  display: flex;
  flex: 1;
  flex-direction: row;
  align-items: center;
`;

const AddonWrapper = styled.View`
  flex-direction: row;
  align-items: center;
`;

const ListItem = styled.View`
  ${props => props.bordered
    ? `
    border-bottom-width: ${StyleSheet.hairlineWidth}px;
    border-top-width: ${StyleSheet.hairlineWidth}px;
    border-color: ${baseColors.border};
    `
    : ''}
`;

const ItemLabel = styled(BaseText)`
  ${fontStyles.medium};
  color: ${props => props.color ? props.color : baseColors.primary};
`;

const SubText = styled(BaseText)`
  ${fontStyles.small};
  color: ${props => props.color ? props.color : baseColors.secondaryText};
  margin-top: 4px;
`;

const ItemAddon = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-left: ${spacing.medium}px;
  padding-bottom: 2px;
  
`;const Row = styled.View`
  flex-direction: row;
  align-items: center;
`;

const ButtonWrapper = ({ onPress, children }) => {
  if (Platform.OS === 'android') {
    return (
      <TouchableNativeFeedback
        onPress={onPress}
        background={TouchableNativeFeedback.Ripple()}
        disabled={!onPress}
      >
        <StyledItemView>
          {children}
        </StyledItemView>
      </TouchableNativeFeedback>
    );
  }
  return (
    <StyledItemTouchable
      onPress={onPress}
      underlayColor={baseColors.secondaryAccent}
      disabled={!onPress}
    >
      {children}
    </StyledItemTouchable>
  );
};

type Props = {
  label: string,
  onPress?: ?Function,
  addon?: React.Node,
  bordered?: boolean,
  color?: string,
  subtext?: string,
  subtextAddon?: React.Node,
  wrapperStyle?: Object,
  chevronStyle?: Object,
  rightAddon?: React.Node,
}

export const ListItemChevron = (props: Props) => {
  const {
    onPress,
    label,
    addon,
    subtextAddon,
    bordered,
    color,
    subtext,
    wrapperStyle,
    chevronStyle,
    rightAddon,
  } = props;
  return (
    <ListItem bordered={bordered} style={wrapperStyle}>
      <ButtonWrapper onPress={onPress}>
        <ItemRow>
          <ContentWrapper>
            <TextWrapper>
              <Row>
                <ItemLabel color={color}>{label}</ItemLabel>
                {!!addon && <ItemAddon>{addon}</ItemAddon>}
              </Row>
              {!!subtext &&
              <Row>
                <SubText>{subtext}</SubText>
                {!!subtextAddon && <ItemAddon>{subtextAddon}</ItemAddon>}
              </Row>}
            </TextWrapper>
          </ContentWrapper>
          <AddonWrapper>
            {rightAddon}
            <Icon
              name="chevron-right"
              style={{
                fontSize: fontSizes.small,
                color: color || baseColors.primary,
                ...chevronStyle,
              }}
            />
          </AddonWrapper>
        </ItemRow>
      </ButtonWrapper>
    </ListItem>
  );
};

