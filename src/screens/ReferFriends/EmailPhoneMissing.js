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
import { connect } from 'react-redux';
import t from 'translations/translate';

import { ADD_EDIT_USER } from 'constants/navigationConstants';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { Wrapper } from 'components/Layout';
import { MediumText } from 'components/Typography';
import Button from 'components/Button';
import LoadingParagraph from 'components/LoadingParagraph';

import { fontStyles, spacing } from 'utils/variables';
import { getCampaignRewardText } from 'utils/referrals';
import { fetchReferralRewardAction } from 'actions/referralsActions';

import type { NavigationScreenProp } from 'react-navigation';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { RewardsByCompany } from 'reducers/referralsReducer';


type Props = {
  navigation: NavigationScreenProp<*>,
  referrals: RewardsByCompany,
  rewardsByCampaign: RewardsByCompany,
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

class EmailPhoneMissing extends React.PureComponent<Props> {
  componentDidMount() {
    const { fetchReferralReward } = this.props;
    fetchReferralReward();
  }

  render() {
    const {
      navigation,
      rewardsByCampaign,
      isFetchingRewards,
      isPillarRewardCampaignActive,
    } = this.props;

    const rewardText = getCampaignRewardText(rewardsByCampaign.pillar);
    const modalTitle = isPillarRewardCampaignActive
      ? t('referralsContent.modal.missingPhone.title.activeRewardCampaign')
      : t('referralsContent.modal.missingPhone.title.inactiveRewardCampaign');
    const rewardParagraph = isPillarRewardCampaignActive && rewardText
      ? t('referralsContent.modal.missingPhone.paragraph.reward', { reward: rewardText })
      : '';
    const enablingParagraph = isPillarRewardCampaignActive
      ? t('referralsContent.modal.missingPhone.paragraph.enablingReferrals')
      : t('referralsContent.modal.missingPhone.paragraph.enablingInvitations');

    return (
      <ContainerWithHeader
        headerProps={{
          rightItems: [{ close: true }],
          noBack: true,
          floating: true,
        }}
      >
        <Wrapper flex={1} center regularPadding>
          {!!isPillarRewardCampaignActive && <RewardBadge source={rewardBadge} />}
          <Title>{modalTitle}</Title>
          <LoadingParagraph
            isLoading={isFetchingRewards}
            text={`${rewardParagraph}\n${enablingParagraph}`} // eslint-disable-line i18next/no-literal-string
            paragraphProps={{
              center: true,
              style: {
                paddingHorizontal: 14,
                marginBottom: 30,
              },
            }}
          />
          <Button
            title={t('referralsContent.modal.missingPhone.button.toUserData')}
            block
            regularText
            onPress={() => navigation.navigate(ADD_EDIT_USER)}
          />
        </Wrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  referrals: { rewardsByCampaign, isFetchingRewards, isPillarRewardCampaignActive },
}: RootReducerState): $Shape<Props> => ({
  rewardsByCampaign,
  isFetchingRewards,
  isPillarRewardCampaignActive,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchReferralReward: () => dispatch(fetchReferralRewardAction()),
});


export default connect(mapStateToProps, mapDispatchToProps)(EmailPhoneMissing);
