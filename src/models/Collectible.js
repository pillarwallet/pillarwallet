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

export type Collectible = {
  animation_url: string,
  assetContract: string,
  background: string,
  current_price: string,
  description: string,
  external_link: string,
  id: string,
  image_original_url: string,
  image_preview_url: string,
  image_thumbnail_url: string,
  image_url: string,
  lastPrice: number,
  name: string,
  permalink: string,
  traits: Object[],
};
