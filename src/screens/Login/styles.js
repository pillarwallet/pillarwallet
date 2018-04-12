// @flow
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    flexDirection: 'column',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  title: {
    marginBottom: 20,
    fontSize: 25,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    color: 'red',
  },
});

export default styles;
