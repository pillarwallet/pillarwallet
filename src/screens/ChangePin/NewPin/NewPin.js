// @flow
import * as React from 'react';
import type { NavigationScreenProp } from 'react-navigation';
import { Container } from 'components/Layout';
import Header from 'components/Header';
import { CHANGE_PIN_CONFIRM_NEW_PIN } from 'constants/navigationConstants';
import CheckPin from 'components/CheckPin';

type Props = {
  navigation: NavigationScreenProp<*>,
  pin: string,
}

export default class NewPin extends React.Component<Props> {
  handleScreenDismissal = () => {
    this.props.navigation.dismiss();
  };

  render() {
    const { navigation, pin } = this.props;
    return (
      <Container>
        <Header
          title="enter new pincode"
          centerTitle
          onClose={this.handleScreenDismissal}
        />
        <CheckPin
          checkExisting
          onPinValid={() => navigation.navigate(CHANGE_PIN_CONFIRM_NEW_PIN, { pin })}
        />
      </Container>
    );
  }
}
