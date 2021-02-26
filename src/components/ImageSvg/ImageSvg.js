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

// Assets
import IconAddContact from 'assets/icons/icon_add_contact.svg';

const componentMap = {
  iconAddContact: (IconAddContact: any),
};

export type ImageSvgName = $Keys<typeof componentMap>;

type Props = {|
  name: ImageSvgName,
  color?: string,
|};

/**
 *  Component for displaying SVG i
 */
const ImageSvg = ({ name, color }: Props) => {
  const Component = componentMap[name];
  return <Component fill={color} />;
};

export default ImageSvg;
