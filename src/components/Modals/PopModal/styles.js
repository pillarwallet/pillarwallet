// @flow

import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  modalContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    bottom: 0,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },

  modalWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  dismissOverlay: {
    height: '100%',
    backgroundColor: 'black',
    zIndex: 0,
  },

  modalContent: {
    backgroundColor: 'white',
    width: '80%',
    height: 300,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },

  sliderHeaderContainer: {
    alignItems: 'flex-end',
    width: '100%',
  },

  modalMessageWrapper: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sliderHeader: {
    fontSize: 18,
    marginBottom: 5,
    fontWeight: 'bold',
  },

  contentWrapper: {
    flex: 0,
    height: window.height,
    alignItems: 'center',
  },
});

export default styles;
