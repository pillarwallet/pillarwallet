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
import { TouchableOpacity, View, TouchableWithoutFeedback } from 'react-native';
import { connect } from 'react-redux';
import styled, { withTheme } from 'styled-components/native';
import tForm from 'tcomb-form-native';
import get from 'lodash.get';
import t from 'translations/translate';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { User } from 'models/User';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ScrollWrapper, Spacing } from 'components/Layout';
import ProfileImage from 'components/ProfileImage';
import { BaseText, MediumText } from 'components/Typography';
import TextInput from 'components/TextInput';
import Flag from 'components/Flag';
import Button from 'components/Button';
import InsightWithButton from 'components/InsightWithButton';
import { Note } from 'components/Note';
import Modal from 'components/Modal';
import Image from 'components/Image';
import Icon from 'components/Icon';

// utils
import { spacing, appFont, fontSizes } from 'utils/variables';
import countries from 'utils/countries.json';
import { getThemeColors } from 'utils/themes';
import { getEnsName } from 'utils/accounts';
import { images } from 'utils/images';
import { EmailStruct, PhoneStruct } from 'utils/validators';

// actions
import { updateUserAction } from 'actions/userActions';
import { dismissPrivacyInsightAction, dismissVerificationNoteAction } from 'actions/insightsActions';
import { goToInvitationFlowAction } from 'actions/referralsActions';

// selectors
import { updatedProfileImageSelector } from 'selectors/user';

// types
import type { Accounts } from 'models/Account';
import type { Theme } from 'models/Theme';

// partials
import VerifyOTPModal from './VerifyOTPModal';
import CautionModal from './CautionModal';
import VerifiedModal from './VerifiedModal';
import InviteBanner from './InviteBanner';
import ProfileImageModal from './ProfileImageModal';

type Props = {
  oneTimePasswordSent: boolean,
  user: User,
  profileImage: string | null,
  updateUser: (walletId: string, field: Object) => void,
  accounts: Accounts,
  theme: Theme,
  privacyInsightDismissed: boolean,
  verificationNoteDismissed: boolean,
  dismissPrivacyInsight: () => void,
  dismissVerificationNote: () => void,
  goToInvitationFlow: () => void,
  isPillarRewardCampaignActive: boolean,
};

type State = {
  focusedField: ?string,
  value: Object,
};

const FIELD_NAME = {
  PHONE: 'phone',
  EMAIL: 'email',
};

const RootContainer = styled.View`
  padding: 48px 20px 0px;
`;

const ImageWrapper = styled.View`
  width: 100%;
  align-items: center;
  justify-content: center;
`;

const CountryWrapper = styled.TouchableOpacity`
  padding: 20px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const CountryNameAndFlagWrapper = styled.View`
  flex-direction: row;
  align-items: center;
`;

const SelectorWrapper = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const FieldTitle = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: ${({ alignItems }) => alignItems || 'center'};
`;

const FieldWrapper = styled.View`
  padding: 20px 0 25px;
`;

const FieldIcon = styled(Image)`
  width: 48px;
  height: 48px;
  margin-top: ${({ marginTop }) => marginTop || 0};
`;

const DescriptionWrapper = styled.View`
  padding: 0 11px 0 64px;
`;

const CheckIcon = styled(Icon)`
  color: ${({ theme }) => theme.colors.secondaryAccent140};
`;

const ProfileFormTemplate = (locals: Object) => {
  const { config = {}, error: errorMessage } = locals;
  const {
    label,
    fieldName,
    options,
    isVerified,
    onPressVerify,
    isFocused,
    onFocus,
    fieldDisplayName,
    fieldDisplayValue,
    descriptionEmpty,
    descriptionAdded,
    descriptionVerified,
    icon,
    onSelectorClose,
    inputRef,
    isFormFocused,
    optionsSearchPlaceholder,
    optionsTitle,
    onSubmit,
    selectorModalTitle,
    zIndex,
  } = config;

  const value = get(locals, 'value', {});
  const { selector } = value;
  const selectorValue = selector ? {
    ...value,
    selector: { ...selector },
  } : undefined;
  const inputProps = {
    autoCapitalize: locals.autoCapitalize || 'words',
    onChange: locals.onChange,
    value: locals.value,
    keyboardType: locals.keyboardType || 'default',
    placeholder: config.placeholder || '',
    fieldName,
    selectorValue,
    autoFocus: true,
    onSelectorClose,
    returnKeyType: 'done',
    onSubmit,
    ...config.inputProps,
  };

  let description = null;

  if (!isFocused) {
    const name = fieldDisplayValue || fieldDisplayName;
    let sideComponent;

    if (isVerified) {
      sideComponent = (
        <CheckIcon name="check" />
      );
    } else {
      const buttonTitle = fieldDisplayValue ? t('button.verify') : t('button.add');
      const buttonAction = fieldDisplayValue ? (() => onPressVerify(fieldName)) : (() => onFocus(fieldName));
      description = fieldDisplayValue ? descriptionAdded : descriptionEmpty;
      sideComponent = <Button horizontalPaddings={8} small title={buttonTitle} onPress={buttonAction} block={false} />;
    }

    return (
      <FieldWrapper pointerEvents={isFormFocused ? 'none' : 'auto'} zIndex={zIndex}>
        <TouchableOpacity onPress={() => onFocus(fieldName)} style={{ flex: 1 }}>
          <FieldTitle>
            <FieldIcon source={icon} />
            <Spacing w={16} />
            <MediumText big numberOfLines={1} style={{ flex: 1 }}>{name}</MediumText>
            <Spacing w={10} />
            {sideComponent}
          </FieldTitle>
          {!!description && (
            <DescriptionWrapper>
              <BaseText regular secondary>{description}</BaseText>
            </DescriptionWrapper>
          )}
        </TouchableOpacity>
      </FieldWrapper>
    );
  }

  description = isVerified ? descriptionVerified : descriptionEmpty;

  return (
    <FieldWrapper zIndex={zIndex}>
      <FieldTitle alignItems="flex-start">
        <FieldIcon source={icon} marginTop={2} />
        <Spacing w={8} />
        <TextInput
          getInputRef={inputRef}
          errorMessage={errorMessage}
          inputProps={inputProps}
          selectorOptions={options ? {
            options,
            selectorModalTitle: selectorModalTitle || label,
            optionsSearchPlaceholder,
            showOptionsTitles: true,
            optionsTitle,
          } : {}}
          inputWrapperStyle={{ flex: 1, paddingBottom: 0 }}
          additionalStyle={{
            fontSize: fontSizes.big,
            fontFamily: appFont.medium,
          }}
          renderOption={(item, selectOption) => {
            return (
              <CountryWrapper onPress={selectOption}>
                <CountryNameAndFlagWrapper>
                  <Flag country={item.cca2} width={48} height={37} radius={4} />
                  <Spacing w={15} />
                  <MediumText big>{item.name}</MediumText>
                </CountryNameAndFlagWrapper>
                <MediumText big>+{item.callingCode}</MediumText>
              </CountryWrapper>
            );
          }}
          optionKeyExtractor={({ cca2, value: val }) => cca2 || val}
          renderSelector={(item) => {
            return (
              <SelectorWrapper>
                <Flag country={item.cca2} width={22} height={15} />
                <Spacing w={8} />
                <MediumText big>+{item.callingCode}</MediumText>
              </SelectorWrapper>
            );
          }}
          iconProps={{
            icon: config.statusIcon,
            color: config.statusIconColor,
            onPress: config.onIconPress,
          }}
        />
      </FieldTitle>
      {!!description && !errorMessage && (
        <DescriptionWrapper>
          <BaseText regular secondary>{description}</BaseText>
        </DescriptionWrapper>
      )}
    </FieldWrapper>
  );
};

const getInitialValue = (user) => {
  let { email, phone = '' } = user;
  // those can be null
  email = email || '';
  phone = phone || '';
  const country = countries.find(c => phone.substring(1).startsWith(c.callingCode));
  const phoneInput = country && phone.substring(country.callingCode.length + 1);
  return { phone: { input: phoneInput || '', selector: country || countries.find(c => c.cca2 === 'GB') }, email };
};

const sortedCountries = countries.sort((a, b) => a.name.localeCompare(b.name));

const formStructure = tForm.struct({
  phone: PhoneStruct,
  email: EmailStruct,
});

const { Form } = tForm.form;

class AddOrEditUser extends React.PureComponent<Props, State> {
  formRef: ?Object;
  phoneInputRef: ?Object;

  constructor(props) {
    super(props);
    const { user } = this.props;

    this.state = {
      value: getInitialValue(user),
      focusedField: null,
    };
  }

  getFormOptions = () => {
    const { theme, user } = this.props;
    const { focusedField, value } = this.state;
    const { isPhoneVerified, isEmailVerified } = user;
    const { roundedEmailIcon, roundedPhoneIcon } = images(theme);
    const colors = getThemeColors(theme);

    const formOptions = {
      fields: {
        email: {
          auto: 'placeholders',
          placeholder: t('form.email.placeholder'),
          autoCapitalize: 'none',
          template: ProfileFormTemplate,
          config: {
            fieldName: FIELD_NAME.EMAIL,
            isFocused: false,
            onFocus: this.onFieldFocus,
            fieldDisplayName: t('form.email.label'),
            descriptionEmpty: t('form.email.description.empty'),
            descriptionAdded: t('form.email.description.added'),
            descriptionVerified: t('form.email.description.confirmed'),
            icon: roundedEmailIcon,
            onPressVerify: this.verifyField,
            isFormFocused: !!focusedField,
            fieldDisplayValue: value.email,
            isVerified: isEmailVerified,
            onSubmit: this.onFieldBlur,
            statusIcon: 'rounded-close',
            statusIconColor: colors.secondaryText,
            onIconPress: this.onClear,
            zIndex: 2,
          },
        },
        phone: {
          keyboardType: 'phone-pad',
          template: ProfileFormTemplate,
          config: {
            fieldName: FIELD_NAME.PHONE,
            label: t('form.countryCode.label'),
            hasInput: true,
            options: sortedCountries,
            isFocused: false,
            onFocus: this.onFieldFocus,
            onSelectorClose: this.onSelectorClose,
            fieldDisplayName: t('form.phoneNumber.label'),
            descriptionEmpty: t('form.phoneNumber.description.empty'),
            descriptionAdded: t('form.phoneNumber.description.added'),
            descriptionVerified: t('form.phoneNumber.description.confirmed'),
            icon: roundedPhoneIcon,
            inputRef: (ref) => {
              if (this.phoneInputRef) this.phoneInputRef = ref;
            },
            onPressVerify: this.verifyField,
            optionsSearchPlaceholder: t('form.countryCode.placeholder'),
            selectorModalTitle: t('form.countryCode.selectorTitle'),
            isFormFocused: !!focusedField,
            fieldDisplayValue: value.phone.input && `+${value.phone.selector.callingCode}${value.phone.input}`,
            isVerified: isPhoneVerified,
            onSubmit: this.onFieldBlur,
            statusIcon: 'rounded-close',
            statusIconColor: colors.secondaryText,
            onIconPress: this.onClear,
            zIndex: 3,
          },
        },
      },
    };
    if (focusedField) {
      formOptions.fields[focusedField].config.isFocused = true;
    }
    return formOptions;
  };

  handleFormChange = (value: Object) => {
    this.setState({ value });
  };

  onFieldBlur = () => {
    const { updateUser, user } = this.props;
    const { focusedField, value } = this.state;
    const { isEmailVerified, isPhoneVerified, walletId } = user;

    if (!focusedField || !this.formRef || !walletId) return;
    const e = this.formRef.getComponent(focusedField).validate();
    const isEmpty = focusedField === FIELD_NAME.PHONE ? !value.phone.input : !value.email;

    if (e.isValid() || isEmpty) {
      this.setState({ focusedField: null });
      if (focusedField === FIELD_NAME.EMAIL && value.email !== user.email) {
        if (isEmailVerified) {
          this.openCautionModal(FIELD_NAME.EMAIL);
        } else {
          updateUser(walletId, { email: value.email });
        }
      } else if (focusedField === FIELD_NAME.PHONE) {
        const { phone: { input, selector } } = value;
        const formattedPhone = input ? `+${selector.callingCode}${input}` : null;
        if (formattedPhone !== user.phone) {
          if (isPhoneVerified) {
            this.openCautionModal(FIELD_NAME.PHONE);
          } else {
            updateUser(walletId, { phone: formattedPhone });
          }
        }
      }
    }
  };

  onClear = () => {
    const { focusedField, value } = this.state;
    const newValue = { ...value };
    if (focusedField === FIELD_NAME.EMAIL) {
      newValue.email = '';
    } else if (focusedField === FIELD_NAME.PHONE) {
      newValue.phone.input = '';
    }
    this.setState({ value: newValue });
  };

  onFieldFocus = (fieldName) => {
    this.setState({ focusedField: fieldName });
  };

  onSelectorClose = () => {
    if (!this.phoneInputRef) return;
    this.phoneInputRef.focus();
  };

  openProfileImageModal = () => Modal.open(() => <ProfileImageModal />)

  verifyField = (verifyingField) => {
    const onCloseVerification = () => {
      const { user: { isPhoneVerified, isEmailVerified }, goToInvitationFlow } = this.props;
      const isFieldVerified =
        (verifyingField === FIELD_NAME.PHONE && isPhoneVerified) ||
        (verifyingField === FIELD_NAME.EMAIL && isEmailVerified);

      if (isFieldVerified) {
        Modal.open(() => (
          <VerifiedModal
            onButtonPress={goToInvitationFlow}
            verifiedField={verifyingField}
          />
        ));
      }
    };

    Modal.open(() => (
      <VerifyOTPModal
        verifyingField={verifyingField}
        onModalClose={onCloseVerification}
      />
    ));
  };

  openCautionModal = (field: string) => {
    const { value } = this.state;

    const changeField = () => {
      const { updateUser, user: { walletId } } = this.props;
      if (!walletId) return;

      if (field === FIELD_NAME.PHONE) {
        const { phone: { input, selector } } = value;
        const formattedPhone = input ? `+${selector.callingCode}${input}` : null;
        updateUser(walletId, { phone: formattedPhone });
      } else if (field === FIELD_NAME.EMAIL) {
        updateUser(walletId, { email: value.email });
      }
    };

    Modal.open(() => (
      <CautionModal
        onAcceptChange={changeField}
        onDismiss={this.resetFieldValues}
        focusedField={field}
      />
    ));
  }

  resetFieldValues = () => {
    this.setState({ value: getInitialValue(this.props.user) });
  }

  renderInsight = () => {
    const {
      verificationNoteDismissed,
      privacyInsightDismissed,
      dismissPrivacyInsight,
      dismissVerificationNote,
      user,
      goToInvitationFlow,
      isPillarRewardCampaignActive,
    } = this.props;
    const {
      isEmailVerified, isPhoneVerified, email, phone,
    } = user;
    if (isPhoneVerified || isEmailVerified) {
      return (
        <InviteBanner
          title={t('referralsContent.banner.inviteBanner.title')}
          onInvitePress={goToInvitationFlow}
          isReferralActive={isPillarRewardCampaignActive}
        />
      );
    }
    if (email || phone) {
      if (verificationNoteDismissed) return null;
      return (
        <Note
          note={t('profileContent.paragraph.verificationIsRequired')}
          containerStyle={{ marginHorizontal: spacing.layoutSides }}
          onClose={dismissVerificationNote}
        />
      );
    }
    if (privacyInsightDismissed) return null;
    if (isPillarRewardCampaignActive) {
      return (
        <InsightWithButton
          title={t('insight.dataPrivacy.title')}
          description={t('insight.dataPrivacy.description')}
          buttonTitle={t('insight.dataPrivacy.button.ok')}
          onButtonPress={dismissPrivacyInsight}
        />
      );
    }
    return null;
  };

  render() {
    const { value, focusedField } = this.state;
    const {
      user: { username },
      accounts,
      profileImage,
    } = this.props;

    const ensName = getEnsName(accounts);

    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [
            { title: t('profileContent.title.manage') },
          ],
        }}
        inset={{ bottom: 0 }}
      >
        <ScrollWrapper disableOnAndroid keyboardShouldPersistTaps="handled">
          <TouchableWithoutFeedback onPress={this.onFieldBlur}>
            <RootContainer zIndex={10}>
              <View pointerEvents={focusedField ? 'none' : 'auto'}>
                <TouchableOpacity onPress={this.openProfileImageModal}>
                  <ImageWrapper>
                    <ProfileImage
                      uri={profileImage}
                      userName={username || ''}
                      diameter={96}
                      initialsSize={36}
                    />
                  </ImageWrapper>
                </TouchableOpacity>
                <Spacing h={20} />
                {!!username && <MediumText large center>{username}</MediumText>}
                <BaseText regular secondary center>{ensName}</BaseText>
                <Spacing h={32} />
              </View>
              <Form
                ref={ref => { this.formRef = ref; }}
                type={formStructure}
                options={this.getFormOptions()}
                value={value}
                onChange={this.handleFormChange}
              />
            </RootContainer>
          </TouchableWithoutFeedback>
          <Spacing h={20} />
          {this.renderInsight()}
          <Spacing h={75} />
        </ScrollWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  user: {
    data: user,
    oneTimePasswordSent,
  },
  accounts: { data: accounts },
  insights: { privacyInsightDismissed, verificationNoteDismissed },
  referrals: { isPillarRewardCampaignActive },
}: RootReducerState): $Shape<Props> => ({
  user,
  oneTimePasswordSent,
  accounts,
  privacyInsightDismissed,
  verificationNoteDismissed,
  isPillarRewardCampaignActive,
});

const combinedMapStateToProps = state => ({
  ...mapStateToProps(state),
  profileImage: updatedProfileImageSelector(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  updateUser: (walletId: string, field: Object) =>
    dispatch(updateUserAction(walletId, field)),
  dismissPrivacyInsight: () => dispatch(dismissPrivacyInsightAction()),
  dismissVerificationNote: () => dispatch(dismissVerificationNoteAction()),
  goToInvitationFlow: () => dispatch(goToInvitationFlowAction()),
});

export default withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(AddOrEditUser));
