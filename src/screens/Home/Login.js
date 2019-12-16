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
import { View } from 'react-native';
import { connect } from 'react-redux';
import Header from 'components/Header';
import type { NavigationScreenProp } from 'react-navigation';

import type { Dispatch, RootReducerState } from 'reducers/rootReducer';

// components
import styled from 'styled-components/native';
import { Container, Wrapper } from 'components/Layout';
import { Paragraph, MediumText } from 'components/Typography';
import Spinner from 'components/Spinner';
import Button from 'components/Button';

// constants
import { PROFILE } from 'constants/navigationConstants';

// actions
import { approveLoginAttemptAction } from 'actions/deepLinkActions';
import { logScreenViewAction } from 'actions/analyticsActions';

// utils
import { baseColors, fontStyles, spacing } from 'utils/variables';

type Props = {
  navigation: NavigationScreenProp<*>,
  user: Object,
  approveLoginAttempt: (token: string) => void,
  logScreenView: (view: string, screen: string) => void,
};

type State = {
  loginPending: boolean,
};

const Description = styled(Paragraph)`
  text-align: center;
  padding-bottom: ${spacing.rhythm}px;
`;

const DescriptionWarning = styled(MediumText)`
  ${fontStyles.medium};
  color: ${baseColors.burningFire};
`;

export const LoadingSpinner = styled(Spinner)`
  padding: 10px;
  align-items: center;
  justify-content: center;
`;

class LoginScreen extends React.Component<Props, State> {
  state = {
    loginPending: false,
  };

  componentDidMount() {
    const { logScreenView } = this.props;
    logScreenView('Login request', 'Home');
  }

  onConfirmPress = (emailRequired: boolean) => {
    const {
      navigation,
      approveLoginAttempt,
    } = this.props;
    if (emailRequired) {
      navigation.navigate(PROFILE, { visibleModal: 'email' });
      return;
    }
    this.setState({ loginPending: true }, async () => {
      const loginAttemptToken = navigation.getParam('loginAttemptToken');
      await approveLoginAttempt(loginAttemptToken);
      this.setState({ loginPending: false });
    });
  };

  onBack = () => {
    const { navigation } = this.props;
    navigation.goBack(null);
  };

  render() {
    const { user } = this.props;
    const { loginPending } = this.state;
    const emailRequired = !user.email;
    const confirmButtonTitle = emailRequired
      ? 'Add your email'
      : 'Confirm login';
    return (
      <Container color={baseColors.white} inset={{ bottom: 0 }}>
        <Header
          title="confirm login"
          centerTitle
          onClose={this.onBack}
        />

        <Wrapper flex={1} center regularPadding>
          <View style={{ justifyContent: 'center', display: 'flex', alignItems: 'center' }}>
            <Description>
              You are about to confirm your login with your Pillar wallet to external resource.
            </Description>
            {emailRequired &&
              <DescriptionWarning>
                In order to proceed with Discourse login you must have email added to your profile.
              </DescriptionWarning>
            }
            {loginPending && <LoadingSpinner />}
            {!loginPending &&
              <Button
                title={confirmButtonTitle}
                onPress={() => this.onConfirmPress(emailRequired)}
                style={{ marginBottom: 13 }}
              />
            }
          </View>
        </Wrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({
  user: { data: user },
}: RootReducerState): $Shape<Props> => ({
  user,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  approveLoginAttempt: loginAttemptToken => dispatch(approveLoginAttemptAction(loginAttemptToken)),
  logScreenView: (view: string, screen: string) => dispatch(logScreenViewAction(view, screen)),
});

export default connect(mapStateToProps, mapDispatchToProps)(LoginScreen);
