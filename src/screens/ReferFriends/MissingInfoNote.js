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
import styled from 'styled-components/native';

import { BaseText, TextLink } from 'components/Typography';
import { Note } from 'components/Note';
import { fontStyles, spacing } from 'utils/variables';


type Props = {
  isEmailVerified: boolean,
  isPhoneVerified: boolean,
  onPressAdd: () => void,
};

const StyledTextLink = styled(TextLink)`
  ${fontStyles.regular};
`;

const getMissingVerification = (isPhoneVerified: boolean, isEmailVerified: boolean): ?string => {
  if (!isPhoneVerified) return 'phone';
  if (!isEmailVerified) return 'email';

  return null;
};

const MissingInfoNote = (props: Props) => {
  const {
    isEmailVerified,
    isPhoneVerified,
    onPressAdd,
  } = props;

  const missingType = getMissingVerification(isPhoneVerified, isEmailVerified);

  if (!missingType) {
    return null;
  }

  return (
    <Note
      containerStyle={{ margin: spacing.layoutSides, marginTop: 0 }}
      note={
        <React.Fragment>
          <BaseText>
            {`To show your ${missingType} contacts, please add and verify your ${missingType}. `}
          </BaseText>
          <StyledTextLink onPress={onPressAdd}>Add</StyledTextLink>
        </React.Fragment>
      }
    />
  );
};

export default MissingInfoNote;
