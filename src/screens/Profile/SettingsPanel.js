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
import { baseColors, fontStyles, spacing } from 'utils/variables';
import { BaseText, MediumText } from 'components/Typography';
import { Platform, StyleSheet } from 'react-native';

const SettingsPanelIOS = styled.View`
  padding-top: 20px;
  background-color: #f2f2f2;
  border-radius: 10px;
  overflow: hidden;
`;

const SettingsPanelAndroid = styled.View`
  padding: 20px 16px 0 16px;
  background-color: #ffffff;
  border-radius: 4px;
  elevation: 10
`;

const FormPlacer = styled.View`
  padding: 0 ${spacing.rhythm}px;
`;

const PanelHeaderIOS = styled(MediumText)`
  ${fontStyles.big};
  margin-bottom: ${props => (props.headerMarginIOS ? '40px' : '0')};;
  text-align: center;
`;

const PanelHeaderAndroid = styled(MediumText)`
  ${fontStyles.big};
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
  headerMarginIOS?: boolean
}

const SettingsPanel = (props: Props) => {
  const {
    children,
    panelTitle,
    handleOK,
    handleCancel,
    headerMarginIOS,
  } = props;

  if (Platform.OS === 'android') {
    return (
      <SettingsPanelAndroid>
        <PanelHeaderAndroid>{panelTitle}</PanelHeaderAndroid>
        {children}
        <ButtonGroupAndroid>
          <ButtonAndroid onPress={handleCancel}>
            <BaseText style={{ textAlign: 'center', color: baseColors.electricBlue, fontSize: 17 }}>CANCEL</BaseText>
          </ButtonAndroid>
          <ButtonAndroid onPress={handleOK}>
            <BaseText style={{ textAlign: 'center', color: baseColors.electricBlue, fontSize: 17 }}>OK</BaseText>
          </ButtonAndroid>
        </ButtonGroupAndroid>
      </SettingsPanelAndroid>
    );
  }

  return (
    <SettingsPanelIOS>
      <PanelHeaderIOS headerMarginIOS={headerMarginIOS}>{panelTitle}</PanelHeaderIOS>
      <FormPlacer>
        {children}
      </FormPlacer>
      <ButtonGroupIOS>
        <ButtonIOS
          onPress={handleCancel}
          style={{ borderRightColor: '#c7c7c7', borderRightWidth: StyleSheet.hairlineWidth }}
          underlayColor={baseColors.lightGray}
        >
          <BaseText style={{
            textAlign: 'center',
            color: baseColors.electricBlue,
            fontSize: 17,
          }}
          >Cancel
          </BaseText>
        </ButtonIOS>
        <ButtonIOS
          onPress={handleOK}
          underlayColor={baseColors.lightGray}
        >
          <BaseText style={{
            textAlign: 'center',
            color: baseColors.electricBlue,
            fontWeight: '700',
            fontSize: 17,
          }}
          >OK
          </BaseText>
        </ButtonIOS>
      </ButtonGroupIOS>
    </SettingsPanelIOS>
  );
};

export default SettingsPanel;
