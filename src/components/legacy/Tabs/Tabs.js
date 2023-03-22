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
import { View } from 'react-native';
import styled from 'styled-components/native';
import { BaseText } from 'components/legacy/Typography';

type Tab = {
  id: string,
  name: string,
  onPress: () => void,
  testID?: string,
  accessibilityLabel?: string,
};

type TabProps = Tab & {
  active: boolean,
};

type Props = {
  tabs: Tab[],
  activeTab: string,
  wrapperStyle?: Object,
};

const TabsContainer = styled.View`
  flex-direction: row;
  width: 100%;
`;

const Underline = styled.View`
  margin-top: 3px;
  border-top-width: 6px;
  border-top-left-radius: 3px;
  border-top-right-radius: 3px;
  border-color: ${({ theme }) => theme.colors.tabUnderline};
`;

const TabContainer = styled.TouchableOpacity`
  flex: 1;
  align-items: center;
`;

const TabComponent = ({ name, onPress, active, testID, accessibilityLabel }: TabProps) => {
  if (active) {
    return (
      <TabContainer onPress={onPress} testID={testID} accessibilityLabel={accessibilityLabel}>
        <View>
          <BaseText regular>{name}</BaseText>
          <Underline />
        </View>
      </TabContainer>
    );
  }
  return (
    <TabContainer onPress={onPress}>
      <BaseText regular secondary>
        {name}
      </BaseText>
    </TabContainer>
  );
};

/**
 * @deprecated This compontent is considered legacy and should not be used in new code
 *
 * Use: components/other/Tabs or components/layout/TabBar instead
 */
const Tabs = ({ tabs, activeTab, wrapperStyle }: Props) => {
  return (
    <TabsContainer style={wrapperStyle}>
      {tabs.map((tab) => (
        <TabComponent {...tab} active={activeTab === tab.id} key={tab.id} />
      ))}
    </TabsContainer>
  );
};

export default Tabs;
