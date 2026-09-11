import UIKit
import Capacitor
import WebKit

class MainViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        bridge?.registerPluginType(LiveActivityPlugin.self)
        DispatchQueue.main.async { [weak self] in
            if let webView = self?.webView {
                webView.allowsBackForwardNavigationGestures = true
            }
        }
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        bridge?.registerPluginType(LiveActivityPlugin.self)
        DispatchQueue.main.async { [weak self] in
            if let webView = self?.webView {
                webView.allowsBackForwardNavigationGestures = true
            }
        }
    }
}
