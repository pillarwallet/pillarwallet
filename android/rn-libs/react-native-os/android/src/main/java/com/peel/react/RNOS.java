/**
 * Copyright (c) 2015-present, Peel Technologies, Inc.
 * All rights reserved.
 */

package com.peel.react.rnos;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.ConnectivityManager;
import android.os.Bundle;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.net.Inet4Address;
import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.InterfaceAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.util.Arrays;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;


public final class RNOS extends ReactContextBaseJavaModule implements LifecycleEventListener {
    /* package */ static final String TAG = "RNOS";
    /* package */ final ConnectivityManager mConnectivityManager;
    /* package */ final ConnectivityBroadcastReceiver mConnectivityBroadcastReceiver;

    public RNOS(ReactApplicationContext reactContext) {
        super(reactContext);
        mConnectivityManager =
                (ConnectivityManager) reactContext.getSystemService(Context.CONNECTIVITY_SERVICE);
        mConnectivityBroadcastReceiver = new ConnectivityBroadcastReceiver();

        reactContext.addLifecycleEventListener(this);
    }

    @Override
    public String getName() {
        return TAG;
    }

    @Override
    public Map<String, Object> getConstants() {
        // set constants as initial values
        final Map<String, Object> constants = new HashMap<>();

        final Map<String, Object> networkMap = new HashMap<>();
        try {
            // extract bundle to map
            final Bundle networkInterfaces = getNetworkInterfaces();
            for (String key : networkInterfaces.keySet()) {
                networkMap.put(key, networkInterfaces.get(key));
            }
        } catch (SocketException e) {
            e.printStackTrace();
        }

        constants.put("networkInterfaces", networkMap);
        constants.put("homedir", getReactApplicationContext().getApplicationInfo().dataDir);
        return constants;
    }

    @Override
    public void onHostResume() {
        registerReceiver();
    }

    @Override
    public void onHostPause() {
        unregisterReceiver();
    }

    @Override
    public void onHostDestroy() {
        unregisterReceiver();
    }

    private void registerReceiver() {
        IntentFilter filter = new IntentFilter();
        filter.addAction(ConnectivityManager.CONNECTIVITY_ACTION);
        getReactApplicationContext().registerReceiver(mConnectivityBroadcastReceiver, filter);
        mConnectivityBroadcastReceiver.setRegistered(true);
    }

    private void unregisterReceiver() {
        if (mConnectivityBroadcastReceiver.isRegistered()) {
            getReactApplicationContext().unregisterReceiver(mConnectivityBroadcastReceiver);
            mConnectivityBroadcastReceiver.setRegistered(false);
        }
    }

    public void updateAndSendOsInfo() {
        Bundle osInfo = new Bundle();

        try {
            final Bundle networkInterfaces = getNetworkInterfaces();
            osInfo.putBundle("networkInterfaces", networkInterfaces);
        } catch (SocketException e) {
            e.printStackTrace();
        }

        final ReactContext reactContext = getReactApplicationContext();
        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("rn-os-info", Arguments.fromBundle(osInfo));
    }

    private Bundle getNetworkInterfaces() throws SocketException {
        Bundle ifaces = new Bundle();
        Enumeration<NetworkInterface> list = NetworkInterface.getNetworkInterfaces();
        while (list.hasMoreElements()) {
            final NetworkInterface iface = list.nextElement();
            String mac = "00:00:00:00:00:00";
            boolean internal = true;

            try {
                internal = iface.isLoopback();
            } catch (SocketException se) {
                // keep calm and query on
                se.printStackTrace();
            }

            try {
                final byte[] macBytes = iface.getHardwareAddress();

                if (macBytes != null) {
                    final StringBuilder sb = new StringBuilder();
                    for (int i = 0; i < macBytes.length; i++) {
                        sb.append(String.format("%02X%s", macBytes[i], (i < macBytes.length - 1) ? ":" : ""));
                    }
                    mac = sb.toString();
                }
            } catch (SocketException se) {
                // keep calm and query on
                se.printStackTrace();
            }

            for (InterfaceAddress address : iface.getInterfaceAddresses()) {
                Bundle ifaceInfo = new Bundle();

                ifaceInfo.putBoolean("internal", internal);
                ifaceInfo.putString("mac", mac);

                InetAddress inet = address.getAddress();

                // getHostAddress adds %scope_id for ipv6
                String hostAddress = inet.getHostAddress();
                int end = hostAddress.indexOf("%");
                if (end > -1) {
                    hostAddress = hostAddress.substring(0, end);
                }
                ifaceInfo.putString("address", hostAddress);
                if (inet instanceof Inet6Address) {
                    ifaceInfo.putString("family", "IPv6");
                    ifaceInfo.putInt("scopeid", ((Inet6Address) inet).getScopeId());
                } else {
                    ifaceInfo.putString("family", "IPv4");
                }

                String netmask = "";
                short prefixLength = address.getNetworkPrefixLength();
                if (inet instanceof Inet4Address) {
                    final int value = 0xffffffff << (32 - prefixLength);
                    netmask = String.format("%d.%d.%d.%d", (value >> 24) & 0xFF,
                            (value >> 16) & 0xFF,  (value >> 8) & 0xFF, value & 0xFF);
                } else {
                    final long[] value = new long[] { 0xffffffffffffffffl, 0xffffffffffffffffl };
                    if (prefixLength <= 64) {
                        value[1] = value[1] << (64 - prefixLength);
                    } else {
                        value[1] = 0;
                        value[0] = value[0] << (64 - (prefixLength - 64));
                    }

                    for (long crtLong : value) { //for every long: it should be two of them
                        for (int i = 0; i < 4; i++) { //we display in total 4 parts for every long
                            netmask += (netmask.length() == 0 ? "" : ":") +
                                ((crtLong & 0xFFFF) == 0 ? "" : Long.toHexString(crtLong & 0xFFFF));
                            crtLong = crtLong >> 16;
                        }
                    }
                }

                ifaceInfo.putString("netmask", netmask);

                Bundle[] bundles = (Bundle[]) ifaces.getParcelableArray(iface.getDisplayName());
                if (bundles == null) {
                    bundles = new Bundle[] { ifaceInfo };
                } else {
                    Bundle[] tmp = Arrays.copyOf(bundles, bundles.length + 1);
                    tmp[bundles.length] = ifaceInfo;
                    bundles = tmp;
                }

                ifaces.putParcelableArray(iface.getDisplayName(), bundles);
            }
        }

        return ifaces;
    }

    /**
     * Class that receives intents whenever the connection type changes.
     * NB: It is possible on some devices to receive certain connection type changes multiple times.
     */
    private class ConnectivityBroadcastReceiver extends BroadcastReceiver {

        //TODO: Remove registered check when source of crash is found. t9846865
        private boolean isRegistered = false;

        public void setRegistered(boolean registered) {
            isRegistered = registered;
        }

        public boolean isRegistered() {
            return isRegistered;
        }

        @Override
        public void onReceive(Context context, Intent intent) {
            if (intent.getAction().equals(ConnectivityManager.CONNECTIVITY_ACTION)) {
                updateAndSendOsInfo();
            }
        }
    }
}
