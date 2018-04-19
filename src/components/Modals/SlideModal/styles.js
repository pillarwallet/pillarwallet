// @flow
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  modalContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },

  dismissOverlay: {
    height: '100%',
    backgroundColor: 'black',
    zIndex: 0,
  },

  modalScrollContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'stretch',
  },

  sliderContainer: {
    backgroundColor: 'white',
    padding: 20,
  },

  sliderHeaderContainer: {
    flexDirection: 'row',
    height: 30,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sliderHeader: {
    fontSize: 24,
    fontWeight: 'bold',
  },


});

export default styles;
