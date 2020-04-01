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
import { Dimensions } from 'react-native';
import styled from 'styled-components/native';
import { CachedImage } from 'react-native-cached-image';
import { withNavigation } from 'react-navigation';

import { Wrapper } from 'components/Layout';
import HeaderBlock from 'components/HeaderBlock';
import { BaseText, MediumText, BoldText } from 'components/Typography';
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/Button';

import { ADD_EDIT_USER } from 'constants/navigationConstants';

import { themedColors } from 'utils/themes';
import { spacing } from 'utils/variables';

import type { NavigationScreenProp } from 'react-navigation';

type Props = {
  isVisible: boolean,
  onModalHide: (callback: () => void) => void,
  navigation: NavigationScreenProp<*>,
};

const { width: screenWidth } = Dimensions.get('window');

const StyledScrollView = styled.ScrollView`
  flex-grow: 1;
  background-color: ${themedColors.surface};
`;

const ContentWrapper = styled.View`
  position: relative;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 40px ${spacing.layoutSides}px;
`;

const RewardBadge = styled(CachedImage)`
  width: 104px;
  height: 104px;
  margin-bottom: ${spacing.medium}px;
`;

const Confetti = styled(CachedImage)`
  position: absolute;
  left: 0;
  ${({ top }) => top ? 'top: 0;' : 'bottom: 0;'}
  width: ${screenWidth}px;
  height: ${({ height }) => height}px;
`;

const rewardBadge = require('assets/images/referralBadge.png');
const confettiTop = require('assets/images/rewardBackgroundTop.png');
const confettiBottom = require('assets/images/rewardBackgroundBottom.png');

class ReferralModalReward extends React.Component<Props> {
  navigateToProfile = () => {
    const { navigation, onModalHide } = this.props;
    onModalHide(() => navigation.navigate(ADD_EDIT_USER));
  };

  render() {
    const { isVisible, onModalHide } = this.props;

    return (
      <SlideModal
        isVisible={isVisible}
        onModalHidden={onModalHide}
        modalStyle={{ flex: 1 }}
        noSwipeToDismiss
        fullScreenComponent={(
          <Wrapper flex={1}>
            <HeaderBlock
              centerItems={[{ title: 'Thank you for using Pillar' }]}
              rightItems={[{ close: true }]}
              onClose={onModalHide}
              noBack
            />
            <StyledScrollView contentContainerStyle={{ flexGrow: 1 }}>
              <ContentWrapper>
                <Confetti source={confettiTop} resizeMode="cover" top height={screenWidth * 0.73} />
                <Confetti source={confettiBottom} resizeMode="contain" height={screenWidth * 0.48} />
                <RewardBadge source={rewardBadge} />
                <MediumText positive large center>
                  Your reward is on the way
                </MediumText>
                <BaseText center regular style={{ marginTop: spacing.large }}>
                  Thanks for joining Pillar.
                  To celebrate this, <BoldText regular>we also give you 25 PLR</BoldText>.
                  You need to add and verify your email or phone in order to receive the reward.
                </BaseText>
                <Button
                  title="Add details"
                  onPress={this.navigateToProfile}
                  marginBottom={spacing.mediumLarge}
                  marginTop={40}
                />
              </ContentWrapper>
            </StyledScrollView>
          </Wrapper>
        )}
      />
    );
  }
}

export default withNavigation(ReferralModalReward);
