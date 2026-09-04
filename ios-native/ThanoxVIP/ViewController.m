//
//  ViewController.m
//  ThanoxVIP
//

#import "ViewController.h"
#import "LocalSchemeHandler.h"
#import "SecurityShield.h"
#import <sys/utsname.h>

static NSString *GetDeviceModelName(void) {
    struct utsname systemInfo;
    uname(&systemInfo);
    NSString *machine = [NSString stringWithCString:systemInfo.machine encoding:NSUTF8StringEncoding];

    NSDictionary *mapping = @{
        @"iPhone15,3": @"iPhone 14 Pro Max",
        @"iPhone15,2": @"iPhone 14 Pro",
        @"iPhone14,8": @"iPhone 14 Plus",
        @"iPhone14,7": @"iPhone 14",
        @"iPhone16,2": @"iPhone 15 Pro Max",
        @"iPhone16,1": @"iPhone 15 Pro",
        @"iPhone15,5": @"iPhone 15 Plus",
        @"iPhone15,4": @"iPhone 15",
        @"iPhone17,2": @"iPhone 16 Pro Max",
        @"iPhone17,1": @"iPhone 16 Pro",
        @"iPhone17,4": @"iPhone 16 Plus",
        @"iPhone17,3": @"iPhone 16",
        @"iPhone14,3": @"iPhone 13 Pro Max",
        @"iPhone14,2": @"iPhone 13 Pro",
        @"iPhone14,5": @"iPhone 13",
        @"iPhone14,4": @"iPhone 13 mini",
        @"iPhone13,4": @"iPhone 12 Pro Max",
        @"iPhone13,3": @"iPhone 12 Pro",
        @"iPhone13,2": @"iPhone 12",
        @"iPhone12,5": @"iPhone 11 Pro Max",
        @"iPhone12,3": @"iPhone 11 Pro",
        @"iPhone12,1": @"iPhone 11",
        @"iPhone11,8": @"iPhone XR",
        @"iPhone11,6": @"iPhone XS Max",
        @"iPhone11,2": @"iPhone XS",
        @"iPhone10,6": @"iPhone X",
        @"iPhone10,3": @"iPhone X"
    };

    return mapping[machine] ?: @"iPhone 14 Pro Max";
}

@implementation ViewController

- (void)loadView {
    WKWebViewConfiguration *config = [[WKWebViewConfiguration alloc] init];

    // Đăng ký Scheme Handler an toàn nội vi
    LocalSchemeHandler *schemeHandler = [[LocalSchemeHandler alloc] init];
    [config setURLSchemeHandler:schemeHandler forURLScheme:@"thanox-local"];

    // Đăng ký Bridge Message Handler nhận lệnh từ JavaScript
    [config.userContentController addScriptMessageHandler:self name:@"thanoxBridge"];

    // Cấu hình tối ưu hóa WebKit
    WKPreferences *prefs = config.preferences;
    prefs.javaScriptCanOpenWindowsAutomatically = NO;

    if (@available(iOS 16.4, *)) {
        config.defaultWebpagePreferences.allowsContentJavaScript = YES;
    }

    self.webView = [[WKWebView alloc] initWithFrame:[[UIScreen mainScreen] bounds] configuration:config];
    self.webView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    self.webView.navigationDelegate = self;
    self.webView.UIDelegate = self;
    self.webView.opaque = NO;
    self.webView.backgroundColor = [UIColor colorWithRed:0.02 green:0.03 blue:0.04 alpha:1.0];
    self.webView.scrollView.backgroundColor = [UIColor colorWithRed:0.02 green:0.03 blue:0.04 alpha:1.0];
    self.webView.scrollView.bounces = NO;
    self.webView.scrollView.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentNever;

    self.view = self.webView;
}

- (void)viewDidLoad {
    [super viewDidLoad];

    self.overrideUserInterfaceStyle = UIUserInterfaceStyleDark;

    // Tải ứng dụng trực tiếp từ scheme an toàn
    NSURL *appURL = [NSURL URLWithString:@"thanox-local://app/index.html"];
    [self.webView loadRequest:[NSURLRequest requestWithURL:appURL]];
}

- (UIStatusBarStyle)preferredStatusBarStyle {
    return UIStatusBarStyleLightContent;
}

- (BOOL)prefersStatusBarHidden {
    return NO;
}

- (BOOL)prefersHomeIndicatorAutoHidden {
    return YES;
}

- (void)viewDidLayoutSubviews {
    [super viewDidLayoutSubviews];
    self.webView.frame = self.view.bounds;
}

#pragma mark - WKScriptMessageHandler (Native Bridge)

- (void)userContentController:(WKUserContentController *)userContentController didReceiveScriptMessage:(WKScriptMessage *)message {
    if (![message.name isEqualToString:@"thanoxBridge"]) return;

    NSDictionary *body = nil;
    if ([message.body isKindOfClass:[NSDictionary class]]) {
        body = (NSDictionary *)message.body;
    } else if ([message.body isKindOfClass:[NSString class]]) {
        NSData *data = [((NSString *)message.body) dataUsingEncoding:NSUTF8StringEncoding];
        body = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
    }
    if (!body) return;

    NSString *action = body[@"action"];

    // 1. KÍCH HOẠT MỞ GAME TRỰC TIẾP
    if ([action isEqualToString:@"launchGame"]) {
        NSString *game = body[@"game"] ?: @"Free Fire";
        NSString *scheme = body[@"scheme"];
        [self launchGameWithPreferredScheme:scheme forGame:game];
    }
    // 2. PHẢN HỒI RUNG TAPTIC ENGINE NATIVE
    else if ([action isEqualToString:@"haptic"]) {
        NSString *type = body[@"type"] ?: @"medium";
        dispatch_async(dispatch_get_main_queue(), ^{
            if ([type isEqualToString:@"light"]) {
                UIImpactFeedbackGenerator *gen = [[UIImpactFeedbackGenerator alloc] initWithStyle:UIImpactFeedbackStyleLight];
                [gen impactOccurred];
            } else if ([type isEqualToString:@"heavy"]) {
                UIImpactFeedbackGenerator *gen = [[UIImpactFeedbackGenerator alloc] initWithStyle:UIImpactFeedbackStyleHeavy];
                [gen impactOccurred];
            } else if ([type isEqualToString:@"success"]) {
                UINotificationFeedbackGenerator *gen = [[UINotificationFeedbackGenerator alloc] init];
                [gen notificationOccurred:UINotificationFeedbackTypeSuccess];
            } else {
                UIImpactFeedbackGenerator *gen = [[UIImpactFeedbackGenerator alloc] initWithStyle:UIImpactFeedbackStyleMedium];
                [gen impactOccurred];
            }
        });
    }
    // 3. MỞ ĐƯỜNG DẪN NGOẠI VI / CÀI ĐẶT HỒ SƠ SAFARI
    else if ([action isEqualToString:@"openUrl"] || [action isEqualToString:@"installProfile"]) {
        NSString *urlString = body[@"url"];
        if (urlString) {
            NSURL *url = [NSURL URLWithString:urlString];
            if (url) {
                [[UIApplication sharedApplication] openURL:url options:@{} completionHandler:nil];
            }
        }
    }
    // 4. CHIA SẺ HOẶC LƯU FILE CẤU HÌNH VÀO TỆP / ESIGN
    else if ([action isEqualToString:@"shareFile"]) {
        NSString *fileName = body[@"fileName"] ?: @"Thanox.mobileconfig";
        NSData *fileData = [[SecurityShield sharedShield] dataForRelativePath:fileName];
        if (!fileData) {
            NSString *fallbackPath = [[NSBundle mainBundle] pathForResource:fileName ofType:nil inDirectory:@"www"];
            if (fallbackPath) {
                fileData = [NSData dataWithContentsOfFile:fallbackPath];
            }
        }
        if (fileData) {
            NSString *tempPath = [NSTemporaryDirectory() stringByAppendingPathComponent:fileName];
            [fileData writeToFile:tempPath atomically:YES];
            NSURL *fileURL = [NSURL fileURLWithPath:tempPath];
            dispatch_async(dispatch_get_main_queue(), ^{
                UIActivityViewController *activityVC = [[UIActivityViewController alloc] initWithActivityItems:@[fileURL] applicationActivities:nil];
                if (UIDevice.currentDevice.userInterfaceIdiom == UIUserInterfaceIdiomPad) {
                    activityVC.popoverPresentationController.sourceView = self.view;
                    activityVC.popoverPresentationController.sourceRect = CGRectMake(self.view.bounds.size.width / 2, self.view.bounds.size.height / 2, 1, 1);
                }
                [self presentViewController:activityVC animated:YES completion:nil];
            });
        }
    }
}

#pragma mark - Native Game Launching Engine

- (void)launchGameWithPreferredScheme:(NSString *)preferredScheme forGame:(NSString *)game {
    BOOL isMax = [game containsString:@"MAX"] || [preferredScheme containsString:@"max"];

    NSMutableArray<NSString *> *schemesToTry = [NSMutableArray array];
    if (preferredScheme && preferredScheme.length > 0) {
        [schemesToTry addObject:preferredScheme];
    }

    if (isMax) {
        [schemesToTry addObjectsFromArray:@[
            @"freefiremax://",
            @"freefire://",
            @"fb1460596327663248://"
        ]];
    } else {
        [schemesToTry addObjectsFromArray:@[
            @"freefiremobile://",
            @"freefire://",
            @"garena://",
            @"fb385480215177319://"
        ]];
    }

    [self tryOpenSchemesSequentially:schemesToTry index:0 fallbackToStore:isMax];
}

- (void)tryOpenSchemesSequentially:(NSArray<NSString *> *)schemes index:(NSUInteger)idx fallbackToStore:(BOOL)isMax {
    if (idx >= schemes.count) {
        // Mở link App Store nếu máy chưa cài
        dispatch_async(dispatch_get_main_queue(), ^{
            NSString *storeUrl = isMax ?
                @"https://apps.apple.com/vn/app/free-fire-max/id1480516829" :
                @"https://apps.apple.com/vn/app/garena-free-fire/id1300146617";
            [[UIApplication sharedApplication] openURL:[NSURL URLWithString:storeUrl] options:@{} completionHandler:nil];
        });
        return;
    }

    NSString *schemeStr = schemes[idx];
    NSURL *url = [NSURL URLWithString:schemeStr];

    if (!url) {
        [self tryOpenSchemesSequentially:schemes index:idx + 1 fallbackToStore:isMax];
        return;
    }

    dispatch_async(dispatch_get_main_queue(), ^{
        [[UIApplication sharedApplication] openURL:url options:@{} completionHandler:^(BOOL success) {
            if (!success) {
                [self tryOpenSchemesSequentially:schemes index:idx + 1 fallbackToStore:isMax];
            }
        }];
    });
}

#pragma mark - WKNavigationDelegate (Xử lý chuyển hướng URL Scheme)

- (void)webView:(WKWebView *)webView decidePolicyForNavigationAction:(WKNavigationAction *)navigationAction decisionHandler:(void (^)(WKNavigationActionPolicy))decisionHandler {
    NSURL *url = navigationAction.request.URL;
    NSString *scheme = url.scheme.lowercaseString;

    // Cho phép scheme nội bộ
    if ([scheme isEqualToString:@"thanox-local"]) {
        decisionHandler(WKNavigationActionPolicyAllow);
        return;
    }

    // Xử lý mở scheme Game Free Fire
    if ([scheme hasPrefix:@"freefire"] || [scheme isEqualToString:@"garena"] || [scheme hasPrefix:@"fb"]) {
        [[UIApplication sharedApplication] openURL:url options:@{} completionHandler:nil];
        decisionHandler(WKNavigationActionPolicyCancel);
        return;
    }

    // Xử lý mở mạng xã hội Telegram, Zalo, AppStore bên ngoài Safari
    if ([url.host containsString:@"t.me"] || [url.host containsString:@"zalo.me"] || [scheme isEqualToString:@"tg"] || [scheme isEqualToString:@"zalo"] || [scheme isEqualToString:@"itms-apps"]) {
        [[UIApplication sharedApplication] openURL:url options:@{} completionHandler:nil];
        decisionHandler(WKNavigationActionPolicyCancel);
        return;
    }

    // Mở link ngoài bằng Safari
    if (navigationAction.navigationType == WKNavigationTypeLinkActivated) {
        [[UIApplication sharedApplication] openURL:url options:@{} completionHandler:nil];
        decisionHandler(WKNavigationActionPolicyCancel);
        return;
    }

    decisionHandler(WKNavigationActionPolicyAllow);
}

- (void)webView:(WKWebView *)webView didFinishNavigation:(WKNavigation *)navigation {
    // Tự động nhận diện phần cứng iPhone và đồng bộ sang JavaScript
    NSString *detectedModel = GetDeviceModelName();
    NSString *js = [NSString stringWithFormat:@"if (typeof setNativeDeviceModel === 'function') { setNativeDeviceModel('%@'); }", detectedModel];
    [webView evaluateJavaScript:js completionHandler:nil];
}

@end
