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
import { StyleSheet, PanResponder } from 'react-native';
import styled from 'styled-components/native';
import { fontSizes, fontStyles, spacing } from 'utils/variables';
import { Badge as NBBadge } from 'native-base';
import { BaseText, MediumText } from 'components/Typography';
import Icon from 'components/Icon';
import NativeTouchable from 'components/NativeTouchable';
import Switcher from 'components/Switcher';
import { LabelBadge } from 'components/LabelBadge';
import { themedColors } from 'utils/themes';


type Props = {
  label: string,
  notificationsCount?: number,
  warningNotification?: ?boolean,
  onPress?: ?Function,
  toggle?: ?boolean,
  value?: ?string | ?boolean,
  disabled?: ?boolean,
  bordered?: ?boolean,
  isSelected?: boolean,
  icon?: string,
  iconColor?: string,
  rightLabel?: string,
  description?: string,
  labelBadge?: {
    label: string,
    color?: string,
  },
  customClickable?: boolean,
};

type State = {
  opacity: number,
};


const MainWrapper = styled.View`
  flex: 1;
  padding: 22px ${spacing.large}px 24px;
  height: 70px;
  ${({ bordered, theme }) => bordered
    ? `
     border-bottom-width: ${StyleSheet.hairlineWidth}px;
     border-top-width: ${StyleSheet.hairlineWidth}px;
     border-color: ${theme.colors.border};
     `
    : ''}
`;

const ItemLabelHolder = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const ListItemInnerWrapper = styled.View`
  flex: 1;
  flex-direction: row; 
  justify-content: space-between;
  align-items: center;
`;

const Badge = styled(NBBadge)`
  height: 24px;
  justify-content: center;
`;

const BadgeText = styled(BaseText)`
  color: ${themedColors.control};
  font-size: ${fontSizes.small}px;
  text-align: center;
  width: 100%;
  padding: 0 2px;
`;

const ItemLabel = styled(MediumText)`
  color: ${({ primary, theme }) => primary ? theme.colors.primary : theme.colors.text};
  ${fontStyles.big};
`;

const ItemValue = styled(BaseText)`
  font-size: ${fontSizes.medium}px;
  color: ${themedColors.secondaryText};
  flex-wrap: wrap;
  text-align: center;
  margin-left: ${spacing.medium}px
  min-width: 70px;
  align-items: center;
`;

const WarningIcon = styled(Icon)`
  font-size: ${fontSizes.big}px;
  margin-right: 10px;
  color: ${themedColors.negative};
`;

const ListAddon = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-left: ${spacing.medium}px;
  margin-top: 2px;
  min-width: 70px;
`;

const LeftIcon = styled(Icon)`
  color: ${({ color }) => color || themedColors.accent};
  font-size: ${fontSizes.big}px;
  margin-right: 10px;
`;

const RightLabel = styled(BaseText)`
  color: ${themedColors.primary};
  ${fontStyles.regular};
  text-align: right;
  padding-left: ${spacing.medium}px;
`;

const Description = styled(BaseText)`
  color: ${themedColors.secondaryText};
  ${fontStyles.regular};
  padding-right: 10%;
`;

const CustomTouchable = styled.View`
  width: 100%;
  color: ${themedColors.surface};
`;

class SettingsListItem extends React.Component<Props, State> {
  _panResponder: PanResponder;

  constructor(props: Props) {
    super(props);
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderGrant: () => { this.setState({ opacity: 0.7 }); },
      onPanResponderRelease: () => {
        if (props.onPress) props.onPress();
        this.setState({ opacity: 1 });
      },
    });
    this.state = {
      opacity: 1,
    };
  }

  renderContent(processedValue: ?string | ?boolean) {
    const {
      label,
      toggle,
      onPress,
      notificationsCount,
      warningNotification,
      disabled,
      bordered,
      isSelected,
      icon,
      iconColor,
      labelBadge,
      rightLabel,
      description,
    } = this.props;

    if (!toggle) {
      return (
        <MainWrapper>
          <ItemLabelHolder bordered={bordered}>
            {!!icon && <LeftIcon name={icon} color={iconColor} />}
            <ListItemInnerWrapper>
              <ItemLabel primary={isSelected}>{label}</ItemLabel>
              {!!label && <RightLabel>{rightLabel}</RightLabel>}
              {!!labelBadge && (
                <LabelBadge
                  label={labelBadge.label}
                  labelStyle={{ fontSize: fontSizes.regular }}
                  color={labelBadge.color}
                />
              )}
              {!!processedValue && <ItemValue>{processedValue}</ItemValue>}
            </ListItemInnerWrapper>
            {!!(notificationsCount || warningNotification) &&
            <ListAddon>
              {!!notificationsCount && <Badge><BadgeText>{notificationsCount}</BadgeText></Badge>}
              {!!warningNotification && <WarningIcon name="warning-circle" />}
            </ListAddon>}
          </ItemLabelHolder>
          {!!description && <Description>{description}</Description>}
        </MainWrapper>
      );
    }

    return (
      <MainWrapper>
        <ItemLabelHolder bordered={bordered}>
          <ItemLabel primary={isSelected}>{label}</ItemLabel>
          <ListAddon>
            <Switcher
              isOn={processedValue}
              onToggle={onPress}
              disabled={disabled}
            />
          </ListAddon>
        </ItemLabelHolder>
      </MainWrapper>
    );
  }
  render() {
    const {
      onPress,
      toggle,
      value,
      customClickable,
    } = this.props;

    const { opacity } = this.state;

    let processedValue;

    if (!toggle) {
      if (value) {
        processedValue = value;
      } else if (value === '' || value === null) {
        processedValue = 'Set';
      } else {
        processedValue = '';
      }
    } else {
      processedValue = value;
    }

    if (customClickable) {
      return (
        <CustomTouchable
          {...this._panResponder.panHandlers}
          style={{ opacity }}
        >
          {this.renderContent(processedValue)}
        </CustomTouchable>
      );
    }

    return (
      <NativeTouchable onPress={onPress}>
        {this.renderContent(processedValue)}
      </NativeTouchable>
    );
  }
}

export default SettingsListItem;
