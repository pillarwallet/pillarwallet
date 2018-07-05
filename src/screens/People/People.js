// @flow
import * as React from 'react';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import debounce from 'lodash.debounce';
// import styled from 'styled-components/native';
import t from 'tcomb-form-native';
import { usersSearchAction } from 'actions/userActions';
import { CONTACT } from 'constants/navigationConstants';
import { Container, Wrapper, ScrollWrapper } from 'components/Layout';
import Title from 'components/Title';
import ContactCard from 'components/ContactCard';
import SearchBar from 'components/SearchBar';

/*
const { Form } = t.form;
const SearchForm = styled(Form)`
  margin: 10px 0 40px;
`;

function InputTemplate(locals: any) {
  const errorMessage = locals.error;
  const inputProps = {
    onChange: locals.onChange,
    onBlur: locals.onBlur,
    value: locals.value,
    keyboardType: locals.keyboardType,
    style: {
      fontSize: 24,
      lineHeight: 0,
    },
    ...locals.config.inputProps,
  };

  return (
    <TextInput
      errorMessage={errorMessage}
      id={locals.label}
      label={locals.label}
      inputProps={inputProps}
    />
  );
}

const formStructure = t.struct({
  query: t.String,
});

const defaultFormOptions = {
  fields: {
    query: {
      template: InputTemplate,
      config: {
        inputProps: {
          autoCapitalize: 'none',
        },
      },
    },
  },
};
*/

type Props = {
  navigation: NavigationScreenProp<*>,
  searchForUsers: (query: string) => Function,
  searchResults: [],
}

type State = {
  query: string,
  // formOptions: Object,
}

class PeopleScreen extends React.Component<Props, State> {
  _form: t.form;

  state = {
    query: '',
    // formOptions: defaultFormOptions,
  };

  constructor(props: Props) {
    super(props);
    this.searchForUsers = debounce(this.searchForUsers, 500);
  }

  handleSearchChange = (formValue: any) => {
    console.log('formValue', formValue);
    // this.setState({ formValue });
    // this.searchForUsers(formValue.query);
  };

  searchForUsers = (query: string) => {
    this.props.searchForUsers(query);
  };

  handleContactCardPress = () => {
    this.props.navigation.navigate(CONTACT);
  };

  render() {
    const { query } = this.state;
    const { searchResults } = this.props;
    console.log('searchResults', searchResults);
    return (
      <Container>
        <Wrapper regularPadding>
          <Title title="people" />
          <SearchBar
            inputProps={{
              onChange: this.handleSearchChange,
              value: query,
            }}
          />
          <ScrollWrapper>
            <ContactCard onPress={this.handleContactCardPress} />
            <ContactCard onPress={this.handleContactCardPress} />
            <ContactCard onPress={this.handleContactCardPress} />
            <ContactCard onPress={this.handleContactCardPress} />
            <ContactCard onPress={this.handleContactCardPress} />
            <ContactCard onPress={this.handleContactCardPress} />
            <ContactCard onPress={this.handleContactCardPress} />
            <ContactCard onPress={this.handleContactCardPress} />
            <ContactCard onPress={this.handleContactCardPress} />
            <ContactCard onPress={this.handleContactCardPress} />
            <ContactCard onPress={this.handleContactCardPress} />
            <ContactCard onPress={this.handleContactCardPress} />
            <ContactCard onPress={this.handleContactCardPress} />
            <ContactCard onPress={this.handleContactCardPress} />
            <ContactCard onPress={this.handleContactCardPress} />
            <ContactCard onPress={this.handleContactCardPress} />
          </ScrollWrapper>
        </Wrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({ user: { searchResults } }) => ({
  searchResults,
});

const mapDispatchToProps = (dispatch: Function) => ({
  searchForUsers: (query) => dispatch(usersSearchAction(query)),
});

export default connect(mapStateToProps, mapDispatchToProps)(PeopleScreen);
