import UIKit
import Capacitor

class MainViewController: CAPBridgeViewController {
    override func loadView() {
        super.loadView()
        bridge?.registerPluginType(LiveActivityPlugin.self)
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        bridge?.registerPluginType(LiveActivityPlugin.self)
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        bridge?.registerPluginType(LiveActivityPlugin.self)
    }
}
