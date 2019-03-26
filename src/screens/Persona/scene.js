// @flow

import React from 'react';
import { FlatList } from 'react-native';
import capitalize from 'lodash.capitalize';
import Header from 'components/Header';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import Separator from 'components/Separator';
import { Container, Footer } from 'components/Layout';
import Button from 'components/Button';
import { baseColors } from 'utils/variables';

type Props = {
  onCreatePersona: Function,
  onBack: Function,
};

const PersonaScene = (props: Props) => {
  const { onBack, onCreatePersona } = props;

  return (
    <Container>
      <Header
        centerTitle
        hasSeparator
        title="create persona"
        onBack={onBack}
      />

      <Footer>
        <Button
          marginBottom="20px"
          width="143px"
          onPress={onCreatePersona}
          title="Save"
        />
      </Footer>
    </Container>
  );
};

export default PersonaScene;
