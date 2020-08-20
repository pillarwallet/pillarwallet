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
import t from 'translations/translate';

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


const MissingInfoNote = (props: Props) => {
  const {
    isEmailVerified,
    isPhoneVerified,
    onPressAdd,
    theme,
  } = props;

  if (isPhoneVerified && isEmailVerified) {
    return null;
  }

  const { roundedEmailIcon, roundedPhoneIcon } = images(theme);
  const noteIcon = !isPhoneVerified ? roundedPhoneIcon : roundedEmailIcon;

  return (
    <TouchableOpacity onPress={onPressAdd}>
      <Note
        containerStyle={{ margin: spacing.layoutSides, marginTop: 0 }}
        note={!isPhoneVerified
          ? t('referralsContent.paragraph.invitationViaPhoneRules')
          : t('referralsContent.paragraph.invitationViaEmailRules')}
      >
        <IconWrapper>
          <NoteImage source={noteIcon} />
        </IconWrapper>
      </Note>
    </TouchableOpacity>
  );
};

export default withTheme(MissingInfoNote);
