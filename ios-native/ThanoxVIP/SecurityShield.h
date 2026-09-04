//
//  SecurityShield.h
//  ThanoxVIP
//
//  Hệ thống bảo vệ chống bẻ khóa đa tầng (Anti-Crack & Anti-Tamper Shield)
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface SecurityShield : NSObject

@property (nonatomic, strong, readonly) NSDictionary<NSString *, NSData *> *decryptedAssetMap;
@property (nonatomic, assign, readonly) BOOL isShieldActive;

+ (instancetype)sharedShield;

// Khởi tạo và kích hoạt toàn bộ lá chắn bảo mật
- (BOOL)initializeAndVerifyShield;

// Kiểm tra trình gỡ lỗi (debugger)
- (BOOL)detectDebugger;

// Phát hiện công cụ can thiệp bộ nhớ và tiêm dylib (Frida, Substrate, v.v.)
- (BOOL)detectHookAndInjectionTools;

// Xác thực chữ ký toàn vẹn của tệp tài nguyên mã hóa
- (BOOL)verifyBundleIntegrity;

// Trích xuất tài nguyên trong bộ nhớ RAM theo đường dẫn tương đối
- (nullable NSData *)dataForRelativePath:(NSString *)path;

// Hủy tiến trình tự vệ khi phát hiện vi phạm
- (void)terminateProcessWithSecurityViolation:(NSString *)reason;

@end

NS_ASSUME_NONNULL_END
