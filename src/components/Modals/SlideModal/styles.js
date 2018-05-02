// @flow
import { StyleSheet, Dimensions } from 'react-native';

const window = Dimensions.get('window');

const styles = StyleSheet.create({
  modalContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
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

  scrollContentStyle: {
    marginTop: 150,
    overflow: 'visible',
    height: 20,
  },

  sliderContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
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

  closeButton: {
    position: 'relative',
    top: -10,
  },

  contentWrapper: {
    flex: 1,
    height: window.height,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  offscreenWrapper: {
    flex: 1,
    height: window.height,
    width: '100%',
    backgroundColor: '#FFFFFF',
  },
});

export default styles;
