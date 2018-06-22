// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { baseColors, fontSizes, fontWeights } from 'utils/variables';

import { Platform, StyleSheet, Text } from 'react-native';

const SettingsPanelIOS = styled.View`
  padding-top: 20px;
  background-color: #f2f2f2;
  border-radius: 10px;
`;

const SettingsPanelAndroid = styled.View`
  padding: 20px 16px 0 16px;
  background-color: #ffffff;
  border-radius: 4px;
  elevation: 10
`;

const FormPlacer = styled.View`
  padding: 0 16px;
`;

const PanelHeaderIOS = styled.Text`
  font-size: ${fontSizes.medium};
  font-weight: ${fontWeights.bold}
  margin-bottom: 40px;
  text-align: center;
`;

const PanelHeaderAndroid = styled.Text`
  font-size: ${fontSizes.large};
  font-weight: ${fontWeights.book};
  margin-bottom: 20px;
  text-align: left;
`;

const ButtonGroupIOS = styled.View`
  display: flex;
  width: 100%;
  flex-direction: row;
  margin-top: 5px;
  border-top-color: #c7c7c7;
  border-top-width: 1px;
`;

const ButtonGroupAndroid = styled.View`
  display: flex;
  width: 100%;
  flex-direction: row;
  margin-top: 10px;
  justify-content: flex-end;
`;

const ButtonIOS = styled.TouchableHighlight`
  flex: 1;
  padding: 14px;
`;

const ButtonAndroid = styled.TouchableOpacity`
  padding: 16px;
`;

type Props = {
  children?: React.Node,
  panelTitle: string,
  handleOK: Function,
  handleCancel: Function,
}

export default class SettingsPanel extends React.Component<Props> {
  render() {
    const {
      children,
      panelTitle,
      handleOK,
      handleCancel
    } = this.props;


    if (Platform.OS === 'android') {
      return (
        <SettingsPanelAndroid>
          <PanelHeaderAndroid>{panelTitle}</PanelHeaderAndroid>
          {children}
          <ButtonGroupAndroid>
            <ButtonAndroid onPress={handleCancel}>
              <Text style={{ textAlign: 'center', color: baseColors.clearBlue, fontSize: 17 }}>CANCEL</Text>
            </ButtonAndroid>
            <ButtonAndroid onPress={handleOK}>
              <Text style={{ textAlign: 'center', color: baseColors.clearBlue, fontSize: 17 }}>OK</Text>
            </ButtonAndroid>
          </ButtonGroupAndroid>
        </SettingsPanelAndroid>
      );
    }

    return (
      <SettingsPanelIOS>
        <PanelHeaderIOS>{panelTitle}</PanelHeaderIOS>
        <FormPlacer>
          {children}
        </FormPlacer>
        <ButtonGroupIOS>
          <ButtonIOS
            onPress={handleCancel}
            style={{ borderRightColor: '#c7c7c7', borderRightWidth: StyleSheet.hairlineWidth }}
            underlayColor={baseColors.lightGray}
          >
            <Text style={{
              textAlign: 'center',
              color: baseColors.clearBlue,
              fontSize: 17,
            }}
            >Cancel
            </Text>
          </ButtonIOS>
          <ButtonIOS
            onPress={handleOK}
            underlayColor={baseColors.lightGray}
          >
            <Text style={{
              textAlign: 'center',
              color: baseColors.clearBlue,
              fontWeight: '700',
              fontSize: 17,
            }}
            >OK
            </Text>
          </ButtonIOS>
        </ButtonGroupIOS>
      </SettingsPanelIOS>
    );
  }
}
