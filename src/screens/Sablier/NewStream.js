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
import styled from 'styled-components/native';
import { addHours, addDays, addMinutes } from 'date-fns';
import { utils } from 'ethers';
import isEmpty from 'lodash.isempty';
import t from 'translations/translate';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import ValueInput from 'components/ValueInput';
import TimingInput from 'components/TimingInput';
import { MediumText, TextLink, BaseText } from 'components/Typography';
import { Spacing } from 'components/Layout';
import Button from 'components/Button';
import Selector from 'components/Selector';
import ArrowIcon from 'components/ArrowIcon';
import Modal from 'components/Modal';

// utils
import { countDownDHMS } from 'utils/common';
import { getTimestamp } from 'utils/sablier';
import { getContactWithEnsName } from 'utils/contacts';
import { isEnsName } from 'utils/validators';

// constants
import { DAI, ETH } from 'constants/assetsConstants';
import { SABLIER_NEW_STREAM_REVIEW } from 'constants/navigationConstants';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';
import { DATE_PICKER } from 'constants/sablierConstants';

// services
import { firebaseRemoteConfig } from 'services/firebase';

// selectors
import { activeAccountAddressSelector } from 'selectors';
import { accountAssetsSelector, visibleActiveAccountAssetsWithBalanceSelector } from 'selectors/assets';

// types
import type { Asset, Assets } from 'models/Asset';
import type { RootReducerState } from 'reducers/rootReducer';
import type { Option } from 'models/Selector';
import type { NavigationScreenProp } from 'react-navigation';
import type { Contact } from 'models/Contact';

// partials
import SablierDatePicker from './SablierDatePicker';

type Props = {
  supportedAssets: Asset[],
  activeAccountAddress: string,
  assets: Assets,
  assetsWithBalance: Option[],
  navigation: NavigationScreenProp<*>,
};

type State = {
  startDate: ?Date,
  endDate: ?Date,
  assetValue: number,
  selectedAsset: Option,
  selectedContact: ?Contact,
  isInputValid: boolean,
};

const Row = styled.View`
  flex-direction: row;
  justify-content: space-between;
`;

const ContentWrapper = styled.View`
  padding: 0 20px;
`;

const InputWrapper = styled.View`
  align-items: center;
  padding: 24px 40px 0;
`;

class NewStream extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    const daiAsset = props.supportedAssets.find(asset => asset.symbol === DAI);
    this.state = {
      startDate: this.getMinimalDate(),
      endDate: null,
      assetValue: 0,
      selectedAsset: daiAsset,
      selectedContact: null,
      isInputValid: false,
    };
  }

  getMinimalDate = () => {
    // default to 5 minutes
    const delayInMinutes = firebaseRemoteConfig.getNumber(REMOTE_CONFIG.SABLIER_TIME_START_TOLERANCE) || 5;
    return addMinutes(new Date(), delayInMinutes);
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

  onSubmit = async () => {
    const {
      startDate, endDate, assetValue, selectedAsset, selectedContact,
    } = this.state;

    // The deposit must be a multiple of the difference between the stop time and the start time,
    // or otherwise the contract reverts with a "deposit not multiple of time delta" message.
    const timeDelta = getTimestamp(endDate) - getTimestamp(startDate);
    const assetValueInWei = utils.parseUnits(assetValue.toString(), selectedAsset.decimals);
    const roundedAssetValue = assetValueInWei.sub(assetValueInWei.mod(timeDelta));

    this.props.navigation.navigate(SABLIER_NEW_STREAM_REVIEW, {
      startDate,
      endDate,
      assetValue: roundedAssetValue,
      assetSymbol: selectedAsset.symbol,
      receiverAddress: selectedContact?.ethAddress,
    });
  }

  openDatePicker = (picker: $Values<typeof DATE_PICKER>, initialDate: ?Date) => {
    const { startDate, endDate } = this.state;

    const minimumDate = picker === DATE_PICKER.START_TIME ? this.getMinimalDate() : addMinutes(startDate, 1);
    const maximumDate = picker === DATE_PICKER.START_TIME ? endDate : null;

    Modal.open(() => (
      <SablierDatePicker
        picker={picker}
        initialDate={initialDate}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        onConfirm={date => {
          const update = picker === DATE_PICKER.START_TIME ? { startDate: date } : { endDate: date };
          this.setState(update);
        }}
      />
    ));
  }

  isFormValid = () => {
    const {
      assetValue, startDate, endDate, selectedContact, isInputValid,
    } = this.state;
    return assetValue && startDate && endDate && selectedContact && isInputValid;
  }

  renderStreamSummary = () => {
    const {
      assetValue, selectedAsset, startDate, endDate,
    } = this.state;

    if (!assetValue || !startDate || !endDate) {
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
          asset: selectedAsset.symbol,
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
      assetValue,
      selectedAsset,
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
        <InputWrapper>
          <ValueInput
            value={assetValue}
            onValueChange={amount => this.setState({ assetValue: amount })}
            assetData={selectedAsset}
            onAssetDataChange={asset => this.setState({ selectedAsset: asset })}
            customAssets={assetsOptions}
            onFormValid={(isValid) => this.setState({ isInputValid: isValid })}
          />
          <Spacing h={10} />
          <ArrowIcon />
          <Spacing h={20} />
          <Selector
            placeholder={t('label.whereToSend')}
            searchPlaceholder={t('label.walletAddress')}
            noOptionImageFallback
            hasQRScanner
            disableSelfSelect
            allowEnteringCustomAddress
            onOptionSelect={this.handleReceiverSelect}
            options={[]}
            selectedOption={selectedContact}
          />
        </InputWrapper>
        <Spacing h={28} />
        <ContentWrapper>
          <Row>
            <MediumText regular>{t('sablierContent.label.start')}</MediumText>
            <TextLink onPress={() => this.setState({ startDate: this.getMinimalDate() })}>
              {t('sablierContent.button.startImmediately')}
            </TextLink>
          </Row>
          <Spacing h={8} />
          <TimingInput
            filled
            value={startDate}
            onPress={() => this.openDatePicker(DATE_PICKER.START_TIME, startDate)}
          />

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
          <TimingInput filled value={endDate} onPress={() => this.openDatePicker(DATE_PICKER.END_TIME, endDate)} />

          <Spacing h={64} />
          <Button
            title={t('button.next')}
            disabled={!formValid}
            onPress={this.onSubmit}
          />
          <Spacing h={19} />
          {this.renderStreamSummary()}
        </ContentWrapper>
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

export default connect(combinedMapStateToProps)(NewStream);
