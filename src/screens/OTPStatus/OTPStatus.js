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
import type { NavigationScreenProp } from 'react-navigation';
import { OTP } from 'constants/navigationConstants';
import { Container, Wrapper } from 'components/Layout';
import HyperLink from 'components/HyperLink';
import { Paragraph } from 'components/Typography';
import Title from 'components/Title';

type Props = {
  navigation: NavigationScreenProp<*>,
}
class OTPStatus extends React.Component<Props> {
  loginAction = () => {
    this.props.navigation.navigate(OTP);
  };

  render() {
    return (
      <Container>
        <Wrapper regularPadding>
          <Title title="thanks" />
          <Paragraph>Congratulations!</Paragraph>
          <Paragraph>
            You have been placed on our waiting list. We will notify you once your access has been approved.
          </Paragraph>
          <Paragraph>
            You can also check <HyperLink url="http://pillarproject.io/">Latest Updates</HyperLink> to stay informed about product updates and releases.
          </Paragraph>
        </Wrapper>
      </Container>
    );
  }
}

export default OTPStatus;
