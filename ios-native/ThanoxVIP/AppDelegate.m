//
//  AppDelegate.m
//  ThanoxVIP
//

#import "AppDelegate.h"
#import "ViewController.h"
#import "SecurityShield.h"

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    // Kích hoạt lá chắn bảo mật
    [[SecurityShield sharedShield] initializeAndVerifyShield];

    self.window = [[UIWindow alloc] initWithFrame:[[UIScreen mainScreen] bounds]];
    self.window.backgroundColor = [UIColor colorWithRed:0.02 green:0.03 blue:0.04 alpha:1.0];
    ViewController *vc = [[ViewController alloc] init];
    self.window.rootViewController = vc;
    [self.window makeKeyAndVisible];
    return YES;
}

- (void)applicationDidBecomeActive:(UIApplication *)application {
    // Quét định kỳ phát hiện debugger hoặc hook
    if ([[SecurityShield sharedShield] detectDebugger] || [[SecurityShield sharedShield] detectHookAndInjectionTools]) {
        [[SecurityShield sharedShield] terminateProcessWithSecurityViolation:@"PERIODIC_SECURITY_TRIP"];
    }
}

@end
