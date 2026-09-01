import Foundation
import Capacitor
import ActivityKit
import AVFoundation
import UIKit

@objc(LiveActivityPlugin)
public class LiveActivityPlugin: CAPPlugin, CAPBridgedPlugin, UIDocumentInteractionControllerDelegate {
    public let identifier = "LiveActivityPlugin"
    public let jsName = "LiveActivityPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "startActivity", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "updateActivity", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopActivity", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getDiagnosticInfo", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "downloadAndOpenIPA", returnType: CAPPluginReturnPromise)
    ]

    private var activeDownloader: IPADownloadManager?
    private var docInteractionController: UIDocumentInteractionController?

    public override func load() {
        super.load()
        UIDevice.current.isBatteryMonitoringEnabled = true
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    // MARK: - UIDocumentInteractionController Delegate
    public func documentInteractionControllerViewControllerForPreview(_ controller: UIDocumentInteractionController) -> UIViewController {
        return self.bridge?.viewController ?? UIViewController()
    }

    public func documentInteractionControllerViewForPreview(_ controller: UIDocumentInteractionController) -> UIView? {
        return self.bridge?.viewController?.view
    }

    public func documentInteractionControllerRectForPreview(_ controller: UIDocumentInteractionController) -> CGRect {
        return self.bridge?.viewController?.view.bounds ?? .zero
    }

    // MARK: - Native In-App IPA Downloader & TrollStore Direct Opener
    @objc public func downloadAndOpenIPA(_ call: CAPPluginCall) {
        guard let urlString = call.getString("url"), let url = URL(string: urlString) else {
            call.reject("URL tải file IPA không hợp lệ")
            return
        }

        let fileName = url.lastPathComponent.isEmpty ? "PCFlex-Update.ipa" : url.lastPathComponent
        let destinationUrl = FileManager.default.temporaryDirectory.appendingPathComponent(fileName)
        try? FileManager.default.removeItem(at: destinationUrl)

        self.activeDownloader = IPADownloadManager()
        self.activeDownloader?.onProgress = { [weak self] progress, downloaded, total, speed in
            self?.notifyListeners("ipaDownloadProgress", data: [
                "progress": progress,
                "downloadedBytes": downloaded,
                "totalBytes": total,
                "downloadedMB": String(format: "%.1f", Double(downloaded) / 1024.0 / 1024.0),
                "totalMB": String(format: "%.1f", Double(total) / 1024.0 / 1024.0),
                "speed": speed
            ])
        }

        self.activeDownloader?.onCompletion = { [weak self] localUrl, error in
            if let error = error {
                DispatchQueue.main.async {
                    call.reject("Lỗi tải file IPA: \(error.localizedDescription)")
                }
                return
            }

            guard let localUrl = localUrl else {
                DispatchQueue.main.async {
                    call.reject("Không tìm thấy file IPA đã tải")
                }
                return
            }

            do {
                try FileManager.default.moveItem(at: localUrl, to: destinationUrl)

                DispatchQueue.main.async {
                    guard let self = self, let viewController = self.bridge?.viewController else {
                        call.resolve(["success": true, "path": destinationUrl.path])
                        return
                    }

                    // 1. Mở trực tiếp TrollStore qua URL Scheme (Ưu tiên số 1 - Cài đặt tức thì không cần Share Sheet)
                    let fileUrlString = destinationUrl.absoluteString
                    let filePathString = destinationUrl.path
                    let trollUrls = [
                        URL(string: "apple-magnifier://install?url=\(fileUrlString.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")"),
                        URL(string: "trollstore://install?url=\(fileUrlString.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")"),
                        URL(string: "apple-magnifier://install?url=\(filePathString.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")"),
                        URL(string: "trollstore://install?url=\(filePathString.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")")
                    ]

                    var openedDirectly = false
                    for tUrl in trollUrls.compactMap({ $0 }) {
                        if UIApplication.shared.canOpenURL(tUrl) {
                            UIApplication.shared.open(tUrl, options: [:], completionHandler: nil)
                            openedDirectly = true
                            break
                        }
                    }

                    // 2. Fallback sang Open-In Menu nếu không bắt được Scheme
                    if !openedDirectly {
                        self.docInteractionController = UIDocumentInteractionController(url: destinationUrl)
                        self.docInteractionController?.delegate = self
                        self.docInteractionController?.uti = "com.apple.itunes.ipa"

                        let centerRect = CGRect(x: viewController.view.bounds.midX, y: viewController.view.bounds.midY, width: 0, height: 0)
                        let presented = self.docInteractionController?.presentOpenInMenu(from: centerRect, in: viewController.view, animated: true) ?? false

                        if !presented {
                            let activityVC = UIActivityViewController(activityItems: [destinationUrl], applicationActivities: nil)
                            if let popover = activityVC.popoverPresentationController {
                                popover.sourceView = viewController.view
                                popover.sourceRect = centerRect
                                popover.permittedArrowDirections = []
                            }
                            viewController.present(activityVC, animated: true)
                        }
                    }

                    call.resolve([
                        "success": true,
                        "path": destinationUrl.path,
                        "openedDirectly": openedDirectly
                    ])
                }
            } catch {
                DispatchQueue.main.async {
                    call.reject("Lỗi lưu file IPA: \(error.localizedDescription)")
                }
            }
        }

        self.activeDownloader?.startDownload(from: url)
    }

    @objc public func getDiagnosticInfo(_ call: CAPPluginCall) {
        var diagnostic: [String: Any] = [:]
        diagnostic["bundleId"] = Bundle.main.bundleIdentifier ?? "unknown"
        diagnostic["appVersion"] = Bundle.main.infoDictionary?["CFBundleShortVersionString"] ?? "unknown"
        diagnostic["bundlePath"] = Bundle.main.bundlePath

        // Cảm biến phần cứng & Pin & Nhiệt độ máy
        let thermal = ProcessInfo.processInfo.thermalState
        diagnostic["thermalState"] = thermal == .nominal ? "Nominal (Bình thường)" :
                                     thermal == .fair ? "Fair (Hơi ấm)" :
                                     thermal == .serious ? "Serious (Nóng)" : "Critical (Rất nóng)"
        diagnostic["isLowPowerModeEnabled"] = ProcessInfo.processInfo.isLowPowerModeEnabled

        let batteryLevel = UIDevice.current.batteryLevel
        diagnostic["batteryLevelPercent"] = batteryLevel >= 0 ? Int(batteryLevel * 100) : -1
        let batState = UIDevice.current.batteryState
        diagnostic["batteryState"] = batState == .charging ? "Đang sạc" :
                                    batState == .full ? "Đầy 100%" :
                                    batState == .unplugged ? "Dùng pin" : "Không xác định"

        call.resolve(diagnostic)
    }

    @objc public func startActivity(_ call: CAPPluginCall) {
        call.resolve(["status": "disabled"])
    }

    @objc public func updateActivity(_ call: CAPPluginCall) {
        call.resolve()
    }

    @objc public func stopActivity(_ call: CAPPluginCall) {
        call.resolve()
    }
}

// MARK: - IPADownloadManager (Hỗ trợ theo dõi tiến trình tải % & tính tốc độ tải Speed MB/s)
class IPADownloadManager: NSObject, URLSessionDownloadDelegate {
    var onProgress: ((Double, Int64, Int64, String) -> Void)?
    var onCompletion: ((URL?, Error?) -> Void)?
    private var downloadSession: URLSession?
    private var lastSpeedCalculationTime: Date = Date()
    private var lastBytesCount: Int64 = 0
    private var currentSpeedStr: String = "0 KB/s"

    func startDownload(from url: URL) {
        let config = URLSessionConfiguration.default
        downloadSession = URLSession(configuration: config, delegate: self, delegateQueue: nil)
        lastSpeedCalculationTime = Date()
        lastBytesCount = 0
        currentSpeedStr = "0 KB/s"
        let task = downloadSession?.downloadTask(with: url)
        task?.resume()
    }

    func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didFinishDownloadingTo location: URL) {
        onCompletion?(location, nil)
    }

    func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didWriteData bytesWritten: Int64, totalBytesWritten: Int64, totalBytesExpectedToWrite: Int64) {
        let now = Date()
        let timeInterval = now.timeIntervalSince(lastSpeedCalculationTime)
        if timeInterval >= 0.4 {
            let bytesDiff = totalBytesWritten - lastBytesCount
            let bytesPerSec = Double(bytesDiff) / timeInterval
            if bytesPerSec >= 1024.0 * 1024.0 {
                currentSpeedStr = String(format: "%.1f MB/s", bytesPerSec / 1024.0 / 1024.0)
            } else {
                currentSpeedStr = String(format: "%.0f KB/s", bytesPerSec / 1024.0)
            }
            lastSpeedCalculationTime = now
            lastBytesCount = totalBytesWritten
        }

        let progress = totalBytesExpectedToWrite > 0 ? Double(totalBytesWritten) / Double(totalBytesExpectedToWrite) : 0.0
        onProgress?(progress, totalBytesWritten, totalBytesExpectedToWrite, currentSpeedStr)
    }

    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        if let error = error {
            onCompletion?(nil, error)
        }
    }
}
