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
import { useDispatch } from 'react-redux';
import t from 'translations/translate';

// Components
import ContainerWithHeader from 'components/legacy/Layout/ContainerWithHeader';

// Actions
import { fetchAllCollectiblesDataAction } from 'actions/collectiblesActions';

// Local
import PPNView from './PPNView';

/**
 * This is legacy PPN Home screen extracted from legacy Assets screen.
 */
function PPNHome() {
  const dispatch = useDispatch();

  React.useEffect(() => {
    dispatch(fetchAllCollectiblesDataAction());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  return (
    <ContainerWithHeader
      headerProps={{
        centerItems: [
          {
            title: t('ppnContent.title.home'),
          },
        ],
      }}
      inset={{ bottom: 0 }}
      tab
    >
      {(onScroll) => <PPNView onScroll={onScroll} />}
    </ContainerWithHeader>
  );
}

export default PPNHome;
