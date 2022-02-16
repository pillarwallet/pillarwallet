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
import { Trans, useTranslation } from 'react-i18next';
import { BaseText, MediumText } from 'components/legacy/Typography';
import type { TranslationOptions, TranslatedString } from 'models/Translations';

export { useTranslation } from 'react-i18next';

const t = (key: string, options: TranslationOptions = {}): TranslatedString => {
  const { linkedText, primaryText, mediumText, onPress, ...values } = options;
  if (linkedText) {
    return (
      <Trans
        i18nKey={key}
        // $FlowFixMe: we're passing a lot translation options as props to base text.
        components={onPress ? [<BaseText {...options} link />] : []}
        values={{ linkedText }}
      />
    );
  }
  if (primaryText) {
    return (
      <Trans
        i18nKey={key}
        // $FlowFixMe: we're passing a lot translation options as props to base text.
        components={[<BaseText {...options} primary />]}
        values={{ primaryText }}
      />
    );
  }
  if (mediumText) {
    return (
      <Trans
        i18nKey={key}
        // $FlowFixMe: we're passing a lot translation options as props to base text.
        components={[<MediumText {...options} />]}
        values={values}
      />
    );
  }
  return i18next.t(key, options);
};

export default t;

export type TFunction = (key: string, options?: any) => string;

export const useTranslationWithPrefix = (prefix: string) => {
  const tRoot: TFunction = useTranslation().t;

  // eslint-disable-next-line no-shadow
  const t: TFunction = React.useCallback(
    (key: string, options?: any): string => (key != null ? tRoot(`${prefix}.${key}`, options) : ''),
    [tRoot, prefix],
  );

  return { t, tRoot };
};
