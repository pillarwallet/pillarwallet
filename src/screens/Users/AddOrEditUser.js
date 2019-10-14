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
import { ScrollWrapper } from 'components/Layout';
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


const ImageWrapper = styled.View`
  width: 100%;
  padding: ${spacing.large}px;
  align-items: center;
  justify-content: center;
`;

const CameraButton = styled.TouchableOpacity`
  padding: 10px
  margin-top: 6px;
  margin-bottom: 60px;
`;

const CameraButtonLabel = styled(TextLink)`
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
  _nameForm: t.form;
  _surnameForm: t.form;
  _emailForm: t.form;
  _countryForm: t.form;
  _cityForm: t.form;
  _phoneForm: t.form;

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

  handleUserFieldChange = (value, formRef) => {
    formRef.getComponent(Object.keys(value)[0]).validate();
  };

  handleUserFieldUpdate = (value: Object, formRef) => {
    const {
      updateUser,
      user,
    } = this.props;
    const valueKey = Object.keys(value)[0];
    const validation = formRef.getComponent(valueKey).validate() || {};
    const { errors = [] } = validation;
    if (!value[valueKey] || !errors.length) updateUser(user.walletId, value);
  };

  handleUserPhoneFieldUpdate = (value: Object) => {
    const {
      updateUser,
      user,
      navigation,
      createOneTimePassword,
    } = this.props;
    const validation = this._phoneForm.getComponent(Object.keys(value)[0]).validate() || {};
    const { errors } = validation;
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

    const {
      firstName,
      lastName,
      email,
      phone,
      country,
      city,
    } = user;

    return (
      <ContainerWithHeader
        color={baseColors.white}
        headerProps={{
          centerItems: [
            { title: 'User settings' },
          ],
        }}
      >
        <ScrollWrapper disableOnAndroid>
          <CameraButton onPress={this.openCamera}>
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
              <CameraButtonLabel>{cameraButtonLabel}</CameraButtonLabel>
            </ImageWrapper>
          </CameraButton>
          <ProfileForm
            fields={[{
              label: 'Name',
              name: 'firstName',
              type: 'firstName',
              onBlur: (val) => this.handleUserFieldUpdate(val, this._nameForm),
            }]}
            onChange={(val) => this.handleUserFieldChange(val, this._nameForm)}
            value={{ firstName }}
            getFormRef={node => { this._nameForm = node; }}
          />

          <ProfileForm
            fields={[{
              label: 'Surname',
              name: 'lastName',
              type: 'lastName',
              onBlur: (val) => this.handleUserFieldUpdate(val, this._surnameForm),
            }]}
            onChange={(val) => this.handleUserFieldChange(val, this._surnameForm)}
            value={{ lastName }}
            getFormRef={node => { this._surnameForm = node; }}
          />

          <ProfileForm
            fields={[{
              label: 'Email',
              name: 'email',
              type: 'email',
              onBlur: (val) => this.handleUserFieldUpdate(val, this._emailForm),
            }]}
            onChange={(val) => this.handleUserFieldChange(val, this._emailForm)}
            value={{ email }}
            getFormRef={node => { this._emailForm = node; }}
          />

          <ProfileForm
            fields={[{
              label: 'Country',
              name: 'country',
              type: 'country',
              onSelect: this.selectCountry,
              options: sortedCountries,
              optionsTitle: 'Choose your country',
            }]}
            value={{ country }}
            getFormRef={node => { this._countryForm = node; }}
          />

          <ProfileForm
            fields={[{
              label: 'City',
              name: 'city',
              type: 'city',
              onBlur: (val) => this.handleUserFieldUpdate(val, this._cityForm),
            }]}
            onChange={(val) => this.handleUserFieldChange(val, this._cityForm)}
            value={{ city }}
            getFormRef={node => { this._cityForm = node; }}
          />

          {!isProdEnv &&
          <ProfileForm
            fields={[{
              label: 'Phone',
              name: 'phone',
              type: 'phone',
              onBlur: this.handleUserPhoneFieldUpdate,
            }]}
            onChange={(val) => this.handleUserFieldChange(val, this._phoneForm)}
            value={{ phone }}
            getFormRef={node => { this._phoneForm = node; }}
          />}
        </ScrollWrapper>

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
