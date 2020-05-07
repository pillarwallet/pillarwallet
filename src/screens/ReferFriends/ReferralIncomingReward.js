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
import isEmpty from 'lodash.isempty';

import { ADD_EDIT_USER } from 'constants/navigationConstants';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { Wrapper } from 'components/Layout';
import ConfettiBackground from 'components/ConfettiBackground';
import { MediumText } from 'components/Typography';
import Button from 'components/Button';
import LoadingParagraph from 'components/LoadingParagraph';

import { fontStyles, spacing } from 'utils/variables';
import { fetchReferralRewardAction } from 'actions/referralsActions';

import type { NavigationScreenProp } from 'react-navigation';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import { connect } from 'react-redux';
import type { RewardsByCompany, ReferralReward } from 'reducers/referralsReducer';


type Props = {
  navigation: NavigationScreenProp<*>,
  rewards: RewardsByCompany,
  isFetchingRewards: boolean,
  fetchReferralReward: () => void,
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

const rewardBadge = require('assets/images/referralBadge.png');

const getCampaignRewardText = (awardInfo: ReferralReward = {}) => {
  const { asset, amount } = awardInfo;
  return asset && amount ? `${amount} ${asset}` : '';
};

const getRewardText = (rewards: RewardsByCompany) => {
  const { pillar, ...allOtherCampaigns } = rewards;
  const referralCampaigns = Object.keys(allOtherCampaigns);
  let rewardText = '';
  let otherCampaignsRewardText = '';

  if (pillar && !isEmpty(pillar)) {
    rewardText = getCampaignRewardText(pillar);
  }
  if (referralCampaigns) {
    referralCampaigns.forEach((campaign) => {
      const text = getCampaignRewardText(allOtherCampaigns[campaign]);
      if (!rewardText) {
        otherCampaignsRewardText += `${text}`;
      } else if (text) {
        otherCampaignsRewardText += `, ${text}`;
      }
    });
  }

  if (otherCampaignsRewardText) {
    rewardText += otherCampaignsRewardText;
  }

  return rewardText ? `${rewardText} and a badge` : 'a badge';
};

class ReferralIncomingReward extends React.PureComponent<Props> {
  componentDidMount() {
    const { fetchReferralReward } = this.props;
    fetchReferralReward();
  }

  render() {
    const { navigation, rewards = {}, isFetchingRewards } = this.props;
    const rewardText = getRewardText(rewards);

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
            <LoadingParagraph
              isLoading={isFetchingRewards}
              text={'Thanks for joining Pillar.\n' +
              `To celebrate this, we also give you ${rewardText}.\n` +
              'You need to add and verify your email or phone in order to receive the reward.'}
              paragraphProps={{
                center: true,
                style: {
                  paddingHorizontal: 14,
                  marginBottom: 30,
                },
              }}
            />
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
  referrals: { rewards, isFetchingRewards },
}: RootReducerState): $Shape<Props> => ({
  rewards,
  isFetchingRewards,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchReferralReward: () => dispatch(fetchReferralRewardAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(ReferralIncomingReward);
