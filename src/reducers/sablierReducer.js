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
import type { Stream, Streams } from 'models/Sablier';


export type SablierReducerState = {
  outgoingStreams: Stream[],
  incomingStreams: Stream[],
  isFetchingStreams: boolean,
  streamsGraphQueryFailed: boolean,
};

type SetStreamsAction = {
  type: typeof SET_STREAMS,
  payload: Streams,
};

type SetFetchingStreamsAction = {
  type: typeof SET_FETCHING_STREAMS,
};

type SetStreamsGraphQueryErrorAction = {
  type: typeof SET_SABLIER_GRAPH_QUERY_ERROR,
};

export type SablierReducerAction =
  | SetStreamsAction
  | SetFetchingStreamsAction
  | SetStreamsGraphQueryErrorAction;

export const initialState = {
  outgoingStreams: [],
  incomingStreams: [],
  isFetchingStreams: false,
  streamsGraphQueryFailed: false,
};

export default function sablierReducer(
  state: SablierReducerState = initialState,
  action: SablierReducerAction,
): SablierReducerState {
  switch (action.type) {
    case SET_STREAMS:
      return {
        ...state,
        ...action.payload,
        isFetchingStreams: false,
        streamsGraphQueryFailed: false,
      };
    case SET_FETCHING_STREAMS:
      return { ...state, isFetchingStreams: true };
    case SET_SABLIER_GRAPH_QUERY_ERROR:
      return {
        ...state,
        isFetchingStreams: false,
        streamsGraphQueryFailed: true,
      };
    default:
      return state;
  }
}
