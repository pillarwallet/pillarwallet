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
  personas: Array,
  onActivatePersona: Function,
  onCreatePersona: Function,
  onBack: Function,
};

const PersonasScene = (props: Props) => {
  const { onBack, onActivatePersona, onCreatePersona, personas } = props;

  return (
    <Container>
      <Header
        centerTitle
        title="personas"
        onBack={onBack}
        style={{
          borderBottomWidth: 1,
          borderBottomColor: baseColors.mediumLightGray,
        }}
      />

      <FlatList
        data={personas}
        renderItem={({ item }) => (
          <ListItemWithImage
            label={item.alias}
            onPress={() => onActivatePersona(item.id)}
          />
        )}
        ItemSeparatorComponent={() => <Separator spaceOnLeft={82} />}
        keyboardShouldPersistTaps="handled"
      />

      <Footer>
        <Button
          block
          marginBottom="20px"
          onPress={onCreatePersona}
          title="Create new persona"
        />
      </Footer>
    </Container>
  );
};

export default PersonasScene;
