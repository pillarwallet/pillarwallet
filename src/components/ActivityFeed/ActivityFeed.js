// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { fontSizes, baseColors, fontWeights } from 'utils/variables';

const ActivityFeedWrapper = styled.View`

`;

const ActivityFeedList = styled.FlatList`
  height: 100%;
`;

const ActivityFeedItem = styled.View`
  background-color: ${props => props.isEven ? baseColors.white : baseColors.snowWhite};
  height: 60px;
  padding: 0 16px;
  justify-content: flex-start;
  align-items: center;
  flex-direction: row;
`;

const ActivityFeedItemAvatarWrapper = styled.View`
  width: 32px;
  height: 32px;
  background: ${baseColors.darkGray};
  border-radius: 16px;
  margin-right: 10px;
`;

const ActivityFeedItemLabel = styled.Text`
  color: ${baseColors.darkGray};
  font-size: ${fontSizes.extraSmall};
  margin-bottom: 2px;
`;

const ActivityFeedItemName = styled.Text``;

const ActivityFeedItemAmount = styled.Text`
  font-weight: ${fontWeights.bold};
  font-size: ${fontSizes.small};
  color: ${props => props.received ? baseColors.jadeGreen : baseColors.slateBlack};
`;

const ActivityFeedItemCol = styled.View`
  flex: ${props => props.fixedWidth ? `0 0 ${props.fixedWidth}` : 1};
  flex-direction: column;
  align-items: ${props => props.flexEnd ? 'flex-end' : 'flex-start'};
  justify-content: center;
`;

const TabWrapper = styled.View`
  flex-direction: row;
  margin: 20px 16px 20px;
`;

const TabItem = styled.TouchableOpacity`
  height: 44px;
  align-items: center;
  justify-content: center;
  flex: 1;
  border-color: ${props => props.active ? baseColors.electricBlue : baseColors.lightGray};
  border-bottom-width: 2px;

`;

const TabItemText = styled.Text`
  font-size: ${fontSizes.medium};
  color: ${props => props.active ? baseColors.slateBlack : baseColors.darkGray};
`;

type Props = {
  history: Array<*>,
}

type State = {
  activeTab: string,
}

export default class ActivityFeed extends React.Component<Props, State> {
  state = {
    activeTab: 'ALL',
  }


  renderActivityFeedItem = (item: Object) => {
    const isEven = item.index % 2 === 0;
    const { data } = item.item.payload;

    const { type } = item.item;


    if (type === 'transactionEvent') {
      const msg = JSON.parse(data.msg);
      const received = msg.value > 0;
      const fromAddress = `${msg.fromAddress.slice(0, 7)}…${msg.fromAddress.slice(-7)}`;
      const displayName = msg.username ? msg.username : fromAddress;

      return (
        <ActivityFeedItem isEven={isEven} key={item.index}>

          <ActivityFeedItemCol fixedWidth="42px">
            <ActivityFeedItemAvatarWrapper />
          </ActivityFeedItemCol>
          <ActivityFeedItemCol>
            <ActivityFeedItemLabel>Sent · Jul 15</ActivityFeedItemLabel>
            <ActivityFeedItemName>{displayName}</ActivityFeedItemName>
          </ActivityFeedItemCol>
          <ActivityFeedItemCol flexEnd>
            <ActivityFeedItemAmount received={received}>
              {msg.value} {msg.asset}
            </ActivityFeedItemAmount>
          </ActivityFeedItemCol>
        </ActivityFeedItem>
      );
    } else if (type === 'social') {
      return (
        <ActivityFeedItem isEven={isEven} key={item.index}>

          <ActivityFeedItemCol fixedWidth="42px">
            <ActivityFeedItemAvatarWrapper />
          </ActivityFeedItemCol>
          <ActivityFeedItemCol>
            <ActivityFeedItemLabel>{data.label}</ActivityFeedItemLabel>
            <ActivityFeedItemName>{data.connection}</ActivityFeedItemName>
          </ActivityFeedItemCol>
          <ActivityFeedItemCol flexEnd />
        </ActivityFeedItem>

      );
    }
  }


  render() {
    return (
      <ActivityFeedWrapper>
        <TabWrapper>
          <TabItem
            active={this.state.activeTab === 'ALL'}
            onPress={() => this.setState({ activeTab: 'ALL' })}
          >
            <TabItemText active={this.state.activeTab === 'ALL'}>All</TabItemText>
          </TabItem>
          <TabItem
            active={this.state.activeTab === 'ASSETS'}
            onPress={() => this.setState({ activeTab: 'ASSETS' })}
          >
            <TabItemText>Assets</TabItemText>
          </TabItem>
          <TabItem
            active={this.state.activeTab === 'SOCIAL'}
            onPress={() => this.setState({ activeTab: 'SOCIAL' })}
          >
            <TabItemText>Social</TabItemText>
          </TabItem>
          <TabItem
            active={this.state.activeTab === 'OTHER'}
            onPress={() => this.setState({ activeTab: 'OTHER' })}
          >
            <TabItemText>Other</TabItemText>
          </TabItem>
        </TabWrapper>
        <ActivityFeedList

          data={this.props.history}
          renderItem={this.renderActivityFeedItem}
        />
      </ActivityFeedWrapper>
    );
  }
}
