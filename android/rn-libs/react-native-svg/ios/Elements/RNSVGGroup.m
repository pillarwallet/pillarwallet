/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGGroup.h"
#import "RNSVGClipPath.h"

@implementation RNSVGGroup
{
    RNSVGGlyphContext *_glyphContext;
}

- (void)setFont:(NSDictionary*)font
{
    if (font == _font) {
        return;
    }

    [self invalidate];
    _font = font;
}

- (void)renderLayerTo:(CGContextRef)context rect:(CGRect)rect
{
    [self clip:context];
    [self setupGlyphContext:context];
    [self renderGroupTo:context rect:rect];
}

- (void)renderGroupTo:(CGContextRef)context rect:(CGRect)rect
{
    [self pushGlyphContext];

    __block CGRect groupRect = CGRectNull;

    [self traverseSubviews:^(UIView *node) {
        if ([node isKindOfClass:[RNSVGNode class]]) {
            RNSVGNode* svgNode = (RNSVGNode*)node;
            if (svgNode.responsible && !self.svgView.responsible) {
                self.svgView.responsible = YES;
            }

            if ([node isKindOfClass:[RNSVGRenderable class]]) {
                [(RNSVGRenderable*)node mergeProperties:self];
            }

            [svgNode renderTo:context rect:rect];

            CGRect nodeRect = svgNode.clientRect;
            if (!CGRectIsEmpty(nodeRect)) {
                groupRect = CGRectUnion(groupRect, nodeRect);
            }

            if ([node isKindOfClass:[RNSVGRenderable class]]) {
                [(RNSVGRenderable*)node resetProperties];
            }
        } else if ([node isKindOfClass:[RNSVGSvgView class]]) {
            RNSVGSvgView* svgView = (RNSVGSvgView*)node;
            CGFloat width = [self relativeOnWidthString:svgView.bbWidth];
            CGFloat height = [self relativeOnHeightString:svgView.bbHeight];
            CGRect rect = CGRectMake(0, 0, width, height);
            CGContextClipToRect(context, rect);
            [svgView drawToContext:context withRect:(CGRect)rect];
        } else {
            [node drawRect:rect];
        }

        return YES;
    }];
    [self setHitArea:[self getPath:context]];
    self.clientRect = groupRect;
    self.bounds = groupRect;
    [self popGlyphContext];
}

- (void)setupGlyphContext:(CGContextRef)context
{
    CGRect clipBounds = CGContextGetClipBoundingBox(context);
    clipBounds = CGRectApplyAffineTransform(clipBounds, self.matrix);
    CGAffineTransform transform = CATransform3DGetAffineTransform(self.layer.transform);
    clipBounds = CGRectApplyAffineTransform(clipBounds, transform);
    CGFloat width = CGRectGetWidth(clipBounds);
    CGFloat height = CGRectGetHeight(clipBounds);

    _glyphContext = [[RNSVGGlyphContext alloc] initWithScale:1 width:width
                                                   height:height];
}

- (RNSVGGlyphContext *)getGlyphContext
{
    return _glyphContext;
}

- (void)pushGlyphContext
{
    __weak typeof(self) weakSelf = self;
    [[self.textRoot getGlyphContext] pushContext:weakSelf font:self.font];
}

- (void)popGlyphContext
{
    [[self.textRoot getGlyphContext] popContext];
}

- (void)renderPathTo:(CGContextRef)context rect:(CGRect)rect
{
    [super renderLayerTo:context rect:rect];
}

- (CGPathRef)getPath:(CGContextRef)context
{
    CGMutablePathRef __block path = CGPathCreateMutable();
    [self traverseSubviews:^(RNSVGNode *node) {
        if ([node isKindOfClass:[RNSVGNode class]]) {
            CGAffineTransform transform = node.matrix;
            CGPathAddPath(path, &transform, [node getPath:context]);
        }
        return YES;
    }];

    return (CGPathRef)CFAutorelease(path);
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
    CGPoint transformed = CGPointApplyAffineTransform(point, self.invmatrix);

    if (self.clipPath) {
        RNSVGClipPath *clipNode = (RNSVGClipPath*)[self.svgView getDefinedClipPath:self.clipPath];
        if ([clipNode isSimpleClipPath]) {
            CGPathRef clipPath = [self getClipPath];
            if (clipPath && !CGPathContainsPoint(clipPath, nil, transformed, self.clipRule == kRNSVGCGFCRuleEvenodd)) {
                return nil;
            }
        } else {
            RNSVGRenderable *clipGroup = (RNSVGRenderable*)clipNode;
            if (![clipGroup hitTest:transformed withEvent:event]) {
                return nil;
            }
        }
    }

    if (!event) {
        NSPredicate *const anyActive = [NSPredicate predicateWithFormat:@"active == TRUE"];
        NSArray *const filtered = [self.subviews filteredArrayUsingPredicate:anyActive];
        if ([filtered count] != 0) {
            return filtered.firstObject;
        }
    }

    for (RNSVGNode *node in [self.subviews reverseObjectEnumerator]) {
        if (![node isKindOfClass:[RNSVGNode class]]) {
            continue;
        }

        if (event) {
            node.active = NO;
        } else if (node.active) {
            return node;
        }

        UIView *hitChild = [node hitTest:transformed withEvent:event];

        if (hitChild) {
            node.active = YES;
            return (node.responsible || (node != hitChild)) ? hitChild : self;
        }
    }

    UIView *hitSelf = [super hitTest:transformed withEvent:event];
    if (hitSelf) {
        return hitSelf;
    }

    return nil;
}

- (void)parseReference
{
    if (self.name) {
        typeof(self) __weak weakSelf = self;
        [self.svgView defineTemplate:weakSelf templateName:self.name];
    }

    [self traverseSubviews:^(__kindof RNSVGNode *node) {
        if ([node isKindOfClass:[RNSVGNode class]]) {
            [node parseReference];
        }
        return YES;
    }];
}

- (void)resetProperties
{
    [self traverseSubviews:^(__kindof RNSVGNode *node) {
        if ([node isKindOfClass:[RNSVGRenderable class]]) {
            [(RNSVGRenderable*)node resetProperties];
        }
        return YES;
    }];
}

@end
