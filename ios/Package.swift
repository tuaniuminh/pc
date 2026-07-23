// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "PCFlex",
    platforms: [
        .iOS(.v15)
    ],
    products: [
        .executable(name: "PCFlex", targets: ["PCFlex"])
    ],
    targets: [
        .executableTarget(
            name: "PCFlex",
            path: "PCFlex"
        )
    ]
)
