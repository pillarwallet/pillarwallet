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
import { FlatList, Keyboard, View, ScrollView, RefreshControl } from 'react-native';
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import Intercom from 'react-native-intercom';
import { ScrollWrapper, Wrapper } from 'components/Layout';
import SlideModal from 'components/Modals/SlideModal';
import { baseColors, spacing } from 'utils/variables';
import ContainerWithBottomSheet from 'components/Layout/ContainerWithBottomSheet';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import ProfileSettingsItem from 'components/ListItem/SettingsItem';
import CountrySelect from 'components/CountrySelect';
import Header from 'components/Header';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import EditProfile from 'screens/Profile/EditProfile';
import SettingsModalTitle from 'screens/Profile/SettingsModalTitle';
import {
  killWalletConnectSessionByUrl,
  clearPendingWalletConnectSessionByUrl,
} from 'actions/walletConnectActions';
import { isProdEnv } from 'utils/environment';
import { updateUserAction, createOneTimePasswordAction } from 'actions/userActions';
import { OTP } from 'constants/navigationConstants';

export const SheetContentWrapper = styled.View`
  flex: 1;
  padding-top: 30px;
`;

type State = {
  activeTab: string,
  visibleModal: ?string,
};

type Props = {
  navigation: NavigationScreenProp<*>,
  user: Object,
  connectors: any[],
  pending: any[],
  clearPendingWalletConnectSessionByUrl: (url: string) => void,
  killWalletConnectSessionByUrl: (url: string) => void,
  updateUser: (walletId: string, field: Object, callback?: Function) => Function,
  createOneTimePassword: (walletId: string, field: Object, callback?: Function) => Function,
};

const ACTIVE = 'ACTIVE';
const REQUESTS = 'REQUESTS';

const cityFormFields = [{
  label: 'City',
  name: 'city',
  type: 'city',
  config: { placeholder: 'City' },
}];

const emailFormFields = [{
  label: 'Email',
  name: 'email',
  type: 'email',
  config: { placeholder: 'user@example.com', autoCapitalize: 'none', error: 'Please specify valid email' },
}];

const phoneFormFields = [{
  label: 'Phone',
  name: 'phone',
  type: 'phone',
  config: {
    keyboardType: 'phone-pad',
    placeholder: '+447472883222',
    autoCapitalize: 'none',
    error: 'Please specify valid phone number',
  },
}];

const fullNameFormFields = [{
  label: 'First name',
  name: 'firstName',
  type: 'firstName',
  config: { placeholder: 'First name' },
}, {
  label: 'Last name',
  name: 'lastName',
  type: 'lastName',
  config: { placeholder: 'Last name' },
}];

class MeScreen extends React.Component<Props, State> {
  state = {
    activeTab: ACTIVE,
    visibleModal: '',
  };

  generateProfileSettings = () => {
    const { user } = this.props;
    const phoneSettings = {
      key: 'phone',
      title: 'Phone',
      value: user.email,
      warningNotification: !user.isPhoneVerified,
      onPress: () => this.toggleSlideModalOpen('phone'),
    };

    const profileSettings = [
      {
        key: 'name',
        title: 'Full name',
        value: user.firstName ? `${user.firstName} ${user.lastName}` : undefined,
        onPress: () => this.toggleSlideModalOpen('fullName'),
      },
      {
        key: 'email',
        title: 'Email',
        value: user.email,
        onPress: () => this.toggleSlideModalOpen('email'),
      },
      {
        key: 'country',
        title: 'Country',
        value: user.country,
        onPress: () => this.toggleSlideModalOpen('country'),
      },
      {
        key: 'city',
        title: 'City',
        value: user.city,
        onPress: () => this.toggleSlideModalOpen('city'),
      },
    ];
    if (!isProdEnv) profileSettings.push(phoneSettings);
    return profileSettings;
  };

  filterSessionsByUrl = (connectors: any[]) => {
    const urls = [];
    const sessions = [];
    connectors.forEach(({ session }) => {
      if (session.peerMeta) {
        if (!urls.includes(session.peerMeta.url)) {
          urls.push(session.peerMeta.url);
          sessions.push(session);
        }
      }
    });
    return sessions;
  };

  disconnectByUrl = (url: string) => {
    if (this.state.activeTab === ACTIVE) {
      this.props.killWalletConnectSessionByUrl(url);
    } else {
      this.props.clearPendingWalletConnectSessionByUrl(url);
    }
  };

  renderSessionItem = ({ item }) => {
    const { activeTab } = this.state;
    const { peerMeta = {} } = item;
    const { name, icons, url } = peerMeta;
    return (
      <ListItemWithImage
        label={name}
        avatarUrl={icons[0]}
        buttonAction={() => this.disconnectByUrl(url)}
        buttonActionLabel={activeTab === ACTIVE ? 'Disconnect' : 'Cancel'}
      />
    );
  };

  renderSheetContent() {
    const { activeTab } = this.state;
    const { connectors, pending } = this.props;

    let data = [];
    let emptyTitle = '';

    switch (activeTab) {
      case ACTIVE:
        data = this.filterSessionsByUrl(connectors);
        emptyTitle = 'No Active Sessions';
        break;
      case REQUESTS:
        data = this.filterSessionsByUrl(pending);
        emptyTitle = 'No Pending Requests';
        break;
      default:
        break;
    }

    return (
      <FlatList
        data={data}
        keyExtractor={(item) => `walletconnect-session-${item.url}`}
        renderItem={this.renderSessionItem}
        initialNumToRender={8}
        style={{ flex: 1 }}
        contentContainerStyle={[{ paddingVertical: spacing.rhythm },
          !data.length
            ? {
                justifyContent: 'center',
                alignItems: 'center',
                flex: 1,
              }
            : {},
        ]}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {}}
          />
        }
        ListEmptyComponent={
          <EmptyStateParagraph
            title={emptyTitle}
          />
        }

      />
    );
  }

  setActiveTab = activeTab => this.setState({ activeTab });

  toggleSlideModalOpen = (visibleModal: ?string = null) => {
    this.setState({ visibleModal });
  };

  renderListItem = (field: string, onSelect: Function) => ({ item: { name } }: Object) => {
    return (
      <ProfileSettingsItem
        key={name}
        label={name}
        onPress={() => onSelect({ [field]: name })}
      />
    );
  };

  handleUserFieldUpdate = (field: Object) => {
    Keyboard.dismiss();
    const {
      updateUser,
      user,
    } = this.props;

    updateUser(user.walletId, field, () => this.toggleSlideModalOpen(null));
  };

  handleUserPhoneFieldUpdate = (field: Object) => {
    Keyboard.dismiss();
    const {
      updateUser,
      user,
      navigation,
      createOneTimePassword,
    } = this.props;

    const createOTP = () => {
      createOneTimePassword(user.walletId, field, () => {
        this.toggleSlideModalOpen(null);
        navigation.navigate(OTP, { phone: field.phone });
      });
    };

    updateUser(user.walletId, field, createOTP);
  };

  renderProfileSettingsItem = ({ item }) => {
    const {
      key,
      title,
      value,
      onPress,
      warningNotification,
    } = item;

    return (
      <ProfileSettingsItem
        key={key}
        label={title}
        value={value}
        onPress={onPress}
        warningNotification={warningNotification}
      />
    );
  };

  renderModalContent = (visibleModal) => {
    const { user } = this.props;
    switch (visibleModal) {
      case 'fullName':
        return (
          <Wrapper regularPadding flex={1}>
            <ScrollView
              contentContainerStyle={{ flex: 1, justifyContent: 'space-between' }}
              keyboardShouldPersistTaps="handled"
            >
              <SettingsModalTitle>
                Enter your full name
              </SettingsModalTitle>
              <EditProfile
                fields={fullNameFormFields}
                onSubmit={this.handleUserFieldUpdate}
                value={{ firstName: user.firstName, lastName: user.lastName }}
              />
            </ScrollView>
          </Wrapper>
        );
      case 'country':
        return (
          <Wrapper flex={1}>
            <SettingsModalTitle extraHorizontalSpacing>
              Choose your country
            </SettingsModalTitle>
            <CountrySelect
              renderItem={this.renderListItem('country', this.handleUserFieldUpdate)}
            />
          </Wrapper>
        );
      case 'city':
        return (
          <Wrapper regularPadding flex={1}>
            <SettingsModalTitle>
              Enter your city name
            </SettingsModalTitle>
            <EditProfile
              fields={cityFormFields}
              onSubmit={this.handleUserFieldUpdate}
              value={{ city: user.city }}
            />
          </Wrapper>
        );
      case 'email':
        return (
          <Wrapper regularPadding flex={1}>
            <SettingsModalTitle>
              Enter your email
            </SettingsModalTitle>
            <EditProfile
              fields={emailFormFields}
              onSubmit={this.handleUserFieldUpdate}
              value={{ email: user.email }}
            />
          </Wrapper>
        );
      case 'phone':
        return (
          <Wrapper regularPadding flex={1}>
            <View style={{ marginTop: 15, flex: 1 }}>
              <SettingsModalTitle>
                Enter your phone
              </SettingsModalTitle>
              <EditProfile
                fields={phoneFormFields}
                onSubmit={this.handleUserPhoneFieldUpdate}
                value={{ phone: user.phone }}
              />
            </View>
          </Wrapper>
        );
      default:
        return null;
    }
  };


  render() {
    const { navigation } = this.props;
    const { activeTab, visibleModal } = this.state;
    const sessionTabs = [
      {
        id: ACTIVE,
        name: 'Active',
        onPress: () => this.setActiveTab(ACTIVE),
      },
      {
        id: REQUESTS,
        name: 'Requests',
        onPress: () => this.setActiveTab(REQUESTS),
      },
    ];

    return (
      <ContainerWithBottomSheet
        inset={{ bottom: 0 }}
        color={baseColors.white}
        bottomSheetProps={{
          sheetHeight: 240,
          swipeToCloseHeight: 62,
          tabs: sessionTabs,
          activeTab,
        }}
        bottomSheetChildren={<SheetContentWrapper>{this.renderSheetContent()}</SheetContentWrapper>}
      >
        <Header
          onBack={() => navigation.goBack()}
          nextText="Get help"
          onNextPress={() => Intercom.displayMessenger()}
        />
        <ScrollWrapper>
          <FlatList
            data={this.generateProfileSettings()}
            renderItem={this.renderProfileSettingsItem}
            keyboardShouldPersistTaps="handled"
          />
          <SlideModal
            isVisible={!!visibleModal}
            fullScreen
            showHeader
            onModalHide={this.toggleSlideModalOpen}
            backgroundColor={baseColors.snowWhite}
            avoidKeyboard
          >
            {this.renderModalContent(visibleModal)}
          </SlideModal>
        </ScrollWrapper>
      </ContainerWithBottomSheet>
    );
  }
}

const mapStateToProps = ({ user: { data: user }, walletConnect: { connectors, pending } }) => ({
  user,
  connectors,
  pending,
});

const mapDispatchToProps = dispatch => ({
  clearPendingWalletConnectSessionByUrl: url => dispatch(clearPendingWalletConnectSessionByUrl(url)),
  killWalletConnectSessionByUrl: url => dispatch(killWalletConnectSessionByUrl(url)),
  updateUser: (walletId: string, field: Object, callback: Function) =>
    dispatch(updateUserAction(walletId, field, callback)),
  createOneTimePassword: (walletId: string, field: Object, callback: Function) =>
    dispatch(createOneTimePasswordAction(walletId, field, callback)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MeScreen);
