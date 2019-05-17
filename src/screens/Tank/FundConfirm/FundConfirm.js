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
import { Keyboard } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { utils } from 'ethers';
import { Container, Footer, ScrollWrapper } from 'components/Layout';
import { Label, BoldText } from 'components/Typography';
import Button from 'components/Button';
import Header from 'components/Header';
import TextInput from 'components/TextInput';
import Toast from 'components/Toast';
import { fontSizes } from 'utils/variables';
import { fundTankAction } from 'actions/tankActions';

type Props = {
  navigation: NavigationScreenProp<*>,
  session: Object,
  fundTank: Function,
};

type State = {
  note: ?string,
  scrollPos: number,
};

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

class FundConfirm extends React.Component<Props, State> {
  scroll: Object;

  constructor(props) {
    super(props);
    this.scroll = React.createRef();
    this.state = {
      note: null,
      scrollPos: 0,
    };
  }

  handleFormSubmit = () => {
    Keyboard.dismiss();
    const { navigation, fundTank } = this.props;
    const { amount } = navigation.getParam('transactionPayload', {});
    // const transactionPayload = { ...navigation.getParam('transactionPayload', {}), note: this.state.note };
    // TODO: add fund function
    navigation.dismiss();
    fundTank(parseInt(amount, 10));
    Toast.show({
      message: 'Your Pillar Tank has been funded',
      type: 'success',
      title: 'Success',
      autoClose: true,
    });
  };

  handleNoteChange(text) {
    this.setState({ note: text });
  }

  render() {
    const { scrollPos } = this.state;
    const { session, navigation } = this.props;
    const {
      amount,
      txFeeInWei,
      symbol,
    } = navigation.getParam('transactionPayload', {});

    return (
      <Container>
        <Header
          onBack={() => this.props.navigation.goBack(null)}
          title="review"
          white
        />
        <ScrollWrapper
          regularPadding
          disableAutomaticScroll
          innerRef={ref => { this.scroll = ref; }}
          onKeyboardWillShow={() => {
            this.scroll.scrollToPosition(0, scrollPos);
          }}
          contentContainerStyle={{ marginTop: 40 }}
        >
          <LabeledRow>
            <Label>Amount</Label>
            <Value>{amount} {symbol}</Value>
          </LabeledRow>
          <LabeledRow>
            <Label>Recipient username</Label>
            <Value>Pillar Tank</Value>
          </LabeledRow>
          <LabeledRow>
            <Label>Transaction fee</Label>
            <Value>{utils.formatEther(txFeeInWei.toString())} ETH</Value>
          </LabeledRow>
          <TextInput
            inputProps={{
              onChange: (text) => this.handleNoteChange(text),
              value: this.state.note,
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
        </ScrollWrapper>
        <Footer keyboardVerticalOffset={40}>
          <FooterWrapper>
            <Button disabled={!session.isOnline} onPress={this.handleFormSubmit} title="Fund Pillar Tank" />
          </FooterWrapper>
        </Footer>
      </Container>
    );
  }
}

const mapStateToProps = ({
  session: { data: session },
}) => ({
  session,
});

const mapDispatchToProps = (dispatch) => ({
  fundTank: (value: number) => dispatch(fundTankAction(value)),
});

export default connect(mapStateToProps, mapDispatchToProps)(FundConfirm);
