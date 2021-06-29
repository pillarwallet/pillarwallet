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

export const renderHTMLfromPrismic = (type: string, text: string): string => {
  /* eslint-disable i18next/no-literal-string */
  switch (type) {
    case 'heading1':
      return `<h1>${text}</h1>`;
    case 'heading4':
      return `<h4>${text}</h4>`;
    case 'heading6':
      return `<h6>${text}</h6>`;
    case 'paragraph':
      return `<p>${text}</p>`;
    case 'list-item':
      return `<li>${text}</li>`;
    default:
      return '';
  }
  /* eslint-enable i18next/no-literal-string */
};
