// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { baseColors, fontSizes } from 'utils/variables';
import { Icon, Switch, Badge as NBBadge } from 'native-base';

import { Platform, View, StyleSheet, TouchableNativeFeedback } from 'react-native';

const StyledItemTouchable = styled.TouchableHighlight`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  padding: 20px 16px;
  background-color: #ffffff;
  border-bottom-color: ${baseColors.lightGray};
  border-top-color: ${baseColors.lightGray};
  border-bottom-width: ${StyleSheet.hairlineWidth};
  border-top-width: ${StyleSheet.hairlineWidth};
`;

const StyledItemView = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 20px 16px;
  background-color: #ffffff;
  border-bottom-color: ${baseColors.lightGray};
  border-top-color: ${baseColors.lightGray};
  border-bottom-width: ${StyleSheet.hairlineWidth};
  border-top-width: ${StyleSheet.hairlineWidth};
`;

const ItemLabelHolder = styled.View`
  display: flex;
  flex: 1;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const Badge = styled(NBBadge)`
  position: absolute;
  top: -3px;
  right: 24px;
  width: 24px;
  height: 24px;
`;

const BadgeText = styled.BaseText`
  color: #fff;
  font-size: ${fontSizes.extraExtraSmall};
  text-align: center;
`;

const ItemLabel = styled.BaseText`
  font-size: ${fontSizes.medium};
`;

const ItemValue = styled.BaseText`
  font-size: ${fontSizes.small};
  color: ${baseColors.coolGrey};
  line-height: ${fontSizes.medium};
`;

const ButtonWrapper = ({ onPress, children }) => {
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
      underlayColor={baseColors.lightGray}
    >
      {children}
    </StyledItemTouchable>
  );
};

type Props = {
  label: string,
  notificationsCount?: number,
  onPress?: ?Function,
  toggle?: ?boolean,
  value?: ?string | ?boolean,
}

export default class ProfileSettingsItem extends React.Component<Props> {
  renderContent(processedValue: ?string | ?boolean) {
    const {
      label,
      toggle,
      onPress,
      notificationsCount,
    } = this.props;
    if (!toggle) {
      return (
        <View style={{ flex: 1, paddingRight: 20, position: 'relative' }}>
          <ItemLabelHolder>
            <ItemLabel>{label}</ItemLabel>
            <ItemValue>{processedValue}</ItemValue>
          </ItemLabelHolder>
          <View style={{
            position: 'absolute',
            width: 12,
            height: 16,
            right: -2,
            top: 2,
          }}
          >
            {!!notificationsCount && <Badge><BadgeText>{notificationsCount}</BadgeText></Badge>}
            <Icon
              name="chevron-right"
              type="Feather"
              style={{
                fontSize: 16,
                color: baseColors.coolGrey,
              }}
            />
          </View>
        </View>
      );
    }

    return (
      <ItemLabelHolder>
        <ItemLabel>{label}</ItemLabel>
        <Switch
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
        <ButtonWrapper onPress={onPress}>
          {this.renderContent(processedValue)}
        </ButtonWrapper>
      );
    }

    return (
      <StyledItemView>
        {this.renderContent(processedValue)}
      </StyledItemView>
    );
  }
}
