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
import { firebaseAnalytics } from 'services/firebase';
import { logEventAction, logScreenViewAction } from 'actions/analyticsActions';
import type { Dispatch, GetState } from 'reducers/rootReducer';

describe('Analytics Actions', () => {
  const dispatch: Dispatch = jest.fn();
  const getState: GetState = jest.fn();

  const optOutTracking = (value) => {
    (getState: any).mockImplementation(() => ({
      appSettings: { data: { optOutTracking: value } },
    }));
  };

  beforeEach(() => {
    firebaseAnalytics.logEvent = jest.fn();
    firebaseAnalytics.logScreenView = jest.fn();
  });

  afterEach(() => {
    (dispatch: any).mockClear();
    (getState: any).mockClear();
  });

  describe('logEventAction', () => {
    describe('when not opted out tracking', () => {
      beforeEach(() => optOutTracking(false));

      it('calls firebaseAnalytics().logEvent', () => {
        logEventAction('test', { property: 'value' })(dispatch, getState);
        expect(firebaseAnalytics.logEvent).toBeCalledWith('test', { property: 'value' });
      });
    });

    describe('when opted out tracking', () => {
      beforeEach(() => optOutTracking(true));

      it('does not call firebaseAnalytics().logEvent', () => {
        logEventAction('test', { property: 'value' })(dispatch, getState);
        expect(firebaseAnalytics.logEvent).not.toBeCalled();
      });
    });
  });

  describe('logScreenViewAction', () => {
    describe('when not opted out tracking', () => {
      beforeEach(() => optOutTracking(false));

      it('calls firebaseAnalytics().logScreenView', () => {
        logScreenViewAction('name')(dispatch, getState);
        expect(firebaseAnalytics.logScreenView).toBeCalledWith(
          expect.objectContaining({
            screen_name: 'name',
            screen_class: 'name',
          }),
        );
      });
    });

  // describe('authActions', () => {
  //   describe('user properties for analytics', () => {
  //     beforeEach(() => optOutTracking(false));

  //     it('calls firebaseAnalytics().setUserProperties', () => {
  //       expect(firebaseAnalytics.setUserProperties).toBeCalledWith(
  //         expect.objectContaining({
  //           screen_name: 'name',
  //           screen_class: 'name',
  //         }),
  //       );
  //     });
  //   });

    describe('when opted out tracking', () => {
      beforeEach(() => optOutTracking(true));

      it('does not call firebaseAnalytics().logScreenView', () => {
        logScreenViewAction('name')(dispatch, getState);
        expect(firebaseAnalytics.logScreenView).not.toBeCalled();
      });
    });
  });
});
