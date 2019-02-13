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
import { baseColors, spacing, fontSizes } from 'utils/variables';

type Tab = {
  id: string,
  name: string,
  icon?: string,
  onPress: Function,
}

type Props = {
  initialActiveTab?: string,
  title?: string,
  tabs: Tab[],
  bgColor?: string,
}

type State = {
  activeTab: string,
}

const TabOuterWrapper = styled.View`
  background-color: ${props => props.backgroundColor ? props.backgroundColor : 'transparent'};
`;

const TabWrapper = styled.View`
  flex-direction: row;
  background-color: ${baseColors.pattensBlue};
  padding: 2px;
  border-radius: 18px;
  margin: 12px 16px;
`;

const TabItem = styled.TouchableOpacity`
  height: 32px;
  padding: 7px 15px;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.active ? baseColors.white : 'transparent'};
  border-radius: 16px;
  flex-direction: row;
  shadow-color: ${baseColors.pigeonPost};
  shadow-radius: 6px;
  shadow-opacity: 0.15;
  shadow-offset: 0px 6px;
  flexGrow: 1;
`;

const TabItemIcon = styled(Icon)`
  font-size: ${fontSizes.extraSmall};
  margin-right: 4px;
  color: ${props => props.active ? baseColors.slateBlack : baseColors.electricBlue};
`;

const TabItemText = styled(BaseText)`
  font-size: ${fontSizes.extraSmall};
  font-weight: 500;
  color: ${props => props.active ? baseColors.slateBlack : baseColors.electricBlue};
`;

const ActivityFeedHeader = styled.View`
  padding: 4px ${spacing.mediumLarge}px 0;
`;

export default class Tabs extends React.Component<Props, State> {
  state = {
    activeTab: this.props.initialActiveTab || ALL,
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
          style={tabs.length === 2 ? { width: '50%' } : {}}
        >
          {!!tab.icon && <TabItemIcon active={isActive} name={tab.icon} />}
          <TabItemText active={isActive}>{tab.name}</TabItemText>
        </TabItem>
      );
    });
    return tabItems;
  };

  render() {
    const { title, tabs, bgColor } = this.props;

    return (
      <TabOuterWrapper backgroundColor={bgColor}>
        {!!title &&
        <ActivityFeedHeader>
          <Title subtitle noMargin title={title} />
        </ActivityFeedHeader>
        }
        <TabWrapper>
          {this.renderTabItems(tabs)}
        </TabWrapper>
      </TabOuterWrapper>
    );
  }
}
