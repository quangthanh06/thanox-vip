//
//  LocalSchemeHandler.h
//  ThanoxVIP
//
//  Bộ nạp tài nguyên WebKit trong RAM (WKURLSchemeHandler)
//

#import <Foundation/Foundation.h>
#import <WebKit/WebKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface LocalSchemeHandler : NSObject <WKURLSchemeHandler>

@end

NS_ASSUME_NONNULL_END
