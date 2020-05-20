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
import get from 'lodash.get';
import { connect } from 'react-redux';

import { REFER_MAIN_SCREEN, REFERRAL_CONTACTS } from 'constants/navigationConstants';
import { DARK_CONTENT, LIGHT_THEME } from 'constants/appSettingsConstants';

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
import type { RewardsByCompany } from 'reducers/referralsReducer';


type Props = {
  navigation: NavigationScreenProp<*>,
  rewards: RewardsByCompany,
  isFetchingRewards: boolean,
  fetchReferralReward: () => void,
  isPillarRewardCampaignActive: boolean,
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

class ReferralSent extends React.PureComponent<Props> {
  componentDidMount() {
    const { fetchReferralReward } = this.props;
    fetchReferralReward();
  }

  render() {
    const {
      navigation,
      rewards,
      isFetchingRewards,
      isPillarRewardCampaignActive,
    } = this.props;
    const { asset, amount } = get(rewards, 'pillar', {});
    const titleText = isPillarRewardCampaignActive ? 'Your reward is on the way' : 'Invitations sent';
    const rewardParagraph = isPillarRewardCampaignActive && asset && amount
      ? `\nYou will receive ${amount} ${asset} for each friend installed the app with your referral link. ` +
      'You both should have verified your details in order to be eligible.'
      : '';
    return (
      <ConfettiBackground>
        <ContainerWithHeader
          backgroundColor="transparent"
          statusbarColor={{
            [LIGHT_THEME]: DARK_CONTENT,
          }}
        >
          <Wrapper flex={1} center>
            {!!isPillarRewardCampaignActive && <RewardBadge source={rewardBadge} />}
            <Title>{titleText}</Title>
            <LoadingParagraph
              isLoading={isFetchingRewards}
              text={`Thank you for spreading the word about Pillar. ${rewardParagraph}`
             }
              paragraphProps={{
                center: true,
                style: {
                  paddingHorizontal: 14,
                  marginBottom: 30,
                },
              }}
            />
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


const mapStateToProps = ({
  referrals: { rewards, isFetchingRewards, isPillarRewardCampaignActive },
}: RootReducerState): $Shape<Props> => ({
  rewards,
  isFetchingRewards,
  isPillarRewardCampaignActive,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchReferralReward: () => dispatch(fetchReferralRewardAction()),
});


export default connect(mapStateToProps, mapDispatchToProps)(ReferralSent);
