// @flow
import * as React from 'react';
import styled from 'styled-components';


type State = {
  SMSCode: Array<string>,
}

const SMSCodeInputWrapper = styled.View`
  width: 240px;
  flex-direction: row;
  justify-content: space-around;
  margin: 20px 0;
`;

const SMSCodeInput = styled.TextInput`
  flex: 0 0 40px;
  height: 40px;
  text-align: center;
  border-bottom-width: 2px;
  border-color: rgb(155, 155, 155);
  font-size: 24px;
`;

export default class SMSConfirmationInput extends React.Component<{}, State> {
  state = {
    SMSCode: [],
  }

  inputs: Object = {}

  handleChange = (id: string, value: string) => {
    this.setState({
      SMSCode: this.state.SMSCode.concat(value),
    }, () => {
      const nextId = id + 1;
      this.inputs[nextId].focus();
    });
  }

  render() {
    const smsInputs = [1, 2, 3, 4]
      .map((id, index) => (
        <SMSCodeInput
          innerRef={(node) => { this.inputs[id] = node; }}
          value={this.state.SMSCode[index]}
          onChangeText={(value) => this.handleChange(id, value) }
          keyboardType="phone-pad"
          maxLength={1}
          key={id}
        />
      ));

    return (
      <SMSCodeInputWrapper>
        {smsInputs}
      </SMSCodeInputWrapper>
    );
  }
}
