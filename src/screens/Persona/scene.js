// @flow

import React, { Component } from 'react';
import { FlatList, View } from 'react-native';
import capitalize from 'lodash.capitalize';
import clone from 'lodash.clone';
import findIndex from 'lodash.findindex';
import filter from 'lodash.filter';
import Header from 'components/Header';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import InputSwitchItem from 'components/ListItem/ListItemInputSwitch';
import Separator from 'components/Separator';
import { Container, Footer } from 'components/Layout';
import Button from 'components/Button';
import { baseColors } from 'utils/variables';
import * as styled from './styles';

type Props = {
  onSavePersona: Function,
  onBack: Function,
  persona?: Object,
};

class PersonaScene extends Component {
  constructor(props) {
    super(props);

    this.state = {
      persona: props.persona,
    };
  }

  updatePersonaDetail = (objectToUpdate) => {
    const persona = clone(this.state.persona);

    const detailIndexToUpdate = findIndex(persona.details, { key: objectToUpdate.key });
    const detailToUpdate = Object.assign({}, persona.details[detailIndexToUpdate], objectToUpdate);

    persona.details[detailIndexToUpdate] = detailToUpdate;

    this.setState({ persona });
  };

  backToScreen = () => {
    const { onBack, onSavePersona } = this.props;
    const { persona } = this.state;

    if (persona.id) {
      onSavePersona(persona);
    }

    onBack();
  }

  render() {
    const { onSavePersona } = this.props;
    const { persona: { id, details: personaData } } = this.state;

    const createDetail = !id ? (
      <styled.DetailView>
        <styled.Detail>
          Fill in the details and set visibility settings for each piece of data.
        </styled.Detail>
        <styled.VisibleLabel>
          Make visible
        </styled.VisibleLabel>
      </styled.DetailView>
    ) : null;

    const saveButton = !id ? (
      <Footer>
        <Button
          marginBottom="20px"
          width="143px"
          onPress={onSavePersona}
          title="Save"
        />
      </Footer>
    ) : null;

    const screenTitle = !id ? 'create persona' : filter(personaData, { key: 'username' })[0].value;

    return (
      <Container>
        <Header
          centerTitle
          hasSeparator
          title={screenTitle}
          onBack={this.backToScreen}
          style={{ marginBottom: 20 }}
        />
        <Container
          color={baseColors.lighterGray}
          inset={{
            top: 'never',
          }}
        >
            {createDetail}

            <FlatList
              data={personaData}
              renderItem={({ item }) => {
                const { key, value, isVisible } = item;
                return (
                  <InputSwitchItem
                    key={key}
                    inputProps={{
                      value,
                      label: key,
                      onChange: (newValue) => this.updatePersonaDetail({ key, value: newValue })
                    }}
                    switchProps={{
                      switchStatus: isVisible,
                      onPress: () => this.updatePersonaDetail({ key, isVisible: !isVisible })
                    }}
                  />
                );
              }}
              keyboardShouldPersistTaps="handled"
              ItemSeparatorComponent={() => <View style={{ margin: 16 }} />}
            />

            {saveButton}
          </Container>
      </Container>
    );
  }
}

PersonaScene.defaultProps = {
  persona: {},
};

export default PersonaScene;
