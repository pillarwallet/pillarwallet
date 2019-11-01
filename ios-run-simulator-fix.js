// @flow
const fs = require('fs');

try {
  const rootDir = process.cwd();

  const file = `${rootDir}/node_modules/@react-native-community/cli/build/commands/runIOS/findMatchingSimulator.js`;
  const data = fs.readFileSync(file, 'utf8');

  const searchValue = '      if (simulator.availability !== \'(available)\' && simulator.isAvailable !== \'YES\') {\n' +
    '        continue;\n' +
    '      }';

  const changedLine = '      if (simulator.availability !== \'(available)\' && simulator.isAvailable !== true) {\n' +
    '        continue;\n' +
    '      }'; // eslint-disable-line no-useless-escape
  if (data.indexOf(changedLine) !== -1) {
    throw 'Already fixed findMatchingSimulator.js'; // eslint-disable-line no-throw-literal
  }

  const result = data.replace(searchValue, changedLine);
  fs.writeFileSync(file, result, 'utf8');
  console.log('Done Modifying findMatchingSimulator.js'); // eslint-disable-line no-console
} catch (error) {
  console.error(error); // eslint-disable-line no-console
}
