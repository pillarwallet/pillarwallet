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
import styled from 'styled-components/native';
import { MediumText, BaseText } from 'components/Typography';
import Button from 'components/Button';
import SlideModal from 'components/Modals/SlideModal';
import Icon from 'components/Icon';
import { Spacing } from 'components/Layout';
import { themedColors } from 'utils/themes';
import { getCampaignRewardText } from 'utils/referrals';
import type { RootReducerState } from 'reducers/rootReducer';
import type { RewardsByCompany } from 'reducers/referralsReducer';


type Props = {
  isVisible: boolean,
  onModalHide: () => void,
  verifiedField: ?string,
  onButtonPress: () => void,
  isPillarRewardCampaignActive: boolean,
  rewardsByCampaign: RewardsByCompany,
};

const Wrapper = styled.View`
  flex: 1;
  justify-content: center;
  padding: 0 30px;
`;

const LikeIcon = styled(Icon)`
  color: ${themedColors.labelTertiary};
  fontSize: 64px;
  align-self: center;
`;

const VerifiedModal = (props: Props) => {
  const {
    isVisible, onModalHide, verifiedField, onButtonPress, isPillarRewardCampaignActive, rewardsByCampaign,
  } = props;
  const referralMethod = verifiedField === 'phone' ? 'text message' : 'email';
  const rewardText = getCampaignRewardText(rewardsByCampaign.pillar);

  const text = (isPillarRewardCampaignActive && rewardText)
    ? `You are now able to invite friends via ${referralMethod}. You will receive ${rewardText} for each ` +
    'friend installed the app with your referral link.'
    : `You are now able to invite friends via ${referralMethod}. Start receiving badges for friends installed Pillar ` +
    'with your referral link!';

  return (
    <SlideModal
      fullScreen
      showHeader
      insetTop
      isVisible={isVisible}
      onModalHide={onModalHide}
    >
      <Wrapper>
        <LikeIcon name="like" />
        <Spacing h={40} />
        <MediumText center large >Your {verifiedField} has been verified</MediumText>
        <Spacing h={15} />
        <BaseText center medium>{text}</BaseText>
        <Spacing h={32} />
        <Button title="Invite friends" onPress={onButtonPress} />
      </Wrapper>
    </SlideModal>
  );
};

const mapStateToProps = ({
  referrals: { isPillarRewardCampaignActive, rewardsByCampaign },
}: RootReducerState): $Shape<Props> => ({
  isPillarRewardCampaignActive,
  rewardsByCampaign,
});

export default connect(mapStateToProps)(VerifiedModal);
