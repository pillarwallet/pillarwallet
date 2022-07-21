// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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

import React, { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import t from 'translations/translate';
import styled from 'styled-components/native';
import { useNavigation } from 'react-navigation-hooks';
import { useDispatch } from 'react-redux';
import { debounce } from 'lodash';

// Actions
import {
  checkUsernameAvailabilityAction,
  resetUsernameCheckAction,
  claimENSNameAction,
} from 'actions/onboardingActions';

// Constants
import { CHAIN } from 'constants/chainConstants';

// Utils
import { appFont, spacing, fontSizes } from 'utils/variables';
import { useThemeColors } from 'utils/themes';
import { validateUsername } from 'utils/validators';
import { getEnsPrefix } from 'utils/common';
import { useChainConfig } from 'utils/uiConfig';
import { getGasAddress } from 'utils/transactions';

// Selectors
import { useRootSelector } from 'selectors';
import { useUser } from 'selectors/user';

// Components
import { Container, Content } from 'components/layout/Layout';
import Text from 'components/core/Text';
import TextInput from 'components/legacy/TextInput';
import HeaderBlock from 'components/HeaderBlock';
import Icon from 'components/core/Icon';
import LegacyButton from 'components/legacy/Button';
import Button from 'components/core/Button';
import FeeLabel from 'components/display/FeeLabel';

// Types
import type { OnboardingUser } from 'models/User';

const RegisterENS = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const colors = useThemeColors();
  const ensName = useUser();
  const { gasSymbol } = useChainConfig(CHAIN.ETHEREUM);

  const user = useRootSelector((root) => root.onboarding.user);
  const errorMessage = useRootSelector((root) => root.onboarding.errorMessage);
  const feeInfo = useRootSelector((root) => root.transactionEstimate.feeInfo);
  const isEstimating = useRootSelector((root) => root.transactionEstimate.isEstimating);
  const estimationErrorMessage = useRootSelector((root) => root.transactionEstimate.errorMessage);

  const [usernameValue, setUsernameValue] = useState(!ensName?.username ? null : ensName?.username);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  const gasAddress = getGasAddress(CHAIN.ETHEREUM, feeInfo?.gasToken);
  const isUsernameInputDirty = usernameValue !== null;
  const usernameValidationErrorMessage = isUsernameInputDirty ? validateUsername(usernameValue) : null;
  const buttonDisable = !!usernameValidationErrorMessage || !!errorMessage || isCheckingUsername;
  const isEditable = ensName?.username;
  const showFeeValue = !estimationErrorMessage && !!feeInfo;
  const showENSSaveButton = !!usernameValue && !feeInfo && !estimationErrorMessage;

  const getButtonName = () => {
    if (!!usernameValidationErrorMessage && !errorMessage) return usernameValidationErrorMessage;
    if (!usernameValidationErrorMessage && errorMessage) return errorMessage;
    return t('button.save');
  };

  const reserveENSName = () => {
    if (user?.username) dispatch(claimENSNameAction(user?.username));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onValidUsername = useCallback(
    debounce(() => {
      if (usernameValue && !ensName?.username) dispatch(checkUsernameAvailabilityAction(usernameValue));
    }, 200),
    [usernameValue],
  );

  useEffect(() => {
    // prepare for username check if no user set
    if (!user && !ensName?.username) dispatch(resetUsernameCheckAction(true));
    if (ensName?.username) dispatch(claimENSNameAction(ensName?.username));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isCheckingUsername && !usernameValidationErrorMessage && !errorMessage && isUsernameInputDirty && !ensName) {
      setIsCheckingUsername(true);
    } else if (isCheckingUsername && (usernameValidationErrorMessage || errorMessage)) {
      // reset if error occurred during update
      setIsCheckingUsername(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usernameValue, errorMessage]);

  useEffect(() => {
    // user updated, reset
    if (isCheckingUsername) setIsCheckingUsername(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!usernameValidationErrorMessage) onValidUsername();
    return onValidUsername.cancel;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onValidUsername, usernameValue]);

  const { statusIcon, iconColor } = getUsernameInputIcon(
    colors,
    isUsernameInputDirty,
    isCheckingUsername,
    user,
    usernameValidationErrorMessage,
    errorMessage,
  );

  return (
    <Container>
      <HeaderBlock
        centerItems={[{ title: t('title.registerEnsName') }]}
        leftItems={[{ close: true }]}
        navigation={navigation}
        noPaddingTop
      />
      <Content paddingHorizontal={0} paddingVertical={0}>
        <StyledWrapper>
          <TextInput
            loading={isCheckingUsername}
            iconProps={{
              icon: !ensName?.username ? statusIcon : null,
              color: !ensName?.username ? iconColor : null,
            }}
            inputProps={{
              value: `${usernameValue || ''}`,
              autoCapitalize: 'none',
              autoFocus: true,
              onChange: setUsernameValue,
              placeholder: t('label.username'),
              editable: isEditable,
            }}
            placeholderTextColor={colors.tertiaryText}
            inputWrapperStyle={styles.inputWrapperStyles}
            itemHolderStyle={styles.itemHolderStyles}
            additionalStyle={[styles.additionalStyle]}
            inputError={!!usernameValidationErrorMessage || !!errorMessage}
          />
          <Text variant="medium" style={styles.textStyle}>
            {getEnsPrefix()}
          </Text>
        </StyledWrapper>
        <Footer behavior={Platform.OS === 'ios' ? 'position' : null}>
          {showFeeValue && (
            <FeeView>
              <FeeLabel
                value={feeInfo?.fee}
                assetSymbol={gasSymbol}
                assetAddress={gasAddress}
                isLoading={isEstimating}
                isNotEnough={false}
                chain={CHAIN.ETHEREUM}
                mode="actual"
              />
              {!isEstimating && (
                <Icon name="info" width={16} height={16} color={colors.buttonTextTitle} style={styles.infoIcon} />
              )}
            </FeeView>
          )}
          {!buttonDisable && showENSSaveButton && (
            <Text color={colors.negative} style={styles.textStyle}>
              {t('auth:label.ensNameWarningMessage')}
            </Text>
          )}
          {showENSSaveButton && (
            <Button
              title={buttonDisable ? getButtonName() : t('button.save')}
              size="large"
              disabled={buttonDisable}
              onPress={reserveENSName}
              style={styles.buttonStyle}
            />
          )}
          {(!!feeInfo || !!ensName?.username) && <LegacyButton title={t('button.confirm')} disabled={!showFeeValue} />}
        </Footer>
      </Content>
    </Container>
  );
};

const styles = {
  inputWrapperStyles: {
    backgroundColor: 'transparent',
    zIndex: 10,
    marginTop: 20,
  },
  itemHolderStyles: {
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  additionalStyle: {
    fontSize: fontSizes.giant,
    fontFamily: appFont.regular,
    textAlign: 'center',
  },
  placeholderStyle: {
    fontSize: fontSizes.giant,
  },
  buttonStyle: {
    marginTop: 8,
  },
  infoIcon: {
    justifyContent: 'center',
    paddingLeft: spacing.medium,
  },
  textStyle: {
    textAlign: 'center',
  },
};

export default RegisterENS;

const Footer = styled.KeyboardAvoidingView`
  padding: 20px 20px 20px;
`;

const StyledWrapper = styled.View`
  flex-grow: 1;
  padding: 32px ${spacing.layoutSides}px ${spacing.layoutSides}px;
`;

const FeeView = styled.View`
  flex-direction: row;
  margin-top: ${spacing.largePlus}px;
  margin-bottom: ${spacing.large}px;
  justify-content: center;
  align-items: center;
`;

export const getUsernameInputIcon = (
  colors: Object,
  isUsernameInputDirty: boolean,
  isCheckingUsername: boolean,
  user: ?OnboardingUser,
  usernameValidationErrorMessage: ?string,
  errorMessage: ?string,
) => {
  let statusIcon = null;
  let iconColor = null;

  if (isUsernameInputDirty && !isCheckingUsername) {
    if (usernameValidationErrorMessage || errorMessage) {
      statusIcon = 'close'; // eslint-disable-line i18next/no-literal-string
      iconColor = colors.negative;
    } else if (user?.username) {
      statusIcon = 'check'; // eslint-disable-line i18next/no-literal-string
      iconColor = colors.positive;
    }
  }
  return { statusIcon, iconColor };
};
