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
import OverlayModal from 'components/OverlayModal/OverlayModal';

type Props = {
    isVisible: boolean,
    onButtonPress: () => void,
}

const content = `Pillar Exchange or Offers Engine, as we call it,\
 aggregates offers from multiple providers vetted by Pillar. 

Buy crypto with credit cards, Apple Pay or Google Pay. Exchange tokens in a few taps.`;

export default (props: Props) => (
  <OverlayModal
    isVisible={props.isVisible}
    onButtonPress={props.onButtonPress}
    title="Exchange."
    content={content}
    buttonText="Next"
  />
);
