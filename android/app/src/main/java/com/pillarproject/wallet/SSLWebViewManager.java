package com.pillarproject.wallet;

import android.webkit.WebView;
import com.facebook.react.uimanager.ThemedReactContext;
import com.reactnativecommunity.webview.RNCWebViewManager;
import com.reactnativecommunity.webview.RNCWebViewWrapper;

public class SSLWebViewManager extends RNCWebViewManager {
    @Override
    public String getName() {
        return "RNCWebView";
    }

    @Override
    public RNCWebViewWrapper createViewInstance(ThemedReactContext reactContext) {
        RNCWebViewWrapper wrapper = super.createViewInstance(reactContext);
        // Enable mixed content mode for development
        if (BuildConfig.DEBUG) {
            WebView webView = wrapper.getWebView();
            if (webView != null) {
                webView.getSettings().setMixedContentMode(android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            }
        }
        return wrapper;
    }

    @Override
    public void addEventEmitters(ThemedReactContext reactContext, RNCWebViewWrapper view) {
        super.addEventEmitters(reactContext, view);
        // Replace the default WebViewClient with our SSL-friendly one
        WebView webView = view.getWebView();
        if (webView != null) {
            webView.setWebViewClient(new SSLWebViewClient());
        }
    }
}

