// @flow
import * as React from 'react';
import { TextInput } from 'react-native';
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

export default class SMSConfirmationInput extends React.Component<{}, State> {

  static defaultProps = {
    length: 4,
  }

  state = {
    SMSCode: [],
  }

  inputs: Object = {}

  handleKeyPress = (e: any, id: number) => {
    let { key: value } = e.nativeEvent;
    const { SMSCode } = this.state;
    const { length } = this.props;
    const currentInput = SMSCode.filter(({ _id }) => _id === id)[0];
    const isCurrentInputFilled = currentInput && !!currentInput.value;
    let updatedSMSCode = SMSCode.filter(({ _id }) => id !== _id).concat({ _id: id, value });
    if (BACKSPACE === value) {
      updatedSMSCode = SMSCode.filter(({ _id }) => id !== _id);
    }
    if (isCurrentInputFilled && BACKSPACE !== value) {
      let nextInputId = (id + 1) >= length ? length : (id + 1);
      updatedSMSCode = SMSCode.concat({ _id: nextInputId, value });      
    }

    this.setState({
      SMSCode: updatedSMSCode
    }, () => {
      const nextID = value === BACKSPACE ? id - 1 : id + 1;
      this.inputs[nextID] && this.inputs[nextID].focus();
      if (length === this.state.SMSCode.length) {
        let code = this.state.SMSCode.sort((a,b) => a._id - b._id).map(({ value }) => value).join('')
      }
    });
  }


  render() {
    const { length } = this.props; 
    const smsInputs = Array(length)
      .fill('')
      .map((_, index) => index + 1)
      .map((id, index) => {
        const input = this.state.SMSCode.filter(({ _id }) => _id === id)[0] || {};
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
