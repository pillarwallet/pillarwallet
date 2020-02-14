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
import { logEventAction, logScreenViewAction } from 'actions/analyticsActions';

describe('Analytics Actions', () => {
  const getState = jest.fn();
  const dispatch = jest.fn().mockImplementation((fn) => fn(dispatch, getState));

  const optOutTracking = (value) => {
    getState.mockImplementation(() => ({
      appSettings: { data: { optOutTracking: value } },
    }));
  };

  beforeEach(() => {
    // TODO: switch to firebase
    // Answers.logCustom = jest.fn().mockImplementation(() => {});
    // Answers.logContentView = jest.fn().mockImplementation(() => {});
  });

  afterEach(() => {
    dispatch.mockClear();
    getState.mockClear();
  });

  describe('logEventAction', () => {
    describe('when not opted out tracking', () => {
      beforeEach(() => optOutTracking(false));

      it('calls Answers.logCustom', () => {
        dispatch(logEventAction('test', { property: 'value' }));

        expect(Answers.logCustom).toBeCalledWith('test', { property: 'value' });
      });
    });

    describe('when opted out tracking', () => {
      beforeEach(() => optOutTracking(true));

      it('does not call Answers.logCustom', () => {
        dispatch(logEventAction('test', { property: 'value' }));

        expect(Answers.logCustom).not.toBeCalled();
      });
    });
  });

  describe('logScreenViewAction', () => {
    describe('when not opted out tracking', () => {
      beforeEach(() => optOutTracking(false));

      it('calls Answers.logContentView', () => {
        dispatch(logScreenViewAction('name', 'type', 'id'));

        expect(Answers.logContentView).toBeCalledWith('name', 'type', 'id');
      });
    });

    describe('when opted out tracking', () => {
      beforeEach(() => optOutTracking(true));

      it('does not call Answers.logContentView', () => {
        dispatch(logScreenViewAction('name', 'type', 'id'));

        expect(Answers.logContentView).not.toBeCalled();
      });
    });
  });
});
