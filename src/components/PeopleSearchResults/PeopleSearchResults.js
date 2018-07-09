// @flow
import * as React from 'react';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';
import { CONTACT } from 'constants/navigationConstants';
import { baseColors, fontSizes } from 'utils/variables';
import { Wrapper, ScrollWrapper } from 'components/Layout';
import ContactCard from 'components/ContactCard';
import type { SearchResults, ApiUser } from 'models/Contacts';

const ContactCardList = styled(ScrollWrapper)`
  padding: 16px;
`;

const TabWrapper = styled.View`
  flex-direction: row;
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

const tabs = {
  contacts: 'CONTACTS',
  allUsers: 'ALL_USERS',
};

type Props = {
  navigation: NavigationScreenProp<*>,
  searchResults: SearchResults,
};

type State = {
  activeTab: string,
};

// NOTE: this is temporary file until new design will be ready
// NOTE: code was copy&pasted from the ConnectionRequests screen
export default class PeopleSearchResults extends React.Component<Props, State> {
  state = {
    activeTab: tabs.allUsers,
  };

  handleContactCardPress = () => {
    this.props.navigation.navigate(CONTACT);
  };

  handleSendInvitationPress = (user: ApiUser) => () => { // eslint-disable-line
  };

  handleReceiveInvitationPress = (user: ApiUser) => () => { // eslint-disable-line
  };

  render() {
    const { activeTab } = this.state;
    const { searchResults } = this.props;

    // TODO: handle when nothing found
    return (
      <React.Fragment>
        <Wrapper regularPadding>
          <TabWrapper>
            <TabItem
              active={activeTab === tabs.allUsers}
              onPress={() => this.setState({ activeTab: tabs.allUsers })}
            >
              <TabItemText active={activeTab === 'RECEIVED'}>All users</TabItemText>
            </TabItem>
            <TabItem
              active={activeTab === tabs.contacts}
              onPress={() => this.setState({ activeTab: tabs.contacts })}
            >
              <TabItemText>My contacts</TabItemText>
            </TabItem>
          </TabWrapper>
        </Wrapper>
        <ContactCardList
          contentInset={{ bottom: 40 }}
        >
          {searchResults.apiUsers.map((user, index) => (
            <ContactCard
              onPress={this.handleContactCardPress}
              onSendInvitationPress={this.handleSendInvitationPress(user)}
              onReceiveInvitationPress={this.handleReceiveInvitationPress(user)}
              name={user.username}
              key={user.id}
              status={index % 2 === 0 ? 'INVITE' : 'RECEIVE'}
              showActions
            />
          ))}
        </ContactCardList>
      </React.Fragment>
    );
  }
}
