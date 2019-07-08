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
import styled from 'styled-components/native';
import Header from 'components/Header';
import { Platform } from 'react-native';
import Title from 'components/Title';
import TextInput from 'components/TextInput';
import { Label, BoldText } from 'components/Typography';
import { fontSizes } from 'utils/variables';
import { Container, Footer, ScrollWrapper } from 'components/Layout';
import Button from 'components/Button';

const FooterWrapper = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0 20px;
  width: 100%;
`;

const LabeledRow = styled.View`
  margin: 10px 0;
`;

const Value = styled(BoldText)`
  font-size: ${fontSizes.medium}
`;

type Props = {
  goBack: () => void,
  formattedAmount: string,
  formattedFee: string,
  symbol: string,
  targetAddress: string,
  isOnline: boolean,
  recipientUsername?: string,
  onConfirm: () => void,
  onNoteChange?: (text: string) => void,
  note?: string,
};

type State = {
  scrollPos: number,
};

// TODO: make screens/SendToken/SendTokenConfirm use this component
class SendConfirm extends React.Component<Props, State> {
  scroll: Object;
  state = {
    scrollPos: 0,
  };

  constructor(props: Props) {
    super(props);
    this.scroll = React.createRef();
  }

  render() {
    const {
      symbol,
      goBack,
      formattedAmount,
      targetAddress,
      formattedFee,
      recipientUsername,
      onNoteChange,
      note,
      isOnline,
      onConfirm,
    } = this.props;
    const {
      scrollPos,
    } = this.state;

    return (
      <Container>
        <Header
          onBack={goBack}
          title="send"
          white
        />
        <ScrollWrapper
          regularPadding
          disableAutomaticScroll={Platform.OS === 'android'}
          innerRef={ref => { this.scroll = ref; }}
          onKeyboardWillShow={() => {
            if (Platform.OS === 'android') {
              this.scroll.scrollToPosition(0, scrollPos);
            }
          }}
        >
          <Title subtitle title="Review and Confirm" />
          <LabeledRow>
            <Label>Amount</Label>
            <Value>{formattedAmount} {symbol}</Value>
          </LabeledRow>
          {!!recipientUsername &&
          <LabeledRow>
            <Label>Recipient Username</Label>
            <Value>{recipientUsername}</Value>
          </LabeledRow>
          }
          <LabeledRow>
            <Label>Recipient Address</Label>
            <Value>{targetAddress}</Value>
          </LabeledRow>
          <LabeledRow>
            <Label>Est. Network Fee</Label>
            <Value>{formattedFee} {symbol}</Value>
          </LabeledRow>
          {!!recipientUsername && onNoteChange &&
          <TextInput
            inputProps={{
              onChange: (text) => onNoteChange(text),
              value: note,
              autoCapitalize: 'none',
              multiline: true,
              numberOfLines: 3,
              placeholder: 'Add a note to this transaction',
            }}
            inputType="secondary"
            labelBigger
            noBorder
            keyboardAvoidance
            onLayout={(e) => {
              const scrollPosition = e.nativeEvent.layout.y + 180;
              this.setState({ scrollPos: scrollPosition });
              }
            }
          />
          }
        </ScrollWrapper>
        <Footer keyboardVerticalOffset={40}>
          <FooterWrapper>
            <Button
              disabled={!isOnline}
              onPress={onConfirm}
              title="Confirm Transaction"
            />
          </FooterWrapper>
        </Footer>
      </Container>
    );
  }
}

export default SendConfirm;
