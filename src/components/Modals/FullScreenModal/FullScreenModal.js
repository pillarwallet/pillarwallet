// @flow
import * as React from 'react';

import type { NavigationScreenProp } from 'react-navigation';
import { Container } from 'components/Layout';
import ModalHeader from 'components/ModalHeader';

type Props = {
  navigation: NavigationScreenProp<*>,
  children?: React.Node,
}

const FullScreenModal = (props: Props) => {
  return (
    <Container>
      <ModalHeader onClose={() => props.navigation.goBack(null)} />
      {props.children}
    </Container>
  );
};

export default FullScreenModal;
