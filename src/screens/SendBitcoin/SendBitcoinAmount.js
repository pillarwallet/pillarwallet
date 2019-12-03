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
import { Keyboard } from 'react-native';
import t from 'tcomb-form-native';
import styled from 'styled-components/native';
import get from 'lodash.get';
import isEmpty from 'lodash.isempty';
// components
import { Wrapper } from 'components/Layout';
import Button from 'components/Button';
import { Label, BaseText } from 'components/Typography';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';

// utils
import { satoshisToBtc } from 'utils/bitcoin';
import { fontStyles, spacing, UIColors } from 'utils/variables';
import { makeAmountForm, getAmountFormFields } from 'utils/btcFormHelpers';

// types
import type { NavigationScreenProp } from 'react-navigation';
import type { BitcoinTransactionPlan, BitcoinTransactionTarget } from 'models/Bitcoin';

// constants
import { SEND_BITCOIN_CONFIRM } from 'constants/navigationConstants';

// actions
import { updateAppSettingsAction } from 'actions/appSettingsActions';

import Spinner from 'components/Spinner';

const ActionsWrapper = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const SendBitcoinDetails = styled.View``;

const SendBitcoinDetailsValue = styled(BaseText)`
  ${fontStyles.medium};
`;

const FooterInner = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;
  width: 100%;
  padding: ${spacing.large}px;
  background-color: ${UIColors.defaultBackgroundColor};
`;

const BackgroundWrapper = styled.View`
  background-color: ${UIColors.defaultBackgroundColor};
  flexGrow: 1;
`;

const TextRow = styled.View`
  flex-direction: row;
`;

type Props = {
  token: string;
  address: string,
  totalBalance: number,
  contractAddress: string,
  navigation: NavigationScreenProp<*>,
  isVisible: boolean,
  formValues?: Object,
  updateAppSettings: Function,
  bitcoin: Object,
};

type State = {
  value: ?{
    amount: ?string,
  },
  inputHasError: boolean,
  submitPressed: boolean,
};

const { Form } = t.form;
const MIN_TX_AMOUNT = 0.00000001;

class SendBitcoinAmount extends React.Component<Props, State> {
  _form: t.form;
  assetData: Object;
  formSubmitted: boolean = false;
  receiver: string;
  source: string;

  constructor(props: Props) {
    super(props);
    this.assetData = this.props.navigation.getParam('assetData', {});
    this.receiver = this.props.navigation.getParam('receiver', '');
    this.source = this.props.navigation.getParam('source', '');

    this.state = {
      value: null,
      inputHasError: false,
      submitPressed: false,
    };
  }

  handleChange = (value: Object) => {
    // first update the amount, then after state is updated check for errors
    this.setState({ value });
    this.checkFormInputErrors();
  };

  handleFormSubmit = async () => {
    const { submitPressed } = this.state;
    const { bitcoin: { data: { unspentTransactions } } } = this.props;
    if (submitPressed) return;
    this.formSubmitted = true;
    this.setState({ submitPressed: true });
    const value = this._form.getValue();
    if (!value) return;

    const transactionTarget: BitcoinTransactionTarget = {
      address: this.receiver,
      value: value.amount,
      isChange: false,
    };

    const transactionPayload: BitcoinTransactionPlan = {
      inputs: unspentTransactions,
      outputs: [transactionTarget],
      fee: 0.00000001,
      isValid: true,
    };
    const { navigation } = this.props;

    Keyboard.dismiss();
    this.setState({ submitPressed: false }, () => {
      navigation.navigate(SEND_BITCOIN_CONFIRM, {
        transactionPayload,
        source: this.source,
      });
    });
  };

  useMaxValue = async () => {
    const updatedState = {};
    const amount = '1';
    this.setState({
      ...updatedState,
      value: { amount },
    });
    this.checkFormInputErrors();
  };

  checkFormInputErrors = () => {
    if (!this._form) return;
    const { inputHasError } = this.state;
    if (!isEmpty(get(this._form.validate(), 'errors'))) {
      this.setState({ inputHasError: true });
    } else if (inputHasError) {
      this.setState({ inputHasError: false });
    }
  };

  render() {
    const {
      value,
      inputHasError,
      submitPressed,
    } = this.state;
    const {
      bitcoin: {
        data: {
          balances,
          addresses,
        },
      },
    } = this.props;

    const { symbol: token, iconUrl: icon, decimals } = this.assetData;

    // balance
    const { address } = addresses[0];
    const formattedBalance = satoshisToBtc(balances[address].balance);

    // form
    const formStructure = makeAmountForm(1000, MIN_TX_AMOUNT, true, this.formSubmitted, decimals);
    const formFields = getAmountFormFields({ icon, currency: token, valueInFiatOutput: 0 });

    const showNextButton = !submitPressed && !!value && !!parseFloat(value.amount) && !inputHasError;
    const nextButtonTitle = 'Next';

    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: `Send ${this.assetData.symbol}` }] }}
        keyboardAvoidFooter={(
          <FooterInner>
            <Label>&nbsp;</Label>
            {showNextButton &&
              <Button
                small
                flexRight
                title={nextButtonTitle}
                onPress={this.handleFormSubmit}
              />
            }
            {submitPressed && <Spinner width={20} height={20} />}
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
              value={value}
              onChange={this.handleChange}
            />
            <ActionsWrapper>
              <SendBitcoinDetails>
                <Label small>Available Balance</Label>
                <TextRow>
                  <SendBitcoinDetailsValue>
                    {formattedBalance} {token}
                  </SendBitcoinDetailsValue>
                </TextRow>
              </SendBitcoinDetails>
            </ActionsWrapper>
          </Wrapper>
        </BackgroundWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  appSettings: { data: { baseFiatCurrency, transactionSpeed } },
  bitcoin,
}) => ({
  baseFiatCurrency,
  transactionSpeed,
  bitcoin,
});

const combinedMapStateToProps = (state) => ({
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch) => ({
  updateAppSettings: (path, value) => dispatch(updateAppSettingsAction(path, value)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(SendBitcoinAmount);
