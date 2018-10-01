// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import { fontSizes } from 'utils/variables';
import { Container, Wrapper } from 'components/Layout';
import { Paragraph } from 'components/Typography';
import Title from 'components/Title';
import Button from 'components/Button';
import ProfileImage from 'components/ProfileImage';
import { APP_FLOW, ASSETS, LEGAL_TERMS } from 'constants/navigationConstants';
import { validateUserDetailsAction, registerOnBackendAction, getUserInfoAction } from 'actions/onboardingActions';
import { USERNAME_EXISTS, USERNAME_OK, CHECKING_USERNAME } from 'constants/walletConstants';
import t from "tcomb-form-native";

type Props = {
  navigation: NavigationScreenProp<*>,
  user: Object,
  wallet: Object,
}

type State = {}

const profileImageWidth = 144;

class WelcomeBack extends React.Component<Props, State> {

  componentDidUpdate(prevProps: Props) {
    const { walletState } = this.props;
    if (prevProps.walletState === walletState) return;

    if (walletState === USERNAME_EXISTS) {
      const options = t.update(this.state.formOptions, {
        fields: {
          username: {
            hasError: { $set: true },
            error: { $set: 'Username taken' },
          },
        },
      });
      this.setState({ formOptions: options }); // eslint-disable-line
    }
    if (walletState === USERNAME_OK) {
      this.goToNextScreen();
    }
  }

  componentWillMount() {
    const { registerOnBackend } = this.props;
    registerOnBackend();
  }

  handleDismissal = () => {
    const { navigation } = this.props;
    // navigation.navigate({
    //   routeName: APP_FLOW,
    //   params: {},
    //   action: navigation.navigate(ASSETS),
    // });
    navigation.navigate(LEGAL_TERMS);
  };

  render() {
    const { apiUser } = this.props;
    console.log('welcome-back');
    console.log(this.props);
    return (
      <Container>
        <Wrapper flex={1} center regularPadding>
          <ProfileImage
            uri={`${apiUser.profileImage}?t=${apiUser.lastUpdateTime || 0}`}
            diameter={profileImageWidth}
            style={{ marginBottom: 47 }}
          />
          <Title
            title={`Welcome back, ${apiUser.username}!`}
            align="center"
            noBlueDot
          />
          <Paragraph small light center style={{ marginBottom: 40, paddingLeft: 40, paddingRight: 40 }}>
            Your Pillar Wallet is now restored. We are happy to see you again.
          </Paragraph>
          <Button marginBottom="20px" onPress={this.handleDismissal} title="Go to wallet" />
        </Wrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({
 wallet: { walletState, onboarding: { apiUser } },
 session: { data: session },
 user: { data: user },
  }) => ({
  walletState,
  apiUser,
  session,
  user,
});

const mapDispatchToProps = (dispatch) => ({
  validateUserDetails: (user: Object) => dispatch(validateUserDetailsAction(user)),
  registerOnBackend: () => dispatch(registerOnBackendAction()),
  getUserInfo: () => dispatch(getUserInfoAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(WelcomeBack);

// const mapStateToProps = ({
//   user: { data: user },
// }) => ({
//   user,
// });
//
// export default connect(mapStateToProps)(WelcomeBack);
