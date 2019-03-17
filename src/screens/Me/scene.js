// @flow

import React from 'react';
import Header from 'components/Header';
import { Container } from 'components/Layout';
import { BaseText } from 'components/Typography';

type Props = {
  onSwitchPersona: Function,
};

const MeScene = (props: Props) => {
  const { onSwitchPersona } = props;

  return (
    <Container>
      <Header
        headerRightFlex="2"
        title="me"
        nextText="Switch persona"
        onNextPress={onSwitchPersona}
      />
      <BaseText style={{ marginBottom: 20 }}>HOLA</BaseText>
    </Container>
  );
};

export default MeScene;
