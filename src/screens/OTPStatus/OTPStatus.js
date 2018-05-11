// @flow
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
        <Wrapper padding>
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
