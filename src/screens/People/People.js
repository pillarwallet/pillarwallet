// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import debounce from 'lodash.debounce';
import styled from 'styled-components/native';
import t from 'tcomb-form-native';
import { usersSearchAction } from 'actions/userActions';
import { Container, ScrollWrapper } from 'components/Layout';
import Title from 'components/Title';
import TextInput from 'components/TextInput';


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


type Props = {
  searchForUsers: (query: string) => Function,
  searchResults: [],
}

type State = {
  formValue: ?{
    query: ?string,
  },
  formOptions: Object,
}

class PeopleScreen extends React.Component<Props, State> {
  _form: t.form;

  state = {
    formValue: null,
    formOptions: defaultFormOptions,
  };

  constructor(props: Props) {
    super(props);
    this.searchForUsers = debounce(this.searchForUsers, 500);
  }

  handleChange = (formValue: Object) => {
    this.setState({ formValue });
    this.searchForUsers(formValue.query);
  };

  searchForUsers = (query: string) => {
    this.props.searchForUsers(query);
  };

  render() {
    const { formValue, formOptions } = this.state;
    const { searchResults } = this.props;
    console.log('searchResults', searchResults);
    return (
      <Container>
        <ScrollWrapper regularPadding>
          <Title title="people" />
          <SearchForm
            innerRef={node => { this._form = node; }}
            type={formStructure}
            options={formOptions}
            value={formValue}
            onChange={this.handleChange}
          />
        </ScrollWrapper>
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
