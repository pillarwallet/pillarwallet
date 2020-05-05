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

class EmailPhoneMissing extends React.PureComponent<Props> {
  render() {
    const { navigation } = this.props;
    return (
      <ContainerWithHeader
        headerProps={{
          rightItems: [{ close: true }],
          noBack: true,
          floating: true,
        }}
      >
        <Wrapper flex={1} center regularPadding>
          <RewardBadge source={rewardBadge} />
          <Title>Invite and get rewarded</Title>
          <Paragraph center>
            {'You will receive 25 PLR and a badge for each friend installed the app with your referral link.'}
            {'\n To enable referral system we need to make sure you\'re a genuine user. We care for our users ' +
            'privacy and never share your data.'}
          </Paragraph>

          <Button
            title="Verify email or phone"
            block
            regularText
            onPress={() => navigation.navigate(ADD_EDIT_USER)}
          />
        </Wrapper>
      </ContainerWithHeader>
    );
  }
}

export default EmailPhoneMissing;
