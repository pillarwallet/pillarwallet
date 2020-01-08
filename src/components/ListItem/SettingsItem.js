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
import { Platform, TouchableNativeFeedback, StyleSheet } from 'react-native';
import styled, { withTheme } from 'styled-components/native';
import { fontSizes, fontStyles, spacing } from 'utils/variables';
import { Switch, Badge as NBBadge } from 'native-base';
import { BaseText, MediumText } from 'components/Typography';
import Icon from 'components/Icon';
import { getThemeColors, themedColors } from 'utils/themes';
import type { Theme } from 'models/Theme';

type Props = {
  label: string,
  notificationsCount?: number,
  warningNotification?: ?boolean,
  onPress?: ?Function,
  toggle?: ?boolean,
  value?: ?string | ?boolean,
  disabled?: ?boolean,
  bordered?: ?boolean,
  theme: Theme,
}

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

const ItemLabelHolder = styled.View`
  flex: 1;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 22px ${spacing.large}px 24px;
 ${({ bordered, theme }) => bordered
    ? `
    border-bottom-width: ${StyleSheet.hairlineWidth}px;
    border-top-width: ${StyleSheet.hairlineWidth}px;
    border-color: ${theme.colors.border};
    `
    : ''}
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
  color: ${themedColors.text};
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

const ButtonWrapper = ({ onPress, children, theme }) => {
  const colors = getThemeColors(theme);
  if (Platform.OS === 'android') {
    return (
      <TouchableNativeFeedback
        onPress={onPress}
        background={TouchableNativeFeedback.Ripple()}
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
      underlayColor={colors.secondaryAccent}
    >
      {children}
    </StyledItemTouchable>
  );
};

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
    } = this.props;

    if (!toggle) {
      return (
        <ItemLabelHolder bordered={bordered}>
          <ListItemInnerWrapper>
            <ItemLabel>{label}</ItemLabel>
            {!!processedValue && <ItemValue>{processedValue}</ItemValue>}
          </ListItemInnerWrapper>
          {!!(notificationsCount || warningNotification) &&
          <ListAddon>
            {!!notificationsCount && <Badge><BadgeText>{notificationsCount}</BadgeText></Badge>}
            {!!warningNotification && <WarningIcon name="warning-circle" />}
          </ListAddon>}
        </ItemLabelHolder>
      );
    }

    return (
      <ItemLabelHolder bordered={bordered}>
        <ItemLabel>{label}</ItemLabel>
        <ListAddon>
          <Switch
            disabled={disabled}
            onValueChange={onPress}
            value={processedValue}
          />
        </ListAddon>
      </ItemLabelHolder>
    );
  }
  render() {
    const {
      onPress,
      toggle,
      value,
      theme,
    } = this.props;

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

    return (
      <ButtonWrapper onPress={onPress} theme={theme}>
        {this.renderContent(processedValue)}
      </ButtonWrapper>
    );
  }
}

export default withTheme(SettingsListItem);
