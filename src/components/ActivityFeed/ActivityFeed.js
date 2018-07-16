// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { fontSizes, baseColors, fontWeights } from 'utils/variables';
import ButtonIcon from 'components/ButtonIcon';
import { SubHeading } from 'components/Typography';

const ActivityFeedWrapper = styled.View`
  flex: 1;
`;

const ActivityFeedHeader = styled.View`
  padding: 16px 16px 0;
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

const ActivityFeedItemName = styled.Text`
  font-size: ${fontSizes.medium};
`;

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
  margin: 10px 16px 10px;
`;

const TabItem = styled.TouchableOpacity`
  height: 44px;
  align-items: center;
  justify-content: center;
  flex: ${props => props.flex ? props.flex : 1};
  border-color: ${props => props.active ? baseColors.electricBlue : baseColors.lightGray};
  border-bottom-width: 2px;
`;

const TabItemText = styled.Text`
  font-size: ${fontSizes.small};
  font-weight: ${props => props.active ? fontWeights.bold : fontWeights.book};
  color: ${props => props.active ? baseColors.slateBlack : baseColors.darkGray};
`;

const ActionCircleButton = styled(ButtonIcon)`
  height: 34px;
  width: 34px;
  border-radius: 17px;
  padding: 0;
  margin: 0 0 0 10px;
  justify-content: center;
  align-items: center;
  background: ${props => props.accept ? baseColors.electricBlue : 'rgba(0,0,0,0)'};
`;

const ButtonIconWrapper = styled.View`
  margin-left: auto;
  flex-direction: row;
`;

const ActionTextWrapper = styled.TouchableOpacity`
  margin-left: auto;
`;

const ActionText = styled.Text`
  color: ${props => props.red ? baseColors.fireEngineRed : baseColors.clearBlue};
  font-size: ${fontSizes.small};
`;

const LabelText = styled.Text`
  font-size: ${fontSizes.small};
  color: ${baseColors.darkGray};
  margin-left: auto;
`;

const ActionButton = styled.View`
  background: ${baseColors.clearBlue};
  padding: 0 20px;
  height: 34px;
  border-radius: 17px;
  justify-content: center;
  align-items: center;
`;

const ActionButtonText = styled.Text`
  font-size: ${fontSizes.small};
  font-weight: ${fontWeights.bold};
  color: ${baseColors.white};
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
  };

  getSocialAction = (status: string) => {
    if (status === 'MESSAGE_RECEIVED') {
      return (
        <ActionTextWrapper>
          <ActionButton>
            <ActionButtonText>
              REPLY
            </ActionButtonText>
          </ActionButton>
        </ActionTextWrapper>
      );
    }
    if (status === 'RECEIVED') {
      return (
        <ButtonIconWrapper>
          <ActionCircleButton
            color={baseColors.darkGray}
            margin={0}
            icon="close"
            fontSize={32}
          />
          <ActionCircleButton
            color={baseColors.white}
            margin={0}
            accept
            icon="ios-checkmark"
            fontSize={32}
          />
        </ButtonIconWrapper>
      );
    }
    if (status === 'SENT') {
      return (
        <ActionTextWrapper>
          <ActionText red>
            Cancel
          </ActionText>
        </ActionTextWrapper>
      );
    }
    if (status === 'ACCEPTED') {
      return (
        <LabelText>
          Accepted
        </LabelText>
      );
    }
    if (status === 'DISMISSED') {
      return (
        <LabelText>
          Dismissed
        </LabelText>
      );
    }
    return null;
  };

  renderActivityFeedItem = (item: Object, index: number) => {
    const isEven = index % 2 === 0;
    const { data } = item.payload;
    const { type } = item;

    if (type === 'transactionEvent') {
      const msg = JSON.parse(data.msg);
      const received = msg.value > 0;
      const fromAddress = `${msg.fromAddress.slice(0, 5)}…${msg.fromAddress.slice(-5)}`;
      const displayName = msg.username ? msg.username : fromAddress;
      const directionSymbol = received ? '+' : '-';

      return (
        <ActivityFeedItem isEven={isEven} key={index}>
          <ActivityFeedItemCol fixedWidth="42px">
            <ActivityFeedItemAvatarWrapper />
          </ActivityFeedItemCol>
          <ActivityFeedItemCol>
            <ActivityFeedItemLabel>Sent · Jul 15</ActivityFeedItemLabel>
            <ActivityFeedItemName>{displayName}</ActivityFeedItemName>
          </ActivityFeedItemCol>
          <ActivityFeedItemCol flexEnd>
            <ActivityFeedItemAmount received={received}>
              {directionSymbol}{msg.value} {msg.asset}
            </ActivityFeedItemAmount>
          </ActivityFeedItemCol>
        </ActivityFeedItem>
      );
    } else if (type === 'social') {
      const { status } = data;
      return (
        <ActivityFeedItem isEven={isEven} key={index}>
          <ActivityFeedItemCol fixedWidth="42px">
            <ActivityFeedItemAvatarWrapper />
          </ActivityFeedItemCol>
          <ActivityFeedItemCol>
            <ActivityFeedItemLabel>{data.label}</ActivityFeedItemLabel>
            <ActivityFeedItemName>{data.connection}</ActivityFeedItemName>
          </ActivityFeedItemCol>
          <ActivityFeedItemCol flexEnd>
            { this.getSocialAction(status) }
          </ActivityFeedItemCol>
        </ActivityFeedItem>

      );
    }
    return null;
  };

  renderActivityFeedItems = (history: Array<*>) => {
    const activityFeedItems = [];
    history.map((item: Object, index: number) => {
      return activityFeedItems.push(this.renderActivityFeedItem(item, index));
    });
    return activityFeedItems;
  };

  render() {
    const { activeTab } = this.state;
    const { history } = this.props;
    return (
      <ActivityFeedWrapper>
        <ActivityFeedHeader>
          <SubHeading>ACTIVITY</SubHeading>
        </ActivityFeedHeader>
        <TabWrapper>
          <TabItem
            active={activeTab === 'ALL'}
            onPress={() => this.setState({ activeTab: 'ALL' })}
            flex={1}
          >
            <TabItemText active={activeTab === 'ALL'}>All</TabItemText>
          </TabItem>
          <TabItem
            active={activeTab === 'TRANSACTIONS'}
            onPress={() => this.setState({ activeTab: 'TRANSACTIONS' })}
            flex={1}
          >
            <TabItemText active={activeTab === 'TRANSACTIONS'}>Transactions</TabItemText>
          </TabItem>
          <TabItem
            active={activeTab === 'SOCIAL'}
            onPress={() => this.setState({ activeTab: 'SOCIAL' })}
            flex={1}
          >
            <TabItemText active={activeTab === 'SOCIAL'}>Social</TabItemText>
          </TabItem>
        </TabWrapper>
        {this.renderActivityFeedItems(history)}
      </ActivityFeedWrapper>
    );
  }
}
