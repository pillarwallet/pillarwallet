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
import { ScrollView } from 'react-native';
import Intercom from 'react-native-intercom';
import styled, { withTheme } from 'styled-components/native';

// components
import { MediumText } from 'components/Typography';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Insight from 'components/Insight';
import FriendsList from 'screens/ReferFriends/FriendsList';

// utils
import { spacing, fontStyles } from 'utils/variables';
import { themedColors } from 'utils/themes';

const INSIGHT_ITEMS = [
  {
    title: 'Share your link',
    body: 'Invite your friends to join Pillar',
  },
  {
    title: 'Give Smart Wallet for free',
    body: 'Friends who install Pillar with your link will get free Smart Wallet activation.',
  },
  {
    title: 'Get free PLR',
    body: 'Earn meta-tokens for referring friends.',
  },
];

const FormWrapper = styled.View`
  padding: 30px ${spacing.layoutSides}px ${spacing.layoutSides}px;
`;

const ExplanationText = styled(MediumText)`
  color: ${themedColors.secondaryText};
  ${fontStyles.small};
  margin-top: 6px;
`;

const ReferFriends = () => {
  return (
    <ContainerWithHeader
      headerProps={{
        centerItems: [{ title: 'Refer friend' }],
        rightItems: [
          {
            link: 'Support',
            onPress: () => Intercom.displayMessenger(),
          },
        ],
        sideFlex: 2,
      }}
    >
      <ScrollView>
        <Insight
          isVisible
          insightNumberedList={INSIGHT_ITEMS}
        />
        <FriendsList />
        <FormWrapper>
          <ExplanationText>
            Upon invited, your friend will receive email link for download. Referral rewards are available with this
            link only.
          </ExplanationText>
        </FormWrapper>
      </ScrollView>
    </ContainerWithHeader>
  );
};

export default withTheme(ReferFriends);
