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
import t from 'translations/translate';

type RiskinessProps = {
  id: string;
  name: string;
  percentageLabel: string;
  maxPercentage: number;
  minPercentage: number;
  color: string;
};

export const getPortfolioRiskList = (): RiskinessProps[] => {
  const riskinessTypeList = [
    {
      id: 'high_risk',
      name: t('label.high_risk'),
      percentageLabel: '0',
      maxPercentage: 9.99,
      minPercentage: 0,
      color: '#f72e00',
    },
    {
      id: 'risky',
      name: t('label.risky'),
      percentageLabel: '10-30',
      maxPercentage: 29.99,
      minPercentage: 10,
      color: '#ff4d88',
    },
    {
      id: 'moderate_risk',
      name: t('label.moderate_risk'),
      percentageLabel: '30-60',
      maxPercentage: 59.99,
      minPercentage: 30,
      color: '#f7931a',
    },
    {
      id: 'low_risk',
      name: t('label.low_risk'),
      percentageLabel: '60-90',
      maxPercentage: 89.999,
      minPercentage: 60,
      color: '#66b3ff',
    },
    {
      id: 'no_risk',
      name: t('label.no_risk'),
      percentageLabel: '100',
      maxPercentage: 100,
      minPercentage: 90,
      color: '#00c786',
    },
  ];
  return riskinessTypeList;
};

export const getRiskType = (percentage?: number): string => {
  if (!percentage) return '';

  const findArrValue = getPortfolioRiskList().find(
    (item) => item.maxPercentage >= percentage && item.minPercentage <= percentage,
  );

  if (findArrValue) return findArrValue?.name;

  return '';
};

export const getRiskColor = (percentage?: number): string => {
  if (!percentage) return null;

  const findArrValue = getPortfolioRiskList().find(
    (item) => item.maxPercentage >= percentage && item.minPercentage <= percentage,
  );

  if (findArrValue) return findArrValue?.color;

  return null;
};
