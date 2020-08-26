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
import { utils, BigNumber as EthersBigNumber } from 'ethers';
import { SDK_PROVIDER } from 'react-native-dotenv';
import t from 'translations/translate';
import isEmpty from 'lodash.isempty';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import ValueSelectorCard from 'components/ValueSelectorCard';
import TimingInput from 'components/TimingInput';
import { MediumText, TextLink, BaseText } from 'components/Typography';
import { Spacing } from 'components/Layout';
import Button from 'components/Button';
import Selector from 'components/Selector';
import SlideModal from 'components/Modals/SlideModal';

// utils
import { getThemeColors, getThemeType } from 'utils/themes';
import { countDownDHMS } from 'utils/common';
import { getAssetData, getAssetsAsList, isEnoughBalanceForTransactionFee } from 'utils/assets';
import { getTimestamp } from 'utils/sablier';
import { getContactWithEnsName } from 'utils/contacts';
import { isEnsName } from 'utils/validators';

// constants
import { DAI, ETH } from 'constants/assetsConstants';
import { SABLIER_NEW_STREAM_REVIEW, SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { DARK_THEME } from 'constants/appSettingsConstants';

// services
import { checkSablierAllowance, getApproveFeeAndTransaction } from 'services/sablier';

// selectors
import { activeAccountAddressSelector } from 'selectors';
import { accountAssetsSelector, visibleActiveAccountAssetsWithBalanceSelector } from 'selectors/assets';
import { accountBalancesSelector } from 'selectors/balances';
import { useGasTokenSelector } from 'selectors/smartWallet';

// types
import type { Balances, Asset, Assets } from 'models/Asset';
import type { RootReducerState } from 'reducers/rootReducer';
import type { Option } from 'models/Selector';
import type { Theme } from 'models/Theme';
import type { NavigationScreenProp } from 'react-navigation';
import type { GasToken } from 'models/Transaction';
import type { Contact } from 'models/Contact';
import type { AllowData } from './SablierAllowanceModal';

// partials
import SablierAllowanceModal from './SablierAllowanceModal';


type Props = {
  supportedAssets: Asset[],
  activeAccountAddress: string,
  assets: Assets,
  assetsWithBalance: Option[],
  balances: Balances,
  useGasToken: boolean,
  theme: Theme,
  navigation: NavigationScreenProp<*>,
  sablierApproveExecuting: { [string]: string | boolean },
};

type State = {
  startDate: ?Date,
  endDate: ?Date,
  modalDate: ?Date,
  activeDatePicker: ?string,
  assetValue: number,
  assetSymbol: ?string,
  selectedContact: ?Contact,
  isAllowanceModalVisible: boolean,
  txFeeInWei: number,
  isCheckingAllowance: boolean,
  allowPayload: ?Object,
  gasToken: ?GasToken,
  allowance: ?EthersBigNumber,
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
      isAllowanceModalVisible: false,
      txFeeInWei: 0,
      isCheckingAllowance: false,
      allowPayload: null,
      gasToken: null,
      allowance: null,
    };
  }

  componentDidUpdate(prevProps) {
    const { assetSymbol } = this.state;
    if (!assetSymbol) {
      return;
    }
    if (prevProps.sablierApproveExecuting[assetSymbol] && !this.props.sablierApproveExecuting[assetSymbol]) {
      this.updateAllowance(assetSymbol);
    }
  }

  updateAllowance = async (assetSymbol: string) => {
    const { assets, supportedAssets, activeAccountAddress } = this.props;
    const assetData = getAssetData(getAssetsAsList(assets), supportedAssets, assetSymbol);
    this.setState({ isCheckingAllowance: true });
    const allowance = await checkSablierAllowance(assetData?.address, activeAccountAddress);
    this.setState({ allowance, isCheckingAllowance: false });
  }

  getMinimalDate = () => addMinutes(new Date(), 5);

  getFormValue = (value) => {
    const { input = '0' } = value || {};
    const newValue = parseFloat(input);
    this.setState({
      assetValue: newValue,
      assetSymbol: value?.selector?.symbol,
    });
    this.updateAllowance(value?.selector?.symbol);
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
    const { useGasToken } = this.props;
    const {
      startDate, endDate, assetValue, assetSymbol, selectedContact, allowance,
    } = this.state;

    this.setState({ isCheckingAllowance: true });

    const assetData = this.getAssetData();
    if (!assetData) return;

    // The deposit must be a multiple of the difference between the stop time and the start time,
    // or otherwise the contract reverts with a "deposit not multiple of time delta" message.
    const timeDelta = getTimestamp(endDate) - getTimestamp(startDate);
    const assetValueInWei = utils.parseUnits(assetValue.toString(), assetData.decimals);
    const roundedAssetValue = assetValueInWei.sub(assetValueInWei.mod(timeDelta));

    if (!allowance || allowance.lt(roundedAssetValue)) {
      const {
        txFeeInWei,
        gasToken,
        transactionPayload,
      } = await getApproveFeeAndTransaction(assetData, useGasToken);
      this.setState({
        isAllowanceModalVisible: true,
        gasToken,
        allowPayload: transactionPayload,
        txFeeInWei,
      });
    } else {
      this.props.navigation.navigate(SABLIER_NEW_STREAM_REVIEW, {
        startDate,
        endDate,
        assetValue: roundedAssetValue,
        assetSymbol,
        receiverAddress: selectedContact?.ethAddress,
      });
    }
    this.setState({ isCheckingAllowance: false });
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
          <TextLink onPress={() => this.setState({ modalDate: addHours(modalDate, 1) })}>
            {t('sablierContent.button.plusHour')}
          </TextLink>
          <Spacing w={10} />
          <TextLink onPress={() => this.setState({ modalDate: addDays(modalDate, 1) })}>
            {t('sablierContent.button.plusDay')}
          </TextLink>
          <Spacing w={10} />
          <TextLink onPress={() => this.setState({ modalDate: addDays(modalDate, 30) })}>
            {t('sablierContent.button.plus30Days')}
          </TextLink>
        </Row>
      </Row>
    );

    const minimumDate = picker === START_TIME ? this.getMinimalDate() : startDate;
    const maximumDate = picker === START_TIME ? endDate : null;

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

  isApprovalExecuting = () => {
    const { sablierApproveExecuting } = this.props;
    const { assetSymbol } = this.state;
    return assetSymbol && !!sablierApproveExecuting[assetSymbol];
  }

  renderStreamSummary = () => {
    const {
      assetValue, assetSymbol, startDate, endDate, allowance,
    } = this.state;

    if (!assetValue || !assetSymbol) {
      return null;
    }

    const isApprovalExecuting = this.isApprovalExecuting();
    const assetValueInWei = utils.parseUnits(assetValue.toString(), this.getAssetData()?.decimals);
    const hasAllowance = allowance && allowance.gte(assetValueInWei);

    if (!isApprovalExecuting && !hasAllowance) {
      return (
        <BaseText regular secondary>
          {t('sablierContent.paragraph.allowanceMissing', { asset: assetSymbol })}
        </BaseText>
      );
    }

    if (isApprovalExecuting) {
      return (
        <BaseText regular secondary>
          {t('sablierContent.paragraph.allowancePending')}
        </BaseText>
      );
    }

    if (!startDate || !endDate) {
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

  hideAllowanceModal = () => {
    this.setState({ isAllowanceModalVisible: false });
  }

  onAllowConfirm = () => {
    const { navigation } = this.props;
    const { allowPayload } = this.state;
    this.hideAllowanceModal();
    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, {
      transactionPayload: allowPayload,
      goBackDismiss: true,
    });
  }

  render() {
    const { balances, assetsWithBalance } = this.props;
    const {
      startDate,
      endDate,
      selectedContact,
      isAllowanceModalVisible,
      assetSymbol,
      isCheckingAllowance,
      gasToken,
      txFeeInWei,
      allowPayload,
    } = this.state;

    const formValid = this.isFormValid();

    let allowData: ?AllowData = null;
    const assetData = this.getAssetData();
    if (allowPayload && assetData) {
      const isDisabled = !isEnoughBalanceForTransactionFee(balances, allowPayload);
      const assetIcon = `${SDK_PROVIDER}/${assetData.iconUrl}?size=3`;

      allowData = {
        assetSymbol,
        txFeeInWei,
        isDisabled,
        gasToken,
        assetIcon,
      };
    }

    const assetsOptions = assetsWithBalance.filter(asset => asset.symbol !== ETH);

    return (
      <ContainerWithHeader
        inset={{ bottom: 'never' }}
        headerProps={{ centerItems: [{ title: t('sablierContent.title.newStreamScreen') }] }}
        putContentInScrollView
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
              <TextLink onPress={() => this.setState({ endDate: addHours(endDate, 1) })}>
                {t('sablierContent.button.plusHour')}
              </TextLink>
              <Spacing w={10} />
              <TextLink onPress={() => this.setState({ endDate: addDays(endDate, 1) })}>
                {t('sablierContent.button.plusDay')}
              </TextLink>
              <Spacing w={10} />
              <TextLink onPress={() => this.setState({ endDate: addDays(endDate, 30) })}>
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
            isLoading={isCheckingAllowance || this.isApprovalExecuting()}
            onPress={this.onSubmit}
          />
          <Spacing h={19} />
          {this.renderStreamSummary()}
        </ContentWrapper>
        {this.renderDatePicker(START_TIME)}
        {this.renderDatePicker(END_TIME)}
        {allowData && (
          <SablierAllowanceModal
            isVisible={isAllowanceModalVisible}
            allowData={allowData}
            onModalHide={this.hideAllowanceModal}
            onAllow={this.onAllowConfirm}
          />
        )}
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  assets: { supportedAssets },
  sablier: { sablierApproveExecuting },
}: RootReducerState): $Shape<Props> => ({
  supportedAssets,
  sablierApproveExecuting,
});

const structuredSelector = createStructuredSelector({
  activeAccountAddress: activeAccountAddressSelector,
  assets: accountAssetsSelector,
  assetsWithBalance: visibleActiveAccountAssetsWithBalanceSelector,
  balances: accountBalancesSelector,
  useGasToken: useGasTokenSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});


export default withTheme(connect(combinedMapStateToProps)(NewStream));
