// @flow
import * as React from 'react';
import type { NavigationScreenProp } from 'react-navigation';
import { OTP } from 'constants/navigationConstants';
import { Container, Wrapper } from 'components/Layout';
import HyperLink from 'components/HyperLink';
import { Title, Body } from 'components/Typography';

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
          <Title>thanks</Title>
          <Body>Congratulations!</Body>
          <Body>You have been placed on our waiting list. We will notify you once your access has been approved.</Body>
          <Body>
            You can also check <HyperLink url="http://pillarproject.io/">Latest Updates</HyperLink> to stay informed about product updates and releases.
          </Body>
        </Wrapper>
      </Container>
    );
  }
}

export default OTPStatus;
