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
import { FlatList, Keyboard } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';
import { Container, Footer } from 'components/Layout';
import SearchBlock from 'components/SearchBlock';
import Separator from 'components/Separator';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import Checkbox from 'components/Checkbox';
import Button from 'components/Button';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import { baseColors, spacing } from 'utils/variables';
import { CONTACT, CHOOSE_ASSETS_TO_TRANSFER } from 'constants/navigationConstants';
import { connect } from 'react-redux';
import orderBy from 'lodash.orderby';

type Props = {
  navigation: NavigationScreenProp<*>,
  contacts: Object[],
};

type State = {
  query: string,
  agentsUserNames: Array<string>,
};

const FooterInner = styled.View`
  background-color: ${baseColors.snowWhite};
  flex-direction: row;
  justify-content: flex-end;
  align-items: flex-start;
`;

const EmptyStateWrapper = styled.View`
  padding-top: 90px;
  padding-bottom: 90px;
  align-items: center;
`;

class RecoveryAgentsScreen extends React.Component<Props, State> {
  state = {
    query: '',
    agentsUserNames: [],
  };

  handleSearchChange = (query: any) => {
    this.setState({ query });
  };

  navigateToContactScreen = (contact: Object) => () => {
    this.props.navigation.navigate(CONTACT, { contact });
  };

  updateAgentsUsernames = (username: string) => {
    const { agentsUserNames } = this.state;
    let updatedAgentsUserNames;
    if (agentsUserNames.includes(username)) {
      updatedAgentsUserNames = agentsUserNames.filter((thisUsername) => { return thisUsername !== username; });
    } else {
      updatedAgentsUserNames = [...agentsUserNames, username];
    }
    this.setState({ agentsUserNames: updatedAgentsUserNames });
  };

  renderContact = ({ item }) => {
    const { agentsUserNames } = this.state;
    return (
      <ListItemWithImage
        label={item.username}
        avatarUrl={item.profileImage}
        navigateToProfile={() => this.navigateToContactScreen(item)}
        onPress={() => this.updateAgentsUsernames(item.username)}
        imageUpdateTimeStamp={item.lastUpdateTime}
        customAddon={
          <Checkbox
            onPress={() => this.updateAgentsUsernames(item.username)}
            checked={agentsUserNames.includes(item.username)}
            rounded
            wrapperStyle={{ width: 24, marginRight: 4 }}
          />
        }
      />
    );
  };

  render() {
    const { navigation, contacts } = this.props;
    const { query, agentsUserNames } = this.state;
    const sortedLocalContacts = orderBy(contacts, [user => user.username.toLowerCase()], 'asc');
    const filteredContacts = (!query || query.trim() === '' || query.length < 2)
      ? sortedLocalContacts
      : sortedLocalContacts.filter(({ username }) => username.toUpperCase().includes(query.toUpperCase()));
    const proceedStepEnabled = true || !!agentsUserNames.length; // TODO: remove `true ||`

    return (
      <Container>
        <SearchBlock
          headerProps={{
            title: 'recovery agents',
            onBack: () => navigation.goBack(null),
          }}
          searchInputPlaceholder="Search user"
          onSearchChange={this.handleSearchChange}
          itemSearchState={query.length >= 2}
          navigation={navigation}
          backgroundColor={baseColors.white}
        />
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.id}
          renderItem={this.renderContact}
          initialNumToRender={8}
          ItemSeparatorComponent={() => <Separator spaceOnLeft={82} />}
          onScroll={() => Keyboard.dismiss()}
          contentContainerStyle={{
            paddingVertical: spacing.mediumLarge,
            paddingTop: 10,
          }}
          ListEmptyComponent={
            <EmptyStateWrapper fullScreen>
              <EmptyStateParagraph
                title="No user found"
                bodyText="Check if the username was entered correctly"
              />
            </EmptyStateWrapper>
          }
        />
        <Footer style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <FooterInner>
            {
              // TODO: add right amount of contacts selected to activate this button
            }
            <Button
              small
              title="Next"
              onPress={() => navigation.navigate(CHOOSE_ASSETS_TO_TRANSFER)}
              disabled={!proceedStepEnabled}
            />
          </FooterInner>
        </Footer>
      </Container>
    );
  }
}

const mapStateToProps = ({
  contacts: { data: contacts },
}) => ({
  contacts,
});

export default connect(mapStateToProps)(RecoveryAgentsScreen);

