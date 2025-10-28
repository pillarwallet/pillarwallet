package com.pillarproject.wallet;

import android.net.http.SslError;
import android.webkit.SslErrorHandler;
import android.webkit.WebView;
import com.reactnativecommunity.webview.RNCWebViewClient;

public class SSLWebViewClient extends RNCWebViewClient {
    @Override
    public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
        // In debug/development mode, accept self-signed certificates
        // This allows local development with HTTPS and self-signed certs
        if (BuildConfig.DEBUG) {
            // Log the SSL error for debugging purposes
            String errorMessage = "SSL Error in dev mode (proceeding): ";
            switch (error.getPrimaryError()) {
                case SslError.SSL_UNTRUSTED:
                    errorMessage += "Certificate authority is not trusted";
                    break;
                case SslError.SSL_EXPIRED:
                    errorMessage += "Certificate has expired";
                    break;
                case SslError.SSL_IDMISMATCH:
                    errorMessage += "Certificate hostname mismatch";
                    break;
                case SslError.SSL_NOTYETVALID:
                    errorMessage += "Certificate is not yet valid";
                    break;
                case SslError.SSL_DATE_INVALID:
                    errorMessage += "Certificate date is invalid";
                    break;
                default:
                    errorMessage += "Unknown SSL error";
                    break;
            }
            android.util.Log.w("SSLWebViewClient", errorMessage);
            
            // Proceed despite SSL errors in debug builds
            handler.proceed();
        } else {
            // In production, use the default behavior (reject invalid certs)
            super.onReceivedSslError(view, handler, error);
        }
    }
}

