/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package com.horcrux.svg;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

class SvgViewModule extends ReactContextBaseJavaModule {
    SvgViewModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "RNSVGSvgViewManager";
    }


    @ReactMethod
    public void toDataURL(int tag, Callback successCallback) {
        SvgView svg = SvgViewManager.getSvgViewByTag(tag);

        if (svg != null) {
            successCallback.invoke(svg.toDataURL());
        }
    }
}
