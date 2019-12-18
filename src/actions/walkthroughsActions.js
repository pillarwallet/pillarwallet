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
  SET_ACTIVE_STEP_ID,
  FORCE_NEXT_STEP,
} from 'constants/walkthroughConstants';
import type { Steps, Measurements } from 'reducers/walkthroughsReducer';
import type { Dispatch, GetState } from 'reducers/rootReducer';

export const initWalkthroughAction = (type: string, steps: Steps) => ({
  type: ADD_WALKTHROUGH,
  payload: { type, steps },
});


export const addWalkthroughStepMeasureAction = (stepId: string, measure: Measurements) => ({
  type: ADD_WALKTHROUGH_STEP_MEASURE,
  payload: { stepId, measure },
});

export const endWalkthroughAction = () => ({
  type: END_WALKTHROUGH,
});

export const setWaitingForStepIdAction = (id: string) => ({
  type: UPDATE_WAITING_FOR_STEP_REF,
  payload: id,
});

export const setActiveStepIdAction = (id: string) => ({
  type: SET_ACTIVE_STEP_ID,
  payload: id,
});

export const showNextStepExternalAction = () => {
  return (dispatch: Dispatch, getState: GetState) => {
    const {
      walkthroughs: { steps, activeStepId },
    } = getState();

    const currentIndex = steps.map(step => step.id).indexOf(activeStepId);

    dispatch({
      type: FORCE_NEXT_STEP,
      payload: currentIndex + 1,
    });
  };
};
