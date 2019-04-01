// @flow

import React, { Component } from 'react';
import { FlatList, View } from 'react-native';
import capitalize from 'lodash.capitalize';
import clone from 'lodash.clone';
import findIndex from 'lodash.findindex';
import filter from 'lodash.filter';
import Header from 'components/Header';
import SlideModal from 'components/Modals/SlideModal';
import CountrySelect from 'components/CountrySelect';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import InputSwitchItem from 'components/ListItem/ListItemInputSwitch';
import SettingsItem from 'components/ListItem/SettingsItem';
import Separator from 'components/Separator';
import { Container, Wrapper, Footer } from 'components/Layout';
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
      isModalVisible: false,
    };
  }

  updatePersonaDetail = (objectToUpdate, shouldCloseModal = false) => {
    const persona = clone(this.state.persona);

    const detailIndexToUpdate = findIndex(persona.details, { key: objectToUpdate.key });
    const detailToUpdate = Object.assign({}, persona.details[detailIndexToUpdate], objectToUpdate);

    persona.details[detailIndexToUpdate] = detailToUpdate;

    if (shouldCloseModal) {
      this.setState({
        persona,
        isModalVisible: false,
      });
    } else {
      this.setState({ persona });
    }
  };

  backToScreen = () => {
    const { onBack, onSavePersona } = this.props;
    const { persona } = this.state;

    if (persona.id) {
      onSavePersona(persona);
    }

    onBack();
  }

  toggleSlideModal = () => {
    this.setState({ isModalVisible: !this.state.isModalVisible });
  };

  renderListItem = (field: string) => ({ item: { name } }: Object) => (
    <SettingsItem
      key={name}
      label={name}
      onPress={() => {
        this.updatePersonaDetail({ key: 'country', value: name }, true)
      }}
    />
  );

  personaInputProps = ({ key, value }) => (
    key === 'country' ? {
      value,
      label: key,
      onSelect: () => this.toggleSlideModal(),
    } : {
      value,
      label: key,
      onChange: (newValue) => this.updatePersonaDetail({ key, value: newValue }),
    }
  );

  render() {
    const { onSavePersona } = this.props;
    const { persona: { id, details: personaData }, isModalVisible } = this.state;

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

        <SlideModal
          fullScreen
          showHeader
          avoidKeyboard
          isVisible={isModalVisible}
          onModalHide={this.toggleSlideModal}
          backgroundColor={baseColors.lightGray}
        >
          <Wrapper flex={1}>
            <styled.ModalTitle extraHorizontalSpacing>
              Choose your country
            </styled.ModalTitle>
            <CountrySelect
              renderItem={this.renderListItem('country')}
            />
          </Wrapper>
        </SlideModal>

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
                    inputType={key === 'country' ? 'Select' : null}
                    inputProps={this.personaInputProps({ key, value })}
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
