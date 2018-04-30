// @flow
import * as React from 'react';
import { TextInput } from 'react-native';
import styled from 'styled-components';


type Input = {
  _id: number,
  value: string
}

type Props = {
  length: number,
  onCodeFilled: Function
}

type State = {
  SMSCode: Input[],
}

const SMSCodeInputWrapper = styled.View`
  width: 240px;
  flex-direction: row;
  justify-content: space-around;
  margin: 20px 0;
`;

const SMSCodeInput = styled(TextInput)`
  flex: 0 0 40px;
  height: 40px;
  text-align: center;
  border-bottom-width: 2px;
  border-color: rgb(155, 155, 155);
  font-size: 24px;
`;

const BACKSPACE = 'Backspace';
const EMPTY_STRING = '';

export default class SMSConfirmationInput extends React.Component<Props, State> {

  static defaultProps = {
    length: 4,
    onCodeFilled: (x: string) => x
  }

  state = {
    SMSCode: [],
  }

  inputs: Object = {}

  handleKeyPress = (e: any, id: number) => {
    let { key: value } = e.nativeEvent;
    const { SMSCode } = this.state;
    const { length, onCodeFilled } = this.props;
    const currentInput = SMSCode.find(({ _id }) => _id === id);
    const isCurrentInputFilled = currentInput && !!currentInput.value;
    let updatedSMSCode = SMSCode.filter(({ _id }) => id !== _id).concat({ _id: id, value });

    // remove value on backspace
    if (BACKSPACE === value) {
      updatedSMSCode = SMSCode.filter(({ _id }) => id !== _id);
    }
    
    // if current input value is filled update the next one
    if (isCurrentInputFilled && BACKSPACE !== value) {
      let nextInputId = (id + 1) >= length ? length : (id + 1);
      updatedSMSCode = SMSCode.filter(({ _id }) => nextInputId !== _id).concat({ _id: nextInputId, value });      
    }

    this.setState({
      SMSCode: updatedSMSCode
    }, () => {
      const nextID = value === BACKSPACE ? id - 1 : id + 1;
      this.inputs[nextID] && this.inputs[nextID].focus();
      if (length === this.state.SMSCode.length) {
        let code = this.state.SMSCode.sort((a,b) => a._id - b._id).map(({ value }) => value).join('')
        onCodeFilled(code);
      }
    });
  }


  render() {
    const { length } = this.props; 
    const smsInputs = Array(length)
      .fill('')
      .map((_, index) => index + 1)
      .map((id, index) => {
        const input = this.state.SMSCode.find(({ _id }) => _id === id) || {};
        const value = input.value || EMPTY_STRING;
        return (
          <SMSCodeInput
            innerRef={(node) => { this.inputs[id] = node; }}
            value={value}
            onKeyPress={(e) => this.handleKeyPress(e, id)}
            keyboardType="number-pad"
            maxLength={1}
            key={id}
          />
        );
    });

    return (
      <SMSCodeInputWrapper>
        {smsInputs}
      </SMSCodeInputWrapper>
    );
  }
}
