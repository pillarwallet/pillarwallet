// @flow
const fs = require('fs');

try {
  const curDir = __dirname;
  const rootDir = process.cwd();

  const file = `${rootDir}/node_modules/react-native/react.gradle`;
  const dataFix = fs.readFileSync(`${curDir}/android-react-gradle-fix`, 'utf8');
  const data = fs.readFileSync(file, 'utf8');

  const doLast = 'doLast \{'; // eslint-disable-line no-useless-escape
  if (data.indexOf(doLast) !== -1) {
    throw 'Already fixed react.gradle'; // eslint-disable-line no-throw-literal
  }

  const result = data.replace(/\/\/ Set up inputs and outputs so gradle can cache the result/g, dataFix);
  fs.writeFileSync(file, result, 'utf8');
  console.log('Done Modifying react.gradle'); // eslint-disable-line no-console
} catch (error) {
  console.error(error); // eslint-disable-line no-console
}
