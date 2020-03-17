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

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { User } from 'models/User';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ScrollWrapper } from 'components/Layout';
import ProfileImage from 'components/ProfileImage';
import { TextLink } from 'components/Typography';
import Camera from 'components/Camera';
import InputWithSwitch from 'components/Input/InputWithSwitch';

// utils
import { spacing } from 'utils/variables';
import countries from 'utils/countries.json';
import { themedColors } from 'utils/themes';

// actions
import { updateUserAction } from 'actions/userActions';

// partials
import ProfileForm from './ProfileForm';
import VerifyOTPModal from './VerifyOTPModal';


type Props = {
  navigation: NavigationScreenProp<*>,
  oneTimePasswordSent: boolean,
  user: User,
  updateUser: (walletId: string, field: Object) => void,
};

type State = {
  permissionsGranted: boolean,
  visibleModal: string,
  verifyingField: ?string,
};

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
  border: 2px dashed ${themedColors.border};
`;

const BlankAvatar = styled(CachedImage)`
  width: 28px;
  height: 28px;
`;

const blankAvatar = require('assets/icons/icon_blank_avatar.png');


class AddOrEditUser extends React.PureComponent<Props, State> {
  state = {
    verifyingField: null,
    permissionsGranted: false,
    visibleModal: '',
  };

  selectCountry = (value: Object) => {
    const {
      updateUser,
      user,
    } = this.props;
    this.setState({ visibleModal: '' });
    updateUser(user.walletId, value);
  };

  handleUserFieldUpdate = (update: Object) => {
    const {
      updateUser,
      user,
    } = this.props;

    updateUser(user.walletId, update);
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

  verifyEmail = () => {
    this.setState({ verifyingField: 'email' });
  };

  verifyPhone = () => {
    this.setState({ verifyingField: 'phone' });
  };

  onCloseVerification = () => {
    this.setState({ verifyingField: null });
  };

  render() {
    const {
      permissionsGranted,
      visibleModal,
      verifyingField,
    } = this.state;
    const { user, navigation } = this.props;

    const {
      firstName,
      lastName,
      email,
      phone,
      country,
      city,
      isEmailVerified,
      isPhoneVerified,
      profileImage,
      lastUpdateTime = 0,
      username,
    } = user;

    const cameraButtonLabel = profileImage ? 'Change profile picture' : 'Set profile picture';

    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [
            { title: 'User settings' },
          ],
        }}
        inset={{ bottom: 'never' }}
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

          <InputWithSwitch
            disabledInput
            inputProps={{
              value: username,
              fieldName: 'username',
            }}
            label="Username"
            wrapperStyle={{ marginTop: spacing.mediumLarge }}
          />

          <ProfileForm
            fields={[{
              label: 'Name',
              name: 'firstName',
              type: 'firstName',
            }]}
            onUpdate={this.handleUserFieldUpdate}
            value={{ firstName }}
          />

          <ProfileForm
            fields={[{
              label: 'Surname',
              name: 'lastName',
              type: 'lastName',
            }]}
            onUpdate={this.handleUserFieldUpdate}
            value={{ lastName }}
          />

          <ProfileForm
            fields={[{
              label: 'E-mail',
              name: 'email',
              type: 'email',
              hasVerification: true,
              isVerified: isEmailVerified,
              onPressVerify: this.verifyEmail,
              autoCapitalize: 'none',
              keyboardType: 'email-address',
            }]}
            onUpdate={this.handleUserFieldUpdate}
            value={{ email }}
          />

          <ProfileForm
            fields={[{
              label: 'Phone',
              name: 'phone',
              type: 'phone',
              hasVerification: true,
              isVerified: isPhoneVerified,
              onPressVerify: this.verifyPhone,
              keyboardType: 'phone-pad',
            }]}
            onUpdate={this.handleUserFieldUpdate}
            value={{ phone }}
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
          />

          <ProfileForm
            fields={[{
              label: 'City',
              name: 'city',
              type: 'city',
            }]}
            onUpdate={this.handleUserFieldUpdate}
            value={{ city }}
          />

        </ScrollWrapper>

        <Camera
          isVisible={visibleModal === 'camera'}
          modalHide={this.closeCamera}
          permissionsGranted={permissionsGranted}
          navigation={navigation}
        />

        {!!verifyingField && <VerifyOTPModal
          verifyingField={verifyingField}
          onModalClose={this.onCloseVerification}
        />}
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  user: {
    data: user,
    oneTimePasswordSent,
  },
}: RootReducerState): $Shape<Props> => ({
  user,
  oneTimePasswordSent,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  updateUser: (walletId: string, field: Object) =>
    dispatch(updateUserAction(walletId, field)),
});

export default connect(mapStateToProps, mapDispatchToProps)(AddOrEditUser);
