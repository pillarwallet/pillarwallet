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
import { ScrollView, Share } from 'react-native';
import Intercom from 'react-native-intercom';
import t from 'tcomb-form-native';
import styled, { withTheme } from 'styled-components/native';
import get from 'lodash.get';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Theme } from 'models/Theme';

// constants
import { VERIFY_EMAIL } from 'constants/navigationConstants';

// actions
import { inviteByEmailAction } from 'actions/referralsActions';

// components
import { MediumText } from 'components/Typography';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Insight from 'components/Insight';
import TextInput from 'components/TextInput';
import { EmailStruct } from 'components/ProfileForm/profileFormDefs';
import { Banner } from 'components/Banner';

// utils
import { spacing, fontStyles, fontSizes } from 'utils/variables';
import { themedColors, getThemeColors } from 'utils/themes';

const INSIGHT_ITEMS = [
  {
    title: 'Share your link',
    body: 'Invite your friends to join Pillar',
  },
  {
    title: 'Give Smart Wallet for free',
    body: 'Friends who install Pillar with your link will get free Smart Wallet activation.',
  },
  {
    title: 'Get free PLR',
    body: 'Earn meta-tokens for referring friends.',
  },
];

type Props = {
  navigation: NavigationScreenProp<*>,
  inviteByEmail: (email: string) => void,
  theme: Theme,
  isEmailVerified: boolean,
};

type Value = {
  email: string,
};

type State = {
  value: Value,
  showFormButton: boolean,
  isFormButtonDisabled: boolean,
  hideErrorMessage: boolean,
};

const FormWrapper = styled.View`
  padding: 30px ${spacing.layoutSides}px ${spacing.layoutSides}px;
`;

const ExplanationText = styled(MediumText)`
  color: ${themedColors.secondaryText};
  ${fontStyles.small};
  margin-top: 6px;
`;

const { Form } = t.form;

const ReferralEmailInputTemplate = (locals) => {
  const {
    config: {
      onIconPress,
      label,
      showButton,
      isButtonDisabled,
      hideErrorMessage,
      onFormSubmit,
    },
  } = locals;
  const errorMessage = locals.error;
  const inputProps = {
    onChange: locals.onChange,
    onBlur: locals.onBlur,
    placeholder: 'Enter your friend\'s email',
    value: locals.value,
    maxLength: 42,
    letterSpacing: 0.1,
    fontSize: fontSizes.medium,
    keyboardType: 'email-address',
    autoCapitalize: 'none',
  };

  const defaultButtonProps = {
    title: 'Invite',
    onPress: onFormSubmit,
    disabledTransparent: false,
  };

  let buttonProps = { ...defaultButtonProps };

  if (isButtonDisabled) buttonProps = { ...defaultButtonProps, disabledTransparent: true };

  return (
    <TextInput
      errorMessage={errorMessage}
      inputProps={inputProps}
      iconProps={!showButton && {
        icon: 'add-contact',
        fontSize: 20,
        onPress: onIconPress,
      }}
      label={label}
      buttonProps={showButton && buttonProps}
      hideErrorMessage={hideErrorMessage}
    />
  );
};

const getReferralFormFields = (config: Object): Object => {
  return {
    fields: {
      email: {
        template: ReferralEmailInputTemplate,
        config,
      },
    },
  };
};

class ReferFriends extends React.Component<Props, State> {
  referForm: t.form;

  state = {
    value: {
      email: '',
    },
    showFormButton: false,
    isFormButtonDisabled: true,
    hideErrorMessage: true,
  };

  handleChange = (value: Object) => {
    const email = get(value, 'email', '');
    const validatedValue = this.referForm.getValue();
    const showFormButton = !!email.length;
    const isFormButtonDisabled = !validatedValue;
    this.setState({ value, showFormButton, isFormButtonDisabled });
  };

  handleSubmit = () => {
    const email = get(this.state.value, 'email', '');
    this.props.inviteByEmail(email);
    this.setState({ hideErrorMessage: false });
  };

  openShareDialog = () => {
    Share.share({
      title: 'Join Pillar',
      message: '', // TODO: Add referral link as message
    }, {
      dialogTitle: 'Refer friend',
    });
  };

  verifyEmail = () => {
    const { navigation } = this.props;
    navigation.navigate(VERIFY_EMAIL);
  };

  render() {
    const {
      value,
      showFormButton,
      isFormButtonDisabled,
      hideErrorMessage,
    } = this.state;

    const {
      isEmailVerified,
      theme,
    } = this.props;

    const colors = getThemeColors(theme);


    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [{ title: 'Refer friend' }],
          rightItems: [
            {
              link: 'Support',
              onPress: () => Intercom.displayMessenger(),
            },
          ],
          sideFlex: 2,
        }}
      >
        <ScrollView>
          <Insight
            isVisible
            insightNumberedList={INSIGHT_ITEMS}
          />
          <Banner
            isVisible={!isEmailVerified}
            onPress={this.verifyEmail}
            bannerText="You need to verify your email before you can refer people."
            wrapperStyle={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
          />
          {isEmailVerified &&
            <FormWrapper>
              <Form
                ref={node => { this.referForm = node; }}
                type={t.struct({
                  email: EmailStruct,
                })}
                options={getReferralFormFields({
                  onIconPress: this.openShareDialog,
                  label: 'Friend\'s email',
                  showButton: showFormButton,
                  isButtonDisabled: isFormButtonDisabled,
                  hideErrorMessage,
                  onFormSubmit: this.handleSubmit,
                })}
                value={value}
                onChange={this.handleChange}
              />
              <ExplanationText>
                Upon invited, your friend will receive email link for download. Referral rewards are available with this
                link only.
              </ExplanationText>
            </FormWrapper>}
        </ScrollView>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  user: {
    data: {
      isEmailVerified,
    },
  },
}: RootReducerState): $Shape<Props> => ({
  isEmailVerified,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  inviteByEmail: (email: string) => dispatch(inviteByEmailAction(email)),
});

export default withTheme(connect(mapStateToProps, mapDispatchToProps)(ReferFriends));
