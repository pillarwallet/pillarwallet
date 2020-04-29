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

import React from 'react';
import { TouchableOpacity } from 'react-native';
import styled, { withTheme } from 'styled-components/native';
import { CachedImage } from 'react-native-cached-image';

import { Note } from 'components/Note';
import { spacing } from 'utils/variables';
import { images } from 'utils/images';
import type { Theme } from 'models/Theme';


type Props = {
  isEmailVerified: boolean,
  isPhoneVerified: boolean,
  onPressAdd: () => void,
  theme: Theme,
};


const NoteImage = styled(CachedImage)`
  width: 48px;
  height: 48px;
`;

const IconWrapper = styled.View`
  padding-left: 36px;
`;

const PHONE = 'phone number';
const EMAIL = 'email';

const getMissingVerification = (isPhoneVerified: boolean, isEmailVerified: boolean): ?string => {
  if (!isPhoneVerified) return PHONE;
  if (!isEmailVerified) return EMAIL;

  return null;
};

const MissingInfoNote = (props: Props) => {
  const {
    isEmailVerified,
    isPhoneVerified,
    onPressAdd,
    theme,
  } = props;

  const missingType = getMissingVerification(isPhoneVerified, isEmailVerified);

  if (!missingType) {
    return null;
  }

  const { roundedEmailIcon, roundedPhoneIcon } = images(theme);
  const noteIcon = missingType === PHONE ? roundedPhoneIcon : roundedEmailIcon;

  return (
    <TouchableOpacity onPress={onPressAdd}>
      <Note
        containerStyle={{ margin: spacing.layoutSides, marginTop: 0 }}
        note={`To invite via ${missingType === PHONE ? 'SMS' : missingType}, you need to verify your ${missingType}.`}
      >
        <IconWrapper>
          <NoteImage source={noteIcon} />
        </IconWrapper>
      </Note>
    </TouchableOpacity>
  );
};

export default withTheme(MissingInfoNote);
