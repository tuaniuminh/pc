import Foundation

public struct ClinicalLevelCategory {
    public let levelTab: Int
    public let name: String
    public let maleWorkouts: [String: WorkoutConfig]
    public let femaleWorkouts: [String: WorkoutConfig]
}

public struct ClinicalLevelsData {
    public static let levels: [Int: ClinicalLevelCategory] = [
        1: ClinicalLevelCategory(
            levelTab: 1,
            name: "Nhập Môn & Đánh Thức",
            maleWorkouts: [
                "goodMorning": WorkoutConfig(
                    id: "goodMorning",
                    name: "Chào Buổi Sáng",
                    meta: "20 lượt siết 1s - thả 2s | 5 lượt Kegel ngược giãn chậu",
                    colorHex: "#f59e0b",
                    icon: "🌅",
                    stages: [
                        WorkoutStage(type: .normal, squeeze: 1, relax: 2, reps: 20),
                        WorkoutStage(type: .reverse, squeeze: 5, relax: 5, reps: 5)
                    ]
                ),
                "powerCombo": WorkoutConfig(
                    id: "powerCombo",
                    name: "Combo Sức Mạnh",
                    meta: "Siết nhanh 20 lượt 1s | Giữ 24 lượt 3s | Giữ 10 lượt 5s + Cooldown",
                    colorHex: "#00f5d4",
                    icon: "★",
                    stages: [
                        WorkoutStage(type: .normal, squeeze: 1, relax: 1, reps: 20),
                        WorkoutStage(type: .normal, squeeze: 3, relax: 3, reps: 12),
                        WorkoutStage(type: .normal, squeeze: 3, relax: 3, reps: 12),
                        WorkoutStage(type: .normal, squeeze: 5, relax: 5, reps: 10),
                        WorkoutStage(type: .reverse, squeeze: 5, relax: 5, reps: 5)
                    ]
                ),
                "nightRecovery": WorkoutConfig(
                    id: "nightRecovery",
                    name: "Phục Hồi Ban Đêm",
                    meta: "15 lượt siết nhanh | 10 lượt Kegel ngược | 5 lượt hít thở sâu",
                    colorHex: "#a78bfa",
                    icon: "🌙",
                    stages: [
                        WorkoutStage(type: .normal, squeeze: 1, relax: 1, reps: 15),
                        WorkoutStage(type: .reverse, squeeze: 5, relax: 5, reps: 10),
                        WorkoutStage(type: .breathing, squeeze: 5, relax: 10, reps: 5)
                    ]
                )
            ],
            femaleWorkouts: [
                "goodMorning": WorkoutConfig(
                    id: "goodMorning",
                    name: "Bình Minh Tươi Trẻ",
                    meta: "20 lượt siết 1s - thả 2s | 5 lượt Kegel ngược giãn chậu",
                    colorHex: "#ec4899",
                    icon: "🌅",
                    stages: [
                        WorkoutStage(type: .normal, squeeze: 1, relax: 2, reps: 20),
                        WorkoutStage(type: .reverse, squeeze: 5, relax: 5, reps: 5)
                    ]
                ),
                "powerCombo": WorkoutConfig(
                    id: "powerCombo",
                    name: "Combo Sức Bền",
                    meta: "15 lượt siết nhanh 1s | 15 lượt siết giữ 3s | 10 lượt Kegel ngược",
                    colorHex: "#a855f7",
                    icon: "★",
                    stages: [
                        WorkoutStage(type: .normal, squeeze: 1, relax: 1, reps: 15),
                        WorkoutStage(type: .normal, squeeze: 3, relax: 3, reps: 15),
                        WorkoutStage(type: .reverse, squeeze: 5, relax: 5, reps: 10)
                    ]
                ),
                "nightRecovery": WorkoutConfig(
                    id: "nightRecovery",
                    name: "Phục Hồi Nhẹ Nhàng",
                    meta: "10 lượt siết 2s | 10 lượt Kegel ngược | 5 lượt hít thở sâu",
                    colorHex: "#3b82f6",
                    icon: "🌙",
                    stages: [
                        WorkoutStage(type: .normal, squeeze: 2, relax: 3, reps: 10),
                        WorkoutStage(type: .reverse, squeeze: 5, relax: 5, reps: 10),
                        WorkoutStage(type: .breathing, squeeze: 5, relax: 10, reps: 5)
                    ]
                )
            ]
        ),
        2: ClinicalLevelCategory(
            levelTab: 2,
            name: "Phối Hợp Lực & Phản Xạ",
            maleWorkouts: [
                "goodMorning": WorkoutConfig(
                    id: "goodMorning",
                    name: "Khởi Đầu Năng Lượng",
                    meta: "25 lượt siết 2s - thả 2s | 8 lượt Kegel ngược",
                    colorHex: "#f59e0b",
                    icon: "🌅",
                    stages: [
                        WorkoutStage(type: .normal, squeeze: 2, relax: 2, reps: 25),
                        WorkoutStage(type: .reverse, squeeze: 6, relax: 4, reps: 8)
                    ]
                ),
                "powerCombo": WorkoutConfig(
                    id: "powerCombo",
                    name: "Combo Phản Xạ Cương Cứng",
                    meta: "30 lượt siết 1s | 15 lượt siết giữ 4s | 8 lượt Kegel ngược",
                    colorHex: "#00f5d4",
                    icon: "⚡",
                    stages: [
                        WorkoutStage(type: .normal, squeeze: 1, relax: 1, reps: 30),
                        WorkoutStage(type: .normal, squeeze: 4, relax: 4, reps: 15),
                        WorkoutStage(type: .reverse, squeeze: 6, relax: 4, reps: 8)
                    ]
                ),
                "nightRecovery": WorkoutConfig(
                    id: "nightRecovery",
                    name: "Thư Giãn Tuyến Tiền Liệt",
                    meta: "15 lượt siết 2s | 12 lượt Kegel ngược | 6 lượt hít thở sâu",
                    colorHex: "#a78bfa",
                    icon: "🌙",
                    stages: [
                        WorkoutStage(type: .normal, squeeze: 2, relax: 3, reps: 15),
                        WorkoutStage(type: .reverse, squeeze: 6, relax: 4, reps: 12),
                        WorkoutStage(type: .breathing, squeeze: 5, relax: 10, reps: 6)
                    ]
                )
            ],
            femaleWorkouts: [
                "goodMorning": WorkoutConfig(
                    id: "goodMorning",
                    name: "Bình Minh Đàn Hồi",
                    meta: "25 lượt siết 2s - thả 2s | 8 lượt Kegel ngược",
                    colorHex: "#ec4899",
                    icon: "🌅",
                    stages: [
                        WorkoutStage(type: .normal, squeeze: 2, relax: 2, reps: 25),
                        WorkoutStage(type: .reverse, squeeze: 6, relax: 4, reps: 8)
                    ]
                ),
                "powerCombo": WorkoutConfig(
                    id: "powerCombo",
                    name: "Combo Săn Chắc Âm Đạo",
                    meta: "20 lượt siết nhanh 1s | 15 lượt siết giữ 4s | 8 lượt Kegel ngược",
                    colorHex: "#a855f7",
                    icon: "💖",
                    stages: [
                        WorkoutStage(type: .normal, squeeze: 1, relax: 1, reps: 20),
                        WorkoutStage(type: .normal, squeeze: 4, relax: 4, reps: 15),
                        WorkoutStage(type: .reverse, squeeze: 6, relax: 4, reps: 8)
                    ]
                ),
                "nightRecovery": WorkoutConfig(
                    id: "nightRecovery",
                    name: "Phục Hồi Trương Lực Nữ",
                    meta: "15 lượt siết 2s | 12 lượt Kegel ngược | 6 lượt hít thở sâu",
                    colorHex: "#3b82f6",
                    icon: "🌙",
                    stages: [
                        WorkoutStage(type: .normal, squeeze: 2, relax: 3, reps: 15),
                        WorkoutStage(type: .reverse, squeeze: 6, relax: 4, reps: 12),
                        WorkoutStage(type: .breathing, squeeze: 5, relax: 10, reps: 6)
                    ]
                )
            ]
        ),
        3: ClinicalLevelCategory(
            levelTab: 3,
            name: "Sức Bền Tối Đa",
            maleWorkouts: [
                "goodMorning": WorkoutConfig(
                    id: "goodMorning",
                    name: "Chào Buổi Sáng Đỉnh Cao",
                    meta: "30 lượt siết 3s | 10 lượt Kegel ngược 7s",
                    colorHex: "#f59e0b",
                    icon: "🌅",
                    stages: [
                        WorkoutStage(type: .normal, squeeze: 3, relax: 2, reps: 30),
                        WorkoutStage(type: .reverse, squeeze: 7, relax: 5, reps: 10)
                    ]
                ),
                "powerCombo": WorkoutConfig(
                    id: "powerCombo",
                    name: "Combo Kiểm Soát Xuất Tinh",
                    meta: "20 lượt siết 2s | 15 lượt siết 6s | 10 lượt Kegel ngược",
                    colorHex: "#00f5d4",
                    icon: "🎯",
                    stages: [
                        WorkoutStage(type: .normal, squeeze: 2, relax: 2, reps: 20),
                        WorkoutStage(type: .normal, squeeze: 6, relax: 6, reps: 15),
                        WorkoutStage(type: .reverse, squeeze: 7, relax: 5, reps: 10)
                    ]
                ),
                "nightRecovery": WorkoutConfig(
                    id: "nightRecovery",
                    name: "Phục Hồi Chuyên Sâu Ban Đêm",
                    meta: "20 lượt siết 3s | 15 lượt Kegel ngược | 8 lượt thở bụng",
                    colorHex: "#a78bfa",
                    icon: "🌙",
                    stages: [
                        WorkoutStage(type: .normal, squeeze: 3, relax: 3, reps: 20),
                        WorkoutStage(type: .reverse, squeeze: 7, relax: 5, reps: 15),
                        WorkoutStage(type: .breathing, squeeze: 6, relax: 10, reps: 8)
                    ]
                )
            ],
            femaleWorkouts: [
                "goodMorning": WorkoutConfig(
                    id: "goodMorning",
                    name: "Bình Minh Quyến Rũ",
                    meta: "30 lượt siết 3s | 10 lượt Kegel ngược 7s",
                    colorHex: "#ec4899",
                    icon: "🌅",
                    stages: [
                        WorkoutStage(type: .normal, squeeze: 3, relax: 2, reps: 30),
                        WorkoutStage(type: .reverse, squeeze: 7, relax: 5, reps: 10)
                    ]
                ),
                "powerCombo": WorkoutConfig(
                    id: "powerCombo",
                    name: "Combo Co Thắt Đàn Hồi",
                    meta: "20 lượt siết 2s | 15 lượt siết 6s | 10 lượt Kegel ngược",
                    colorHex: "#a855f7",
                    icon: "💃",
                    stages: [
                        WorkoutStage(type: .normal, squeeze: 2, relax: 2, reps: 20),
                        WorkoutStage(type: .normal, squeeze: 6, relax: 6, reps: 15),
                        WorkoutStage(type: .reverse, squeeze: 7, relax: 5, reps: 10)
                    ]
                ),
                "nightRecovery": WorkoutConfig(
                    id: "nightRecovery",
                    name: "Nâng Đỡ Cơ Quan Chậu",
                    meta: "20 lượt siết 3s | 15 lượt Kegel ngược | 8 lượt thở bụng",
                    colorHex: "#3b82f6",
                    icon: "🌙",
                    stages: [
                        WorkoutStage(type: .normal, squeeze: 3, relax: 3, reps: 20),
                        WorkoutStage(type: .reverse, squeeze: 7, relax: 5, reps: 15),
                        WorkoutStage(type: .breathing, squeeze: 6, relax: 10, reps: 8)
                    ]
                )
            ]
        ),
        4: ClinicalLevelCategory(
            levelTab: 4,
            name: "Kiểm Soát Phản Xạ Nâng Cao",
            maleWorkouts: [
                "goodMorning": WorkoutConfig(
                    id: "goodMorning",
                    name: "Bình Minh Thép",
                    meta: "30 lượt siết 4s | 12 lượt Kegel ngược 8s",
                    colorHex: "#f59e0b",
                    icon: "🌅",
                    stages: [
                        WorkoutStage(type: .normal, squeeze: 4, relax: 3, reps: 30),
                        WorkoutStage(type: .reverse, squeeze: 8, relax: 5, reps: 12)
                    ]
                ),
                "powerCombo": WorkoutConfig(
                    id: "powerCombo",
                    name: "Combo Kiểm Soát Cương Cứng",
                    meta: "20 lượt siết 3s | 12 lượt siết 8s | 12 lượt Kegel ngược",
                    colorHex: "#00f5d4",
                    icon: "🛡️",
                    stages: [
                        WorkoutStage(type: .normal, squeeze: 3, relax: 3, reps: 20),
                        WorkoutStage(type: .normal, squeeze: 8, relax: 6, reps: 12),
                        WorkoutStage(type: .reverse, squeeze: 8, relax: 5, reps: 12)
                    ]
                ),
                "nightRecovery": WorkoutConfig(
                    id: "nightRecovery",
                    name: "Phục Hồi Phản Xạ Thần Kinh",
                    meta: "20 lượt siết 4s | 15 lượt Kegel ngược | 10 lượt thở bụng",
                    colorHex: "#a78bfa",
                    icon: "🌙",
                    stages: [
                        WorkoutStage(type: .normal, squeeze: 4, relax: 3, reps: 20),
                        WorkoutStage(type: .reverse, squeeze: 8, relax: 5, reps: 15),
                        WorkoutStage(type: .breathing, squeeze: 6, relax: 10, reps: 10)
                    ]
                )
            ],
            femaleWorkouts: [
                "goodMorning": WorkoutConfig(
                    id: "goodMorning",
                    name: "Bình Minh Tối Ưu Nữ",
                    meta: "30 lượt siết 4s | 12 lượt Kegel ngược 8s",
                    colorHex: "#ec4899",
                    icon: "🌅",
                    stages: [
                        WorkoutStage(type: .normal, squeeze: 4, relax: 3, reps: 30),
                        WorkoutStage(type: .reverse, squeeze: 8, relax: 5, reps: 12)
                    ]
                ),
                "powerCombo": WorkoutConfig(
                    id: "powerCombo",
                    name: "Combo Ngăn Ngừa Són Tiểu Stress",
                    meta: "20 lượt siết 3s | 12 lượt siết 8s | 12 lượt Kegel ngược",
                    colorHex: "#a855f7",
                    icon: "🌸",
                    stages: [
                        WorkoutStage(type: .normal, squeeze: 3, relax: 3, reps: 20),
                        WorkoutStage(type: .normal, squeeze: 8, relax: 6, reps: 12),
                        WorkoutStage(type: .reverse, squeeze: 8, relax: 5, reps: 12)
                    ]
                ),
                "nightRecovery": WorkoutConfig(
                    id: "nightRecovery",
                    name: "Phục Hồi Sàn Chậu Sau Sinh",
                    meta: "20 lượt siết 4s | 15 lượt Kegel ngược | 10 lượt thở bụng",
                    colorHex: "#3b82f6",
                    icon: "🌙",
                    stages: [
                        WorkoutStage(type: .normal, squeeze: 4, relax: 3, reps: 20),
                        WorkoutStage(type: .reverse, squeeze: 8, relax: 5, reps: 15),
                        WorkoutStage(type: .breathing, squeeze: 6, relax: 10, reps: 10)
                    ]
                )
            ]
        ),
        5: ClinicalLevelCategory(
            levelTab: 5,
            name: "Bậc Thầy Sàn Chậu",
            maleWorkouts: [
                "goodMorning": WorkoutConfig(
                    id: "goodMorning",
                    name: "Chào Buổi Sáng Bậc Thầy",
                    meta: "35 lượt siết 5s | 15 lượt Kegel ngược 10s",
                    colorHex: "#f59e0b",
                    icon: "👑",
                    stages: [
                        WorkoutStage(type: .normal, squeeze: 5, relax: 3, reps: 35),
                        WorkoutStage(type: .reverse, squeeze: 10, relax: 5, reps: 15)
                    ]
                ),
                "powerCombo": WorkoutConfig(
                    id: "powerCombo",
                    name: "Combo Bậc Thầy Phong Độ",
                    meta: "25 lượt siết 3s | 15 lượt siết 10s | 15 lượt Kegel ngược",
                    colorHex: "#00f5d4",
                    icon: "🏆",
                    stages: [
                        WorkoutStage(type: .normal, squeeze: 3, relax: 3, reps: 25),
                        WorkoutStage(type: .normal, squeeze: 10, relax: 8, reps: 15),
                        WorkoutStage(type: .reverse, squeeze: 10, relax: 5, reps: 15)
                    ]
                ),
                "nightRecovery": WorkoutConfig(
                    id: "nightRecovery",
                    name: "Phục Hồi Sinh Lý Tối Thượng",
                    meta: "25 lượt siết 5s | 20 lượt Kegel ngược | 12 lượt thở bụng",
                    colorHex: "#a78bfa",
                    icon: "🌌",
                    stages: [
                        WorkoutStage(type: .normal, squeeze: 5, relax: 3, reps: 25),
                        WorkoutStage(type: .reverse, squeeze: 10, relax: 5, reps: 20),
                        WorkoutStage(type: .breathing, squeeze: 6, relax: 10, reps: 12)
                    ]
                )
            ],
            femaleWorkouts: [
                "goodMorning": WorkoutConfig(
                    id: "goodMorning",
                    name: "Bình Minh Bậc Thầy Nữ",
                    meta: "35 lượt siết 5s | 15 lượt Kegel ngược 10s",
                    colorHex: "#ec4899",
                    icon: "👑",
                    stages: [
                        WorkoutStage(type: .normal, squeeze: 5, relax: 3, reps: 35),
                        WorkoutStage(type: .reverse, squeeze: 10, relax: 5, reps: 15)
                    ]
                ),
                "powerCombo": WorkoutConfig(
                    id: "powerCombo",
                    name: "Combo Sức Mạnh Nữ Tối Thượng",
                    meta: "25 lượt siết 3s | 15 lượt siết 10s | 15 lượt Kegel ngược",
                    colorHex: "#a855f7",
                    icon: "🏆",
                    stages: [
                        WorkoutStage(type: .normal, squeeze: 3, relax: 3, reps: 25),
                        WorkoutStage(type: .normal, squeeze: 10, relax: 8, reps: 15),
                        WorkoutStage(type: .reverse, squeeze: 10, relax: 5, reps: 15)
                    ]
                ),
                "nightRecovery": WorkoutConfig(
                    id: "nightRecovery",
                    name: "Phục Hồi Sức Trẻ Sinh Lý Nữ",
                    meta: "25 lượt siết 5s | 20 lượt Kegel ngược | 12 lượt thở bụng",
                    colorHex: "#3b82f6",
                    icon: "🌌",
                    stages: [
                        WorkoutStage(type: .normal, squeeze: 5, relax: 3, reps: 25),
                        WorkoutStage(type: .reverse, squeeze: 10, relax: 5, reps: 20),
                        WorkoutStage(type: .breathing, squeeze: 6, relax: 10, reps: 12)
                    ]
                )
            ]
        )
    ]
}
