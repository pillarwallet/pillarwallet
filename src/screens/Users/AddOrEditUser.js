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
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import Permissions from 'react-native-permissions';
import styled from 'styled-components/native';
import { CachedImage } from 'react-native-cached-image';
import t from 'tcomb-form-native';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { KAScrollView } from 'components/Layout';
import ProfileImage from 'components/ProfileImage';
import { TextLink } from 'components/Typography';
import Camera from 'components/Camera';

import { baseColors, spacing } from 'utils/variables';
import countries from 'utils/countries.json';
import { isProdEnv } from 'utils/environment';

import { updateUserAction, createOneTimePasswordAction } from 'actions/userActions';

import { OTP } from 'constants/navigationConstants';

import ProfileForm from './ProfileForm';

type Props = {
  navigation: NavigationScreenProp<*>,
  user: Object,
  updateUser: Function,
  createOneTimePassword: Function,
}

type State = {
  permissionsGranted: boolean,
  visibleModal: string,
}

const sortedCountries = countries.sort((a, b) => a.name.localeCompare(b.name));

const fields = (that) => {
  const fieldsList = [{
    label: 'Name',
    name: 'firstName',
    type: 'firstName',
    onBlur: that.handleUserFieldUpdate,
  },
  {
    label: 'Surname',
    name: 'lastName',
    type: 'lastName',
    onBlur: that.handleUserFieldUpdate,
  },
  {
    label: 'Email',
    name: 'email',
    type: 'email',
    onBlur: that.handleUserFieldUpdate,
  },
  {
    label: 'Country',
    name: 'country',
    type: 'country',
    onSelect: that.selectCountry,
    options: sortedCountries,
    optionsTitle: 'Choose your country',
  },
  {
    label: 'City',
    name: 'city',
    type: 'city',
    onBlur: that.handleUserFieldUpdate,
  }];

  if (!isProdEnv) {
    fieldsList.push({
      label: 'Phone',
      name: 'phone',
      type: 'phone',
      onBlur: that.handleUserPhoneFieldUpdate,
    });
  }

  return fieldsList;
};

const ImageWrapper = styled.View`
  width: 100%;
  padding: ${spacing.large}px ${spacing.large}px 60px;
  align-items: center;
  justify-content: center;
`;

const CameraButton = styled.TouchableOpacity`
  padding: 10px
  margin-top: 6px;
`;

const ProfileImagePlaceholder = styled.View`
  width: 96px;
  height: 96px;
  border-radius: 48px;
  align-items: center;
  justify-content: center;
  background-color: ${baseColors.white};
  border: 2px dashed ${baseColors.mediumLightGray};
`;

const BlankAvatar = styled(CachedImage)`
  width: 28px;
  height: 28px;
`;

const blankAvatar = require('assets/icons/icon_blank_avatar.png');

class AddOrEditUser extends React.PureComponent<Props, State> {
  _form: t.form;

  constructor(props: Props) {
    super(props);
    this.state = {
      permissionsGranted: false,
      visibleModal: '',
    };
  }

  selectCountry = (value: Object) => {
    const {
      updateUser,
      user,
    } = this.props;
    this.setState({ visibleModal: '' });
    updateUser(user.walletId, value);
  };

  handleUserFieldUpdate = (value: Object) => {
    const {
      updateUser,
      user,
    } = this.props;
    const valdation = this._form.getComponent(Object.keys(value)[0]).validate() || {};
    const { errors } = valdation;

    if (!errors || errors.length) return;
    updateUser(user.walletId, value);
  };

  handleUserPhoneFieldUpdate = (value: Object) => {
    const {
      updateUser,
      user,
      navigation,
      createOneTimePassword,
    } = this.props;
    const valdation = this._form.getComponent(Object.keys(value)[0]).validate() || {};
    const { errors } = valdation;
    if (!errors || errors.length) return;

    const createOTP = () => {
      createOneTimePassword(user.walletId, value, () => {
        navigation.navigate(OTP, { phone: value.phone });
      });
    };

    updateUser(user.walletId, value, createOTP);
  };

  openCamera = async () => {
    const statusPhoto = await Permissions.request('photo');
    const statusCamera = await Permissions.request('camera');
    this.setState({
      permissionsGranted: statusPhoto === 'authorized' && statusCamera === 'authorized',
      visibleModal: 'camera',
    });
  };

  closeCamera = () => {
    this.setState({ visibleModal: '' });
  };

  render() {
    const { permissionsGranted, visibleModal } = this.state;
    const { user, navigation } = this.props;
    const { profileImage, lastUpdateTime = 0, username } = user;
    const cameraButtonLabel = profileImage ? 'Change profile picture' : 'Set profile picture';

    const formedFields = fields(this);
    const {
      firstName,
      lastName,
      phone,
      country,
      city,
    } = user;
    const value = {
      firstName,
      lastName,
      phone,
      country,
      city,
    };

    return (
      <ContainerWithHeader
        color={baseColors.white}
        headerProps={{
          centerItems: [
            { title: 'User settings' },
          ],
        }}
      >
        <KAScrollView>
          <ImageWrapper>
            {!!profileImage && <ProfileImage
              uri={`${profileImage}?t=${lastUpdateTime}`}
              userName={username}
              diameter={96}
              borderWidth={0}
              noShadow
            />}
            {!profileImage &&
            <ProfileImagePlaceholder>
              <BlankAvatar source={blankAvatar} />
            </ProfileImagePlaceholder>}
            <CameraButton onPress={this.openCamera}>
              <TextLink>{cameraButtonLabel}</TextLink>
            </CameraButton>

          </ImageWrapper>
          <ProfileForm
            fields={formedFields}
            value={value}
            getFormRef={node => { this._form = node; }}
          />
        </KAScrollView>

        <Camera
          isVisible={visibleModal === 'camera'}
          modalHide={this.closeCamera}
          permissionsGranted={permissionsGranted}
          navigation={navigation}
        />

      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  wallet: { backupStatus },
  user: { data: user },
}) => ({
  backupStatus,
  user,
});

const mapDispatchToProps = (dispatch: Function) => ({
  updateUser: (walletId: string, field: Object, callback?: Function) =>
    dispatch(updateUserAction(walletId, field, callback)),
  createOneTimePassword: (walletId: string, field: Object, callback: Function) =>
    dispatch(createOneTimePasswordAction(walletId, field, callback)),
});

export default connect(mapStateToProps, mapDispatchToProps)(AddOrEditUser);
