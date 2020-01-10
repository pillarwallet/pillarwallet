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
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ADD_EDIT_USER } from 'constants/navigationConstants';
import { ListCard } from 'components/ListItem/ListCard';
import { lockScreenAction, logoutAction } from 'actions/authActions';

type Props = {
  navigation: NavigationScreenProp<*>,
  lockScreen: Function,
  logoutUser: Function,
  user: Object,
}

const getUserSettings = (that) => {
  return [
    {
      key: 'userSettings',
      title: 'User settings',
      body: 'Update your profile information',
      action: () => that.manageUserInformation(),
    },
    {
      key: 'spendingLimits',
      title: 'Spending limits',
      body: 'Secure your funds by restricting larger transactions',
      action: null,
      label: 'soon',
      disabled: true,
    },
    {
      key: 'dataLocker',
      title: 'Personal data locker',
      body: 'Identity management, privacy settings, visibility settings',
      action: null,
      label: 'soon',
      disabled: true,
    },
  ];
};

class UserSettings extends React.PureComponent<Props> {
  // settings actions
  manageUserInformation = () => {
    const { navigation } = this.props;
    navigation.navigate(ADD_EDIT_USER);
  };

  renderSettingsItems = ({ item }) => {
    const {
      title,
      labelColor,
      body,
      action,
      label,
      disabled,
    } = item;

    return (
      <ListCard
        title={title}
        titleStyle={labelColor && { color: labelColor }}
        subtitle={body}
        action={action}
        disabled={disabled}
        label={label}
        contentWrapperStyle={{ minHeight: 96, padding: 16 }}
      />
    );
  };

  render() {
    const userSettings = getUserSettings(this);
    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: 'User settings' }] }}
        inset={{ bottom: 'never' }}
      >
        <FlatList
          data={userSettings}
          keyExtractor={(item) => item.key}
          style={{ width: '100%' }}
          contentContainerStyle={{ width: '100%', padding: 20, paddingBottom: 40 }}
          renderItem={this.renderSettingsItems}
        />
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  wallet: { backupStatus },
}) => ({
  backupStatus,
});

const mapDispatchToProps = (dispatch: Function) => ({
  lockScreen: () => dispatch(lockScreenAction()),
  logoutUser: () => dispatch(logoutAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(UserSettings);
