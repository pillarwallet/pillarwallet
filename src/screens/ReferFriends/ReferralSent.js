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

import { REFER_MAIN_SCREEN, REFERRAL_CONTACTS } from 'constants/navigationConstants';
import { DARK_CONTENT, LIGHT_THEME } from 'constants/appSettingsConstants';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { Wrapper } from 'components/Layout';
import ConfettiBackground from 'components/ConfettiBackground';
import { MediumText, BaseText } from 'components/Typography';
import Button from 'components/Button';

import { fontStyles, spacing } from 'utils/variables';

import type { NavigationScreenProp } from 'react-navigation';


type Props = {
  navigation: NavigationScreenProp<*>,
};

const RewardBadge = styled(CachedImage)`
  width: 104px;
  height: 104px;
  margin-bottom: ${spacing.medium}px;
`;

const Title = styled(MediumText)`
  ${fontStyles.large};
  margin-top: 11px;
  margin-bottom: 12px;
`;

const Paragraph = styled(BaseText)`
  ${fontStyles.regular};
  padding: 0 14px;
  margin-bottom: 30px;
`;

const rewardBadge = require('assets/images/referralBadge.png');

class ReferralSent extends React.PureComponent<Props> {
  render() {
    const { navigation } = this.props;
    return (
      <ConfettiBackground>
        <ContainerWithHeader
          headerProps={{
            floating: true,
            noBack: true,
          }}
          backgroundColor="transparent"
          statusbarColor={{
            [LIGHT_THEME]: DARK_CONTENT,
          }}
        >
          <Wrapper flex={1} center>
            <RewardBadge source={rewardBadge} />
            <Title>Your reward is on the way</Title>
            <Paragraph>
              Thank you for spreading the word about Pillar.
              You will receive 25 PLR for each friend installed the app with your referral link.
              You both should have verified your details in order to be eligible.
            </Paragraph>

            <Button
              title="Invite more friends"
              block
              regularText
              onPress={() => navigation.navigate(REFERRAL_CONTACTS)}
            />
            <Button
              title="Close"
              secondary
              block
              marginTop={12}
              onPress={() => navigation.navigate(REFER_MAIN_SCREEN)}
            />
          </Wrapper>
        </ContainerWithHeader>
      </ConfettiBackground>
    );
  }
}

export default ReferralSent;
