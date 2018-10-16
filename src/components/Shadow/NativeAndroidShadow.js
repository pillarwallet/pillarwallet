// @flow

import { requireNativeComponent } from 'react-native';

/**
 * Composes View with a shadow for Android.
 *
 * - shadowAngle: number
 * - shadowRadius: number
 * - shadowDistance: number
 * - shadowColor: string
 */

module.exports = requireNativeComponent('NativeShadow');
