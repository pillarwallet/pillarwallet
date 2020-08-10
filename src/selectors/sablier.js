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
  SABLIER_CREATE_STREAM,
  SABLIER_CANCEL_STREAM,
  SABLIER_STREAM_ENDED,
  SABLIER_EVENT,
} from 'constants/sablierConstants';
import { getTimestamp } from 'utils/sablier';
import type { RootReducerState } from 'reducers/rootReducer';

export const sablierEventsSelector = ({ sablier: { outgoingStreams, incomingStreams } }: RootReducerState) => {
  const sablierEvents = incomingStreams.reduce((events, stream) => {
    const event = {
      type: SABLIER_EVENT,
      streamId: stream.id,
      contactAddress: stream.sender,
    };
    events.push({
      tag: SABLIER_CREATE_STREAM,
      createdAt: stream.timestamp,
      ...event,
    });
    if (stream.cancellation) {
      events.push({
        tag: SABLIER_CANCEL_STREAM,
        createdAt: stream.cancellation.timestamp,
        ...event,
      });
    }
    if (!stream.cancellation && +stream.stopTime < getTimestamp()) {
      events.push({
        tag: SABLIER_STREAM_ENDED,
        createdAt: stream.stopTime,
        incoming: true,
        ...event,
      });
    }
    return events;
  }, []);
  outgoingStreams.reduce((events, stream) => {
    if (!stream.cancellation && +stream.stopTime < getTimestamp()) {
      events.push({
        type: SABLIER_EVENT,
        tag: SABLIER_STREAM_ENDED,
        createdAt: stream.stopTime,
        contactAddress: stream.recipient,
        outgoing: true,
        streamId: stream.id,
      });
    }
    return events;
  }, sablierEvents);
  return sablierEvents;
};
