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
import { FlatList } from 'react-native';
import styled from 'styled-components/native';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ScrollWrapper } from 'components/Layout';
import SlideModal from 'components/Modals/SlideModal';
import { spacing, fontStyles } from 'utils/variables';
import { supportedFiatCurrencies, defaultFiatCurrency } from 'constants/assetsConstants';
import { MediumText } from 'components/Typography';
import SettingsListItem from 'components/ListItem/SettingsItem';
import { saveBaseFiatCurrencyAction, changeAppThemeAction } from 'actions/appSettingsActions';
import { DARK_THEME, LIGHT_THEME } from 'constants/appSettingsConstants';

import type { Dispatch, RootReducerState } from 'reducers/rootReducer';

import { SettingsSection } from './SettingsSection';

type Props = {
  baseFiatCurrency: ?string,
  themeType: string,
  isSetAsSystemPrefTheme: boolean,
  saveBaseFiatCurrency: (currency: string) => void,
  changeAppTheme: (themeType: string, shouldSetAsPref?: boolean) => void,
};

type State = {
  visibleModal: ?string,
};

const SettingsModalTitle = styled(MediumText)`
  ${fontStyles.big};
  margin: ${props => props.extraHorizontalSpacing ? `0 ${spacing.rhythm}px ${spacing.rhythm}px` : 0};
`;

const currencies = supportedFiatCurrencies.map(currency => ({ name: currency, value: currency }));

class AppSettings extends React.Component<Props, State> {
  state = {
    visibleModal: null,
  }

  renderListItem = (field: string, onSelect: Function, currentValue: string) => ({ item: { name, value } }: Object) => {
    return (
      <SettingsListItem
        key={value}
        label={name}
        isSelected={value === currentValue}
        onPress={() => onSelect({ [field]: value })}
      />
    );
  };

  handleCurrencyUpdate = ({ currency }: Object) => {
    const { saveBaseFiatCurrency } = this.props;
    saveBaseFiatCurrency(currency);
    this.setState({ visibleModal: null });
  };

  getItems = () => {
    const { baseFiatCurrency, themeType, changeAppTheme } = this.props;

    return [
      {
        key: 'localFiatCurrency',
        title: 'Local fiat currency',
        onPress: () => this.setState({ visibleModal: 'baseCurrency' }),
        value: baseFiatCurrency || defaultFiatCurrency,
      },
      {
        key: 'notificationSettings',
        title: 'Notification settings',
      },
      {
        key: 'darkMode',
        title: 'Dark mode',
        toggle: true,
        value: themeType === DARK_THEME,
        onPress: () => changeAppTheme(themeType === DARK_THEME ? LIGHT_THEME : DARK_THEME),
      },
    ];
  }

  render() {
    const { baseFiatCurrency } = this.props;
    const { visibleModal } = this.state;

    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: 'App settings' }] }}
      >
        <ScrollWrapper
          contentContainerStyle={{
            paddingHorizontal: spacing.layoutSides,
            paddingTop: spacing.mediumLarge,
          }}
        >
          <SettingsSection
            sectionItems={this.getItems()}
          />
        </ScrollWrapper>

        {/* BASE CURRENCY */}
        <SlideModal
          isVisible={visibleModal === 'baseCurrency'}
          fullScreen
          showHeader
          onModalHide={() => this.setState({ visibleModal: null })}
        >
          <SettingsModalTitle extraHorizontalSpacing>
            Choose your base currency
          </SettingsModalTitle>
          <FlatList
            data={currencies}
            renderItem={this.renderListItem(
              'currency', this.handleCurrencyUpdate, baseFiatCurrency || defaultFiatCurrency)}
            keyExtractor={({ name }) => name}
          />
        </SlideModal>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  appSettings: {
    data: {
      baseFiatCurrency,
      themeType,
      isSetAsSystemPrefTheme,
    },
  },
}: RootReducerState): $Shape<Props> => ({
  baseFiatCurrency,
  themeType,
  isSetAsSystemPrefTheme,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  saveBaseFiatCurrency: (currency: string) => dispatch(saveBaseFiatCurrencyAction(currency)),
  changeAppTheme: (themeType: string, shouldSetAsPref?: boolean) => dispatch(
    changeAppThemeAction(themeType, shouldSetAsPref),
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(AppSettings);
