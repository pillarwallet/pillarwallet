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

import * as React from 'react';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import Switcher from 'components/Switcher';
import Text from 'components/modern/Text';

// Utils
import { fontStyles, spacing } from 'utils/variables';

type Props = {|
  showSideChains: boolean,
  onToggleSideChains: (boolean) => mixed,
|};

function Controls({ showSideChains, onToggleSideChains }: Props) {
  const { t } = useTranslationWithPrefix('home.controls');

  return (
    <Container>
      <SwitchLabel>{t('sideChains')}</SwitchLabel>
      <Switcher isOn={showSideChains} onToggle={onToggleSideChains} />
    </Container>
  );
}

export default Controls;

const Container = styled.View`
  flex-direction: row;
  align-items: center;
  margin: ${spacing.mediumLarge}px 0 0;
`;

const SwitchLabel = styled(Text)`
  ${fontStyles.small};
  margin-right: ${spacing.small}px;
`;
