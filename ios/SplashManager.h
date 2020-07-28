//
//  SplashManager.h
//  pillarwallet
//

#ifndef SplashManager_h
#define SplashManager_h

#import <React/RCTBridgeModule.h>
#import <UIKit/UIKit.h>

@interface SplashManager : NSObject <RCTBridgeModule>
+ (void)show:(NSString*)storyBoard inRootView:(UIView*)rootView;
+ (void)hide;
@end


#endif /* SplashManager_h */
