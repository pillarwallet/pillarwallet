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
import tForm from 'tcomb-form-native';
import styled from 'styled-components/native';
import { createStructuredSelector } from 'reselect';
import t from 'translations/translate';

// components
import ContainerWithHeader from 'components/legacy/Layout/ContainerWithHeader';
import { Wrapper } from 'components/legacy/Layout';
import Button from 'components/legacy/Button';
import { TextLink, Label, BaseText } from 'components/legacy/Typography';

// utils
import { formatAmount, formatFiat } from 'utils/common';
import { fontSizes, fontStyles, spacing } from 'utils/variables';
import { makeAmountForm, getAmountFormFields } from 'utils/formHelpers';
import { themedColors } from 'utils/themes';
import { getAssetRateInFiat } from 'utils/rates';

// types
import type { NavigationScreenProp } from 'react-navigation';
import type { TransactionPayload } from 'models/Transaction';
import type { Currency, RatesPerChain } from 'models/Rates';

// constants
import { SEND_TOKEN_CONFIRM } from 'constants/navigationConstants';
import { defaultFiatCurrency } from 'constants/assetsConstants';
import { CHAIN } from 'constants/chainConstants';

// configs
import { getPlrAddressForChain } from 'configs/assetsConfig';

// selectors
import { availableStakeSelector } from 'selectors/paymentNetwork';

const ActionsWrapper = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const SendTokenDetails = styled.View``;

const SendTokenDetailsValue = styled(BaseText)`
  font-size: ${fontSizes.medium}px;
  margin-bottom: 8px;
`;

const HelperText = styled(BaseText)`
  ${fontStyles.medium};
  margin-bottom: ${spacing.rhythm / 2}px;
  color: ${themedColors.secondaryText};
  margin-left: 4px;
`;

const BackgroundWrapper = styled.View`
  flex: 1;
`;

const FooterWrapper = styled.View`
  width: 100%;
  padding: ${spacing.large}px;
`;

const TextRow = styled.View`
  flex-direction: row;
`;

const FormWrapper = styled.View`
  z-index: 10;
`;


type Props = {
  token: string,
  address: string,
  navigation: NavigationScreenProp<*>,
  isVisible: boolean,
  formValues?: Object,
  availableStake: number,
  session: Object,
  ratesPerChain: RatesPerChain,
  baseFiatCurrency: Currency,
};

type State = {
  value: ?{
    amount: ?string,
  },
};

const { Form } = tForm.form;
const MIN_TX_AMOUNT = 0.000000000000000001;

class PPNSendTokenAmount extends React.Component<Props, State> {
  _form: tForm.form;
  assetData: Object;
  formSubmitted: boolean = false;
  receiver: string;
  source: string;

  constructor(props: Props) {
    super(props);
    this.assetData = props.navigation.getParam('assetData', {});
    this.receiver = props.navigation.getParam('receiver', '');
    this.source = props.navigation.getParam('source', '');

    this.state = {
      value: null,
    };
  }

  handleChange = (value: Object) => {
    this.setState({ value });
  };

  handleFormSubmit = () => {
    this.formSubmitted = true;
    const value = this._form.getValue();
    const { navigation } = this.props;

    if (!value) return;
    const transactionPayload: TransactionPayload = {
      to: this.receiver,
      amount: value.amount,
      gasLimit: 0,
      gasPrice: 0,
      txFeeInWei: 0,
      usePPN: true,
      symbol: this.assetData.symbol,
      contractAddress: this.assetData.address,
      decimals: this.assetData.decimals,
      chain: CHAIN.ETHEREUM,
    };

    Keyboard.dismiss();
    navigation.navigate(SEND_TOKEN_CONFIRM, {
      transactionPayload,
      source: this.source,
    });
  };

  useMaxValue = () => {
    const { availableStake } = this.props;
    this.setState({
      value: {
        amount: formatAmount(availableStake),
      },
    });
  };

  render() {
    const { value } = this.state;
    const {
      session,
      availableStake,
      ratesPerChain,
      baseFiatCurrency,
    } = this.props;

    const { symbol, iconUrl, decimals } = this.assetData;
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const plrAddress = getPlrAddressForChain(CHAIN.ETHEREUM);

    const ethereumRates = ratesPerChain[CHAIN.ETHEREUM] ?? {};

    // balance
    const balance = availableStake;
    const formattedBalance = formatAmount(balance);

    // balance in fiat
    const totalInFiat = balance * getAssetRateInFiat(ethereumRates, plrAddress, fiatCurrency);
    const formattedBalanceInFiat = formatFiat(totalInFiat, baseFiatCurrency);

    // max amount
    const maxAmount = Number(balance);

    // value
    const currentValue = (!!value && !!parseFloat(value.amount)) ? parseFloat(value.amount) : 0;

    // value in fiat
    const valueInFiat = currentValue * getAssetRateInFiat(ethereumRates, plrAddress, fiatCurrency);
    const valueInFiatOutput = formatFiat(valueInFiat, baseFiatCurrency);

    // form
    const formStructure = makeAmountForm(maxAmount, MIN_TX_AMOUNT, true, this.formSubmitted, decimals);
    const formFields = getAmountFormFields({
      icon: iconUrl,
      valueInFiatOutput,
      customProps: { inputWrapperStyle: { marginTop: spacing.large } },
    });

    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [{ title: t('ppnContent.title.sendTokenViaPpnScreen', { token: this.assetData.symbol }) }],
        }}
        footer={
          <FooterWrapper>
            {!!value && !!parseFloat(value.amount) &&
              <Button
                disabled={!session.isOnline}
                small
                flexRight
                title={t('button.next')}
                block={false}
                onPress={this.handleFormSubmit}
              />
            }
          </FooterWrapper>
        }
        minAvoidHeight={200}
      >
        <BackgroundWrapper>
          <Wrapper regularPadding>
            <FormWrapper>
              <Form
                ref={node => { this._form = node; }}
                type={formStructure}
                options={formFields}
                value={value}
                onChange={this.handleChange}
              />
            </FormWrapper>
            <ActionsWrapper>
              <SendTokenDetails>
                <Label small>{t('ppnContent.label.availableBalance')}</Label>
                <TextRow>
                  <SendTokenDetailsValue>
                    {t('tokenValue', { value: formattedBalance, token: symbol })}
                  </SendTokenDetailsValue>
                  <HelperText>{formattedBalanceInFiat}</HelperText>
                </TextRow>
              </SendTokenDetails>
              <TouchableOpacity onPress={this.useMaxValue}>
                <TextLink>{t('button.sendAll')}</TextLink>
              </TouchableOpacity>
            </ActionsWrapper>
          </Wrapper>
        </BackgroundWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  session: { data: session },
  rates: { data: ratesPerChain },
  appSettings: { data: { baseFiatCurrency } },
}) => ({
  ratesPerChain,
  session,
  baseFiatCurrency,
});

const structuredSelector = createStructuredSelector({
  availableStake: availableStakeSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(PPNSendTokenAmount);
