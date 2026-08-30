/**
 * PC Flex - Gemini REST API Service
 * Tích hợp mô hình Google Gemini 3.7 Flash và cơ chế Fallback chống quá tải
 */

const CANDIDATE_MODELS = [
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash'
];

const translateErrorMessage = (errorMsg) => {
  if (!errorMsg) return "Lỗi không xác định khi kết nối với AI.";
  const msg = errorMsg.toLowerCase();
  
  if (msg.includes("high demand") || msg.includes("overloaded") || msg.includes("503") || msg.includes("resource has been exhausted")) {
    return "Máy chủ Google Gemini đang quá tải tạm thời. Hệ thống đã thử chuyển sang mô hình dự phòng.";
  }
  if (msg.includes("api_key_invalid") || msg.includes("api key not valid") || msg.includes("400")) {
    return "API Key không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại trong phần Cài đặt.";
  }
  if (msg.includes("quota") || msg.includes("rate limit") || msg.includes("429")) {
    return "Đã đạt giới hạn yêu cầu miễn phí của Google. Vui lòng đợi trong giây lát hoặc đổi API Key khác.";
  }
  return errorMsg;
};

export const testGeminiApiKey = async (apiKey) => {
  if (!apiKey || !apiKey.trim()) {
    throw new Error("Vui lòng nhập API Key.");
  }

  let lastError = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
      const requestBody = {
        contents: [{ parts: [{ text: "Ping" }] }]
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          return { success: true, activeModel: model };
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        const rawMsg = errorData.error?.message || `HTTP ${response.status}`;
        lastError = new Error(translateErrorMessage(rawMsg));
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("Không thể kết nối với máy chủ Google Gemini.");
};

export const extractJsonFromText = (text) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error("Không thể phân tích dữ liệu JSON từ AI.");
  }
};

export const generateKegelPlan = async (apiKey, userProfile, historySummary, customGoals = '') => {
  if (!apiKey || !apiKey.trim()) {
    throw new Error("Vui lòng nhập Google Gemini API Key trong phần Cài đặt.");
  }

  const genderText = userProfile.gender === 'female' ? 'Nữ' : 'Nam';
  const birthYear = userProfile.birthYear || 1995;
  const age = new Date().getFullYear() - birthYear;

  const promptText = `
Bạn là Bác sĩ chuyên khoa Sức khỏe Sinh sản & Huấn luyện viên Cơ sàn chậu (Kegel & PC Muscle) cấp cao.
Dưới đây là BÁO CÁO TOÀN DIỆN VỀ LỊCH SỬ TẬP LUYỆN THỰC TẾ của học viên:

📊 THÔNG TIN HỌC VIÊN:
- Giới tính: ${genderText}
- Độ tuổi: ${age} tuổi (Năm sinh: ${birthYear})
- Tổng số buổi tập đã hoàn thành: ${historySummary?.totalWorkouts || 0} buổi
- Tổng số lượt co thắt cơ sàn chậu đã tích lũy: ${historySummary?.totalSqueezes || 0} lượt
- Tổng số lượt Kegel ngược (Reverse Kegel): ${historySummary?.totalReverseKegels || 0} lượt
- Chuỗi ngày tập liên tục: ${historySummary?.streak || 0} ngày
- Tổng thời gian luyện tập: ${historySummary?.totalMinutes || 0} phút
- Mục tiêu cụ thể: ${customGoals || "Tăng sức bền, kiểm soát phản xạ xuất tinh/co thắt, ngừa phì đại tiền liệt tuyến/sa sàn chậu"}

🗓️ CHI TIẾT CÁC BUỔI TẬP GẦN NHẤT:
${historySummary?.recentSessionsText || "Chưa có lịch sử buổi tập trước đó."}

NHIỆM VỤ CỦA CHUYÊN GIA:
1. Đánh giá phong độ (evaluation): Phân tích chi tiết mức độ trương lực cơ sàn chậu dựa trên số lượt siết và lượt ngược thực tế.
2. Lời khuyên lâm sàng (advice): Đưa ra chỉ dẫn y khoa về cách thở cơ hoành chậu, xả căng thẳng tiền liệt tuyến/vùng kín và kiểm soát phản xạ.
3. Thiết kế bài tập Kegel mới (stages): Tạo từ 2 đến 4 chặng tập khoa học (bao gồm siết thông thường 'normal', Kegel ngược 'reverse', và nghỉ chuyển bài 'transition' hoặc thở sâu 'breathing').

YÊU CẦU ĐẦU RA BẮT BUỘC:
Chỉ trả về DUY NHẤT một chuỗi JSON hợp lệ theo đúng cấu trúc mẫu sau (KHÔNG kèm lời chào hay giải thích ngoài JSON) để ứng dụng PC Flex nạp trực tiếp:
{
  "evaluation": "Phân tích phong độ thực tế của học viên...",
  "advice": "Lời khuyên chiến lược lâm sàng...",
  "planName": "Tên giáo án cá nhân hóa (vd: 7 Ngày Làm Chủ Sức Mạnh Sàn Chậu)",
  "goal": "${customGoals || 'Tối ưu hóa trương lực & Sức bền'}",
  "stages": [
    {
      "type": "normal",
      "squeeze": 3,
      "relax": 3,
      "reps": 20,
      "label": "Siết Phản Xạ Kích Hoạt 3s"
    },
    {
      "type": "transition",
      "squeeze": 0,
      "relax": 15,
      "reps": 1,
      "label": "Nghỉ Giữa Chặng 15s"
    },
    {
      "type": "normal",
      "squeeze": 6,
      "relax": 6,
      "reps": 10,
      "label": "Siết Sâu Tăng Sức Bền 6s"
    },
    {
      "type": "reverse",
      "squeeze": 5,
      "relax": 5,
      "reps": 8,
      "label": "Kegel Ngược Giãn Cơ Chậu"
    }
  ]
}`;

  let lastError = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
      const requestBody = {
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7
        }
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error("Mô hình AI không trả về nội dung.");

      const parsedPlan = extractJsonFromText(rawText);
      return {
        ...parsedPlan,
        id: 'ai_plan_' + Date.now(),
        createdAt: new Date().toISOString(),
        modelUsed: model
      };
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("Không thể tạo giáo án từ Google Gemini.");
};
