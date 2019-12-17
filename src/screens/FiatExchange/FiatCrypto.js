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
import t from 'tcomb-form-native';
import { Container, Wrapper } from 'components/Layout';
import ErrorMessage from 'components/ErrorMessage';
import Header from 'components/Header';
import TextInput from 'components/TextInput';

import { createStructuredSelector } from 'reselect';
import { accountAssetsSelector } from 'selectors/assets';
import { sortAssets } from 'utils/assets';

import type { NavigationScreenProp } from 'react-navigation';
import type { Accounts } from 'models/Account';
import type { Assets } from 'models/Asset';
import type { RootReducerState } from 'reducers/rootReducer';

function SelectorInputTemplate(locals) {
  const {
    config: {
      label,
      hasInput,
      wrapperStyle,
      placeholderSelector,
      placeholderInput,
      options,
      inputAddonText,
    },
  } = locals;
  const errorMessage = locals.error;
  const inputProps = {
    onChange: locals.onChange,
    onBlur: locals.onBlur,
    keyboardType: locals.keyboardType,
    maxLength: 42,
    label,
    placeholderSelector,
    placeholder: placeholderInput,
  };

  return (
    <TextInput
      errorMessage={errorMessage}
      inputProps={inputProps}
      leftSideText={inputAddonText}
      numeric
      selectorOptions={{
        options,
        fullWidth: !hasInput,
        selectorModalTitle: label,
      }}
      inputWrapperStyle={wrapperStyle}
    />
  );
}

const { Form } = t.form;

const FromOption = t.refinement(t.Object, ({ selector }) => {
  return !!Object.keys(selector).length;
});

const SourceAsset = t.struct({
  fromInput: FromOption,
});

const formOptions = {
  fields: {
    fromInput: {
      keyboardType: 'decimal-pad',
      template: SelectorInputTemplate,
      config: {
        label: 'Buying',
        hasInput: true,
        options: [],
        placeholderSelector: 'select',
        placeholderInput: '0',
      },
    },
  },
};

type Props = {
  wallet: Object,
  navigation: NavigationScreenProp<*>,
  assets: Assets,
  user: Object,
  accounts: Accounts,
};

type State = {
  error: string,
  value: Object,
  options: Object,
};

class FiatCrypto extends React.Component<Props, State> {
  fiatCryptoForm = t.form;

  state = {
    error: '',
    value: {
      fromInput: {
        selector: {},
        input: '',
      },
    },
    options: formOptions,
  };

  componentDidMount = () => {
    const { assets } = this.props;

    const optionsFrom = this.generateAssetsOptions(assets);
    const newOptions = t.update(this.state.options, {
      fields: {
        fromInput: {
          config: {
            options: { $set: optionsFrom },
          },
        },
      },
    });

    this.setState({ options: newOptions });
  };

  handleFormChange = (value: Object) => {
    this.setState({ value });
    this.updateOptions();
  };

  generateAssetsOptions = (assets: Assets) => {
    return sortAssets(assets).map(({ symbol, iconUrl, ...rest }) => {
      return ({
        key: symbol,
        value: symbol,
        icon: iconUrl,
        iconUrl,
        symbol,
        ...rest,
      });
    });
  };

  updateOptions = () => {
    const { assets } = this.props;

    const optionsFrom = this.generateAssetsOptions(assets);

    const newOptions = t.update(this.state.options, {
      fields: {
        fromInput: {
          config: {
            options: { $set: optionsFrom },
          },
        },
      },
    });

    this.setState({ options: newOptions });
  };

  render() {
    const { error } = this.state;

    const {
      value,
      options,
    } = this.state;

    return (
      <Container>
        {!!error && <ErrorMessage>{error}</ErrorMessage>}
        <Header
          title="FiatCrypto Payment"
          onBack={() => this.props.navigation.goBack(null)}
        />
        <Wrapper regularPadding style={{ justifyContent: 'space-between', flex: 1 }}>
          <Form
            ref={node => { this.fiatCryptoForm = node; }}
            type={SourceAsset}
            options={options}
            value={value}
            onChange={this.handleFormChange}
          />
        </Wrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({
  wallet: { data: wallet },
  user: { data: user },
  accounts: { data: accounts },
}: RootReducerState): $Shape<Props> => ({
  wallet,
  user,
  accounts,
});

const structuredSelector = createStructuredSelector({
  assets: accountAssetsSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(FiatCrypto);
