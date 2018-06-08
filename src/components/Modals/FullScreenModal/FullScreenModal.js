// @flow
import * as React from 'react';

import type { NavigationScreenProp } from 'react-navigation';
import { Container, ScrollWrapper } from 'components/Layout';
import { CloseButton } from 'components/Button/CloseButton';
import { UIColors } from 'utils/variables';

type Props = {
  navigation: NavigationScreenProp<*>,
  children?: React.Node,
}

const FullScreenModal = (props: Props) => {
  return (
    <Container>
      <ScrollWrapper padding>
        <CloseButton
          icon="md-close"
          onPress={() => props.navigation.goBack(null)}
          color={UIColors.primary}
          fontSize={32}
        />
        {props.children}
      </ScrollWrapper>
    </Container>
  );
};

export default FullScreenModal;
