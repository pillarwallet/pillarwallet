// @flow
import * as React from 'react';
import { Dimensions } from 'react-native';
import styled from 'styled-components/native';
import { BaseText } from 'components/Typography';
import { TWORDSPHRASE } from 'constants/walletConstants';
import { baseColors, spacing, fontSizes, fontWeights } from 'utils/variables';

type Tab = {
  id: string,
  name: string,
  onPress: Function,
}

type Props = {
  tabs: Tab[],
}

type State = {
  activeTab: string,
}

const window = Dimensions.get('window');

const TabBottom = styled.View`
  background-color: ${baseColors.electricBlue};
  border-color: ${baseColors.electricBlue};
  border-width: 2px;
  border-radius: 2px;
  width: 100%;
`;

const TabItem = styled.TouchableOpacity`
  height: 52px;
  padding: 0 10px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
`;

const TabItemText = styled(BaseText)`
  font-size: ${fontSizes.small};
  color: ${props => props.active ? baseColors.slateBlack : baseColors.darkGray};
  font-weight: ${props => props.active ? fontWeights.medium : fontWeights.book};
  padding-bottom: ${props => props.active ? '12px' : '15px'};
`;

const TabWrapper = styled.View`
  padding: 0 0 23px 0;
  width: 100%;
  flex-direction: row;
`;

const TabItemWrapper = styled.View`
  width: ${(window.width / 2) - spacing.rhythm}px;
  flex-direction: row;
  justify-content: center;
`;

export default class WalletTabs extends React.Component<Props, State> {
  state = {
    activeTab: TWORDSPHRASE,
  }

  renderTabItems = (tabs: Tab[]) => {
    const { activeTab } = this.state;
    const tabItems = tabs.map(tab => {
      const isActive = activeTab === tab.id;
      return (
        <TabItemWrapper key={tab.id} >
          <TabItem
            active={isActive}
            onPress={() => this.setState({
              activeTab: tab.id,
            }, tab.onPress)}
          >
            <TabItemText active={isActive}>{tab.name}</TabItemText>
            {isActive && <TabBottom />}
          </TabItem>
        </TabItemWrapper>
      );
    });
    return tabItems;
  }

  render() {
    const { tabs } = this.props;
    return (
      <TabWrapper>
        {this.renderTabItems(tabs)}
      </TabWrapper>
    );
  }
}
