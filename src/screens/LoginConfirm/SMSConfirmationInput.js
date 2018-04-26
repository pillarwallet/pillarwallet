// @flow
import * as React from 'react';
import styled from 'styled-components';

type State = {
  SMSCode: Array<number>,
  SMSCodeInputList: Array<Object>
}

const SMSCodeInputs = ['input1', 'input2', 'input3', 'input4'];

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
    SMSCodeInputList: [],
  }

  componentDidMount() {
    this.generateSMSCodeInputComponents();
  }


  inputCodeNumber(codeNumber: number) {
    this.setState({
      SMSCode: [...this.state.SMSCode, codeNumber],
    });
  }

  generateSMSCodeInputComponents = () => {
    const newSMSCodeInputList = [];
    SMSCodeInputs.forEach((input, index) => {
      newSMSCodeInputList.push(
        <SMSCodeInput
          value={this.state.SMSCode[index]}
          keyboardType="phone-pad"
          maxLength={1}
          key={input}
          onChangeText={(codeNumber) => this.inputCodeNumber(codeNumber)}
        />,
      );
    });
    this.setState({
      SMSCodeInputList: newSMSCodeInputList,
    });
  };

  render() {
    return (
      <SMSCodeInputWrapper>
        {this.state.SMSCodeInputList}
      </SMSCodeInputWrapper>
    );
  }
}
