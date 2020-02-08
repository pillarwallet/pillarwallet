package nativeShadow;

import android.graphics.Color;
import android.view.ViewGroup;

import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.annotations.ReactProp;

public class NativeShadowManager extends ViewGroupManager<ViewGroup> {

    public static final String REACT_CLASS = "NativeShadow";

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @Override
    protected NativeShadowView createViewInstance(final ThemedReactContext reactContext) {
        NativeShadowView shadowLayout = new NativeShadowView(reactContext);
        shadowLayout.setClipToPadding(false);
        shadowLayout.setIsShadowed(true);
        return shadowLayout;
    }

    @ReactProp(name = "shadowVisible")
    public void setShadowVisibility(NativeShadowView shadowFrame, boolean isVisible) {
        shadowFrame.setIsShadowed(isVisible);
    }

    @ReactProp(name = "shadowAngle")
    public void setShadowAngle(NativeShadowView shadowFrame, float shadowAngle) {
        shadowFrame.setShadowAngle(shadowAngle);
    }

    @ReactProp(name = "shadowColor")
    public void setShadowColor(NativeShadowView shadowFrame, String shadowColor) {
        shadowFrame.setShadowColor(Color.parseColor(shadowColor));
    }

    @ReactProp(name = "shadowRadius")
    public void setShadowRadius(NativeShadowView shadowFrame, float shadowRadius) {
        shadowFrame.setShadowRadius(shadowRadius);
    }

    @ReactProp(name = "shadowDistance")
    public void setShadowDistance(NativeShadowView shadowFrame, float shadowDistance) {
        shadowFrame.setShadowDistance(shadowDistance);
    }
}
