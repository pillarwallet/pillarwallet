// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import * as React from 'react';
import { TextInput } from 'react-native';
import styled from 'styled-components/native';


type Input = {
  _id: number,
  value: string,
}

type Props = {
  length: number,
  onCodeFilled: Function,
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
    onCodeFilled: (x: string) => x,
  };

  state = {
    SMSCode: [],
  };

  inputs: Object = {};

  handleKeyPress = (e: any, id: number) => {
    const { key: value } = e.nativeEvent;
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
      const nextInputId = (id + 1) >= length ? length : (id + 1);
      updatedSMSCode = SMSCode.filter(({ _id }) => nextInputId !== _id).concat({ _id: nextInputId, value });
    }

    this.setState({
      SMSCode: updatedSMSCode,
    }, () => {
      let nextID = id + 1;
      if (value === BACKSPACE) {
        nextID = id - 1;
      }
      if (this.inputs[nextID]) {
        this.inputs[nextID].focus();
      }

      if (length === this.state.SMSCode.length) {
        const code = this.state.SMSCode.sort((a, b) => a._id - b._id).map(({ value: val }) => val).join('');
        onCodeFilled(code);
      }
    });
  };


  render() {
    const { length } = this.props;
    const smsInputs = Array(length)
      .fill('')
      .map((_, index) => index + 1)
      .map((id) => {
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
