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
import { Platform, Linking } from 'react-native';
import styled from 'styled-components/native';
import * as Keychain from 'react-native-keychain';
import { PERMISSIONS, RESULTS, request as requestPermission } from 'react-native-permissions';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';

// actions
import { beginOnboardingAction } from 'actions/onboardingActions';

// components
import ContainerWithHeader from 'components/legacy/Layout/ContainerWithHeader';
import { MediumText } from 'components/legacy/Typography';
import Button from 'components/legacy/Button';
import Image from 'components/Image';
import Toast from 'components/Toast';

// utils
import { fontStyles } from 'utils/variables';
import { getBiometryType } from 'utils/settings';
import { themedColors } from 'utils/themes';

// types
import type { Dispatch } from 'reducers/rootReducer';

type Props = {
  navigation: NavigationScreenProp<*>,
  beginOnboarding: (enableBiometrics: boolean) => void,
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
  width: 100%;
  padding-bottom: 15%;
`;

const TouchIdImage = styled(Image)`
  width: 164px;
  height: 164px;
  tintcolor: ${themedColors.positive};
`;

const getBiometryImage = (biometryType: string) => {
  switch (biometryType) {
    case Keychain.BIOMETRY_TYPE.FACE_ID:
    case Keychain.BIOMETRY_TYPE.FACE:
      return faceIdImageSource;
    case Keychain.BIOMETRY_TYPE.TOUCH_ID:
    case Keychain.BIOMETRY_TYPE.FINGERPRINT:
      return touchIdImageSource;
    default:
      return '';
  }
};

const showFaceIDFailed = () => {
  Toast.show({
    message: t('toast.failedToGetFaceIDPermission'),
    emoji: 'pensive',
    supportLink: true,
    link: t('label.faceIDSettings'),
    onLinkPress: () => {
      Linking.openURL('app-settings:');
    },
    autoClose: true,
  });
};

class BiometricsPrompt extends React.Component<Props> {
  proceedToBeginOnboarding = (setBiometrics: boolean) => {
    const { beginOnboarding, navigation } = this.props;

    /**
     * as for permission if it's iOS FaceID, otherwise – no permission needed,
     * if permission is rejected – go with PIN flow (by Dmitry) as lib is unable
     * to ask for permission again unless user changes that in device
     * settings for the app
     * P. S. granted status will be returned even after user logs out because the permission
     * is given to the app and not the user (obvious, but just making a note if questions rise)
     */
    const biometryType = navigation.getParam('biometryType');
    if (setBiometrics && Platform.OS === 'ios' && biometryType === Keychain.BIOMETRY_TYPE.FACE_ID) {
      requestPermission(PERMISSIONS.IOS.FACE_ID)
        .then((status) => beginOnboarding(status === RESULTS.GRANTED))
        .catch(showFaceIDFailed);
      return;
    }

    beginOnboarding(setBiometrics);
  };

  render() {
    const { navigation } = this.props;
    const biometryType = navigation.getParam('biometryType');
    const biometryTypeTitle = getBiometryType(biometryType);
    const imageSource = getBiometryImage(biometryType);
    return (
      <ContainerWithHeader headerProps={{ centerItems: [{ title: t('auth:title.biometricsPromptOnLogin') }] }}>
        <ContentWrapper contentContainerStyle={{ paddingVertical: 20, paddingHorizontal: 30, flexGrow: 1 }}>
          <HeaderText>{t('auth:paragraph.biometricsPrompt', { biometryTypeTitle })}</HeaderText>
          <ContentInnerWrapper>
            <TouchIdImage source={imageSource} />
            <ButtonsWrapper>
              <Button
                title={t('auth:button.yesPlease')}
                onPress={() => this.proceedToBeginOnboarding(true)}
                marginBottom={4}
                testID={`${TAG}-button-yes`}
                // eslint-disable-next-line i18next/no-literal-string
                accessibilityLabel={`${TAG}-button-yes`}
              />
              <Button
                transparent
                title={t('auth:button.okToUsePinCodeOnly')}
                onPress={() => this.proceedToBeginOnboarding(false)}
                testID={`${TAG}-pin_only`}
                // eslint-disable-next-line i18next/no-literal-string
                accessibilityLabel={`${TAG}-pin_only`}
              />
            </ButtonsWrapper>
          </ContentInnerWrapper>
        </ContentWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  beginOnboarding: (enableBiometrics) => dispatch(beginOnboardingAction(enableBiometrics)),
});

export default connect(null, mapDispatchToProps)(BiometricsPrompt);

const TAG = 'BiometricsPrompt';
