// @flow
import * as React from 'react';
import { Icon, Form, Picker } from 'native-base';
import { supportedFiatCurrencies } from 'constants/assetsConstants';
import { connect } from 'react-redux';
import { saveBaseFiatCurrencyAction } from 'actions/profileActions';

type Props = {
  baseFiatCurrency: string,
  saveBaseFiatCurrency: (currency: string) => Function,
};

type State = {
  selectedCurrency: string,
};

class CurrencySelector extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { selectedCurrency: props.baseFiatCurrency || '' };
  }

  onCurrencyChanged = (value: string) => {
    this.setState({ selectedCurrency: value });
    this.props.saveBaseFiatCurrency(value);
  };

  render() {
    const { selectedCurrency } = this.state;
    return (
      <Form>
        <Picker
          iosHeader="Select currency"
          mode="dropdown"
          selectedValue={selectedCurrency}
          onValueChange={this.onCurrencyChanged}
          iosIcon={<Icon name="arrow-forward" />}
        >
          {supportedFiatCurrencies.map(el => <Picker.Item label={el} value={el} key={el} />)}
        </Picker>
      </Form>
    );
  }
}

const mapStateToProps = ({ appSettings: { data: { baseFiatCurrency } } }) => ({
  baseFiatCurrency,
});

const mapDispatchToProps = (dispatch: Function) => ({
  saveBaseFiatCurrency: (currency) => dispatch(saveBaseFiatCurrencyAction(currency)),
});

export default connect(mapStateToProps, mapDispatchToProps)(CurrencySelector);
