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
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  popOverContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  popOverContainerBG: {
    backgroundColor: 'black',
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },

  popOverBackground: {
    width: '85%',
    margin: 'auto',
    height: 300,
    backgroundColor: '#01bbff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },

  popOverHeader: {
    alignItems: 'center',
    marginBottom: 10,
  },

  popOverHeaderText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },

  popOverContentText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },

  popOverActions: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },

  popOverActionsText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default styles;
