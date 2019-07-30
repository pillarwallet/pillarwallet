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
import { FlatList, RefreshControl } from 'react-native';
import isEqual from 'lodash.isequal';
import { connect } from 'react-redux';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { SettingsItemCarded } from 'components/ListItem/SettingsItemCarded';
import ProfileImage from 'components/ProfileImage';

// utils
import { baseColors, fontSizes, spacing } from 'utils/variables';

// types
import type { NavigationScreenProp } from 'react-navigation';

// constants
import { HOME, USER_SETTINGS } from 'constants/navigationConstants';

// actions
import { setActiveBNetworkAction } from 'actions/blockchainNetworkActions';
import { responsiveSize } from '../../utils/ui';

type Props = {
  navigation: NavigationScreenProp<*>,
  user: Object,
}

class UsersScreen extends React.Component<Props> {
  shouldComponentUpdate(nextProps: Props) {
    const isFocused = this.props.navigation.isFocused();
    if (!isFocused) {
      return false;
    }
    const isEq = isEqual(this.props, nextProps);
    return !isEq;
  }

  renderUser = ({ item: user }) => {
    const { navigation } = this.props;
    const { username, profileImage, lastUpdateTime = 0 } = user;
    const iconRadius = responsiveSize(44);
    const userImage = `${profileImage}?t=${lastUpdateTime}`;

    return (
      <SettingsItemCarded
        title={username}
        subtitle="No limits"
        onMainPress={() => navigation.navigate(HOME)}
        onSettingsPress={() => navigation.navigate(USER_SETTINGS, { user })}
        isActive
        customIcon={(
          <ProfileImage
            uri={userImage}
            userName={username}
            diameter={iconRadius}
            borderWidth={0}
            textStyle={{ fontSize: fontSizes.medium }}
            noShadow
          />
        )}
      />
    );
  };

  render() {
    const { user } = this.props;

    const users = [user]; // update when we have more users

    return (
      <ContainerWithHeader
        color={baseColors.white}
        headerProps={{
          leftItems: [
            { userIcon: true },
            {
              title: 'Users',
              color: baseColors.aluminium,
            },
          ],
          rightItems: [{ close: true, dismiss: true }],
        }}
      >
        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          renderItem={this.renderUser}
          initialNumToRender={8}
          contentContainerStyle={{
            padding: spacing.large,
          }}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {}}
            />
          }
          style={{ flexGrow: 0 }}
        />
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  user: { data: user },
}) => ({
  user,
});

const mapDispatchToProps = (dispatch: Function) => ({
  setActiveBNetwork: (id: string) => dispatch(setActiveBNetworkAction(id)),
});

export default connect(mapStateToProps, mapDispatchToProps)(UsersScreen);
