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
import { CachedImage } from 'react-native-cached-image';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import t from 'translations/translate';

// actions
import { hasSeenRecoveryPortalIntroAction } from 'actions/appSettingsActions';

// constants
import { RECOVERY_PORTAL_SETUP_SIGN_UP } from 'constants/navigationConstants';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ScrollWrapper, Wrapper } from 'components/Layout';
import { BaseText, BoldText } from 'components/Typography';
import Button from 'components/Button';

// utils
import { fontStyles, spacing } from 'utils/variables';
import { responsiveSize } from 'utils/ui';

// type
import type { Dispatch } from 'reducers/rootReducer';


type Props = {
  hasSeenRecoveryPortalIntro: () => void,
  navigation: NavigationScreenProp,
};

const CustomWrapper = styled.View`
  flex: 1;
  padding: 20px 55px 20px 46px;
`;

const Title = styled(BoldText)`
  color: #cea240;
  ${fontStyles.rGiant};
`;

const BodyText = styled(BaseText)`
  color: #ec9700;
  ${fontStyles.rBig};
  margin-top: ${responsiveSize(26)}px;
`;

const ButtonWrapper = styled(Wrapper)`
  margin: 30px 0 50px;
  padding: 0 ${spacing.rhythm}px;
`;

const FeatureIcon = styled(CachedImage)`
  height: 124px;
  width: 124px;
  margin-bottom: 24px;
`;

const deviceRecoveryIcon = require('assets/images/logo_recovery_device.png');

const RecoveryPortalSetupIntro = ({
  hasSeenRecoveryPortalIntro,
  navigation,
}: Props) => (
  <ContainerWithHeader
    headerProps={{ floating: true }}
    backgroundColor="#faf3f5"
  >
    <ScrollWrapper contentContainerStyle={{ paddingTop: 80 }}>
      <CustomWrapper>
        <FeatureIcon source={deviceRecoveryIcon} />
        <Title>{t('auth:recoveryPortal.title.recoverySetupIntro')}</Title>
        <BodyText>{t('auth:recoveryPortal.paragraph.recoverySetupIntro')}</BodyText>
      </CustomWrapper>
      <ButtonWrapper>
        <Button
          title={t('auth:button.next')}
          onPress={() => {
            hasSeenRecoveryPortalIntro();
            navigation.navigate(RECOVERY_PORTAL_SETUP_SIGN_UP);
          }}
        />
      </ButtonWrapper>
    </ScrollWrapper>
  </ContainerWithHeader>
);

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  hasSeenRecoveryPortalIntro: () => dispatch(hasSeenRecoveryPortalIntroAction()),
});

export default connect(null, mapDispatchToProps)(RecoveryPortalSetupIntro);
