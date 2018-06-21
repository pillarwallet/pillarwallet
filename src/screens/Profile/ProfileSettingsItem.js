// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { baseColors, fontSizes } from 'utils/variables';
import { Icon, Switch } from 'native-base';

import { Platform, View, StyleSheet, TouchableNativeFeedback } from 'react-native';

const StyledItemTouchable = styled.TouchableHighlight`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  padding: 25px 30px;
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
  padding: 25px 30px;
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


const ItemLabel = styled.Text`
  font-size: ${fontSizes.medium};
`;

const ItemValue = styled.Text`
  font-size: ${fontSizes.semiSmall};
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
  onPress?: ?Function,
  toggle?: ?boolean,
  value?: string | number | boolean,
}

export default class ProfileSettingsItem extends React.Component<Props> {

  renderContent(processedValue: string | boolean | number) {
    const {
      label,
      value,
      toggle,
      onPress,
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
      processedValue = Boolean(Number(value));
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
