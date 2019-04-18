package dk.madslee.imageCapInsets;

import android.graphics.Rect;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;


public class RCTImageCapInsetManager extends SimpleViewManager<RCTImageCapInsetView> {
    @Override
    public String getName() {
        return "RCTImageCapInset";
    }

    @Override
    protected RCTImageCapInsetView createViewInstance(ThemedReactContext reactContext) {
        return new RCTImageCapInsetView(reactContext);
    }

    @ReactProp(name = "capInsets")
    public void setCapInsets(final RCTImageCapInsetView view, ReadableMap map) {
        int top = map.hasKey("top") ? map.getInt("top") : 0;
        int left = map.hasKey("left") ? map.getInt("left") : 0;
        int right = map.hasKey("right") ? map.getInt("right") : 0;
        int bottom = map.hasKey("bottom") ? map.getInt("bottom") : 0;

        Rect insets = new Rect(left, top, right, bottom);
        view.setCapInsets(insets);
    }

    @ReactProp(name = "source")
    public void setSource(final RCTImageCapInsetView view, ReadableMap source) {
        String uri = source.getString("uri");
        view.setSource(uri);
    }
}
