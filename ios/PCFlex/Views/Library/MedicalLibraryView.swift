import SwiftUI

public struct MedicalLibraryView: View {
    @ObservedObject var engine: WorkoutEngine
    @State private var openFaqIndex: Int? = nil
    
    private var faqItems: [(q: String, a: String)] {
        if engine.gender == .male {
            return [
                ("Cơ PC ở nam giới nằm ở đâu và cách nhận biết?", "Cơ PC (Pubococcygeus) nằm ở vùng tầng sinh môn giữa hậu môn và gốc dương vật. Để nhận biết, hãy thử nhịn tiểu giữa chừng hoặc siết nhẹ vùng hậu môn - cảm giác nâng cơ lên chính là cơ PC."),
                ("Nên luyện tập vào thời điểm nào trong ngày?", "Nên chia thành các khung giờ cố định: Buổi sáng để thắp sáng cơ, buổi trưa/thực hành combo sức mạnh, và buổi tối nhẹ nhàng thở bụng phục hồi."),
                ("Kegel ngược (Reverse Kegel) có tác dụng gì?", "Kegel ngược giúp thư giãn giải áp lực sàn chậu, tăng tưới máu tuyến tiền liệt và giúp kéo dài thời gian kiểm soát phản xạ cương cứng đỉnh điểm.")
            ]
        } else {
            return [
                ("Cơ sàn chậu nữ giới có vai trò gì?", "Cơ sàn chậu giúp nâng đỡ tử cung, bàng quang, trực tràng; duy trì khả năng co thắt đàn hồi âm đạo và ngăn ngừa các vấn đề són tiểu sau sinh."),
                ("Cách nhận biết cơ PC chuẩn xác cho nữ?", "Hãy tưởng tượng bạn đang cố ngăn dòng nước tiểu hoặc siết nhẹ như giữ hơi hơi lại. Cảm giác vùng cơ chậu rút nhẹ lên trên chính là cơ PC."),
                ("Tập Kegel có tốt cho phụ nữ sau sinh?", "Rất tốt. Việc tập luyện đúng kỹ thuật giúp tái tạo độ săn chắc của sợi cơ chậu, phục hồi tổn thương mô liên kết và se khít tự nhiên.")
            ]
        }
    }
    
    public var body: some View {
        NavigationView {
            ZStack {
                Color(red: 0.06, green: 0.09, blue: 0.16)
                    .ignoresSafeArea()
                
                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        // Header
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Giáo Trình Y Khoa")
                                .font(.system(size: 24, weight: .bold))
                                .foregroundColor(.white)
                            Text("Kiến thức y sinh học lâm sàng về sức mạnh sàn chậu.")
                                .font(.system(size: 13))
                                .foregroundColor(.gray)
                        }
                        .padding(.horizontal)
                        
                        // Gender Selector
                        HStack(spacing: 12) {
                            Button(action: { engine.gender = .male }) {
                                HStack {
                                    Text("Nam giới")
                                        .font(.system(size: 14, weight: .bold))
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 10)
                                .background(engine.gender == .male ? Color(red: 0, green: 0.96, blue: 0.83) : Color.white.opacity(0.08))
                                .foregroundColor(engine.gender == .male ? .black : .white)
                                .cornerRadius(12)
                            }
                            
                            Button(action: { engine.gender = .female }) {
                                HStack {
                                    Text("Nữ giới")
                                        .font(.system(size: 14, weight: .bold))
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 10)
                                .background(engine.gender == .female ? Color(red: 0.93, green: 0.28, blue: 0.6) : Color.white.opacity(0.08))
                                .foregroundColor(engine.gender == .female ? .white : .white)
                                .cornerRadius(12)
                            }
                        }
                        .padding(.horizontal)
                        
                        // Medical Guide Banner Card
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                Text("🩺")
                                    .font(.system(size: 24))
                                Text("Cơ Học Sinh Lý Sàn Chậu")
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundColor(.white)
                            }
                            Text(engine.gender == .male ?
                                 "Tập luyện cơ PC đều đặn giúp gia tăng tuần hoàn máu thể hang, tăng áp lực co bóp và củng cố phản xạ kiểm soát xuất tinh chủ động." :
                                 "Tập luyện nâng đỡ sàn chậu hỗ trợ tăng độ đàn hồi trương lực cơ vòng, phòng ngừa sa tử cung và se khít vùng chậu tự nhiên.")
                                .font(.system(size: 13))
                                .foregroundColor(.white.opacity(0.8))
                                .lineSpacing(4)
                        }
                        .padding()
                        .background(Color.white.opacity(0.05))
                        .cornerRadius(16)
                        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.1), lineWidth: 1))
                        .padding(.horizontal)
                        
                        // FAQ Section Header
                        Text("Giải Đáp Thường Gặp (FAQ)")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal)
                        
                        // FAQ List Accordion
                        VStack(spacing: 12) {
                            ForEach(0..<faqItems.count, id: \.self) { idx in
                                let item = faqItems[idx]
                                VStack(alignment: .leading, spacing: 8) {
                                    Button(action: {
                                        withAnimation {
                                            openFaqIndex = (openFaqIndex == idx) ? nil : idx
                                        }
                                    }) {
                                        HStack {
                                            Text(item.q)
                                                .font(.system(size: 14, weight: .semibold))
                                                .foregroundColor(.white)
                                                .multilineTextAlignment(.leading)
                                            Spacer()
                                            Image(systemName: openFaqIndex == idx ? "chevron.up" : "chevron.down")
                                                .foregroundColor(Color(red: 0, green: 0.96, blue: 0.83))
                                        }
                                    }
                                    
                                    if openFaqIndex == idx {
                                        Text(item.a)
                                            .font(.system(size: 13))
                                            .foregroundColor(.gray)
                                            .padding(.top, 4)
                                            .lineSpacing(3)
                                    }
                                }
                                .padding()
                                .background(Color.white.opacity(0.04))
                                .cornerRadius(12)
                            }
                        }
                        .padding(.horizontal)
                        .padding(.bottom, 30)
                    }
                }
            }
            .navigationBarHidden(true)
        }
    }
}
