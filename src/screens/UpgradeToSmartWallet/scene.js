// @flow

import React from 'react';
import Header from 'components/Header';
import { Container, Footer } from 'components/Layout';
import Button from 'components/Button';
import * as styled from './styles';

type Props = {
  onUpgrade: Function,
  onBack: Function,
};

const PersonasScene = (props: Props) => {
  const { onBack, onUpgrade } = props;

  return (
    <Container>
      <Header
        centerTitle
        hasSeparator
        title="premium"
        onBack={onBack}
      />

      <styled.DetailBox>
        <styled.Detail>
          By upgrading to Premium you will unlock the ability to create multiple personas.{'\n'}Manage all funds from smart contract, etc.
        </styled.Detail>
      </styled.DetailBox>

      <Footer>
        <Button
          block
          marginBottom="20px"
          onPress={onUpgrade}
          title="Upgrade"
        />
      </Footer>
    </Container>
  );
};

export default PersonasScene;

