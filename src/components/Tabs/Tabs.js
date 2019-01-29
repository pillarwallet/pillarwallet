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
import Title from 'components/Title';
import Icon from 'components/Icon';
import { BaseText } from 'components/Typography';
import { ALL } from 'constants/activityConstants';
import { UIColors, baseColors, spacing, fontSizes } from 'utils/variables';

type Tab = {
  id: string,
  name: string,
  icon: string,
  onPress: Function,
}

type Props = {
  title?: string,
  tabs: Tab[],
}

type State = {
  activeTab: string,
}

const TabWrapperScrollView = styled.ScrollView`
  flex-direction: row;
`;

const TabOuterWrapper = styled.View`
  background-color: ${baseColors.white};
`;

const TabItem = styled.TouchableOpacity`
  height: 32px;
  padding: 0 15px;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.active ? baseColors.electricBlue : 'transparent'};
  border-radius: 16px;
  flex-direction: row;
`;

const TabItemIcon = styled(Icon)`
  font-size: ${fontSizes.extraSmall};
  margin-right: 5px;
  color: ${props => props.active ? baseColors.white : baseColors.darkGray};
`;

const TabItemText = styled(BaseText)`
  font-size: ${fontSizes.extraSmall};
  color: ${props => props.active ? baseColors.white : baseColors.darkGray};
`;

const ActivityFeedHeader = styled.View`
  padding: 4px ${spacing.mediumLarge}px 0;
`;

const TabWrapper = styled.View`
  padding: 12px 16px;
  background: ${baseColors.white};
  border-bottom-width: 1px;
  border-color: ${UIColors.defaultDividerColor};
  border-style: solid;
`;

export default class Tabs extends React.Component<Props, State> {
  state = {
    activeTab: ALL,
  };

  renderTabItems = (tabs: Tab[]) => {
    const { activeTab } = this.state;
    const tabItems = tabs.map(tab => {
      const isActive = activeTab === tab.id;
      return (
        <TabItem
          key={tab.id}
          active={isActive}
          onPress={() => this.setState({
            activeTab: tab.id,
          }, tab.onPress)}
        >
          <TabItemIcon active={isActive} name={tab.icon} />
          <TabItemText active={isActive}>{tab.name}</TabItemText>
        </TabItem>
      );
    });
    return tabItems;
  };

  render() {
    const { title, tabs } = this.props;

    return (
      <TabOuterWrapper>
        {!!title &&
        <ActivityFeedHeader>
          <Title subtitle noMargin title={title} />
        </ActivityFeedHeader>
        }
        <TabWrapper>
          <TabWrapperScrollView horizontal>
            {this.renderTabItems(tabs)}
          </TabWrapperScrollView>
        </TabWrapper>
      </TabOuterWrapper>
    );
  }
}
