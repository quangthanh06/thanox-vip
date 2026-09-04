//
//  main.m
//  ThanoxVIP - Liquid Edition
//
//  Lớp bảo vệ khởi động Mach-O cấp độ thấp
//

#import <UIKit/UIKit.h>
#import "AppDelegate.h"
#import <dlfcn.h>
#import <sys/types.h>

typedef int (*ptrace_ptr_t)(int _request, pid_t _pid, caddr_t _addr, int _data);
#define PT_DENY_ATTACH 31

// Vô hiệu hóa mọi trình gắn dò (debugger/ptrace) ngay từ hàm main
static void anti_debug_ptrace_init(void) {
    void* handle = dlopen(NULL, RTLD_GLOBAL | RTLD_NOW);
    if (handle) {
        ptrace_ptr_t ptrace_func = (ptrace_ptr_t)dlsym(handle, "ptrace");
        if (ptrace_func) {
            ptrace_func(PT_DENY_ATTACH, 0, 0, 0);
        }
        dlclose(handle);
    }
}

int main(int argc, char * argv[]) {
    @autoreleasepool {
        // Kích hoạt lá chắn chống debug ptrace tức thì
        anti_debug_ptrace_init();
        return UIApplicationMain(argc, argv, nil, NSStringFromClass([AppDelegate class]));
    }
}
