// @flow
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
  title: string,
  tabs: Array<Tab>,
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
  padding: 0 10px;
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
  padding: 0 ${spacing.rhythm}px;
`;

const TabWrapper = styled.View`
  padding: 10px 16px 10px;
  background: ${baseColors.white};
  border-bottom-width: 1px;
  border-color: ${UIColors.defaultBorderColor};
  border-style: solid;
`;

export default class Tabs extends React.Component<Props, State> {
  state = {
    activeTab: ALL,
  }

  renderTabItems = (tabs: Array<Tab>) => {
    const { activeTab } = this.state;
    const tabItems = tabs.map(tab => {
      return (
        <TabItem
          key={tab.id}
          active={activeTab === tab.id}
          onPress={() => this.setState({
            activeTab: tab.id,
          }, () => tab.onPress())}
        >
          <TabItemIcon active={activeTab === tab.id} name={tab.icon} />
          <TabItemText active={activeTab === tab.id}>{tab.name}</TabItemText>
        </TabItem>
      );
    });
    return tabItems;
  }

  render() {
    const { title, tabs } = this.props;

    return (
      <TabOuterWrapper>
        <ActivityFeedHeader>
          <Title subtitle title={title} />
        </ActivityFeedHeader>
        <TabWrapper>
          <TabWrapperScrollView horizontal>
            {this.renderTabItems(tabs)}
          </TabWrapperScrollView>
        </TabWrapper>
      </TabOuterWrapper>
    );
  }
}
