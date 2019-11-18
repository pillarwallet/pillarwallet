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
  ADD_WALKTHROUGH_STEP_MEASURE,
} from 'constants/walkthroughConstants';

export type Measurements = {
  x: number,
  y: number,
  w: number,
  h: number,
}

type Step = {
  id: string,
  measure: Measurements,
  label: string;
  activeScreen: string;
  body: string;
  buttonText: string;
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
    case ADD_WALKTHROUGH_STEP_MEASURE:
      return {
        ...state,
        steps: state.steps.map((step) => {
          if (step.id !== action.payload.stepId) {
            return step;
          }
          return {
            ...step,
            measure: action.payload.measure,
          };
        }),
      };
    case END_WALKTHROUGH:
      return { ...state, id: '', steps: [] };
    case UPDATE_WAITING_FOR_STEP_REF:
      return { ...state, waitingForStepId: action.payload };
    default:
      return state;
  }
};

export default walkthroughsReducer;
