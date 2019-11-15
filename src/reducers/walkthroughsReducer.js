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
  ADD_WALKTHROUGH,
  END_WALKTHROUGH,
  ADD_WALKTHROUGH_STEPS,
  UPDATE_WAITING_FOR_STEP_REF,
} from 'constants/walkthroughConstants';


type Step = {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  buttonText?: string;
  isLast?: boolean; // TODO: remove when won't be used
  action?: () => void; // TODO: remove when won't be used
}

export type Steps = Step[];

export type WalkthroughsReducerState = {
  steps: Steps,
  type: string,
  waitingForStepId: string,
}

export type WalkthroughsReducerAction = {
  type: string,
  payload: any
}

const initialState: WalkthroughsReducerState = {
  steps: [],
  type: '',
  waitingForStepId: '',
};

const walkthroughsReducer = (
  state: WalkthroughsReducerState = initialState,
  action: WalkthroughsReducerAction,
): WalkthroughsReducerState => {
  switch (action.type) {
    case ADD_WALKTHROUGH:
      return { ...state, type: action.payload.type, steps: action.payload.steps };
    case ADD_WALKTHROUGH_STEPS:
      return { ...state, steps: [...state.steps, ...action.payload] };
    case END_WALKTHROUGH:
      return { ...state, id: '', steps: [] };
    case UPDATE_WAITING_FOR_STEP_REF:
      return { ...state, waitingForStepId: action.payload };
    default:
      return state;
  }
};

export default walkthroughsReducer;
