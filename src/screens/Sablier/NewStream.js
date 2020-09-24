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
import { createStructuredSelector } from 'reselect';
import styled, { withTheme } from 'styled-components/native';
import { addHours, addDays, addMinutes } from 'date-fns';
import DatePicker from 'react-native-date-picker';
import { utils } from 'ethers';
import isEmpty from 'lodash.isempty';
import t from 'translations/translate';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import ValueSelectorCard from 'components/ValueSelectorCard';
import TimingInput from 'components/TimingInput';
import { MediumText, TextLink, BaseText } from 'components/Typography';
import { Spacing } from 'components/Layout';
import Button from 'components/Button';
import Selector from 'components/Selector';
import SlideModal from 'components/Modals/SlideModal/SlideModal-old';

// utils
import { getThemeColors, getThemeType } from 'utils/themes';
import { countDownDHMS } from 'utils/common';
import { getAssetData, getAssetsAsList } from 'utils/assets';
import { getTimestamp } from 'utils/sablier';
import { getContactWithEnsName } from 'utils/contacts';
import { isEnsName } from 'utils/validators';

// constants
import { DAI, ETH } from 'constants/assetsConstants';
import { SABLIER_NEW_STREAM_REVIEW } from 'constants/navigationConstants';
import { DARK_THEME } from 'constants/appSettingsConstants';
import { FEATURE_FLAGS } from 'constants/featureFlagsConstants';

// services
import { firebaseRemoteConfig } from 'services/firebase';

// selectors
import { activeAccountAddressSelector } from 'selectors';
import { accountAssetsSelector, visibleActiveAccountAssetsWithBalanceSelector } from 'selectors/assets';

// types
import type { Asset, Assets } from 'models/Asset';
import type { RootReducerState } from 'reducers/rootReducer';
import type { Option } from 'models/Selector';
import type { Theme } from 'models/Theme';
import type { NavigationScreenProp } from 'react-navigation';
import type { Contact } from 'models/Contact';


type Props = {
  supportedAssets: Asset[],
  activeAccountAddress: string,
  assets: Assets,
  assetsWithBalance: Option[],
  theme: Theme,
  navigation: NavigationScreenProp<*>,
};

type State = {
  startDate: ?Date,
  endDate: ?Date,
  modalDate: ?Date,
  activeDatePicker: ?string,
  assetValue: number,
  assetSymbol: ?string,
  selectedContact: ?Contact,
};

const Row = styled.View`
  flex-direction: row;
  justify-content: space-between;
`;

const ContentWrapper = styled.View`
  padding: 0 20px;
`;

const PickerWrapper = styled.View`
  padding: 18px 20px;
`;

const START_TIME = 'START_TIME';
const END_TIME = 'END_TIME';

class NewStream extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = {
      startDate: this.getMinimalDate(),
      endDate: null,
      modalDate: null,
      activeDatePicker: null,
      assetValue: 0,
      assetSymbol: null,
      selectedContact: null,
    };
  }

  getMinimalDate = () => {
    // default to 5 minutes
    const delayInMinutes = firebaseRemoteConfig.getNumber(FEATURE_FLAGS.SABLIER_TIME_START_TOLERANCE) || 5;
    return addMinutes(new Date(), delayInMinutes);
  }

  getFormValue = (value) => {
    const { input = '0' } = value || {};
    const newValue = parseFloat(input);
    this.setState({
      assetValue: newValue,
      assetSymbol: value?.selector?.symbol,
    });
  }

  handleReceiverSelect = async (value: Option, onSuccess?: () => void) => {
    const ethAddress = value?.ethAddress || '';
    let contact = {
      name: value?.name || '',
      ethAddress,
      ensName: null,
    };

    if (isEnsName(ethAddress)) {
      contact = await getContactWithEnsName(contact, ethAddress);
      if (!contact?.ensName) {
        // getContactWithEnsName should've shown the toast that ens lookup failed
        return Promise.resolve();
      }
    }

    if (isEmpty(contact.name)) contact = { ...contact, name: contact.ethAddress };

    this.setState({ selectedContact: contact });
    if (onSuccess) onSuccess();
    return Promise.resolve();
  }

  getAssetData = () => {
    const { assets, supportedAssets } = this.props;
    const { assetSymbol } = this.state;
    if (!assetSymbol) return null;
    return getAssetData(getAssetsAsList(assets), supportedAssets, assetSymbol);
  }

  onSubmit = async () => {
    const {
      startDate, endDate, assetValue, assetSymbol, selectedContact,
    } = this.state;

    const assetData = this.getAssetData();
    if (!assetData) return;

    // The deposit must be a multiple of the difference between the stop time and the start time,
    // or otherwise the contract reverts with a "deposit not multiple of time delta" message.
    const timeDelta = getTimestamp(endDate) - getTimestamp(startDate);
    const assetValueInWei = utils.parseUnits(assetValue.toString(), assetData.decimals);
    const roundedAssetValue = assetValueInWei.sub(assetValueInWei.mod(timeDelta));

    this.props.navigation.navigate(SABLIER_NEW_STREAM_REVIEW, {
      startDate,
      endDate,
      assetValue: roundedAssetValue,
      assetSymbol,
      receiverAddress: selectedContact?.ethAddress,
    });
  }

  openDatePicker = (picker: string, date: ?Date) => {
    this.setState({ activeDatePicker: picker, modalDate: date });
  }

  closePicker = () => {
    this.setState({ activeDatePicker: null });
  }

  handleDateModalConfirm = () => {
    const { activeDatePicker, modalDate } = this.state;
    let newState = {
      activeDatePicker: null,
    };
    if (activeDatePicker === START_TIME) {
      newState = { ...newState, startDate: modalDate };
    } else {
      newState = { ...newState, endDate: modalDate };
    }
    this.setState(newState);
  }

  renderDatePicker = (picker: string) => {
    const {
      activeDatePicker, modalDate, startDate, endDate,
    } = this.state;
    const { theme } = this.props;
    const colors = getThemeColors(theme);

    const minimumDate = picker === START_TIME ? this.getMinimalDate() : addMinutes(startDate, 1);
    const maximumDate = picker === START_TIME ? endDate : null;

    const header = picker === START_TIME ? (
      <Row>
        <MediumText labelTertiary regular>{t('sablierContent.label.start')}</MediumText>
        <TextLink onPress={() => this.setState({ modalDate: this.getMinimalDate() })}>
          {t('sablierContent.button.startImmediately')}
        </TextLink>
      </Row>
    ) : (
      <Row>
        <MediumText labelTertiary regular>{t('sablierContent.label.start')}</MediumText>
        <Row>
          <TextLink onPress={() => this.setState({ modalDate: addHours(modalDate || minimumDate, 1) })}>
            {t('sablierContent.button.plusHour')}
          </TextLink>
          <Spacing w={10} />
          <TextLink onPress={() => this.setState({ modalDate: addDays(modalDate || minimumDate, 1) })}>
            {t('sablierContent.button.plusDay')}
          </TextLink>
          <Spacing w={10} />
          <TextLink onPress={() => this.setState({ modalDate: addDays(modalDate || minimumDate, 30) })}>
            {t('sablierContent.button.plus30Days')}
          </TextLink>
        </Row>
      </Row>
    );

    return (
      <SlideModal
        isVisible={activeDatePicker === picker}
        onModalHide={this.closePicker}
        hideHeader
        noPadding
      >
        <PickerWrapper>
          {header}
          <Spacing h={8} />
          <TimingInput value={modalDate} filled={getThemeType(theme) === DARK_THEME} />
          <Spacing h={20} />
          <DatePicker
            date={modalDate || this.getMinimalDate()}
            onDateChange={(date) => this.setState({ modalDate: date })}
            androidVariant="nativeAndroid"
            mode="datetime"
            textColor={getThemeType(theme) === DARK_THEME ? colors.activeTabBarIcon : colors.text}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            style={{ alignSelf: 'center' }}
          />
          <Spacing h={20} />
          <Button
            title={t('button.next')}
            onPress={this.handleDateModalConfirm}
            disabled={!modalDate}
          />
        </PickerWrapper>
      </SlideModal>
    );
  }

  isFormValid = () => {
    const {
      assetValue, startDate, endDate, assetSymbol, selectedContact,
    } = this.state;
    return assetValue && startDate && endDate && assetSymbol && selectedContact;
  }

  renderStreamSummary = () => {
    const {
      assetValue, assetSymbol, startDate, endDate,
    } = this.state;

    if (!assetValue || !assetSymbol || !startDate || !endDate) {
      return null;
    }

    const timeDelta = endDate.getTime() - startDate.getTime();
    const streamingRate = ((assetValue / timeDelta) * 1000 * 60).toFixed(5);
    const { days, hours } = countDownDHMS(timeDelta);
    let duration = '';
    if (days === 0) {
      duration = t('hour', { count: hours });
    } else {
      duration = t('day', { count: days });
    }

    return (
      <BaseText regular secondary>
        {t('sablierContent.paragraph.newStreamInformation', {
          value: assetValue,
          asset: assetSymbol,
          duration,
          streamingRate,
        })}
      </BaseText>
    );
  }

  render() {
    const { assetsWithBalance } = this.props;
    const {
      startDate,
      endDate,
      selectedContact,
    } = this.state;

    const formValid = this.isFormValid();
    const assetsOptions = assetsWithBalance.filter(asset => asset.symbol !== ETH);
    const minimumEndingDate = addMinutes(startDate, 1);

    return (
      <ContainerWithHeader
        inset={{ bottom: 'never' }}
        headerProps={{ centerItems: [{ title: t('sablierContent.title.newStreamScreen') }] }}
        putContentInScrollView
        keyboardShouldPersistTaps="handled"
      >
        <Selector
          label={t('label.to')}
          placeholder={t('label.chooseReceiver')}
          searchPlaceholder={t('label.walletAddress')}
          noOptionImageFallback
          hasQRScanner
          disableSelfSelect
          allowEnteringCustomAddress
          onOptionSelect={this.handleReceiverSelect}
          options={[]}
          selectedOption={selectedContact}
        />

        <ValueSelectorCard
          preselectedAsset={DAI}
          maxLabel={t('button.sendMax')}
          getFormValue={this.getFormValue}
          customOptions={assetsOptions}
        />

        <Spacing h={34} />
        <ContentWrapper>
          <Row>
            <MediumText regular>{t('sablierContent.label.start')}</MediumText>
            <TextLink onPress={() => this.setState({ startDate: this.getMinimalDate() })}>
              {t('sablierContent.button.startImmediately')}
            </TextLink>
          </Row>
          <Spacing h={8} />
          <TimingInput filled value={startDate} onPress={() => this.openDatePicker(START_TIME, startDate)} />

          <Spacing h={38} />

          <Row>
            <MediumText regular>{t('sablierContent.label.end')}</MediumText>
            <Row>
              <TextLink onPress={() => this.setState({ endDate: addHours(endDate || minimumEndingDate, 1) })}>
                {t('sablierContent.button.plusHour')}
              </TextLink>
              <Spacing w={10} />
              <TextLink onPress={() => this.setState({ endDate: addDays(endDate || minimumEndingDate, 1) })}>
                {t('sablierContent.button.plusDay')}
              </TextLink>
              <Spacing w={10} />
              <TextLink onPress={() => this.setState({ endDate: addDays(endDate || minimumEndingDate, 30) })}>
                {t('sablierContent.button.plus30Days')}
              </TextLink>
            </Row>
          </Row>
          <Spacing h={8} />
          <TimingInput filled value={endDate} onPress={() => this.openDatePicker(END_TIME, endDate)} />

          <Spacing h={64} />
          <Button
            title={t('button.next')}
            disabled={!formValid}
            onPress={this.onSubmit}
          />
          <Spacing h={19} />
          {this.renderStreamSummary()}
        </ContentWrapper>
        {this.renderDatePicker(START_TIME)}
        {this.renderDatePicker(END_TIME)}
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  assets: { supportedAssets },
}: RootReducerState): $Shape<Props> => ({
  supportedAssets,
});

const structuredSelector = createStructuredSelector({
  activeAccountAddress: activeAccountAddressSelector,
  assets: accountAssetsSelector,
  assetsWithBalance: visibleActiveAccountAssetsWithBalanceSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});


export default withTheme(connect(combinedMapStateToProps)(NewStream));
