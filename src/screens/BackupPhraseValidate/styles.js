// @flow
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },

  textContainer: {
    justifyContent: 'flex-start',
    paddingLeft: 10,
    paddingRight: 10,
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

  paragraphSmall: {
    fontSize: 12,
    padding: 10,
    color: 'grey',
  },

  mnemonicContainer: {
    marginLeft: -10,
    marginRight: -10,
    marginTop: 20,
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#f2f2f2',
    flexWrap: 'wrap',
    flexDirection: 'row',

    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#d6d7da',
  },

  listItem: {
    fontWeight: 'bold',
    marginRight: 10,
    marginBottom: 2,
    fontSize: 12,
  },

  confirmContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },

});

export default styles;
