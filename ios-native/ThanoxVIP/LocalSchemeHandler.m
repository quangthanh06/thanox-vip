//
//  LocalSchemeHandler.m
//  ThanoxVIP
//

#import "LocalSchemeHandler.h"
#import "SecurityShield.h"

@implementation LocalSchemeHandler

- (void)webView:(WKWebView *)webView startURLSchemeTask:(id<WKURLSchemeTask>)urlSchemeTask {
    NSURL *requestURL = urlSchemeTask.request.URL;
    NSString *path = requestURL.path;
    if ([path hasPrefix:@"/"]) {
        path = [path substringFromIndex:1];
    }
    if (path.length == 0 || [path isEqualToString:@"app"]) {
        path = @"index.html";
    }

    NSData *data = [[SecurityShield sharedShield] dataForRelativePath:path];

    if (!data) {
        // Fallback đọc trực tiếp từ bundle nếu chưa mã hóa
        NSString *fallbackPath = [[NSBundle mainBundle] pathForResource:path ofType:nil inDirectory:@"www"];
        if (fallbackPath) {
            data = [NSData dataWithContentsOfFile:fallbackPath];
        }
    }

    if (data) {
        NSString *mimeType = [self mimeTypeForPath:path];
        NSHTTPURLResponse *response = [[NSHTTPURLResponse alloc] initWithURL:requestURL
                                                                  statusCode:200
                                                                 HTTPVersion:@"HTTP/1.1"
                                                                headerFields:@{
            @"Content-Type": mimeType,
            @"Content-Length": [NSString stringWithFormat:@"%lu", (unsigned long)data.length],
            @"Cache-Control": @"no-cache, no-store, must-revalidate",
            @"Access-Control-Allow-Origin": @"*"
        }];

        [urlSchemeTask didReceiveResponse:response];
        [urlSchemeTask didReceiveData:data];
        [urlSchemeTask didFinish];
    } else {
        NSHTTPURLResponse *response = [[NSHTTPURLResponse alloc] initWithURL:requestURL
                                                                  statusCode:404
                                                                 HTTPVersion:@"HTTP/1.1"
                                                                headerFields:@{}];
        [urlSchemeTask didReceiveResponse:response];
        [urlSchemeTask didFinish];
    }
}

- (void)webView:(WKWebView *)webView stopURLSchemeTask:(id<WKURLSchemeTask>)urlSchemeTask {
    // Không cần xử lý hủy luồng đặc biệt
}

- (NSString *)mimeTypeForPath:(NSString *)path {
    NSString *ext = [path pathExtension].lowercaseString;
    if ([ext isEqualToString:@"html"] || [ext isEqualToString:@"htm"]) return @"text/html; charset=utf-8";
    if ([ext isEqualToString:@"js"]) return @"application/javascript; charset=utf-8";
    if ([ext isEqualToString:@"css"]) return @"text/css; charset=utf-8";
    if ([ext isEqualToString:@"png"]) return @"image/png";
    if ([ext isEqualToString:@"jpg"] || [ext isEqualToString:@"jpeg"]) return @"image/jpeg";
    if ([ext isEqualToString:@"svg"]) return @"image/svg+xml";
    if ([ext isEqualToString:@"json"]) return @"application/json";
    if ([ext isEqualToString:@"3105"]) return @"application/octet-stream";
    if ([ext isEqualToString:@"woff2"]) return @"font/woff2";
    if ([ext isEqualToString:@"woff"]) return @"font/woff";
    return @"application/octet-stream";
}

@end
