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


import {
  SET_STREAMS,
  SET_FETCHING_STREAMS,
  SET_SABLIER_GRAPH_QUERY_ERROR,
} from 'constants/sablierConstants';
import reducer from 'reducers/sablierReducer';

describe('Sablier reducer', () => {
  describe('handles subgraph query status', () => {
    it('marks start of the request', () => {
      const state = reducer(undefined, { type: SET_FETCHING_STREAMS });
      expect(state).toMatchObject({ isFetchingStreams: true });
    });

    it('marks error when it occurs', () => {
      const state = reducer(undefined, { type: SET_SABLIER_GRAPH_QUERY_ERROR });
      expect(state).toMatchObject({ streamsGraphQueryFailed: true });
    });

    it('resets fetching status on error', () => {
      const actions = [
        { type: SET_FETCHING_STREAMS },
        { type: SET_SABLIER_GRAPH_QUERY_ERROR },
      ];

      const state = actions.reduce(reducer, undefined);
      expect(state).toMatchObject({ isFetchingStreams: false });
    });

    it('resets fetching and query status when receiving data', () => {
      const actions = [
        { type: SET_SABLIER_GRAPH_QUERY_ERROR },
        { type: SET_FETCHING_STREAMS },
        {
          type: SET_STREAMS,
          payload: {
            incomingStreams: [],
            outgoingStreams: [],
          },
        },
      ];

      const state = actions.reduce(reducer, undefined);
      expect(state).toMatchObject({
        isFetchingStreams: false,
        streamsGraphQueryFailed: false,
      });
    });
  });
});
