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

import { MediumText } from 'components/Typography';

import { themedColors } from 'utils/themes';
import { fontStyles, spacing } from 'utils/variables';
import { responsiveSize } from 'utils/ui';

import type { Event } from 'react-native';


type Position = {
  x: number,
  y: number,
};

type Props = {
  codeLength: number,
  inputProps?: Object,
  errorMessage?: ?string,
};

type State = {
  value: string,
  focused: boolean,
  inputPositions: Position[],
  focusLastOne: boolean,
};


const INPUT_SIDE = responsiveSize(46);
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

const StyledTextInput = styled.TextInput`
  position: absolute;
  color: ${themedColors.text};
  font-size: ${FONT_SIZE}px;
  text-align: center;
  width: ${INPUT_SIDE}px;
  height: ${INPUT_SIDE}px;
  padding: 0;
`;


export default class CodeInput extends React.Component<Props, State> {
  static defaultProps = {
    codeLength: 1,
  };

  input = React.createRef();

  state = {
    value: '',
    focused: false,
    inputPositions: [],
    focusLastOne: false,
  };

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
    const { codeLength, inputProps = {} } = this.props;
    const { onChange } = inputProps;
    const { value: currentValue } = this.state;
    if (currentValue.length < codeLength) {
      const newValue = (currentValue + value).slice(0, codeLength);
      this.setState({ value: newValue });
      if (onChange) onChange(newValue);
    }
  };

  setInputPosition = (pos: Position) => {
    const { inputPositions } = this.state;
    const updatedInputPositions = [...inputPositions, pos];
    this.setState({ inputPositions: updatedInputPositions });
  };

  render() {
    const {
      value,
      focused,
      inputPositions,
      focusLastOne,
    } = this.state;
    const { codeLength, inputProps = {}, errorMessage } = this.props;
    const codeArray = new Array(codeLength).fill(0);
    const values = value.replace(/\s/g, '').split('');
    const valueLength = values.length;
    const selectedIndex = valueLength < codeLength ? valueLength : codeLength - 1;
    const hideInput = valueLength > codeLength;
    const { x, y } = inputPositions[selectedIndex] || {};

    return (
      <Wrapper>
        <TouchableWithoutFeedback onPress={this.handleClick}>
          <Row>
            {codeArray.map((val, index) => {
              const selected = !focusLastOne ? valueLength === index : valueLength - 1 === index;
              return (
                <FakeInput
                  onLayout={({ nativeEvent }) => {
                    this.setInputPosition({
                      x: nativeEvent.layout.x,
                      y: nativeEvent.layout.y,
                    });
                  }}
                  focus={focused && selected}
                  key={index.toString()}
                >
                  <InputValue>{values[index] || ''}</InputValue>
                </FakeInput>
              );
            })}
            <StyledTextInput
              {...inputProps}
              value=""
              innerRef={this.input}
              onChangeText={this.onChange}
              onKeyPress={this.onKeyPress}
              onFocus={this.onFocus}
              onBlur={this.onBlur}
              style={{
                left: x,
                top: y,
                opacity: hideInput ? 0 : 1,
              }}
              maxLength={1}
            />
          </Row>
        </TouchableWithoutFeedback>
        {!!errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
      </Wrapper>
    );
  }
}
