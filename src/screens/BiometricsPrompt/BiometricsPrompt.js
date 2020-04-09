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
import { connect } from 'react-redux';
import { Platform } from 'react-native';
import styled from 'styled-components/native';
import { CachedImage } from 'react-native-cached-image';
import * as Keychain from 'react-native-keychain';
import { PERMISSIONS, RESULTS, request as requestPermission } from 'react-native-permissions';
import type { NavigationScreenProp } from 'react-navigation';

// actions
import { registerWalletAction } from 'actions/onboardingActions';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { MediumText } from 'components/Typography';
import Button from 'components/Button';
import ButtonText from 'components/ButtonText';
import Toast from 'components/Toast';

// utils
import { fontSizes, fontStyles, spacing } from 'utils/variables';
import { getBiometryType } from 'utils/settings';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';


type Props = {
  navigation: NavigationScreenProp<*>,
  registerWallet: (setBiometrics: boolean, themeToStore: string) => void,
  themeType: string,
};

const touchIdImageSource = require('assets/images/touchId.png');
const faceIdImageSource = require('assets/images/faceId.png');

const ContentWrapper = styled.ScrollView`
  flex: 1;
`;

const HeaderText = styled(MediumText)`
  ${fontStyles.large};
  text-align: center;
`;

const ContentInnerWrapper = styled.View`
  flex-grow: 1;
  align-items: center;
  justify-content: space-around;
`;

const ButtonsWrapper = styled.View`
  padding-bottom: 15%;
`;

const TouchIdImage = styled(CachedImage)`
  width: 164px;
  height: 164px;
`;

const getBiometryImage = (biometryType: string) => {
  switch (biometryType) {
    case Keychain.BIOMETRY_TYPE.TOUCH_ID:
    case Keychain.BIOMETRY_TYPE.FINGERPRINT:
      return touchIdImageSource;
    case Keychain.BIOMETRY_TYPE.FACE_ID:
      return faceIdImageSource;
    default:
      return '';
  }
};

const showFaceIDFailed = () => {
  Toast.show({
    message: 'Failed to get FaceID permission!',
    type: 'warning',
    title: 'Warning',
    autoClose: true,
  });
};

class BiometricsPrompt extends React.Component<Props> {
  proceedToRegisterWallet = (setBiometrics: boolean) => {
    const { registerWallet, themeType, navigation } = this.props;

    /**
     * as for permission if it's iOS FaceID, otherwise – no permission needed,
     * if permission is rejected – go with PIN flow (by Dmitry) as lib is unable
     * to ask for permission again unless user changes that in device
     * settings for the app
     * P. S. granted status will be returned even after user logs out because the permission
     * is given to the app and not the user (obvious, but just making a note if questions rise)
     */
    const biometryType = navigation.getParam('biometryType');
    if (setBiometrics
      && Platform.OS === 'ios'
      && biometryType === Keychain.BIOMETRY_TYPE.FACE_ID) {
      requestPermission(PERMISSIONS.IOS.FACE_ID)
        .then((status) => registerWallet(status === RESULTS.GRANTED, themeType))
        .catch(showFaceIDFailed);
      return;
    }

    registerWallet(setBiometrics, themeType);
  };

  render() {
    const { navigation } = this.props;
    const biometryType = navigation.getParam('biometryType');
    const biometryTypeTitle = getBiometryType(biometryType);
    const imageSource = getBiometryImage(biometryType);
    return (
      <ContainerWithHeader headerProps={{ centerItems: [{ title: 'Make crypto easy' }] }}>
        <ContentWrapper contentContainerStyle={{ paddingVertical: 20, paddingHorizontal: 30, flexGrow: 1 }}>
          <HeaderText>{`Would you like to use\n${biometryTypeTitle} with your\nwallet?`}</HeaderText>
          <ContentInnerWrapper>
            <TouchIdImage source={imageSource} />
            <ButtonsWrapper>
              <Button title="Yes, please" onPress={() => this.proceedToRegisterWallet(true)} />
              <ButtonText
                buttonText="I'm happy with PIN only"
                onPress={() => this.proceedToRegisterWallet(false)}
                fontSize={fontSizes.medium}
                wrapperStyle={{ marginTop: spacing.large }}
              />
            </ButtonsWrapper>
          </ContentInnerWrapper>
        </ContentWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  appSettings: { data: { themeType } },
}: RootReducerState): $Shape<Props> => ({
  themeType,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  registerWallet: (setBiometrics, themeToStore) => dispatch(
    registerWalletAction(setBiometrics, themeToStore),
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(BiometricsPrompt);
