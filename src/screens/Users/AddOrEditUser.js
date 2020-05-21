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
import { Platform, TouchableOpacity, View, TouchableWithoutFeedback } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { PERMISSIONS, RESULTS, request as requestPermission } from 'react-native-permissions';
import styled, { withTheme } from 'styled-components/native';
import { CachedImage } from 'react-native-cached-image';
import t from 'tcomb-form-native';
import get from 'lodash.get';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { User } from 'models/User';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ScrollWrapper, Spacing } from 'components/Layout';
import ProfileImage from 'components/ProfileImage';
import { BaseText, MediumText } from 'components/Typography';
import Camera from 'components/Camera';
import { EmailStruct, PhoneStruct } from 'components/ProfileForm/profileFormDefs';
import TextInput from 'components/TextInput';
import Flag from 'components/Flag';
import Button from 'components/Button';
import { LabelBadge } from 'components/LabelBadge';
import InsightWithButton from 'components/InsightWithButton';
import InviteBanner from 'screens/People/InviteBanner';
import { Note } from 'components/Note';

// utils
import { spacing, appFont, fontSizes, lineHeights } from 'utils/variables';
import countries from 'utils/countries.json';
import { themedColors, getThemeColors } from 'utils/themes';
import { getEnsName } from 'utils/accounts';
import { images } from 'utils/images';

// actions
import { updateUserAction } from 'actions/userActions';
import { dismissInsight } from 'actions/insightsActions';
import { goToInvitationFlowAction } from 'actions/referralsActions';

// constants
import { PRIVACY_INSIGHT, VERIFICATION_NOTE } from 'constants/insightsConstants';

// types
import type { Accounts } from 'models/Account';
import type { Theme } from 'models/Theme';

// partials
import VerifyOTPModal from './VerifyOTPModal';
import CautionModal from './CautionModal';
import VerifiedModal from './VerifiedModal';


type Props = {
  navigation: NavigationScreenProp<*>,
  oneTimePasswordSent: boolean,
  user: User,
  updateUser: (walletId: string, field: Object) => void,
  accounts: Accounts,
  theme: Theme,
  privacyInsightDismissed: boolean,
  verificationNoteDismissed: boolean,
  dismissPrivacyInsight: () => void,
  dismissVerificationNote: () => void,
  goToInvitationFlow: () => void,
};

type State = {
  permissionsGranted: boolean,
  visibleModal: string,
  verifyingField: ?string,
  focusedField: ?string,
  value: Object,
  cautionModalField: ?string,
  verifiedModalField: ?string,
};

const RootContainer = styled.View`
  padding: 48px 20px 0px;
`;

const ImageWrapper = styled.View`
  width: 100%;
  align-items: center;
  justify-content: center;
`;

const ProfileImagePlaceholder = styled.View`
  width: 96px;
  height: 96px;
  border-radius: 48px;
  align-items: center;
  justify-content: center;
  background-color: ${themedColors.avatarPlaceholderBackground};
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
  align-items: center;
`;

const FieldWrapper = styled.View`
  flex-direction: row;
  padding: 20px 0 25px;
  align-items: ${({ alignItems }) => alignItems || 'flex-start'};
`;

const FieldIcon = styled(CachedImage)`
  width: 48px;
  height: 48px;
`;

const ProfileFormTemplate = (locals: Object) => {
  const { config = {} } = locals;
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
    icon,
    onSelectorClose,
    inputRef,
    isFormFocused,
    optionsSearchPlaceholder,
    optionsTitle,
    onSubmit,
  } = config;
  const errorMessage = locals.error;

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

  if (!isFocused) {
    const name = fieldDisplayValue || fieldDisplayName;
    let sideComponent;
    let description;
    let alignItems;

    if (isVerified) {
      sideComponent = (
        <LabelBadge positive labelStyle={{ fontSize: fontSizes.tiny, lineHeight: lineHeights.tiny }} label="Verified" />
      );
      alignItems = 'center';
    } else {
      const buttonTitle = fieldDisplayValue ? 'Verify' : 'Add';
      const buttonAction = fieldDisplayValue ? (() => onPressVerify(fieldName)) : (() => onFocus(fieldName));
      description = fieldDisplayValue ? descriptionAdded : descriptionEmpty;
      sideComponent = <Button horizontalPaddings={8} small title={buttonTitle} onPress={buttonAction} />;
    }

    return (
      <FieldWrapper pointerEvents={isFormFocused ? 'none' : 'auto'} alignItems={alignItems}>
        <FieldIcon source={icon} />
        <Spacing w={16} />
        <TouchableOpacity onPress={() => onFocus(fieldName)} style={{ flex: 1 }}>
          <FieldTitle>
            <MediumText big numberOfLines={1} style={{ flex: 1 }}>{name}</MediumText>
            <Spacing w={10} />
            {sideComponent}
          </FieldTitle>
          {description && (
            <>
              <Spacing h={8} />
              <BaseText regular secondary>{description}</BaseText>
            </>
          )}
        </TouchableOpacity>
      </FieldWrapper>
    );
  }

  return (
    <FieldWrapper>
      <FieldIcon source={icon} />
      <Spacing w={16} />
      <TextInput
        getInputRef={inputRef}
        errorMessage={errorMessage}
        inputProps={inputProps}
        selectorOptions={options ? {
          options,
          selectorModalTitle: label,
          optionsSearchPlaceholder,
          showOptionsTitles: true,
          optionsTitle,
        } : {}}
        inputWrapperStyle={{ flex: 1 }}
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
        renderSelector={(item) => {
          return (
            <SelectorWrapper>
              <Flag country={item.cca2} width={22} height={15} />
              <Spacing w={8} />
              <MediumText big>+{item.callingCode}</MediumText>
            </SelectorWrapper>
          );
        }}
      />
    </FieldWrapper>
  );
};


const sortedCountries = countries.sort((a, b) => a.name.localeCompare(b.name));

const formStructure = t.struct({
  phone: PhoneStruct,
  email: EmailStruct,
});

const { Form } = t.form;

class AddOrEditUser extends React.PureComponent<Props, State> {
  formRef: ?Object;
  phoneInputRef: ?Object;

  constructor(props) {
    super(props);
    const { user } = props;

    const { email = '', phone = '' } = user;

    const country = countries.find(c => phone.substring(1).startsWith(c.callingCode));
    const phoneInput = country && phone.substring(country.callingCode.length + 1);

    this.state = {
      verifyingField: null,
      permissionsGranted: false,
      visibleModal: '',
      value: { phone: { input: phoneInput || '', selector: country || countries.find(c => c.cca2 === 'US') }, email },
      focusedField: null,
      cautionModalField: null,
      verifiedModalField: null,
    };
  }

  getFormOptions = () => {
    const { theme, user } = this.props;
    const { focusedField, value } = this.state;
    const { isPhoneVerified, isEmailVerified } = user;
    const { roundedEmailIcon, roundedPhoneIcon } = images(theme);

    const formOptions = {
      fields: {
        email: {
          auto: 'placeholders',
          placeholder: 'Email',
          autoCapitalize: 'none',
          template: ProfileFormTemplate,
          config: {
            fieldName: 'email',
            isFocused: false,
            onFocus: this.onFieldFocus,
            fieldDisplayName: 'Email',
            descriptionEmpty: 'Add your email to be able receive special requests.',
            descriptionAdded: 'Verify your email and you will be able to invite your friends in Pillar ',
            icon: roundedEmailIcon,
            onPressVerify: this.verifyField,
            isFormFocused: !!focusedField,
            fieldDisplayValue: value.email,
            isVerified: isEmailVerified,
            onSubmit: this.onFieldBlur,
          },
        },
        phone: {
          keyboardType: 'phone-pad',
          fieldName: 'phone',
          template: ProfileFormTemplate,
          config: {
            fieldName: 'phone',
            label: 'Country code',
            hasInput: true,
            options: sortedCountries,
            isFocused: false,
            onFocus: this.onFieldFocus,
            onSelectorClose: this.onSelectorClose,
            fieldDisplayName: 'Phone number',
            descriptionEmpty: 'Add your phone number to be able to invite your friends.',
            descriptionAdded:
              'Verify your phone number and you will be able to invite your friends in Pillar community ',
            icon: roundedPhoneIcon,
            inputRef: (ref) => {
              if (this.phoneInputRef) this.phoneInputRef = ref;
            },
            onPressVerify: this.verifyField,
            optionsSearchPlaceholder: 'Country name',
            optionsTitle: 'All codes',
            isFormFocused: !!focusedField,
            fieldDisplayValue: value.phone.input && `+${value.phone.selector.callingCode}${value.phone.input}`,
            isVerified: isPhoneVerified,
            onSubmit: this.onFieldBlur,
          },
        },
      },
    };
    if (focusedField) {
      formOptions.fields[focusedField].config.isFocused = true;
    }
    return formOptions;
  }

  updateUser = () => {
    const {
      updateUser,
      user,
    } = this.props;
    const { value: { email, phone: { input, selector } } } = this.state;
    updateUser(user.walletId, { email, phone: `+${selector.callingCode}${input}` });
  }

  handleFormChange = (value: Object) => {
    this.setState({ value });
  }

  onFieldBlur = () => {
    const { updateUser, user } = this.props;
    const { focusedField, value } = this.state;
    if (!focusedField || !this.formRef) return;
    const e = this.formRef.getComponent(focusedField).validate();
    const isEmpty = focusedField === 'phone' ? !value.phone.input : !value.email;
    if (e.isValid() || isEmpty) {
      this.setState({ focusedField: null });
      if (focusedField === 'email' && value.email !== user.email) {
        updateUser(user.walletId, { email: value.email });
      } else if (focusedField === 'phone') {
        const { phone: { input, selector } } = value;
        const formattedPhone = input ? `+${selector.callingCode}${input}` : null;
        if (formattedPhone !== user.phone) {
          updateUser(user.walletId, { phone: formattedPhone });
        }
      }
    }
  }

  onFieldFocus = (fieldName) => {
    const { isEmailVerified, isPhoneVerified } = this.props.user;
    if ((fieldName === 'phone' && isPhoneVerified) || (fieldName === 'email' && isEmailVerified)) {
      this.setState({ cautionModalField: fieldName });
    } else {
      this.setState({ focusedField: fieldName });
    }
  }

  onSelectorClose = () => {
    if (!this.phoneInputRef) return;
    this.phoneInputRef.focus();
  }

  openCamera = async () => {
    let statusPhoto = RESULTS.GRANTED; // android doesn't need extra permission
    if (Platform.OS === 'ios') {
      statusPhoto = await requestPermission(PERMISSIONS.IOS.PHOTO_LIBRARY);
    }
    const statusCamera = await requestPermission(Platform.select({
      android: PERMISSIONS.ANDROID.CAMERA,
      ios: PERMISSIONS.IOS.CAMERA,
    }));
    this.setState({
      permissionsGranted: statusPhoto === RESULTS.GRANTED && statusCamera === RESULTS.GRANTED,
      visibleModal: 'camera',
    });
  };

  closeCamera = () => {
    this.setState({ visibleModal: '' });
  };

  verifyField = (verifyingField) => {
    this.setState({ verifyingField });
  };

  onCloseVerification = () => {
    const { verifyingField } = this.state;
    this.setState({ verifyingField: null, verifiedModalField: verifyingField });
  };

  getAlertData = (dataType: string) => {
    return ({
      title: `Change ${dataType}`,
      message: `You will have to re-verify your ${dataType} after changing it`,
    });
  };

  renderInsight = () => {
    const {
      verificationNoteDismissed,
      privacyInsightDismissed,
      dismissPrivacyInsight,
      dismissVerificationNote,
      user,
      goToInvitationFlow,
    } = this.props;
    const {
      isEmailVerified, isPhoneVerified, email, phone,
    } = user;
    if (isPhoneVerified || isEmailVerified) {
      return (
        <InviteBanner
          title="Pillar is social"
          onInvitePress={goToInvitationFlow}
        />
      );
    }
    if (email || phone) {
      if (verificationNoteDismissed) return null;
      return (
        <Note
          note="Verification is required to prevent scammers activity. We care for our users privacy."
          containerStyle={{ marginHorizontal: spacing.layoutSides }}
          onClose={dismissVerificationNote}
        />
      );
    }
    if (privacyInsightDismissed) return null;
    return (
      <InsightWithButton
        title="All your data is private"
        description="We care for our users' privacy. We don't support scammers.
                     We need to make sure you're a genuine user in order to get
                     rewarded with PLR tokens for inviting friends."
        buttonTitle="I understand"
        onButtonPress={dismissPrivacyInsight}
      />
    );
  }

  render() {
    const {
      permissionsGranted,
      visibleModal,
      verifyingField,
      value,
      focusedField,
      cautionModalField,
      verifiedModalField,
    } = this.state;
    const {
      user, navigation, theme, accounts, goToInvitationFlow,
    } = this.props;

    const {
      profileImage,
      lastUpdateTime = 0,
      username = '',
    } = user;


    const colors = getThemeColors(theme);

    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [
            { title: 'User settings' },
          ],
        }}
        inset={{ bottom: 0 }}
      >
        <ScrollWrapper disableOnAndroid keyboardShouldPersistTaps="handled">
          <TouchableWithoutFeedback onPress={this.onFieldBlur}>
            <RootContainer>
              <View pointerEvents={focusedField ? 'none' : 'auto'}>
                <TouchableOpacity onPress={this.openCamera}>
                  <ImageWrapper>
                    {!!profileImage && <ProfileImage
                      uri={`${profileImage}?t=${lastUpdateTime}`}
                      userName={username}
                      diameter={96}
                      borderWidth={0}
                      noShadow
                    />}
                    {!profileImage &&
                    <ProfileImagePlaceholder>
                      <MediumText big color={colors.avatarPlaceholderText}>{username.substring(0, 1)}</MediumText>
                    </ProfileImagePlaceholder>}
                  </ImageWrapper>
                </TouchableOpacity>
                <Spacing h={20} />
                <MediumText large center>{username}</MediumText>
                <BaseText regular secondary center>{getEnsName(accounts)}</BaseText>
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

        <Camera
          isVisible={visibleModal === 'camera'}
          modalHide={this.closeCamera}
          permissionsGranted={permissionsGranted}
          navigation={navigation}
        />

        {!!verifyingField && <VerifyOTPModal
          verifyingField={verifyingField}
          onModalClose={this.onCloseVerification}
        />}
        <CautionModal
          isVisible={!!cautionModalField}
          onModalHide={() => this.setState({ cautionModalField: null })}
          onButtonPress={() => this.setState({ cautionModalField: null, focusedField: cautionModalField })}
          focusedField={cautionModalField}
        />
        <VerifiedModal
          isVisible={!!verifiedModalField}
          onModalHide={() => this.setState({ verifiedModalField: null })}
          onButtonPress={goToInvitationFlow}
          verifiedField={verifiedModalField}
        />
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
  insights: { [PRIVACY_INSIGHT]: privacyInsightDismissed, [VERIFICATION_NOTE]: verificationNoteDismissed },
}: RootReducerState): $Shape<Props> => ({
  user,
  oneTimePasswordSent,
  accounts,
  privacyInsightDismissed,
  verificationNoteDismissed,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  updateUser: (walletId: string, field: Object) =>
    dispatch(updateUserAction(walletId, field)),
  dismissPrivacyInsight: () => dispatch(dismissInsight(PRIVACY_INSIGHT)),
  dismissVerificationNote: () => dispatch(dismissInsight(VERIFICATION_NOTE)),
  goToInvitationFlow: () => dispatch(goToInvitationFlowAction()),
});

export default withTheme(connect(mapStateToProps, mapDispatchToProps)(AddOrEditUser));
