// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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

import * as React from 'react';

export const STATUS = {
  STARTED: 'Started',
  STOPPED: 'Stopped',
};

const INITIAL_COUNT = 1;

type Props = {
  status: string;
  onChangeStatus: (status: string) => void;
};

export function useTimer(status: string, onChangeStatus: (status: string) => void): string {
  const [seconds, setSeconds] = React.useState(INITIAL_COUNT);

  const secondsToDisplay = seconds % 60;
  const minutesRemaining = (seconds - secondsToDisplay) / 60;
  const minutesToDisplay = minutesRemaining % 60;

  useInterval(
    () => {
      if (seconds > 0) {
        setSeconds(seconds + 1);
      } else {
        onChangeStatus(STATUS.STOPPED);
      }
    },
    status === STATUS.STARTED ? 1000 : null,
    // passing null stops the interval
  );

  const finalTime = `${twoDigits(minutesToDisplay)}:${twoDigits(secondsToDisplay)}`;
  return finalTime;
}

function useInterval(callback, delay) {
  const savedCallback: any = React.useRef();

  // Remember the latest callback.
  React.useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  React.useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

const twoDigits = (num) => String(num).padStart(2, '0');
