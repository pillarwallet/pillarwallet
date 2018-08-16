// @flow
import * as React from 'react';
import type { NavigationScreenProp } from 'react-navigation';
import { Container } from 'components/Layout';
import Header from 'components/Header';
import CheckPin from 'components/CheckPin';
import { CHANGE_PIN_NEW_PIN } from 'constants/navigationConstants';

type Props = {
  navigation: NavigationScreenProp<*>,
}

export default class CurrentPin extends React.Component<Props> {
  handleScreenDismissal = () => {
    this.props.navigation.dismiss();
  };

  render() {
    const { navigation } = this.props;

    return (
      <Container>
        <Header
          title="enter current pincode"
          centerTitle
          onClose={this.handleScreenDismissal}
        />
        <CheckPin
          onPinValid={() => navigation.navigate(CHANGE_PIN_NEW_PIN)}
        />
      </Container>
    );
  }
}
