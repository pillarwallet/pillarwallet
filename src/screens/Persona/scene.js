// @flow

import React, { Component } from 'react';
import t from 'tcomb-form-native';
import capitalize from 'lodash.capitalize';
import clone from 'lodash.clone';
import findIndex from 'lodash.findindex';
import filter from 'lodash.filter';
import forEach from 'lodash.foreach';
import partition from 'lodash.partition';
import map from 'lodash.map';
import Header from 'components/Header';
import SlideModal from 'components/Modals/SlideModal';
import CountrySelect from 'components/CountrySelect';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import SettingsItem from 'components/ListItem/SettingsItem';
import Separator from 'components/Separator';
import { Container, ScrollWrapper, Wrapper, Footer } from 'components/Layout';
import Button from 'components/Button';
import { InputSwitchTemplate, Form } from 'components/ProfileForm';
import {
  UsernameStruct,
  NameStruct,
  EmailStruct,
  PhoneStruct,
  CountryStruct,
  CityStruct,
  getFormStructure,
} from 'components/ProfileForm/profileFormDefs';
import { baseColors } from 'utils/variables';
import * as styled from './styles';

type Props = {
  onSavePersona: Function,
  onBack: Function,
  onGetHelp: Function,
  persona?: Object,
};

const usernameFormFields = [{
  name: 'username',
  type: 'username',
  config: { autoCapitalize: 'none', error: 'Please specify valid username' },
}];

const personaFormFields = [
  {
    name: 'name',
    type: 'name',
    config: { autoCapitalize: 'none', error: 'Please specify valid name' },
  },
  {
    name: 'email',
    type: 'email',
    config: { autoCapitalize: 'none', error: 'Please specify valid email' },
  },
  {
    name: 'phone',
    type: 'phone',
    config: { autoCapitalize: 'none', error: 'Please specify valid phone' },
  },
  {
    name: 'country',
    type: 'country',
    config: { autoCapitalize: 'words', error: 'Please specify valid country' },
  },
  {
    name: 'city',
    type: 'city',
    config: { autoCapitalize: 'words', error: 'Please specify valid city' },
  },
];

const defaultTypes = {
  username: UsernameStruct,
  name: t.maybe(NameStruct),
  email: t.maybe(EmailStruct),
  phone: t.maybe(PhoneStruct),
  country: t.maybe(CountryStruct),
  city: t.maybe(CityStruct),
};

const generateFormOptions = (fields: Field[], personaProps): Object => {
  const options = fields.reduce((memo, field) => {
    const propsToUse = filter(personaProps, { key: field.name })[0] || {};
    const { fieldDetails, inputProps, switchProps } = propsToUse;

    memo[field.name] = {
      template: InputSwitchTemplate,
      config: {
        ...field.config,
        fieldDetails,
        inputProps,
        switchProps,
        marginTop: 11,
        marginBottom: field.name === 'username' ? 22 : 11,
      },
    };

    return memo;
  }, {});

  return {
    fields: {
      ...options,
    },
  };
};

class PersonaScene extends Component {
  constructor(props) {
    super(props);

    this._usernameForm = clone(t.form);
    this._personaForm = clone(t.form);

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
    const { onBack } = this.props;
    const { persona } = this.state;

    if (persona.id) {
      this.handleSubmit();
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
      label: capitalize(key),
      onSelect: () => this.toggleSlideModal(),
    } : {
      value,
      label: capitalize(key),
      onChange: (newValue) => this.updatePersonaDetail({ key, value: newValue }),
    }
  );

  handleSubmit = () => {
    const { onSavePersona } = this.props;
    const { persona } = this.state;

    const usernameValidation = this._usernameForm.getValue();
    const personaValidation = this._personaForm.getValue();

    if (!usernameValidation || !personaValidation) return;

    onSavePersona(persona);
  };

  personaForm(details, formFields) {
    const { persona: { id } } = this.state;
    const propsToUse = map(details, ({ key, value, isVisible, isVerified }) => (
      {
        key,
        fieldDetails: {
          isVerified,
          includeVerified: !!id,
          disabledInput: id && key === 'username',
          inputType: key === 'country' ? 'Select' : null,
        },
        inputProps: this.personaInputProps({ key, value }),
        switchProps: {
          switchStatus: isVisible,
          onPress: () => this.updatePersonaDetail({ key, isVisible: !isVisible }),
        },
      }
    ));

    const inputProps = this.personaInputProps({ key: 'username', value: 'foo' })
    const switchProps = {
      switchStatus: false,
      onPress: () => this.updatePersonaDetail({ key: 'username', isVisible: false }),
    };

    const formOptions = generateFormOptions(formFields, propsToUse);
    const formStructure = getFormStructure(formFields, defaultTypes);

    return { formOptions, formStructure };
  }

  render() {
    const { persona: { id, details: personaData }, isModalVisible } = this.state;
    const { onGetHelp } = this.props;

    const [personaDetails, usernameDetails] = partition(personaData, (data) => data.key !== 'username');

    const {
      formStructure: usernameFormStructure,
      formOptions: usernameFormOptions,
    } = this.personaForm(usernameDetails, usernameFormFields);

    const {
      formStructure: personaFormStructure,
      formOptions: personaFormOptions,
    } = this.personaForm(personaDetails, personaFormFields);

    const createDetail = !id ? (
      <styled.Detail>
        Fill in the details and set visibility settings for each piece of data.
      </styled.Detail>
    ) : null;

    const personaDetailValues = {};
    forEach(personaDetails, ({ key, value }) => {
      personaDetailValues[key] = value;
    });

    const saveButton = !id ? (
      <Footer>
        <Button
          marginBottom="20px"
          width="143px"
          onPress={this.handleSubmit}
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
          nextText="Get help"
          onNextPress={onGetHelp}
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
          <ScrollWrapper>
            <styled.DetailView>
              {createDetail}
              <styled.VisibleLabel>
                Discoverable in search
              </styled.VisibleLabel>
            </styled.DetailView>

            <Form
              ref={node => { this._usernameForm = node; }}
              type={usernameFormStructure}
              options={usernameFormOptions}
              value={{ username: usernameDetails[0].value }}
            />

            <styled.DetailView>
              <styled.VisibleLabel>
                Visible in your profile
              </styled.VisibleLabel>
            </styled.DetailView>

            <Form
              ref={node => { this._personaForm = node; }}
              type={personaFormStructure}
              options={personaFormOptions}
              value={personaDetailValues}
            />
          </ScrollWrapper>

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
