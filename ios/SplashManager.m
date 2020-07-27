//
//  SplashManager.m
//  pillarwallet
//


#import <Foundation/Foundation.h>
#import "SplashManager.h"
#import <React/RCTLog.h>
#import <React/RCTBridge.h>

static bool loading = true;
static bool addedJsLoadErrorObserver = false;
static UIView* splashView = nil;


@implementation SplashManager

// To export a module
RCT_EXPORT_MODULE()

+ (void)show:(NSString*)storyBoard inRootView:(UIView*)rootView {
    if (!addedJsLoadErrorObserver) {
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(jsLoadError:) name:RCTJavaScriptDidFailToLoadNotification object:nil];
        addedJsLoadErrorObserver = true;
    }
    
    if (!splashView) {
      UIStoryboard *storyboard = [UIStoryboard storyboardWithName:storyBoard bundle:[NSBundle mainBundle]];
      UIViewController *splashViewController = [storyboard instantiateViewControllerWithIdentifier:@"SplashStoryboard"];
      splashView = splashViewController.view;
    }
    loading = false;
    
    [rootView addSubview:splashView];
}

+ (void)hide {
    if (loading) {
        dispatch_async(dispatch_get_main_queue(), ^{
            loading = false;
        });
    } else {
        dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.1 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
            [splashView removeFromSuperview];
        });
    }
}

+ (void) jsLoadError:(NSNotification*)notification
{
    [SplashManager hide];
}

RCT_EXPORT_METHOD(hide) {
    [SplashManager hide];
}

@end
