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
import { FlatList } from 'react-native';
import { type NavigationScreenProp, withNavigation } from 'react-navigation';
import { connect } from 'react-redux';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { APPS, type AppItem } from 'utils/exploreApps';
import { dismissConnectAppsIntroAction } from 'actions/appSettingsActions';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import ExploreAppsInfoCard from './ExploreAppsInfoCard';
import ExploreAppsItem from './ExploreAppsItem';

type Props = {
  navigation: NavigationScreenProp<*>,
  dismissConnectAppsIntro: () => void,
  hasDismissedConnectAppsIntro: boolean,
};

class ExploreApps extends React.PureComponent<Props> {
  handleCardButton = () => { this.props.dismissConnectAppsIntro(); }

  renderItem = ({ item }: { item: AppItem }) => <ExploreAppsItem item={item} />

  renderListHeader = () => {
    if (this.props.hasDismissedConnectAppsIntro) return null;
    return <ExploreAppsInfoCard onButtonPress={this.handleCardButton} />;
  }

  render() {
    return (
      <ContainerWithHeader
        navigation={this.props.navigation}
        headerProps={{ centerItems: [{ title: 'Explore apps' }] }}
      >
        <FlatList
          contentContainerStyle={{ padding: 20 }}
          ListHeaderComponent={this.renderListHeader()}
          data={APPS}
          renderItem={this.renderItem}
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.name}
        />
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  appSettings: { data: { hasDismissedConnectAppsIntro = false } },
}: RootReducerState): $Shape<Props> => ({
  hasDismissedConnectAppsIntro,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  dismissConnectAppsIntro: () => dispatch(dismissConnectAppsIntroAction()),
});

export default withNavigation(connect(mapStateToProps, mapDispatchToProps)(ExploreApps));
