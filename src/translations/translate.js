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
import i18next from 'i18next';
import { Trans } from 'react-i18next';
import { BaseText } from 'components/Typography';
import type { TranslationOptions, TranslatedString } from 'models/Translations';


const t = (key: string | string[], options?: TranslationOptions = {}): TranslatedString => {
  const { linkedText, primaryText, onPress } = options;
  if (linkedText) {
    return (
      <Trans
        i18nKey={key}
        components={onPress ? [<BaseText {...options} link />] : []}
        values={{ linkedText }}
      />
    );
  }
  if (primaryText) {
    return (
      <Trans
        i18nKey={key}
        components={[<BaseText {...options} primary />]}
        values={{ primaryText }}
      />
    );
  }
  return i18next.t(key, options);
};

export default t;
