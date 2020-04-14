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
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { APPS } from 'utils/exploreApps';
import ExploreAppsInfoCard from './ExploreAppsInfoCard';
import ExploreAppsItem, { type AppItem } from './ExploreAppsItem';

interface Props {
  navigation: NavigationScreenProp<*>
}

class ExploreApps extends React.PureComponent<Props> {
    handleCardButton = () => {
      //
    }

    renderItem = ({ item }: { item: AppItem }) => <ExploreAppsItem item={item} />

    render() {
      return (
        <ContainerWithHeader
          navigation={this.props.navigation}
          headerProps={{
            centerItems: [{ title: 'Explore apps' }],
          }}
        >
          <FlatList
            contentContainerStyle={{ padding: 20 }}
            ListHeaderComponent={<ExploreAppsInfoCard onButtonPress={this.handleCardButton} />}
            data={APPS}
            renderItem={this.renderItem}
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.name}
          />
        </ContainerWithHeader>
      );
    }
}


export default withNavigation(ExploreApps);
