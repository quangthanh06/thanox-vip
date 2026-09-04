//
//  ViewController.m
//  ThanoxVIP
//

#import "ViewController.h"
#import "LocalSchemeHandler.h"
#import "SecurityShield.h"

@interface ViewController () <WKNavigationDelegate, WKUIDelegate>
@end

@implementation ViewController

- (void)loadView {
    WKWebViewConfiguration *config = [[WKWebViewConfiguration alloc] init];

    // Đăng ký Scheme Handler an toàn nội vi
    LocalSchemeHandler *schemeHandler = [[LocalSchemeHandler alloc] init];
    [config setURLSchemeHandler:schemeHandler forURLScheme:@"thanox-local"];

    // Cấu hình tối ưu hóa WebKit
    WKPreferences *prefs = config.preferences;
    prefs.javaScriptCanOpenWindowsAutomatically = NO;

    // Vô hiệu hóa Safari Web Inspector trên iOS 16.4+ để chống soi mã nguồn qua cáp Mac
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

@end
