import SwiftUI
import WidgetKit
import ActivityKit

#if canImport(ActivityKit) && canImport(WidgetKit)
@available(iOS 16.1, *)
public struct PCFlexLiveActivityWidget: Widget {
    public init() {}

    public var body: some WidgetConfiguration {
        ActivityConfiguration(for: PCFlexActivityAttributes.self) { context in
            // Giao diện Màn hình khóa (Lock Screen Live Activity Banner)
            LockScreenLiveActivityView(context: context)
                .activityBackgroundTint(Color.black.opacity(0.88))
                .activitySystemActionForegroundColor(Color.white)
                .widgetURL(URL(string: "pcflex://workout"))
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded Dynamic Island (Khi nhấn giữ trên đảo thích ứng)
                DynamicIslandExpandedRegion(.leading) {
                    VStack(alignment: .leading, spacing: 2) {
                        HStack(spacing: 4) {
                            Text(actionIcon(for: context.state.actionState))
                                .font(.system(size: 14))
                            Text(actionTitle(for: context.state.actionState))
                                .font(.system(size: 12, weight: .black))
                                .foregroundColor(actionColor(for: context.state.actionState))
                        }
                        Text(context.state.stageLabel)
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundColor(.white.opacity(0.8))
                            .lineLimit(1)
                    }
                    .padding(.leading, 6)
                }

                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(timerInterval: Date()...max(Date().addingTimeInterval(1), context.state.targetDate), countsDown: true)
                            .font(.system(size: 24, weight: .black, design: .monospaced))
                            .foregroundColor(.white)
                            .multilineTextAlignment(.trailing)
                        Text("Hiệp \(context.state.currentRep)/\(context.state.totalReps)")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.0, green: 0.8, blue: 0.9))
                    }
                    .padding(.trailing, 6)
                }

                DynamicIslandExpandedRegion(.bottom) {
                    HStack {
                        Text(context.attributes.routineName)
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white.opacity(0.8))
                        Spacer()
                        ProgressView(value: Double(context.state.currentRep), total: Double(max(1, context.state.totalReps)))
                            .progressViewStyle(LinearProgressViewStyle(tint: actionColor(for: context.state.actionState)))
                            .frame(width: 130)
                    }
                    .padding(.horizontal, 8)
                    .padding(.top, 4)
                }
            } compactLeading: {
                // Compact Leading (Chỉ 1 icon gọn gàng)
                Text(actionIcon(for: context.state.actionState))
                    .font(.system(size: 13))
            } compactTrailing: {
                // Compact Trailing (Đồng hồ đếm lùi tự động mượt mà của Apple)
                Text(timerInterval: Date()...max(Date().addingTimeInterval(1), context.state.targetDate), countsDown: true)
                    .font(.system(size: 12, weight: .black, design: .monospaced))
                    .foregroundColor(actionColor(for: context.state.actionState))
                    .frame(minWidth: 26, alignment: .trailing)
            } minimal: {
                // Minimal: Đếm ngược khi ở dạng đảo nhỏ
                Text("\(max(1, context.state.timeRemaining))")
                    .font(.system(size: 11, weight: .black))
                    .foregroundColor(actionColor(for: context.state.actionState))
            }
            .widgetURL(URL(string: "pcflex://workout"))
        }
    }
}

// MARK: - Lock Screen View
@available(iOS 16.1, *)
struct LockScreenLiveActivityView: View {
    let context: ActivityViewContext<PCFlexActivityAttributes>

    var body: some View {
        HStack(spacing: 14) {
            // Cột bên trái: Trạng thái & Tên bài
            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 6) {
                    Text(actionIcon(for: context.state.actionState))
                        .font(.system(size: 16))
                    Text(actionTitle(for: context.state.actionState))
                        .font(.system(size: 14, weight: .black))
                        .foregroundColor(actionColor(for: context.state.actionState))
                }

                Text(context.state.stageLabel)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.white.opacity(0.85))
                    .lineLimit(1)

                Text("\(context.attributes.routineName) • Hiệp \(context.state.currentRep)/\(context.state.totalReps)")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(.gray)
            }

            Spacer()

            // Cột bên phải: Đồng hồ đếm giây Live Activity tự động của Apple
            VStack(alignment: .trailing, spacing: 2) {
                Text(timerInterval: Date()...max(Date().addingTimeInterval(1), context.state.targetDate), countsDown: true)
                    .font(.system(size: 32, weight: .black, design: .monospaced))
                    .foregroundColor(.white)
                Text("GIÂY")
                    .font(.system(size: 9, weight: .black))
                    .foregroundColor(actionColor(for: context.state.actionState))
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .fill(Color(red: 0.05, green: 0.08, blue: 0.15).opacity(0.95))
                .overlay(
                    RoundedRectangle(cornerRadius: 24, style: .continuous)
                        .stroke(actionColor(for: context.state.actionState).opacity(0.4), lineWidth: 1.5)
                )
        )
    }
}

// MARK: - Helpers
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
func actionShortTitle(for state: String) -> String {
    switch state {
    case "squeezing": return "Siết"
    case "relaxing": return "Thả"
    case "reverse": return "Ngược"
    case "transition": return "Nghỉ"
    case "breathing": return "Thở"
    default: return "Tập"
    }
}

@available(iOS 16.1, *)
func actionColor(for state: String) -> Color {
    switch state {
    case "squeezing": return Color(red: 0.06, green: 0.95, blue: 0.55) // Emerald
    case "relaxing": return Color(red: 0.02, green: 0.71, blue: 0.83) // Cyan
    case "reverse": return Color(red: 0.55, green: 0.36, blue: 0.96) // Violet
    case "transition": return Color(red: 0.96, green: 0.62, blue: 0.04) // Amber
    case "breathing": return Color(red: 0.06, green: 0.95, blue: 0.55)
    default: return Color(red: 0.0, green: 0.8, blue: 0.9)
    }
}
#endif
