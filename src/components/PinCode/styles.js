// @flow
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: 'white',
  },

  textContainer: {
    flex: 0.25,
    justifyContent: 'flex-start',
  },

  header: {
    fontSize: 32,
    marginTop: 10,
    alignItems: 'center',
  },

  paragraph: {
    paddingTop: 10,
    fontSize: 16,
    color: 'grey',
  },

  pinContainer: {
    flex: 0.65,
    flexWrap: 'wrap',
    flexDirection: 'row',
    alignSelf: 'center',
    width: 140,
    justifyContent: 'space-between',
  },

  inactivePinDot: {
    width: 12,
    height: 12,
    backgroundColor: 'gray',
    borderRadius: 12 / 2,
    opacity: 0.5,
  },

  activePinDot: {
    opacity: 1,
  },

  inputKeyContainer: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    alignSelf: 'center',
    width: 360,
    justifyContent: 'flex-end',
  },

  inputKey: {
    justifyContent: 'center',
    width: 120,
    height: 55,
  },
});

export default styles;
