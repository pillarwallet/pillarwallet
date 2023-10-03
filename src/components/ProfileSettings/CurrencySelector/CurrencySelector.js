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
import { Icon, Select } from 'native-base';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { supportedFiatCurrencies } from 'constants/assetsConstants';
import { connect } from 'react-redux';
import { saveBaseFiatCurrencyAction } from 'actions/appSettingsActions';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';

type Props = {
  baseFiatCurrency: ?string,
  saveBaseFiatCurrency: (currency: string) => void,
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
      <Select
        selectedValue={selectedCurrency}
        onValueChange={this.onCurrencyChanged}
        dropdownIcon={<Icon as={Ionicons} name="arrow-forward" style={{ color: '#c9c8cd' }} />}
      >
        {supportedFiatCurrencies.map((el) => (
          <Select.Item label={el} value={el} key={el} />
        ))}
      </Select>
    );
  }
}

const mapStateToProps = ({
  appSettings: {
    data: { baseFiatCurrency },
  },
}: RootReducerState): $Shape<Props> => ({
  baseFiatCurrency,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  saveBaseFiatCurrency: (currency) => dispatch(saveBaseFiatCurrencyAction(currency)),
});

export default connect(mapStateToProps, mapDispatchToProps)(CurrencySelector);
