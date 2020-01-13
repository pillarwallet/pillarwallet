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
// import SearchBlock from 'components/SearchBlock';
import Header from 'components/Header';
import Separator from 'components/Separator';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import Checkbox from 'components/Checkbox';
import Button from 'components/Button';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import Toast from 'components/Toast';
import { spacing } from 'utils/variables';
import { themedColors } from 'utils/themes';
import { CONTACT, CHOOSE_ASSETS_TO_TRANSFER, UPGRADE_REVIEW } from 'constants/navigationConstants';
import { connect } from 'react-redux';
// import orderBy from 'lodash.orderby';
import { addRecoveryAgentsToSmartWalletUpgradeAction } from 'actions/smartWalletActions';
import type { RecoveryAgent } from 'models/RecoveryAgents';

type Props = {
  navigation: NavigationScreenProp<*>,
  contacts: Object[],
  addRecoveryAgentsToSmartWalletUpgrade: Function,
};

type State = {
  // query: string,
  selectedAgents: Object[],
};

const FooterInner = styled.View`
  background-color: ${themedColors.surface};
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
    // query: '',
    selectedAgents: [],
  };

  // handleSearchChange = (query: any) => {
  //   this.setState({ query });
  // };

  navigateToContactScreen = (contact: Object) => () => {
    this.props.navigation.navigate(CONTACT, { contact });
  };

  updateAgents = (agent: Object) => {
    const { selectedAgents } = this.state;
    const name = agent.username || agent.serviceName;
    let updatedAgents;
    if (selectedAgents.find(thisAgent => thisAgent.username === name || thisAgent.serviceName === name)) {
      updatedAgents = selectedAgents.filter((thisAgent) => {
        return thisAgent.username !== name && thisAgent.serviceName !== name;
      });
    } else {
      updatedAgents = [...selectedAgents, agent];
    }
    this.setState({ selectedAgents: updatedAgents });
  };

  renderContact = ({ item }) => {
    const { selectedAgents } = this.state;
    const name = item.username || item.serviceName;
    return (
      <ListItemWithImage
        label={name}
        avatarUrl={item.profileImage || item.icon}
        navigateToProfile={item.username ? () => this.navigateToContactScreen(item) : null}
        onPress={() => this.updateAgents(item)}
        imageUpdateTimeStamp={item.lastUpdateTime}
        customAddon={
          <Checkbox
            onPress={() => this.updateAgents(item)}
            checked={!!selectedAgents.find(agent => agent.username === name || agent.serviceName === name)}
            rounded
            wrapperStyle={{ width: 24, marginRight: 4 }}
          />
        }
      />
    );
  };

  onNextPress = async () => {
    const { navigation, addRecoveryAgentsToSmartWalletUpgrade } = this.props;
    const isEditing = navigation.getParam('isEditing', false);
    const { selectedAgents } = this.state;
    await addRecoveryAgentsToSmartWalletUpgrade(selectedAgents);
    if (isEditing) {
      navigation.navigate(UPGRADE_REVIEW);
    } else {
      navigation.navigate(CHOOSE_ASSETS_TO_TRANSFER);
    }
  };

  // MOCK
  setupRecovery = () => {
    const { navigation } = this.props;
    navigation.goBack(null);
    Toast.show({
      message: 'Recovery agents have been selected',
      type: 'success',
      title: 'Success',
      autoClose: true,
    });
  };

  render() {
    const {
      navigation,
      // contacts,
    } = this.props;
    // const sortedLocalContacts = orderBy(contacts, [user => user.username.toLowerCase()], 'asc');
    // const filteredContacts = (!query || query.trim() === '' || query.length < 2)
    //   ? sortedLocalContacts
    //   : sortedLocalContacts.filter(({ username }) => username.toUpperCase().includes(query.toUpperCase()));
    // const proceedStepEnabled = true || !!selectedAgents.length; // TODO: remove `true ||`
    const options = navigation.getParam('options', { isSeparateRecovery: false });
    const { isSeparateRecovery } = options;

    return (
      <Container>
        { /* <SearchBlock
          headerProps={{
            title: 'recovery agents',
            onBack: () => navigation.goBack(null),
          }}
          searchInputPlaceholder="Search user"
          onSearchChange={this.handleSearchChange}
          itemSearchState={query.length >= 2}
          navigation={navigation}
        /> */ }
        <Header
          title="recovery agents"
          centerTitle
          onBack={() => navigation.goBack(null)}
          white
        />
        <FlatList
          // data={filteredContacts}
          data={[
            {
              id: 'Pillar',
              serviceName: 'Pillar Wallet',
              icon: 'https://api-qa-core.pillarproject.io/asset/images/tokens/icons/plrColor.png?size=3',
            },
          ]}
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
        <Footer style={isSeparateRecovery
          ? { flexDirection: 'row', justifyContent: 'center' }
          : { flexDirection: 'row', justifyContent: 'flex-end' }}
        >
          {!isSeparateRecovery &&
          <FooterInner>
            {
              // TODO: add right amount of contacts selected to activate this button
            }
            <Button
              small
              title="Next"
              onPress={this.onNextPress}
              // disabled={!proceedStepEnabled}
            />
          </FooterInner>
          }
          {!!isSeparateRecovery &&
          <Button
            title="Setup recovery"
            onPress={this.setupRecovery}
            // disabled={!proceedStepEnabled}
          />
          }
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

const mapDispatchToProps = (dispatch) => ({
  addRecoveryAgentsToSmartWalletUpgrade: (recoveryAgents: RecoveryAgent[]) => {
    return dispatch(addRecoveryAgentsToSmartWalletUpgradeAction(recoveryAgents));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(RecoveryAgentsScreen);

