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

import { ADD_EDIT_USER } from 'constants/navigationConstants';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { Wrapper } from 'components/Layout';
import ConfettiBackground from 'components/ConfettiBackground';
import { MediumText, BaseText } from 'components/Typography';
import Button from 'components/Button';

import { fontStyles, spacing } from 'utils/variables';

import type { NavigationScreenProp } from 'react-navigation';
import type { RootReducerState } from 'reducers/rootReducer';
import { connect } from 'react-redux';
import type { ReferralReward } from 'reducers/referralsReducer';


type Props = {
  navigation: NavigationScreenProp<*>,
  reward: ReferralReward,
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

class ReferralIncomingReward extends React.PureComponent<Props> {
  render() {
    const { navigation, reward = {} } = this.props;
    const { asset, amount } = reward;
    const rewardText = asset ? `${amount || 'some'} ${asset}` : 'a gift';
    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [{ title: 'Thank you for using Pillar' }],
          rightItems: [{ close: true }],
          noBack: true,
        }}
      >
        <ConfettiBackground>
          <Wrapper flex={1} center fullScreen>
            <RewardBadge source={rewardBadge} />
            <Title>Your reward is on the way</Title>
            <Paragraph center>
              {'Thanks for joining Pillar.\n' +
              `To celebrate this, we also give you ${rewardText}.\n` +
              'You need to add and verify your email or phone in order to receive the reward.'}
            </Paragraph>
            <Button
              title="Add details"
              onPress={() => navigation.navigate(ADD_EDIT_USER)}
              marginBottom={spacing.mediumLarge}
              marginTop={40}
              block
            />
          </Wrapper>
        </ConfettiBackground>
      </ContainerWithHeader>
    );
  }
}


const mapStateToProps = ({
  referrals: { reward },
}: RootReducerState): $Shape<Props> => ({
  reward,
});

export default connect(mapStateToProps)(ReferralIncomingReward);
