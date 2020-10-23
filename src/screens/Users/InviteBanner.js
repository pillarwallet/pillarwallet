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
import t from 'translations/translate';

import ShadowedCard from 'components/ShadowedCard';
import { BaseText, MediumText } from 'components/Typography';
import Button from 'components/Button';

import { fontStyles, spacing } from 'utils/variables';
import { getThemeType } from 'utils/themes';

import { DARK_THEME } from 'constants/appSettingsConstants';


type Props = {
  title: string,
  onInvitePress: () => void,
  isReferralActive: boolean,
};


const inviteImageSource = require('assets/images/referral_gift.png');

const Wrapper = styled.View`
  margin: 0 ${spacing.layoutSides}px;
`;

const HeaderWrapper = styled.View`
  justify-content: center;
  position: relative;
  height: 136px;
  background-color: ${({ theme }) => getThemeType(theme) === DARK_THEME
    ? theme.colors.tertiary
    : theme.colors.basic070};
  padding: ${spacing.large}px 36px;
`;

const InviteImage = styled(CachedImage)`
  width: 138px;
  height: 95px;
  position: absolute;
  bottom: 0;
  right: -40px;
`;

const BodyWrapper = styled.View`
  padding: 20px 36px 36px;
  align-items: center;
`;

const Title = styled(MediumText)`
  ${fontStyles.large};
`;

const BodyText = styled(BaseText)`
  ${fontStyles.medium};
  max-width: 245px;
  text-align: center;
  margin-bottom: ${spacing.large}px;
`;


const InviteBanner = (props: Props) => {
  const { title, onInvitePress, isReferralActive } = props;
  return (
    <Wrapper>
      <ShadowedCard borderRadius={30} upperContentWrapperStyle={{ overflow: 'hidden' }}>
        <HeaderWrapper>
          <InviteImage source={inviteImageSource} resizeMode="contain" />
          <Title>{title}</Title>
        </HeaderWrapper>
        <BodyWrapper>
          {!!isReferralActive &&
          <BodyText>
            {t('referralsContent.label.referAndGetRewards')}
          </BodyText>}
          <Button
            title={t('button.inviteFriends')}
            onPress={onInvitePress}
            marginTop={isReferralActive ? 0 : 14}
          />
        </BodyWrapper>
      </ShadowedCard>
    </Wrapper>
  );
};

export default InviteBanner;
