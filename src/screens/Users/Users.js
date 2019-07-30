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
import { SectionList } from 'react-native';
import isEqual from 'lodash.isequal';
import styled from 'styled-components/native';
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
import { responsiveSize } from 'utils/ui';
import { MediumText, BaseText } from 'components/Typography';

type Props = {
  navigation: NavigationScreenProp<*>,
  user: Object,
}

const SectionHeader = styled(MediumText)`
  color: ${baseColors.blueYonder};
  font-size: 14px;
  line-height: 17px;
  margin: ${spacing.mediumLarge}px 0;
`;

const EmptyState = styled(BaseText)`
  color: ${baseColors.darkGray};
  font-size: 15px;
  line-height: 22px;
`;

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
    const usersOnOtherDevices = []; // update when we have users on other devices
    const sections = [];
    sections.push({ title: 'This device', data: users, extraData: users });
    sections.push({
      title: 'Other devices',
      data: usersOnOtherDevices,
      extraData: usersOnOtherDevices,
      emptyStateMessage: 'Log in an existing user on another device to manage their permissions here',
    });

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
        <SectionList
          renderItem={this.renderUser}
          sections={sections}
          keyExtractor={(item) => item.id.toString()}
          style={{ width: '100%' }}
          renderSectionFooter={({ section: { emptyStateMessage } }) => {
            if (emptyStateMessage) return (<EmptyState>{emptyStateMessage}</EmptyState>);
            return null;
          }}
          renderSectionHeader={({ section: { title } }) => (
            <SectionHeader>{title}</SectionHeader>
          )}
          contentContainerStyle={{
            paddingHorizontal: spacing.large,
            paddingVertical: spacing.medium,
          }}
          stickySectionHeadersEnabled={false}
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
