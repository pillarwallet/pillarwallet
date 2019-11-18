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
  ADD_WALKTHROUGH_STEP_MEASURE,
  UPDATE_WAITING_FOR_STEP_REF,
} from 'constants/walkthroughConstants';
import type { Steps, Measurements } from 'reducers/walkthroughsReducer';
import type { Dispatch } from 'reducers/rootReducer';

export const initWalkthroughAction = (type: string, steps: Steps) => {
  return async (dispatch: Dispatch) => {
    dispatch({
      type: ADD_WALKTHROUGH,
      payload: { type, steps },
    });
  };
};

export const addWalkthroughStepMeasureAction = (stepId: string, measure: Measurements) => {
  return async (dispatch: Dispatch) => {
    dispatch({
      type: ADD_WALKTHROUGH_STEP_MEASURE,
      payload: { stepId, measure },
    });
  };
};

export const endWalkthroughAction = () => {
  return async (dispatch: Dispatch) => {
    dispatch({
      type: END_WALKTHROUGH,
    });
  };
};

export const setWaitingForStepIdAction = (id: string) => {
  return async (dispatch: Dispatch) => {
    dispatch({
      type: UPDATE_WAITING_FOR_STEP_REF,
      payload: id,
    });
  };
};
