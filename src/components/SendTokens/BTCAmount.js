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
import { connect } from 'react-redux';
import { TouchableOpacity, Keyboard } from 'react-native';
import t from 'tcomb-form-native';
import styled from 'styled-components/native';
import get from 'lodash.get';
import isEmpty from 'lodash.isempty';

// components
import Toast from 'components/Toast';
import { Wrapper } from 'components/Layout';
import Button from 'components/Button';
import { BaseText, TextLink, Label } from 'components/Typography';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import SendTokenDetails from 'components/SendTokenDetails';
import SlideModal from 'components/Modals/SlideModal';

// utils
import { btcToSatoshis, satoshisToBtc } from 'utils/bitcoin';
import { fontStyles, spacing } from 'utils/variables';
import { makeAmountForm, getAmountFormFields } from 'utils/btcFormHelpers';
import { getRate } from 'utils/assets';
import { formatFiat, formatUnits } from 'utils/common';
import { collectOutputs } from 'services/bitcoin';

// types
import type { RootReducerState } from 'reducers/rootReducer';
import type { NavigationScreenProp } from 'react-navigation';
import type {
  BitcoinTransactionPlan,
  BitcoinTransactionTarget,
  BitcoinAddress,
  BitcoinUtxo,
  BitcoinBalance,
} from 'models/Bitcoin';
import type { Rates } from 'models/Asset';

// constants
import { SEND_BITCOIN_CONFIRM } from 'constants/navigationConstants';
import { BTC, SPEED_TYPES, SPEED_TYPE_LABELS } from 'constants/assetsConstants';

const BTCIcon = require('assets/icons/icon_BTC.png');

const ActionsWrapper = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const FooterInner = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;
  width: 100%;
  padding: ${spacing.large}px;
`;

const BackgroundWrapper = styled.View`
  flexGrow: 1;
`;

const SendTokenDetailsValue = styled(BaseText)`
  ${fontStyles.medium};
`;

const ButtonWrapper = styled.View`
  margin-top: ${spacing.rhythm / 2}px;
  margin-bottom: ${spacing.rhythm + 10}px;
`;

const Btn = styled(Button)`
  margin-top: 14px;
  display: flex;
  justify-content: space-between;
`;

type Props = {
  token: string;
  navigation: NavigationScreenProp<*>,
  addresses: BitcoinAddress[],
  unspentTransactions: BitcoinUtxo[],
  balances: BitcoinBalance,
  fiatCurrency: string,
  rates: Rates,
  onUpdateTransactionSpeed: (speed: string) => void,
};

type State = {
  amount: string,
  inputHasError: boolean,
  showFeeModal: boolean,
  selectedTransactionSpeed: string,
};

type ChangeEvent = {|
  amount: ?string,
|};

const { Form } = t.form;
const MIN_TX_AMOUNT = 0.00000001;

class BTCAmount extends React.Component<Props, State> {
  _form: t.form;
  assetData: Object;
  formSubmitted: boolean = false;
  receiver: string;
  source: string;

  state = {
    amount: '0',
    inputHasError: false,
    showFeeModal: false,
    selectedTransactionSpeed: SPEED_TYPES.FAST,
  };

  constructor(props: Props) {
    super(props);

    const { navigation } = this.props;

    this.assetData = navigation.getParam('assetData', {});
    this.receiver = navigation.getParam('receiver', '');
    this.source = navigation.getParam('source', '');
  }

  handleChange = ({ amount }: ChangeEvent) => {
    this.setState({ amount: amount || '0' });

    this.checkFormInputErrors();
  };

  handleFormSubmit = () => {
    if (this.formSubmitted) {
      return;
    }
    this.formSubmitted = true;

    Keyboard.dismiss();

    const { selectedTransactionSpeed, amount } = this.state;
    const currentAmount = parseFloat(amount);

    const transactionPayload = this.createTransaction(currentAmount, selectedTransactionSpeed);
    if (!transactionPayload.isValid) {
      Toast.show({
        message: 'There was an issue trying to create the transaction',
        title: 'Cannot create transaction',
        type: 'warning',
        autoClose: false,
      });

      this.formSubmitted = false;
      return;
    }

    const { navigation } = this.props;

    navigation.navigate(SEND_BITCOIN_CONFIRM, {
      transactionPayload,
      source: this.source,
    });
    this.formSubmitted = false;
  };

  checkFormInputErrors = () => {
    if (!this._form) {
      return;
    }

    const { inputHasError } = this.state;
    if (!isEmpty(get(this._form.validate(), 'errors'))) {
      this.setState({ inputHasError: true });
    } else if (inputHasError) {
      this.setState({ inputHasError: false });
    }
  };

  changeFee = () => {
    this.setState({
      showFeeModal: true,
    });
  };

  createTarget(satoshis: number): BitcoinTransactionTarget {
    return {
      value: satoshis,
      address: this.receiver,
      isChange: false,
    };
  }

  handleFeeChange = (selectedTransactionSpeed: string) => {
    this.setState({
      showFeeModal: false,
      selectedTransactionSpeed,
    });
  };


  renderTxSpeedButtons = () => {
    const {
      addresses,
      rates,
      fiatCurrency,
      unspentTransactions,
    } = this.props;

    const { amount } = this.state;
    const { token, decimals } = this.assetData;

    const satoshis = btcToSatoshis(parseFloat(amount));
    const transactionTarget = this.createTarget(satoshis);

    const { address } = addresses[0];
    const btcRate = getRate(rates, token, fiatCurrency);

    return Object.keys(SPEED_TYPE_LABELS).map(txSpeed => {
      const transactionPayload = collectOutputs(
        [transactionTarget],
        txSpeed,
        unspentTransactions,
        (): string => address,
      );

      const feeInBtc = satoshisToBtc(parseFloat(transactionPayload.fee));
      const formattedFeeInBtc = formatUnits(`${transactionPayload.fee || ''}`, decimals);
      const formattedFeeInFiat = formatFiat(feeInBtc * btcRate, fiatCurrency);
      return (
        <Btn
          key={txSpeed}
          primaryInverted
          onPress={() => this.handleFeeChange(txSpeed)}
        >
          <TextLink>{SPEED_TYPE_LABELS[txSpeed]} - {formattedFeeInBtc} BTC</TextLink>
          <Label>{formattedFeeInFiat}</Label>
        </Btn>
      );
    });
  };

  createTransaction(btc: number, speed: string): BitcoinTransactionPlan {
    const { addresses, unspentTransactions } = this.props;
    const { address } = addresses[0];

    const satoshis = btcToSatoshis(btc);
    const transactionTarget = this.createTarget(satoshis);

    return collectOutputs(
      [transactionTarget],
      speed,
      unspentTransactions,
      (): string => address,
    );
  }

  render() {
    const {
      inputHasError,
      showFeeModal,
      amount,
      selectedTransactionSpeed,
    } = this.state;
    const {
      balances,
      addresses,
      rates,
      fiatCurrency,
    } = this.props;

    const { token, decimals } = this.assetData;

    // balance
    const { address } = addresses[0];
    const { balance: satoshisBalance } = balances[address];

    const currentAmount = parseFloat(amount);
    const balance = satoshisToBtc(satoshisBalance);

    const transactionPayload = this.createTransaction(currentAmount, selectedTransactionSpeed);
    const isEnoughForFee = balance >= (currentAmount + satoshisToBtc(transactionPayload.fee || 0));

    // value in fiat
    const valueInFiat = currentAmount * getRate(rates, BTC, fiatCurrency);
    const valueInFiatOutput = formatFiat(valueInFiat, fiatCurrency);

    const formStructure = makeAmountForm(balance, MIN_TX_AMOUNT, isEnoughForFee, this.formSubmitted, decimals);
    const formFields = getAmountFormFields({ icon: BTCIcon, currency: token, valueInFiatOutput });

    const showNextButton = !!currentAmount && !inputHasError;

    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: 'Send BTC' }] }}
        keyboardAvoidFooter={(
          <FooterInner>
            <TouchableOpacity onPress={this.changeFee}>
              <SendTokenDetailsValue>
                <Label small>Speed: </Label>
                <TextLink>{SPEED_TYPE_LABELS[selectedTransactionSpeed]}</TextLink>
              </SendTokenDetailsValue>
            </TouchableOpacity>
            <Label>&nbsp;</Label>
            {showNextButton &&
              <Button
                small
                flexRight
                title="Next"
                onPress={this.handleFormSubmit}
              />
            }
          </FooterInner>
        )}
        minAvoidHeight={200}
      >
        <BackgroundWrapper>
          <Wrapper regularPadding>
            <Form
              ref={node => { this._form = node; }}
              type={formStructure}
              options={formFields}
              value={{ amount }}
              onChange={this.handleChange}
            />
            <ActionsWrapper>
              <SendTokenDetails
                rates={rates}
                fiatCurrency={fiatCurrency}
                balance={balance}
                token={token}
              />
            </ActionsWrapper>
          </Wrapper>
        </BackgroundWrapper>
        <SlideModal
          isVisible={showFeeModal}
          title="Transaction speed"
          onModalHide={() => { this.setState({ showFeeModal: false }); }}
        >
          <Label>Choose your fee.</Label>
          <Label>Faster transaction requires higher fees.</Label>
          <ButtonWrapper>{this.renderTxSpeedButtons()}</ButtonWrapper>
        </SlideModal>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  bitcoin: {
    data: {
      addresses,
      balances,
      unspentTransactions,
    },
  },
}: RootReducerState): $Shape<Props> => ({
  addresses,
  unspentTransactions,
  balances,
});

const combinedMapStateToProps = (state) => ({
  ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(BTCAmount);
