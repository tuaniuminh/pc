import SwiftUI
import WebKit
import AVFoundation

public struct MainTabView: View {
    public init() {}
    
    public var body: some View {
        ZStack {
            Color(red: 0.027, green: 0.039, blue: 0.075)
                .ignoresSafeArea()
            
            PWAWebView()
                .ignoresSafeArea(.all, edges: .bottom)
        }
        .preferredColorScheme(.dark)
    }
}

public struct PWAWebView: UIViewRepresentable {
    public init() {}
    
    public func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    public func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        
        let prefs = WKWebpagePreferences()
        prefs.allowsContentJavaScript = true
        config.defaultWebpagePreferences = prefs
        
        // Add Native Haptic & WakeLock Bridge Handlers
        let contentController = WKUserContentController()
        contentController.add(context.coordinator, name: "haptic")
        contentController.add(context.coordinator, name: "wakelock")
        config.userContentController = contentController
        
        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 0.027, green: 0.039, blue: 0.075, alpha: 1.0)
        webView.scrollView.backgroundColor = UIColor(red: 0.027, green: 0.039, blue: 0.075, alpha: 1.0)
        webView.scrollView.bounces = true
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        
        // Hide scroll indicators for ultra-clean UI
        webView.scrollView.showsVerticalScrollIndicator = false
        webView.scrollView.showsHorizontalScrollIndicator = false
        
        // Find index.html in main bundle or www directory
        if let indexURL = Bundle.main.url(forResource: "index", withExtension: "html") {
            webView.loadFileURL(indexURL, allowingReadAccessTo: indexURL.deletingLastPathComponent())
        } else if let wwwURL = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "www") {
            webView.loadFileURL(wwwURL, allowingReadAccessTo: wwwURL.deletingLastPathComponent())
        } else {
            // Fallback: load local path from bundlePath
            let bundlePath = Bundle.main.bundlePath
            let indexFilePath = URL(fileURLWithPath: bundlePath).appendingPathComponent("index.html")
            webView.loadFileURL(indexFilePath, allowingReadAccessTo: URL(fileURLWithPath: bundlePath))
        }
        
        return webView
    }
    
    public func updateUIView(_ uiView: WKWebView, context: Context) {}
    
    public class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
        var parent: PWAWebView
        
        init(_ parent: PWAWebView) {
            self.parent = parent
            super.init()
        }
        
        public func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            if message.name == "haptic" {
                if let type = message.body as? String {
                    triggerHaptic(type: type)
                }
            } else if message.name == "wakelock" {
                if let enable = message.body as? Bool {
                    DispatchQueue.main.async {
                        UIApplication.shared.isIdleTimerDisabled = enable
                    }
                }
            }
        }
        
        private func triggerHaptic(type: String) {
            switch type {
            case "light":
                let generator = UIImpactFeedbackGenerator(style: .light)
                generator.impactOccurred()
            case "medium":
                let generator = UIImpactFeedbackGenerator(style: .medium)
                generator.impactOccurred()
            case "heavy":
                let generator = UIImpactFeedbackGenerator(style: .heavy)
                generator.impactOccurred()
            case "success":
                let generator = UINotificationFeedbackGenerator()
                generator.notificationOccurred(.success)
            default:
                let generator = UIImpactFeedbackGenerator(style: .medium)
                generator.impactOccurred()
            }
        }
    }
}
