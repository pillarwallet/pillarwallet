// @flow
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
