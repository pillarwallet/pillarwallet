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

export const DEFAULT_LANGUAGE = 'en';
export const SUPPORTED_LANGUAGES = ['en', 'fr'];

export const DEFAULT_NAMESPACE = 'common';
export const NAMESPACES = ['common', 'auth'];

export const CAPITALIZATION_POSTPROCESSOR = 'capitalization';
export const PUNCTUATION_POSTPROCESSOR = 'punctuation';
export const SUFFIX_PREFIX_POSTPROCESSOR = 'suffixPrefix';
export const POST_PROCESSORS = [PUNCTUATION_POSTPROCESSOR, CAPITALIZATION_POSTPROCESSOR, SUFFIX_PREFIX_POSTPROCESSOR];
