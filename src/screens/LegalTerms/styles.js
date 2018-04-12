// @flow
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header2: {
    fontSize: 28,
    marginTop: 10,
    alignItems: 'center',
  },
  paragraph: {
    paddingTop: 10,
    fontSize: 16,
    color: 'grey',
  },
  paragraphSmall: {
    fontSize: 12,
    padding: 10,
    color: 'grey',
  },
  instructionsContainer: {
    alignItems: 'center',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    width: '80%',
  },

  confirmContainer: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'red',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },

});

export default styles;
