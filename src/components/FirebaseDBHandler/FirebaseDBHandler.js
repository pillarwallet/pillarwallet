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

import React, { useEffect, useState, useRef, type Node } from 'react';
import {
  // useDispatch,
  useSelector } from 'react-redux';
import isEqual from 'lodash.isequal';
import { db } from 'services/storage';
import { reportOrWarn } from 'utils/common';

const FirebaseDBHandler = ({ children }: { children: Node }) => {
  const [initialStateLoaded, setInitialStateLoaded] = useState(false);
  // const dispatch = useDispatch();

  const localState = useSelector(state => state);

  const usePrevious = (value) => {
    const ref = useRef();
    useEffect(() => {
      ref.current = value;
    });
    return ref.current;
  };

  const prevState = usePrevious(localState);

  useEffect(() => {
    if (!initialStateLoaded) {
      const timeout = setTimeout(() => {
        // failed to fetch data, likely because user is offline
        reportOrWarn('Failed to load user data from Firebase', null, 'warn');
        // TODO handle
      }, 5000);
      db.once('value').then(snapshot => {
        const dbState = snapshot.val();
        if (!dbState) {
          // nothing stored in DB, migrate user to firebase
          db.set({ storageState: localState }, (e) => {
            if (e) {
              reportOrWarn('Failed to setup Firebase storage', e, 'error');
            }
          });
        } else {
          // TODO - set local state
        }
        clearTimeout(timeout);
      }).catch(e => reportOrWarn('Failed to load user data from Firebase', e, 'error'));
      setInitialStateLoaded(true);
    }

    if (!isEqual(prevState, localState)) {
      db.update({ storageState: localState }, (e) => {
        if (e) {
          reportOrWarn('Failed to update user data on Firebase storage', e, 'warning');
        }
      });
    }
  }, [localState]);

  return <>{children}</>;
};

export default FirebaseDBHandler;
