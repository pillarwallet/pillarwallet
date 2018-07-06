// @flow
import * as React from 'react';

import type { NavigationScreenProp } from 'react-navigation';
import { Container } from 'components/Layout';
import ModalScreenHeader from 'components/ModalScreenHeader';
import CheckPin from 'components/CheckPin';
import { CHANGE_PIN_NEW_PIN } from 'constants/navigationConstants';

type Props = {
  navigation: NavigationScreenProp<*>,
}

export default class CurrentPin extends React.Component<Props> {
  handleScreenDismissal = () => {
    this.props.navigation.goBack(null);
  };

  render() {
    const { navigation } = this.props;

    return (
      <React.Fragment>
        <ModalScreenHeader onClose={this.handleScreenDismissal} />
        <Container>
          <CheckPin
            onPinValid={() => navigation.navigate(CHANGE_PIN_NEW_PIN)}
            title="enter current pincode"
          />
        </Container>
      </React.Fragment>
    );
  }
}
