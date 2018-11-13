/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package com.horcrux.svg;

import android.graphics.Bitmap;
import android.graphics.BitmapShader;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.RadialGradient;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Shader;

import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.common.ReactConstants;

class Brush {
    private final BrushType mType;
    private final SVGLength[] mPoints;
    private ReadableArray mColors;
    private final boolean mUseObjectBoundingBox;

    // TODO implement pattern units
    @SuppressWarnings({"FieldCanBeLocal", "unused"})
    private boolean mUseContentObjectBoundingBox;

    private Matrix mMatrix;
    private Rect mUserSpaceBoundingBox;
    private PatternView mPattern;

    Brush(BrushType type, SVGLength[] points, BrushUnits units) {
        mType = type;
        mPoints = points;
        mUseObjectBoundingBox = units == BrushUnits.OBJECT_BOUNDING_BOX;
    }

    void setContentUnits(BrushUnits units) {
        mUseContentObjectBoundingBox = units == BrushUnits.OBJECT_BOUNDING_BOX;
    }

    void setPattern(PatternView pattern) {
        mPattern = pattern;
    }

    enum BrushType {
        LINEAR_GRADIENT,
        RADIAL_GRADIENT,
        PATTERN
    }

    enum BrushUnits {
        OBJECT_BOUNDING_BOX,
        USER_SPACE_ON_USE
    }

    private static void parseGradientStops(ReadableArray value, int stopsCount, float[] stops, int[] stopsColors, float opacity) {
        int startStops = value.size() - stopsCount;
        for (int i = 0; i < stopsCount; i++) {
            stops[i] = (float) value.getDouble(startStops + i);
            stopsColors[i] = Color.argb(
                    (int) (value.getDouble(i * 4 + 3) * 255 * opacity),
                    (int) (value.getDouble(i * 4) * 255),
                    (int) (value.getDouble(i * 4 + 1) * 255),
                    (int) (value.getDouble(i * 4 + 2) * 255));

        }
    }

    void setUserSpaceBoundingBox(Rect userSpaceBoundingBox) {
        mUserSpaceBoundingBox = userSpaceBoundingBox;
    }

    void setGradientColors(ReadableArray colors) {
        mColors = colors;
    }

    void setGradientTransform(Matrix matrix) {
        mMatrix = matrix;
    }

    private RectF getPaintRect(RectF pathBoundingBox) {
        RectF rect = mUseObjectBoundingBox ? pathBoundingBox : new RectF(mUserSpaceBoundingBox);
        float width = rect.width();
        float height = rect.height();
        float x = 0f;
        float y = 0f;

        if (mUseObjectBoundingBox) {
            x = rect.left;
            y = rect.top;
        }

        return new RectF(x, y, x + width, y + height);
    }

    void setupPaint(Paint paint, RectF pathBoundingBox, float scale, float opacity) {
        RectF rect = getPaintRect(pathBoundingBox);
        float width = rect.width();
        float height = rect.height();
        float offsetX = rect.left;
        float offsetY = rect.top;

        float textSize = paint.getTextSize();
        if (mType == BrushType.PATTERN) {
            double x = PropHelper.fromRelative(mPoints[0], width, offsetX, scale, textSize);
            double y = PropHelper.fromRelative(mPoints[1], height, offsetY, scale, textSize);
            double w = PropHelper.fromRelative(mPoints[2], width, offsetX, scale, textSize);
            double h = PropHelper.fromRelative(mPoints[3], height, offsetY, scale, textSize);

            RectF vbRect = mPattern.getViewBox();
            RectF eRect = new RectF((float)x, (float)y, (float)w, (float)h);
            Matrix mViewBoxMatrix = ViewBox.getTransform(vbRect, eRect, mPattern.mAlign, mPattern.mMeetOrSlice);

            Bitmap bitmap = Bitmap.createBitmap(
                    (int) w,
                    (int) h,
                    Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(bitmap);
            canvas.concat(mViewBoxMatrix);
            mPattern.draw(canvas, new Paint(), opacity);

            Matrix patternMatrix = new Matrix();
            if (mMatrix != null) {
                patternMatrix.preConcat(mMatrix);
            }

            BitmapShader bitmapShader = new BitmapShader(bitmap, Shader.TileMode.REPEAT, Shader.TileMode.REPEAT);
            bitmapShader.setLocalMatrix(patternMatrix);
            paint.setShader(bitmapShader);
            return;
        }

        int stopsCount = mColors.size() / 5;
        int[] stopsColors = new int[stopsCount];
        float[] stops = new float[stopsCount];
        parseGradientStops(mColors, stopsCount, stops, stopsColors, opacity);

        if (stops.length == 1) {
            // Gradient with only one stop will make LinearGradient/RadialGradient
            // throw. It may happen when source SVG contains only one stop or
            // two stops at the same spot (see lib/extract/extractGradient.js).
            // Although it's mistake SVGs like this can be produced by vector
            // editors or other tools, so let's handle that gracefully.
            stopsColors = new int[] { stopsColors[0], stopsColors[0] };
            stops = new float[] { stops[0], stops[0] };
            FLog.w(ReactConstants.TAG, "Gradient contains only on stop");
        }

        if (mType == BrushType.LINEAR_GRADIENT) {
            double x1 = PropHelper.fromRelative(mPoints[0], width, offsetX, scale, textSize);
            double y1 = PropHelper.fromRelative(mPoints[1], height, offsetY, scale, textSize);
            double x2 = PropHelper.fromRelative(mPoints[2], width, offsetX, scale, textSize);
            double y2 = PropHelper.fromRelative(mPoints[3], height, offsetY, scale, textSize);

            Shader linearGradient = new LinearGradient(
                (float) x1,
                (float) y1,
                (float) x2,
                (float) y2,
                stopsColors,
                stops,
                Shader.TileMode.CLAMP);

            if (mMatrix != null) {
                Matrix m = new Matrix();
                m.preConcat(mMatrix);
                linearGradient.setLocalMatrix(m);
            }

            paint.setShader(linearGradient);
        } else if (mType == BrushType.RADIAL_GRADIENT) {
            double rx = PropHelper.fromRelative(mPoints[2], width, 0f, scale, textSize);
            double ry = PropHelper.fromRelative(mPoints[3], height, 0f, scale, textSize);
            double cx = PropHelper.fromRelative(mPoints[4], width, offsetX, scale, textSize);
            double cy = PropHelper.fromRelative(mPoints[5], height, offsetY, scale, textSize) / (ry / rx);
            // TODO: support focus point.
            //double fx = PropHelper.fromRelative(mPoints[0], width, offsetX, scale);
            //double fy = PropHelper.fromRelative(mPoints[1], height, offsetY, scale) / (ry / rx);
            Shader radialGradient = new RadialGradient(
                    (float) cx,
                    (float) cy,
                    (float) rx,
                    stopsColors,
                    stops,
                    Shader.TileMode.CLAMP
            );

            Matrix radialMatrix = new Matrix();
            radialMatrix.preScale(1f, (float) (ry / rx));

            if (mMatrix != null) {
                radialMatrix.preConcat(mMatrix);
            }

            radialGradient.setLocalMatrix(radialMatrix);
            paint.setShader(radialGradient);
        }
    }
}
