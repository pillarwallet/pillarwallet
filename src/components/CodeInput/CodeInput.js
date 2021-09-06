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

import React from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import styled from 'styled-components/native';

import { MediumText } from 'components/legacy/Typography';
import TextInput from 'components/Input';

import { themedColors } from 'utils/themes';
import { fontStyles, spacing } from 'utils/variables';
import { responsiveSize } from 'utils/ui';

// $FlowFixMe
import type { Event } from 'react-native';


type Props = {
  codeLength: number,
  inputProps?: Object,
  errorMessage?: ?string,
  onFilled?: (value: string) => void,
};

type State = {
  value: string,
  focused: boolean,
  focusLastOne: boolean,
};


const INPUT_SIDE = responsiveSize(56);
const FONT_SIZE = responsiveSize(36);

const Wrapper = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

const Row = styled.View`
  position: relative;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
`;

const FakeInput = styled.View`
  width: ${INPUT_SIDE}px;
  height: ${INPUT_SIDE}px;
  border-radius: 4px;
  margin: 5px;
  background-color: ${themedColors.tertiary};
  align-items: center;
  justify-content: center;
  border-width: 2px;
  border-color: ${({ focus }) => focus ? themedColors.primary : themedColors.tertiary};
`;

const InputValue = styled(MediumText)`
  color: ${themedColors.text};
  font-size: ${FONT_SIZE}px;
`;

const ErrorMessage = styled(MediumText)`
  color: ${themedColors.negative};
  ${fontStyles.regular};
  margin: ${spacing.small}px 0 ${spacing.medium}px;
`;

const StyledTextInput = styled(TextInput)`
  position: absolute;
  opacity: 0;
  top: 0;
  left: 0;
`;


export default class CodeInput extends React.Component<Props, State> {
  timeout: TimeoutID;

  static defaultProps = {
    codeLength: 1,
  };

  input: any = React.createRef();

  state = {
    value: '',
    focused: false,
    focusLastOne: false,
  };

  componentDidUpdate(prevProps: Props, prevState: State) {
    const { value } = this.state;
    const { onFilled, codeLength } = this.props;
    if (!!onFilled && prevState.value !== value && value.length === codeLength) {
      this.timeout = setTimeout(() => {
        onFilled(value);
        clearTimeout(this.timeout);
      }, 400);
    } else if (prevState.value !== value && !!this.timeout) {
      clearTimeout(this.timeout);
    }
  }

  componentWillUnmount() {
    clearTimeout(this.timeout);
  }

  handleClick = () => {
    const { current } = this.input;
    if (!current) return;
    current.focus();
  };

  onFocus = () => {
    const { codeLength } = this.props;
    const { value } = this.state;
    this.setState({ focused: true, focusLastOne: codeLength === value.length });
  };

  onBlur = () => {
    this.setState({ focused: false });
  };

  onKeyPress = (e: Event) => {
    const { value: currentValue } = this.state;
    if (e.nativeEvent.key === 'Backspace') {
      this.setState({ value: currentValue.slice(0, currentValue.length - 1), focusLastOne: false });
    }
  };

  onChange = (value: string) => {
    const { codeLength } = this.props;
    const { value: currentValue } = this.state;
    if (currentValue.length < codeLength) {
      const newValue = (currentValue + value).slice(0, codeLength);
      this.setState({ value: newValue });
    }
  };

  render() {
    const {
      value,
      focused,
      focusLastOne,
    } = this.state;
    const { codeLength, inputProps = {}, errorMessage } = this.props;
    const codeArray = new Array(codeLength).fill(0);
    const values = value.replace(/\s/g, '').split('');
    const valueLength = values.length;

    return (
      <Wrapper>
        <TouchableWithoutFeedback onPress={this.handleClick}>
          <Row>
            {codeArray.map((val, index) => {
              const selected = !focusLastOne ? valueLength === index : valueLength - 1 === index;
              return (
                <FakeInput focus={focused && selected} key={index.toString()}>
                  <InputValue>{values[index] || ''}</InputValue>
                </FakeInput>
              );
            })}
            <StyledTextInput
              {...inputProps}
              value=""
              ref={this.input}
              onChangeText={this.onChange}
              onKeyPress={this.onKeyPress}
              onFocus={this.onFocus}
              onBlur={this.onBlur}
              maxLength={1}
            />
          </Row>
        </TouchableWithoutFeedback>
        {!!errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
      </Wrapper>
    );
  }
}
