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
import { BaseText } from 'components/Typography';

type Tab = {
  id: string,
  name: string,
  onPress: () => void,
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
  border-top-width: 3px;
  border-color: ${({ theme }) => theme.colors.primaryAccent130};
  border-top-left-radius: 3px;
  border-top-right-radius: 3px;
  margin-top: 3px;
`;

const TabContainer = styled.TouchableOpacity`
  flex: 1;
  align-items: center;
`;

const TabComponent = ({ name, onPress, active }: TabProps) => {
  if (active) {
    return (
      <TabContainer onPress={onPress}>
        <View>
          <BaseText regular>{name}</BaseText>
          <Underline />
        </View>
      </TabContainer>
    );
  }
  return (
    <TabContainer onPress={onPress}>
      <BaseText regular secondary>{name}</BaseText>
    </TabContainer>
  );
};

const Tabs = ({ tabs, activeTab, wrapperStyle }: Props) => {
  return (
    <TabsContainer style={wrapperStyle}>
      {tabs.map(tab => <TabComponent {...tab} active={activeTab === tab.id} key={tab.id} />)}
    </TabsContainer>
  );
};

export default Tabs;

