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
import styled from 'styled-components/native';
import { baseColors, fontSizes, spacing } from 'utils/variables';
import { Switch, Badge as NBBadge } from 'native-base';
import { BaseText, MediumText } from 'components/Typography';
import Icon from 'components/Icon';
import { Platform, TouchableNativeFeedback } from 'react-native';

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
  width: 100%;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 22px ${spacing.mediumLarge}px 24px;
`;

const ListItem = styled.View`
  flex: 1;
  flex-direction: row; 
  justify-content: space-between;
  align-items: center;
`;

const Badge = styled(NBBadge)`
  height: 24px;
  justify-content: center;
  margin-right: 10px;
`;

const BadgeText = styled(BaseText)`
  color: #fff;
  font-size: ${fontSizes.extraExtraSmall};
  text-align: center;
  width: 100%;
  padding: 0 2px;
`;

const ItemLabel = styled(MediumText)`
  color: ${baseColors.slateBlack};
  font-size: 17px;
  line-height: 24px;
`;

const ItemValue = styled(BaseText)`
  font-size: ${fontSizes.small};
  color: ${baseColors.coolGrey};
  flex-wrap: wrap;
  text-align: right;
  flex: 1;
  padding: 0 ${spacing.rhythm / 2}px
  align-self: stretch;
`;

const WarningIcon = styled(Icon)`
  font-size: ${fontSizes.large};
  margin-right: 10px;
  color: ${baseColors.burningFire};
`;

const ListAddon = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

const ButtonWrapper = ({ onPress, children, wrapperPaddingHorizontal }) => {
  if (Platform.OS === 'android') {
    return (
      <TouchableNativeFeedback
        onPress={onPress}
        background={TouchableNativeFeedback.Ripple()}
      >
        <StyledItemView wrapperPaddingHorizontal={wrapperPaddingHorizontal}>
          {children}
        </StyledItemView>
      </TouchableNativeFeedback>
    );
  }
  return (
    <StyledItemTouchable
      onPress={onPress}
      underlayColor={baseColors.lightGray}
      wrapperPaddingHorizontal={wrapperPaddingHorizontal}
    >
      {children}
    </StyledItemTouchable>
  );
};

type Props = {
  label: string,
  notificationsCount?: number,
  warningNotification?: ?boolean,
  onPress?: ?Function,
  toggle?: ?boolean,
  value?: ?string | ?boolean,
  disabled?: ?boolean,
  wrapperPaddingHorizontal?: number,
}

export default class SettingsListItem extends React.Component<Props> {
  renderContent(processedValue: ?string | ?boolean) {
    const {
      label,
      toggle,
      onPress,
      notificationsCount,
      warningNotification,
      disabled,
    } = this.props;
    if (!toggle) {
      return (
        <ListItem>
          <ItemLabelHolder>
            <ItemLabel>{label}</ItemLabel>
            <ItemValue>{processedValue}</ItemValue>
          </ItemLabelHolder>
          <ListAddon>
            {!!notificationsCount && <Badge><BadgeText>{notificationsCount}</BadgeText></Badge>}
            {!!warningNotification && <WarningIcon name="warning-circle" />}
            <Icon
              name="chevron-right"
              style={{
                fontSize: fontSizes.tiny,
                color: baseColors.coolGrey,
              }}
            />
          </ListAddon>
        </ListItem>
      );
    }

    return (
      <ItemLabelHolder>
        <ItemLabel>{label}</ItemLabel>
        <Switch
          disabled={disabled}
          onValueChange={onPress}
          value={processedValue}
        />
      </ItemLabelHolder>
    );
  }
  render() {
    const {
      onPress,
      toggle,
      value,
      wrapperPaddingHorizontal,
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

    if (!toggle) {
      return (
        <ButtonWrapper onPress={onPress} wrapperPaddingHorizontal={wrapperPaddingHorizontal}>
          {this.renderContent(processedValue)}
        </ButtonWrapper>
      );
    }

    return (
      <StyledItemView wrapperPaddingHorizontal={wrapperPaddingHorizontal}>
        {this.renderContent(processedValue)}
      </StyledItemView>
    );
  }
}
