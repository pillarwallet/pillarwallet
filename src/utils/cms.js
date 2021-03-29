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

import orderBy from 'lodash.orderby';
import type { CMSDocument, ParsedCMSDocument, TutorialDataObject, CMSData } from 'models/CMSData';
import { CMS_DATA_TYPES } from 'constants/cmsConstants';

const {
  ONBOARDING_SCREENS_FOR_NATIVES: NATIVES,
  ONBOARDING_SCREENS_FOR_NEWBIES: NEWBIES,
} = CMS_DATA_TYPES;

const getSortedTutorialData = (docs: CMSDocument[], type: string): ParsedCMSDocument[] =>
  orderBy(docs.map(d => parseCMSDocument(d)).filter(d => d.type === type), i => (i.order || 0), ['asc']);

const parseCMSDocument = (doc: CMSDocument): ParsedCMSDocument => {
  const {
    id, type, href, slugs, data: {
      order = 0, title, subtitle, body, image,
    } = {},
  } = doc;
  return {
    id,
    type,
    href,
    slugs,
    order,
    title: title[0]?.text || '',
    subtitle: subtitle[0]?.text || '',
    body: body[0]?.text || '',
    imageUrl: image?.url || '',
    imageHeight: image?.dimensions?.height || 0,
    imageWidth: image?.dimensions?.width || 0,
  };
};

export const getTutorialDataObject = (res: CMSData): ?TutorialDataObject => {
  if (!res?.results?.length) return null;
  return {
    [NATIVES]: getSortedTutorialData(res.results, NATIVES),
    [NEWBIES]: getSortedTutorialData(res.results, NEWBIES),
  };
};

export const isValidTutorialData = (data: ?TutorialDataObject): boolean =>
  !!data && !!data[NATIVES]?.length && !!data[NEWBIES]?.length;
