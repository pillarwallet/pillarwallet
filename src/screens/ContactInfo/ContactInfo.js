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
import styled from 'styled-components/native';
import { View, StyleSheet } from 'react-native';
import { baseColors, spacing } from 'utils/variables';
import { connect } from 'react-redux';

import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Button from 'components/Button';
import type { NavigationScreenProp } from 'react-navigation';
import ListItem from 'components/ListItem/SettingsItem';
import SlideModal from 'components/Modals/SlideModal';

import { logScreenViewAction } from 'actions/analyticsActions';

import ModalQRCode from './ModalQRCode.js';

type Props = {
  user: Object,
  navigation: NavigationScreenProp<*>,
  logScreenView: Function,
};

type State = {
  name: boolean,
  username: boolean,
  email: boolean,
  city: boolean,
  country: boolean,
  showQRModal: boolean,
}

const Footer = styled.View`
  padding: ${spacing.large}px;
  flex-grow: 1;
  justify-content: flex-end;
`;

const ListItems = styled.View`
  border-bottom-width: ${StyleSheet.hairlineWidth}px;
  border-color: ${baseColors.mediumLightGray};
`;

export class ContactInfo extends React.Component<Props, State> {
  state = {
    name: !!this.props.user.firstName,
    username: !this.props.user.firstName && !this.props.user.email,
    email: !!this.props.user.email,
    city: false,
    country: false,
    showQRModal: false,
  };

  componentDidMount() {
    const { logScreenView } = this.props;
    logScreenView('View contact info', 'Profile');
  }

  getDataQR = () => {
    const {
      name,
      username,
      email,
      city,
      country,
    } = this.state;
    const {
      user,
    } = this.props;
    let data = 'MECARD:';
    if (name) {
      data = data.concat(`N:${user.firstName},${user.lastName};`);
    } else {
      data = data.concat('N:;');
    }
    if (username) {
      data = data.concat(`NICKNAME:${user.username};`);
    } else {
      data = data.concat('NICKNAME:;');
    }
    if (email) {
      data = data.concat(`EMAIL:${user.email};`);
    } else {
      data = data.concat('EMAIL:;');
    }
    if (city) {
      data = data.concat(`ADR:${user.city}`);
    }
    if (country) {
      if (city) {
        data = data.concat(`,${user.country};`);
      } else {
        data = data.concat(`ADR:${user.country};`);
      }
    } else if (city) {
      data = data.concat(';');
    } else {
      data = data.concat('ADR:;');
    }
    return data;
  };

  onToggleValue = (nameState: string) => () => {
    this.setState((prevState: State) => ({
      [nameState]: !prevState[nameState],
    }));
  };

  toggleOpenModal = () => {
    requestAnimationFrame(() => {
      this.setState((prevState: State) => ({
        showQRModal: !prevState.showQRModal,
      }));
    });
  };
  render() {
    const {
      name,
      username,
      email,
      city,
      country,
      showQRModal,
    } = this.state;
    const {
      user,
    } = this.props;
    const nameLabel = user.firstName ? `Name: ${user.firstName} ${user.lastName}` : 'Name';
    const userNameLabel = user.username ? `Username: ${user.username}` : 'Username';
    const emailLabel = user.email ? `Email: ${user.email}` : 'Email';
    const cityLabel = user.city ? `City: ${user.city}` : 'City';
    const countryLabel = user.country ? `Country: ${user.country}` : 'Country';
    const dataQR = this.getDataQR();
    return (
      <ContainerWithHeader
        backgroundColor={baseColors.white}
        headerProps={{
          centerItems: [{ title: 'User info' }],
          rightItems: [{ close: true }],
        }}
      >
        <SlideModal
          isVisible={showQRModal}
          title="Your contact info"
          onModalHide={this.toggleOpenModal}
        >
          <View>
            <ModalQRCode
              data={dataQR}
              onCloseModal={this.toggleOpenModal}
            />
          </View>
        </SlideModal>
        <ListItems>
          <ListItem
            toggle
            key="name"
            onPress={this.onToggleValue('name')}
            value={name}
            label={nameLabel}
            disabled={!user.firstName}
            bordered
          />
          <ListItem
            toggle
            key="username"
            onPress={this.onToggleValue('username')}
            value={username}
            label={userNameLabel}
            disabled={!user.username}
            bordered
          />
          <ListItem
            toggle
            key="email"
            onPress={this.onToggleValue('email')}
            value={email}
            label={emailLabel}
            disabled={!user.email}
            bordered
          />
          <ListItem
            toggle
            key="city"
            onPress={this.onToggleValue('city')}
            value={city}
            label={cityLabel}
            disabled={!user.city}
            bordered
          />
          <ListItem
            toggle
            key="country"
            onPress={this.onToggleValue('country')}
            value={country}
            label={countryLabel}
            disabled={!user.country}
            bordered
          />
        </ListItems>
        <Footer>
          <Button
            title="Generate QR code"
            onPress={this.toggleOpenModal}
          />
        </Footer>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  user: { data: user },
}: RootReducerState): $Shape<Props> => ({
  user,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  logScreenView: (view: string, screen: string) => dispatch(logScreenViewAction(view, screen)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ContactInfo);
