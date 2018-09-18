// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import { Container, Wrapper } from 'components/Layout';
import { Paragraph } from 'components/Typography';
import Title from 'components/Title';
import Button from 'components/Button';
import { NEW_PROFILE } from 'constants/navigationConstants';

type Props = {
  navigation: NavigationScreenProp<*>,
  user: Object,
  wallet: Object,
}

type State = {}

class WelcomeBack extends React.Component<Props, State> {
  handleDismissal = () => {
    const { navigation } = this.props;
    navigation.navigate(NEW_PROFILE);
  };

  render() {
    return (
      <Container>
        <Wrapper flex={1} center regularPadding>
          <Title title="Welcome back!" align="center" noBlueDot />
          <Paragraph light center style={{ marginBottom: 30 }}>
            Your Pillar Wallet is now restored. We are happy to see you again.
          </Paragraph>
          <Button marginBottom="20px" onPress={this.handleDismissal} title="Go to wallet" />
        </Wrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({
  user: { data: user },
  wallet: { data: wallet },
}) => ({
  user,
  wallet,
});

export default connect(mapStateToProps)(WelcomeBack);
