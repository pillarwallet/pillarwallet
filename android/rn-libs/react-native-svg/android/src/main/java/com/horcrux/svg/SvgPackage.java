/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package com.horcrux.svg;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static com.horcrux.svg.RenderableViewManager.*;

public class SvgPackage implements ReactPackage {

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Arrays.<ViewManager>asList(
                new GroupViewManager(),
                new PathViewManager(),
                new CircleViewManager(),
                new EllipseViewManager(),
                new LineViewManager(),
                new RectViewManager(),
                new TextViewManager(),
                new TSpanViewManager(),
                new TextPathViewManager(),
                new ImageViewManager(),
                new ClipPathViewManager(),
                new DefsViewManager(),
                new UseViewManager(),
                new SymbolManager(),
                new LinearGradientManager(),
                new RadialGradientManager(),
                new PatternManager(),
                new MaskManager(),
                new SvgViewManager());
    }

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        return Collections.<NativeModule>singletonList(new SvgViewModule(reactContext));
    }

    @SuppressWarnings("unused")
    public List<Class<? extends JavaScriptModule>> createJSModules() {
        return Collections.emptyList();
    }
}
