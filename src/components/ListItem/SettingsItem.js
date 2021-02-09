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
import { StyleSheet } from 'react-native';
import styled from 'styled-components/native';
import { fontSizes, fontStyles, spacing } from 'utils/variables';
import { Badge as NBBadge } from 'native-base';
import t from 'translations/translate';

import { BaseText, MediumText } from 'components/Typography';
import Icon from 'components/Icon';
import NativeTouchable from 'components/NativeTouchable';
import Switcher from 'components/Switcher';
import { LabelBadge } from 'components/LabelBadge';
import { LabelBulleted } from 'components/LabelBulleted';

type Props = {
  label: string,
  notificationsCount?: number,
  warningNotification?: ?boolean,
  onPress?: ?() => void,
  toggle?: ?boolean,
  value?: ?string | ?boolean,
  disabled?: boolean,
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
  bulletedLabel?: {
    label: string,
    color: string,
  },
  customIcon?: React.Node,
};

const MainWrapper = styled.View`
  flex: 1;
  min-height: 70px;
  padding: 24px ${spacing.large}px 24px;
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
  flex-wrap: wrap;
`;

const Badge = styled(NBBadge)`
  height: 24px;
  justify-content: center;
`;

const BadgeText = styled(BaseText)`
  color: ${({ theme }) => theme.colors.basic005};
  font-size: ${fontSizes.small}px;
  text-align: center;
  width: 100%;
  padding: 0 2px;
`;

const ItemLabel = styled(MediumText)`
  color: ${({ primary, theme }) => primary ? theme.colors.primary : theme.colors.basic010};
  ${fontStyles.big};
`;

const ItemValue = styled(BaseText)`
  font-size: ${fontSizes.medium}px;
  color: ${({ theme }) => theme.colors.basic030};
  flex-wrap: wrap;
  text-align: right;
  margin-left: ${spacing.medium}px
  min-width: 70px;
`;

const WarningIcon = styled(Icon)`
  font-size: ${fontSizes.big}px;
  margin-right: 10px;
  color: ${({ theme }) => theme.colors.secondaryAccent240};
`;

const ListAddon = styled.View`
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  margin-left: ${spacing.medium}px;
  margin-top: 2px;
  min-width: 70px;
`;

const LeftIcon = styled(Icon)`
  color: ${({ color, theme }) => color || theme.colors.basic020};
  font-size: ${fontSizes.big}px;
  margin-right: 10px;
`;

const RightLabel = styled(BaseText)`
  color: ${({ theme }) => theme.colors.basic000};
  ${fontStyles.regular};
  text-align: right;
  padding-left: ${spacing.medium}px;
`;

const Description = styled(BaseText)`
  color: ${({ theme }) => theme.colors.basic030};
  ${fontStyles.regular};
  padding-right: 10%;
`;

const LabelWrapper = styled.View`
  flex: 1;
`;

class SettingsListItem extends React.Component<Props> {
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
      bulletedLabel,
      customIcon,
    } = this.props;

    if (!toggle) {
      return (
        <MainWrapper>
          <ItemLabelHolder bordered={bordered}>
            {!!icon && <LeftIcon name={icon} color={iconColor} />}
            {customIcon}
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
              {!!bulletedLabel && (
                <LabelBulleted
                  label={bulletedLabel.label}
                  color={bulletedLabel.color}
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
          <LabelWrapper>
            <ItemLabel primary={isSelected}>{label}</ItemLabel>
          </LabelWrapper>
          <ListAddon>
            <Switcher
              isOn={!!processedValue}
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
      disabled,
    } = this.props;

    let processedValue;

    if (!toggle) {
      if (value) {
        processedValue = value;
      } else if (value === '' || value === null) {
        processedValue = t('label.set');
      } else {
        processedValue = '';
      }
    } else {
      processedValue = value;
    }

    return (
      <NativeTouchable onPress={onPress} disabled={!!disabled}>
        {this.renderContent(processedValue)}
      </NativeTouchable>
    );
  }
}

export default SettingsListItem;
