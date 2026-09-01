import SwiftUI
import WidgetKit
import ActivityKit

#if canImport(ActivityKit) && canImport(WidgetKit)
@available(iOS 16.1, *)
public struct PCFlexLiveActivityWidget: Widget {
    public init() {}

    public var body: some WidgetConfiguration {
        ActivityConfiguration(for: PCFlexActivityAttributes.self) { context in
            // MARK: - Giao diện Màn hình khóa (Lock Screen Live Activity Banner)
            LockScreenLiveActivityView(context: context)
                .activityBackgroundTint(Color(red: 0.04, green: 0.06, blue: 0.12).opacity(0.95))
                .activitySystemActionForegroundColor(actionColor(for: context.state.actionState))
                .widgetURL(URL(string: "pcflex://workout"))
        } dynamicIsland: { context in
            DynamicIsland {
                // MARK: - Expanded Dynamic Island (Khi nhấn giữ trên đảo thích ứng)
                DynamicIslandExpandedRegion(.leading) {
                    HStack(spacing: 6) {
                        ZStack {
                            Circle()
                                .fill(actionColor(for: context.state.actionState).opacity(0.2))
                                .frame(width: 32, height: 32)
                            Text(actionIcon(for: context.state.actionState))
                                .font(.system(size: 16))
                        }
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text(actionTitle(for: context.state.actionState))
                                .font(.system(size: 13, weight: .black, design: .rounded))
                                .foregroundColor(actionColor(for: context.state.actionState))
                            Text(context.state.stageLabel)
                                .font(.system(size: 10, weight: .medium))
                                .foregroundColor(.white.opacity(0.8))
                                .lineLimit(1)
                        }
                    }
                    .padding(.leading, 4)
                }

                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(context.state.targetDate, style: .timer)
                            .font(.system(size: 26, weight: .black, design: .rounded))
                            .monospacedDigit()
                            .foregroundColor(actionColor(for: context.state.actionState))
                            .lineLimit(1)
                        Text("Hiệp \(context.state.currentRep)/\(context.state.totalReps)")
                            .font(.system(size: 10, weight: .bold, design: .rounded))
                            .foregroundColor(.white.opacity(0.75))
                    }
                    .padding(.trailing, 4)
                }

                DynamicIslandExpandedRegion(.bottom) {
                    VStack(spacing: 4) {
                        HStack {
                            Text(context.attributes.routineName)
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(.white.opacity(0.7))
                            Spacer()
                            Text("\(Int(Double(context.state.currentRep) / Double(max(1, context.state.totalReps)) * 100))%")
                                .font(.system(size: 10, weight: .bold, design: .monospaced))
                                .foregroundColor(actionColor(for: context.state.actionState))
                        }
                        
                        ProgressView(value: Double(context.state.currentRep), total: Double(max(1, context.state.totalReps)))
                            .progressViewStyle(LinearProgressViewStyle(tint: actionColor(for: context.state.actionState)))
                            .scaleEffect(x: 1, y: 1.5, anchor: .center)
                            .clipShape(Capsule())
                    }
                    .padding(.horizontal, 6)
                    .padding(.top, 4)
                }
            } compactLeading: {
                // MARK: - Compact Leading (Biểu tượng trạng thái phát sáng)
                HStack(spacing: 2) {
                    Text(actionIcon(for: context.state.actionState))
                        .font(.system(size: 13))
                }
                .padding(.leading, 2)
            } compactTrailing: {
                // MARK: - Compact Trailing (Đồng hồ đếm lùi tự động phần cứng style: .timer chuẩn Apple)
                Text(context.state.targetDate, style: .timer)
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .foregroundColor(actionColor(for: context.state.actionState))
                    .lineLimit(1)
                    .padding(.trailing, 2)
            } minimal: {
                // MARK: - Minimal: Biểu tượng trạng thái nhỏ gọn
                Text(actionIcon(for: context.state.actionState))
                    .font(.system(size: 11))
            }
            .widgetURL(URL(string: "pcflex://workout"))
        }
    }
}

// MARK: - Lock Screen View (Màn hình khóa đẳng cấp)
@available(iOS 16.1, *)
struct LockScreenLiveActivityView: View {
    let context: ActivityViewContext<PCFlexActivityAttributes>

    var body: some View {
        HStack(spacing: 14) {
            // Cột bên trái: Biểu tượng hình tròn & Tên bài tập
            HStack(spacing: 10) {
                ZStack {
                    Circle()
                        .fill(actionColor(for: context.state.actionState).opacity(0.2))
                        .frame(width: 44, height: 44)
                    Circle()
                        .stroke(actionColor(for: context.state.actionState).opacity(0.5), lineWidth: 1.5)
                        .frame(width: 44, height: 44)
                    Text(actionIcon(for: context.state.actionState))
                        .font(.system(size: 22))
                }

                VStack(alignment: .leading, spacing: 3) {
                    Text(actionTitle(for: context.state.actionState))
                        .font(.system(size: 15, weight: .black, design: .rounded))
                        .foregroundColor(actionColor(for: context.state.actionState))

                    Text(context.state.stageLabel)
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(.white.opacity(0.85))
                        .lineLimit(1)

                    Text("\(context.attributes.routineName) • Hiệp \(context.state.currentRep)/\(context.state.totalReps)")
                        .font(.system(size: 10, weight: .bold, design: .rounded))
                        .foregroundColor(.gray)
                }
            }

            Spacer()

            // Cột bên phải: Đồng hồ đếm lùi lớn tự động của iOS
            VStack(alignment: .trailing, spacing: 0) {
                Text(context.state.targetDate, style: .timer)
                    .font(.system(size: 36, weight: .black, design: .rounded))
                    .monospacedDigit()
                    .foregroundColor(actionColor(for: context.state.actionState))
                    .lineLimit(1)
                Text(context.state.actionState == "squeezing" ? "ĐANG SIẾT" : context.state.actionState == "relaxing" ? "THẢ LỎNG" : "KEGEL")
                    .font(.system(size: 9, weight: .black, design: .rounded))
                    .foregroundColor(.white.opacity(0.6))
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .fill(Color(red: 0.05, green: 0.08, blue: 0.15).opacity(0.96))
                .overlay(
                    RoundedRectangle(cornerRadius: 24, style: .continuous)
                        .stroke(actionColor(for: context.state.actionState).opacity(0.4), lineWidth: 1.5)
                )
        )
    }
}

// MARK: - Helpers & Color Palette Chuẩn PC Flex
@available(iOS 16.1, *)
func actionIcon(for state: String) -> String {
    switch state {
    case "squeezing": return "⚡"
    case "relaxing": return "❄️"
    case "reverse": return "🌊"
    case "transition": return "⏳"
    case "breathing": return "🧘"
    default: return "⚡"
    }
}

@available(iOS 16.1, *)
func actionTitle(for state: String) -> String {
    switch state {
    case "squeezing": return "SIẾT CƠ PC"
    case "relaxing": return "THẢ LỎNG"
    case "reverse": return "KEGEL NGƯỢC"
    case "transition": return "NGHỈ CHUYỂN"
    case "breathing": return "THỞ BỤNG"
    default: return "SẴN SÀNG"
    }
}

@available(iOS 16.1, *)
func actionColor(for state: String) -> Color {
    switch state {
    case "squeezing": 
        return Color(red: 0.0, green: 0.96, blue: 0.61) // Emerald
    case "relaxing": 
        return Color(red: 0.0, green: 0.82, blue: 1.0)  // Cyan
    case "reverse": 
        return Color(red: 0.66, green: 0.33, blue: 0.97) // Violet
    case "transition": 
        return Color(red: 0.96, green: 0.62, blue: 0.04) // Amber
    case "breathing": 
        return Color(red: 0.06, green: 0.73, blue: 0.51)
    default: 
        return Color(red: 0.0, green: 0.82, blue: 1.0)
    }
}
#endif
