#import "RCTTestFairyBridge.h"
#import <React/RCTConvert.h>
#import <React/RCTLog.h>
#import <React/RCTUIManager.h>
#import "TestFairy.h"

@implementation RCTTestFairyBridge

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(begin:(NSString *)appKey withOptions:(NSDictionary *)options) {
	dispatch_async(dispatch_get_main_queue(), ^{
		[TestFairy begin:appKey withOptions:options];
	});
}

RCT_EXPORT_METHOD(setCorrelationId:(NSString *)correlationId) {
	dispatch_async(dispatch_get_main_queue(), ^{
		[TestFairy setCorrelationId:correlationId];
	});
}

RCT_EXPORT_METHOD(identify:(NSString *)correlationId traits:(NSDictionary *)traits) {
		dispatch_async(dispatch_get_main_queue(), ^{
			[TestFairy identify:correlationId traits:traits];
		});
}

RCT_EXPORT_METHOD(takeScreenshot) {
	dispatch_async(dispatch_get_main_queue(), ^{
		[TestFairy takeScreenshot];
	});
}

RCT_EXPORT_METHOD(pause) {
	dispatch_async(dispatch_get_main_queue(), ^{
		[TestFairy pause];
	});
}

RCT_EXPORT_METHOD(resume) {
	dispatch_async(dispatch_get_main_queue(), ^{
		[TestFairy resume];
	});
}

RCT_EXPORT_METHOD(checkpoint:(NSString *)name) {
	dispatch_async(dispatch_get_main_queue(), ^{
		[TestFairy checkpoint:name];
	});
}

RCT_EXPORT_METHOD(sendUserFeedback:(NSString *)feedback) {
	dispatch_async(dispatch_get_main_queue(), ^{
		[TestFairy sendUserFeedback:feedback];
	});
}

RCT_EXPORT_METHOD(sessionUrl:(RCTResponseSenderBlock)callback) {
	dispatch_async(dispatch_get_main_queue(), ^{
		callback(@[[NSNull null], [TestFairy sessionUrl]]);
	});
}

RCT_EXPORT_METHOD(version:(RCTResponseSenderBlock)callback) {
	dispatch_async(dispatch_get_main_queue(), ^{
		callback(@[[NSNull null], [TestFairy version]]);
	});
}

RCT_EXPORT_METHOD(setServerEndpoint:(NSString *)url) {
	dispatch_async(dispatch_get_main_queue(), ^{
		[TestFairy setServerEndpoint:url];
	});
}

RCT_EXPORT_METHOD(log:(NSString *)message) {
	dispatch_async(dispatch_get_main_queue(), ^{
		TFLog(@"%@", message);
	});
}

RCT_EXPORT_METHOD(setScreenName:(NSString *)name) {
	dispatch_async(dispatch_get_main_queue(), ^{
		[TestFairy setScreenName:name];
	});
}

RCT_EXPORT_METHOD(stop) {
	dispatch_async(dispatch_get_main_queue(), ^{
		[TestFairy stop];
	});
}

RCT_EXPORT_METHOD(pushFeedbackController) {
	dispatch_async(dispatch_get_main_queue(), ^{
		[TestFairy pushFeedbackController];
	});
}

RCT_EXPORT_METHOD(setUserId:(NSString *)userId) {
	dispatch_async(dispatch_get_main_queue(), ^{
		[TestFairy setUserId:userId];
	});
}

RCT_EXPORT_METHOD(hideWebViewElements:(NSString *)cssSelector) {
	dispatch_async(dispatch_get_main_queue(), ^{
		[TestFairy hideWebViewElements:cssSelector];
	});
}

RCT_EXPORT_METHOD(setAttribute:(NSString *)key value:(NSString *)value) {
	dispatch_async(dispatch_get_main_queue(), ^{
		[TestFairy setAttribute:key withValue:value];
	});
}

RCT_EXPORT_METHOD(enableCrashHandler) {
	dispatch_async(dispatch_get_main_queue(), ^{
		[TestFairy enableCrashHandler];
	});
}

RCT_EXPORT_METHOD(disableCrashHandler) {
	dispatch_async(dispatch_get_main_queue(), ^{
		[TestFairy disableCrashHandler];
	});
}

RCT_EXPORT_METHOD(enableMetric:(NSString *)metric) {
	dispatch_async(dispatch_get_main_queue(), ^{
		[TestFairy enableMetric:metric];
	});
}

RCT_EXPORT_METHOD(disableMetric:(NSString *)metric) {
	dispatch_async(dispatch_get_main_queue(), ^{
		[TestFairy disableMetric:metric];
	});
}

RCT_EXPORT_METHOD(enableVideo:(NSString *)policy quality:(NSString*)quality framesPerSecond:(float)fps) {
	dispatch_async(dispatch_get_main_queue(), ^{
		[TestFairy enableVideo:policy quality:quality framesPerSecond:fps];
	});
}

RCT_EXPORT_METHOD(disableVideo) {
	dispatch_async(dispatch_get_main_queue(), ^{
		[TestFairy disableVideo];
	});
}

RCT_EXPORT_METHOD(enableFeedbackForm:(NSString*) method) {
	dispatch_async(dispatch_get_main_queue(), ^{
		[TestFairy enableFeedbackForm:method];
	});
}

RCT_EXPORT_METHOD(disableFeedbackForm) {
	dispatch_async(dispatch_get_main_queue(), ^{
		[TestFairy disableFeedbackForm];
	});
}

RCT_EXPORT_METHOD(setMaxSessionLength:(float)seconds) {
	dispatch_async(dispatch_get_main_queue(), ^{
		[TestFairy setMaxSessionLength:seconds];
	});
}

RCT_EXPORT_METHOD(hideView:(nonnull NSNumber *)reactTag) {
	dispatch_async(_bridge.uiManager.methodQueue, ^{
		[_bridge.uiManager addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
			__block UIView *view = viewRegistry[reactTag];
			if (view != nil) {
				dispatch_async(dispatch_get_main_queue(), ^{
					[TestFairy hideView:view];
				});
			}
		}];
	});
}

@end
