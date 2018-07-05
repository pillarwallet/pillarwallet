// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import debounce from 'lodash.debounce';
import styled from 'styled-components/native';
import t from 'tcomb-form-native';
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
    },
  },
};


type Props = {
}

type State = {
  value: ?{
    query: ?string,
  },
  formOptions: Object,
}

class PeopleScreen extends React.Component<Props, State> {
  _form: t.form;

  state = {
    value: null,
    formOptions: defaultFormOptions,
  };

  constructor(props: Props) {
    super(props);
    this.searchForUser = debounce(this.searchForUser, 500);
  }

  handleChange = (value: Object) => {
    this.setState({ value });
    this.searchForUser(value.query);
  };

  searchForUser = (query: string) => {
    // this.props.searchForUser(query);
  };

  render() {
    const { value, formOptions } = this.state;
    return (
      <Container>
        <ScrollWrapper regularPadding>
          <Title title="people" />
          <SearchForm
            innerRef={node => { this._form = node; }}
            type={formStructure}
            options={formOptions}
            value={value}
            onChange={this.handleChange}
          />
        </ScrollWrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({
}) => ({
});

const mapDispatchToProps = (dispatch: Function) => ({
});

export default connect(mapStateToProps, mapDispatchToProps)(PeopleScreen);
