//
//  SecurityShield.m
//  ThanoxVIP
//

#import "SecurityShield.h"
#import <sys/sysctl.h>
#import <mach-o/dyld.h>
#import <CommonCrypto/CommonCryptor.h>
#import <CommonCrypto/CommonDigest.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>

// Obfuscated Key và IV cho AES-256 (Khóa bí mật 32 bytes & IV 16 bytes)
// Được xor với mask byte 0x5A để tránh bị lệnh 'strings' bóc tách
static const unsigned char OBFUSCATED_KEY[32] = {
    0x6E, 0x38, 0x1F, 0x72, 0x05, 0x6A, 0x24, 0x4D,
    0x3B, 0x12, 0x7E, 0x55, 0x09, 0x3C, 0x61, 0x2A,
    0x78, 0x0F, 0x42, 0x19, 0x5D, 0x66, 0x33, 0x7C,
    0x21, 0x48, 0x0B, 0x63, 0x1A, 0x7F, 0x54, 0x36
};

static const unsigned char OBFUSCATED_IV[16] = {
    0x1C, 0x4F, 0x72, 0x29, 0x5A, 0x03, 0x3E, 0x61,
    0x48, 0x15, 0x7C, 0x23, 0x5D, 0x0B, 0x34, 0x67
};

static const unsigned char KEY_MASK = 0x5A;

@interface SecurityShield ()
@property (nonatomic, strong, readwrite) NSDictionary<NSString *, NSData *> *decryptedAssetMap;
@property (nonatomic, assign, readwrite) BOOL isShieldActive;
@end

@implementation SecurityShield

+ (instancetype)sharedShield {
    static SecurityShield *instance = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        instance = [[SecurityShield alloc] init];
    });
    return instance;
}

- (instancetype)init {
    self = [super init];
    if (self) {
        _decryptedAssetMap = @{};
        _isShieldActive = NO;
    }
    return self;
}

- (BOOL)initializeAndVerifyShield {
    // 1. Kiểm tra debugger
    if ([self detectDebugger]) {
        [self terminateProcessWithSecurityViolation:@"DEBUGGER_ATTACHED"];
        return NO;
    }

    // 2. Quét công cụ tiêm dylib / hook
    if ([self detectHookAndInjectionTools]) {
        [self terminateProcessWithSecurityViolation:@"INJECTION_TOOL_DETECTED"];
        return NO;
    }

    // 3. Giải mã và nạp bộ tài nguyên trong RAM
    NSString *bundlePath = [[NSBundle mainBundle] pathForResource:@"assets" ofType:@"enc"];
    if (!bundlePath) {
        // Fallback kiểm tra www nếu chạy chế độ test không mã hóa
        NSString *wwwPath = [[NSBundle mainBundle] pathForResource:@"index" ofType:@"html" inDirectory:@"www"];
        if (wwwPath) {
            _isShieldActive = YES;
            return YES;
        }
        [self terminateProcessWithSecurityViolation:@"ASSETS_MISSING"];
        return NO;
    }

    NSData *encryptedData = [NSData dataWithContentsOfFile:bundlePath];
    if (!encryptedData || encryptedData.length < 32) {
        [self terminateProcessWithSecurityViolation:@"ASSETS_CORRUPTED"];
        return NO;
    }

    NSData *decryptedArchive = [self decryptData:encryptedData];
    if (!decryptedArchive) {
        [self terminateProcessWithSecurityViolation:@"DECRYPTION_FAILED"];
        return NO;
    }

    // Giải nén gói archive trong bộ nhớ RAM
    BOOL unpacked = [self unpackInMemoryArchive:decryptedArchive];
    if (!unpacked) {
        [self terminateProcessWithSecurityViolation:@"ARCHIVE_UNPACK_FAILED"];
        return NO;
    }

    _isShieldActive = YES;
    return YES;
}

- (BOOL)detectDebugger {
    int name[4];
    struct kinfo_proc info;
    size_t info_size = sizeof(info);
    info.kp_proc.p_flag = 0;

    name[0] = CTL_KERN;
    name[1] = KERN_PROC;
    name[2] = KERN_PROC_PID;
    name[3] = getpid();

    if (sysctl(name, 4, &info, &info_size, NULL, 0) == -1) {
        return NO;
    }

    return ((info.kp_proc.p_flag & P_TRACED) != 0);
}

- (BOOL)detectHookAndInjectionTools {
    // A. Quét thư viện động qua _dyld
    uint32_t count = _dyld_image_count();
    NSArray *blacklistedDylibs = @[
        @"FridaGadget", @"cydiasubstrate", @"substitute", @"ellekit",
        @"libhooker", @"shadow.dylib", @"choicy.dylib", @"cycript",
        @"fishhook", @"libflex", @"cheatengine", @"gamegem"
    ];

    for (uint32_t i = 0; i < count; i++) {
        const char *imageName = _dyld_get_image_name(i);
        if (imageName) {
            NSString *nsName = [[NSString stringWithUTF8String:imageName] lowercaseString];
            for (NSString *black in blacklistedDylibs) {
                if ([nsName containsString:[black lowercaseString]]) {
                    return YES;
                }
            }
        }
    }

    // B. Quét socket cổng Frida Server (27042)
    int sock = socket(AF_INET, SOCK_STREAM, 0);
    if (sock >= 0) {
        struct sockaddr_in addr;
        memset(&addr, 0, sizeof(addr));
        addr.sin_family = AF_INET;
        addr.sin_port = htons(27042);
        inet_pton(AF_INET, "127.0.0.1", &addr.sin_addr);

        struct timeval timeout;
        timeout.tv_sec = 0;
        timeout.tv_usec = 20000;
        setsockopt(sock, SOL_SOCKET, SO_RCVTIMEO, &timeout, sizeof(timeout));
        setsockopt(sock, SOL_SOCKET, SO_SNDTIMEO, &timeout, sizeof(timeout));

        if (connect(sock, (struct sockaddr *)&addr, sizeof(addr)) == 0) {
            close(sock);
            return YES; // Phát hiện Frida Server đang lắng nghe
        }
        close(sock);
    }

    return NO;
}

- (BOOL)verifyBundleIntegrity {
    // Có thể đối soát hash SHA-256 nội vi
    return YES;
}

- (NSData *)decryptData:(NSData *)encryptedData {
    unsigned char key[32];
    unsigned char iv[16];

    for (int i = 0; i < 32; i++) {
        key[i] = OBFUSCATED_KEY[i] ^ KEY_MASK;
    }
    for (int i = 0; i < 16; i++) {
        iv[i] = OBFUSCATED_IV[i] ^ KEY_MASK;
    }

    size_t bufferSize = encryptedData.length + kCCBlockSizeAES128;
    void *buffer = malloc(bufferSize);
    size_t numBytesDecrypted = 0;

    CCCryptorStatus status = CCCrypt(
        kCCDecrypt,
        kCCAlgorithmAES,
        kCCOptionPKCS7Padding,
        key,
        kCCKeySizeAES256,
        iv,
        encryptedData.bytes,
        encryptedData.length,
        buffer,
        bufferSize,
        &numBytesDecrypted
    );

    if (status == kCCSuccess) {
        NSData *decrypted = [NSData dataWithBytes:buffer length:numBytesDecrypted];
        free(buffer);
        return decrypted;
    }

    free(buffer);
    return nil;
}

- (BOOL)unpackInMemoryArchive:(NSData *)archiveData {
    // Định dạng gói nhị phân tùy biến đơn giản, siêu nhanh:
    // [4 bytes count]
    // Cho mỗi entry:
    //   [2 bytes path_len]
    //   [path UTF-8 string]
    //   [4 bytes data_len]
    //   [data bytes]

    NSMutableDictionary *map = [NSMutableDictionary dictionary];
    const unsigned char *bytes = (const unsigned char *)archiveData.bytes;
    size_t totalLen = archiveData.length;
    size_t offset = 0;

    if (totalLen < 4) return NO;

    uint32_t fileCount = *(uint32_t *)(bytes + offset);
    offset += 4;

    for (uint32_t i = 0; i < fileCount; i++) {
        if (offset + 2 > totalLen) return NO;
        uint16_t pathLen = *(uint16_t *)(bytes + offset);
        offset += 2;

        if (offset + pathLen > totalLen) return NO;
        NSString *path = [[NSString alloc] initWithBytes:(bytes + offset) length:pathLen encoding:NSUTF8StringEncoding];
        offset += pathLen;

        if (offset + 4 > totalLen) return NO;
        uint32_t dataLen = *(uint32_t *)(bytes + offset);
        offset += 4;

        if (offset + dataLen > totalLen) return NO;
        NSData *fileData = [NSData dataWithBytes:(bytes + offset) length:dataLen];
        offset += dataLen;

        if (path && fileData) {
            [map setObject:fileData forKey:path];
        }
    }

    self.decryptedAssetMap = [map copy];
    return (map.count > 0);
}

- (nullable NSData *)dataForRelativePath:(NSString *)path {
    // Chuẩn hóa đường dẫn
    NSString *cleanPath = [path stringByTrimmingCharactersInSet:[NSCharacterSet characterSetWithCharactersInString:@"/"]];
    NSData *data = self.decryptedAssetMap[cleanPath];
    if (data) return data;

    // Thử fallback index.html nếu yêu cầu root
    if ([cleanPath isEqualToString:@""] || [cleanPath isEqualToString:@"index.html"]) {
        return self.decryptedAssetMap[@"index.html"];
    }

    return nil;
}

- (void)terminateProcessWithSecurityViolation:(NSString *)reason {
    NSLog(@"[LÁ CHẮN BẢO MẬT NATIVE] Vi phạm: %@ -> Tiến trình tự hủy!", reason);
    // Thoát đột ngột không để lại crash trace
    abort();
}

@end
