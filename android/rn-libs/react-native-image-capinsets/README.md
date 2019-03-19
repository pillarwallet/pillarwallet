# react-native-image-capinsets
adds support for a similar functionality as `<Image capInsets={...} />` to android.
behind the scenes it will generate a `NinePatchDrawable` and set as background for the android `ImageView`

## Installation

1. `npm i --save react-native-image-capinsets`
2. `react-native link react-native-image-capinsets`


## Examples

```javascript
import ImageCapInset from 'react-native-image-capinsets';

<ImageCapInset
  source={require('./bubble.png')}
  capInsets={{ top: 8, right: 8, bottom: 8, left: 8 }}
  />
```
