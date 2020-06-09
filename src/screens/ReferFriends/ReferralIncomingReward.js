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
import { MediumText } from 'components/Typography';
import Button from 'components/Button';
import LoadingParagraph from 'components/LoadingParagraph';

import { fontStyles, spacing } from 'utils/variables';
import { getCampaignRewardText } from 'utils/referrals';
import { fetchReferralRewardAction } from 'actions/referralsActions';

import type { NavigationScreenProp } from 'react-navigation';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import { connect } from 'react-redux';
import type { RewardsByCompany } from 'reducers/referralsReducer';


type Props = {
  navigation: NavigationScreenProp<*>,
  rewardsByCampaign: RewardsByCompany,
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

const getRewardText = (rewards: RewardsByCompany, campaign: string) => {
  const relatedCampaignRewards = rewards[campaign];
  if (!relatedCampaignRewards) return '';
  return getCampaignRewardText(relatedCampaignRewards);
};

class ReferralIncomingReward extends React.PureComponent<Props> {
  componentDidMount() {
    const { fetchReferralReward } = this.props;
    fetchReferralReward();
  }

  render() {
    const {
      navigation,
      rewardsByCampaign = {},
      isFetchingRewards,
    } = this.props;

    // temp solution. Would be best to pass campaign via branch.io
    const relatedCampaign = rewardsByCampaign['1world'] ? '1world' : 'pillar';

    const rewardText = getRewardText(rewardsByCampaign, relatedCampaign);
    const isGettingReward = !!rewardText;
    const title = isGettingReward ? 'Your reward is on the way' : 'Thanks for joining Pillar';

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
            {!!isGettingReward && <RewardBadge source={rewardBadge} />}
            <Title>{title}</Title>
            {!!isGettingReward &&
            <>
              <LoadingParagraph
                isLoading={isFetchingRewards}
                text={'Thanks for joining Pillar.\n' +
                `To celebrate this, we also give you ${rewardText}.\n` +
                'You need to add and verify your email or phone in order to receive the reward. ' +
                'Reward will be issued to new user only.'}
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
            </>}
          </Wrapper>
        </ConfettiBackground>
      </ContainerWithHeader>
    );
  }
}


const mapStateToProps = ({
  referrals: { rewardsByCampaign, isFetchingRewards },
}: RootReducerState): $Shape<Props> => ({
  rewardsByCampaign,
  isFetchingRewards,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchReferralReward: () => dispatch(fetchReferralRewardAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(ReferralIncomingReward);
