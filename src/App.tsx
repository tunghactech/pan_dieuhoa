import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CheckCircle,
  ChevronRight,
  Droplets,
  Gauge,
  GraduationCap,
  HelpCircle,
  Info,
  Layers,
  ListFilter,
  Flame,
  Play,
  RefreshCw,
  Save,
  ShieldAlert,
  Sliders,
  Sparkles,
  Thermometer,
  Wrench,
  Zap
} from 'lucide-react';

// === CƠ SỞ DỮ LIỆU CÁC MỐC CHUẨN VÀ 8 PAN LỖI ===
interface Limit {
  min?: number;
  max?: number;
  label: string;
  unit: string;
  desc: string;
}

const STANDARD_LIMITS: Record<string, Limit> = {
  t1_t2: { min: 6, max: 8, label: "Độ chênh nhiệt gió dàn lạnh (T1-T2)", unit: "°C", desc: "Hiệu số giữa nhiệt độ gió vào hồi và gió thổi ra ở dàn lạnh. Thể hiện năng lực hấp thụ nhiệt." },
  lp: { min: 120, max: 140, label: "Áp suất bay hơi thấp áp (LP)", unit: "psi", desc: "Áp suất của ga lạnh ở phần áp suất thấp (dàn lạnh). Quyết định nhiệt độ sôi của ga lạnh." },
  hp: { min: 400, max: 450, label: "Áp suất ngưng tụ cao áp (HP)", unit: "psi", desc: "Áp suất của ga lạnh ở phần áp suất cao (dàn nóng). Thể hiện khả năng giải nhiệt ngưng tụ." },
  t4_t3: { min: 5, max: 8, label: "Độ quá nhiệt (Superheat - T4-T3)", unit: "°C", desc: "Nhiệt độ hơi hút về lốc trừ đi nhiệt độ sôi bão hòa. Tránh nguy cơ máy nén hút phải ga lỏng." },
  t5_t6: { min: 4, max: 7, label: "Độ quá lạnh (Subcooling - T5-T6)", unit: "°C", desc: "Nhiệt độ bão hòa lỏng trừ đi nhiệt độ lỏng thực tế trước tiết lưu. Đảm bảo lỏng nguyên chất vào tiết lưu." },
  t7_t8: { max: 2, label: "Độ chênh nhiệt phin lọc (T7-T8)", unit: "°C", desc: "Độ lệch nhiệt độ ống trước và sau phin lọc dịch. Nếu quá lớn tức là phin lọc đang bị nghẹt bẩn." },
  t10_t9: { min: 6, max: 8, label: "Độ chênh nhiệt gió dàn nóng (T10-T9)", unit: "°C", desc: "Hiệu số giữa nhiệt độ gió thổi ra và gió vào ở dàn nóng. Thể hiện hiệu quả giải nhiệt ra môi trường." }
};

interface ScenarioData {
  t1: number;
  t2: number;
  t3: number;
  t4: number;
  t5: number;
  t6: number;
  t7: number;
  t8: number;
  t9: number;
  t10: number;
  lp: number;
  hp: number;
  t11: number;
}

interface Scenario {
  id: string;
  name: string;
  code: string;
  desc: string;
  dangerLevel: 'info' | 'warning' | 'danger' | 'success';
  data: ScenarioData;
}

const SYSTEM_SCENARIOS: Scenario[] = [
  {
    id: 'normal',
    name: 'Hệ thống hoạt động bình thường',
    code: 'STANDARD',
    desc: 'Các chỉ số nằm trong dải thiết kế chuẩn, hệ thống chạy êm ái, đạt hiệu suất COP tối ưu.',
    dangerLevel: 'success',
    data: { t1: 30, t2: 23, t3: 5, t4: 11, t5: 45, t6: 40, t7: 35, t8: 34, t9: 32, t10: 39, lp: 130, hp: 420, t11: 45 }
  },
  {
    id: 'pan1',
    name: 'Pan 1: Van tiết lưu quá bé',
    code: 'PAN-01',
    desc: 'Lưu lượng ga đi qua van quá ít khiến áp suất hút tụt sâu và dòng ga về máy nén bị sấy nóng quá mức.',
    dangerLevel: 'warning',
    data: { t1: 30, t2: 27, t3: -10, t4: 10, t5: 42, t6: 37, t7: 32, t8: 31, t9: 32, t10: 35, lp: 90, hp: 320, t11: 42 }
  },
  {
    id: 'pan2',
    name: 'Pan 2: Tiết lưu sớm (Nghẹt phin/Ống dịch)',
    code: 'PAN-02',
    desc: 'Bị tắc nghẽn một phần ngay trên đường ống dịch/phin lọc làm gas bị hóa hơi sớm trước khi vào van tiết lưu.',
    dangerLevel: 'danger',
    data: { t1: 30, t2: 28, t3: -5, t4: 15, t5: 42, t6: 37, t7: 32, t8: 25, t9: 32, t10: 34, lp: 85, hp: 310, t11: 42 }
  },
  {
    id: 'pan3',
    name: 'Pan 3: Thiếu gas',
    code: 'PAN-03',
    desc: 'Lượng ga tuần hoàn không đủ làm suy giảm mạnh áp suất ở cả hai đầu nóng và lạnh.',
    dangerLevel: 'warning',
    data: { t1: 30, t2: 27, t3: -8, t4: 12, t5: 38, t6: 37, t7: 32, t8: 31, t9: 32, t10: 34, lp: 95, hp: 300, t11: 38 }
  },
  {
    id: 'pan4',
    name: 'Pan 4: Dàn bay hơi quá bé (Bám tuyết/Bẩn)',
    code: 'PAN-04',
    desc: 'Dàn lạnh trao đổi nhiệt cực kém, gas lỏng không bay hơi hết dẫn đến nguy cơ ngập lỏng máy nén.',
    dangerLevel: 'danger',
    data: { t1: 30, t2: 28, t3: -2, t4: -1, t5: 40, t6: 35, t7: 30, t8: 29, t9: 32, t10: 35, lp: 100, hp: 340, t11: 40 }
  },
  {
    id: 'pan5',
    name: 'Pan 5: Máy nén quá bé (Luồn hơi/Hỏng lá van)',
    code: 'PAN-05',
    desc: 'Máy nén bị hở clape nén, hơi áp suất cao rò ngược về khoang hút làm mất chênh lệch áp suất cao/thấp.',
    dangerLevel: 'danger',
    data: { t1: 30.6, t2: 29.8, t3: 15, t4: 18, t5: 35, t6: 33, t7: 31, t8: 30, t9: 32, t10: 34, lp: 208, hp: 276, t11: 35 }
  },
  {
    id: 'pan6',
    name: 'Pan 6: Có khí không ngưng tụ',
    code: 'PAN-06',
    desc: 'Hệ thống lẫn không khí làm chiếm chỗ truyền nhiệt và tăng áp suất đẩy ngưng tụ lên cực kỳ cao.',
    dangerLevel: 'danger',
    data: { t1: 30, t2: 28, t3: 12, t4: 16, t5: 55, t6: 42, t7: 35, t8: 34, t9: 32, t10: 41, lp: 160, hp: 520, t11: 65 }
  },
  {
    id: 'pan7',
    name: 'Pan 7: Thừa gas',
    desc: 'Môi chất nạp quá định mức dâng ngập dàn ngưng, làm tăng vọt áp suất nhưng tăng độ quá lạnh lỏng.',
    code: 'PAN-07',
    dangerLevel: 'warning',
    data: { t1: 30, t2: 27, t3: 11, t4: 15, t5: 56, t6: 41, t7: 35, t8: 34, t9: 32, t10: 42, lp: 155, hp: 510, t11: 56 }
  },
  {
    id: 'pan8',
    name: 'Pan 8: Dàn ngưng tụ quá bé (Bẩn/Hỏng quạt)',
    code: 'PAN-08',
    desc: 'Dàn nóng không giải tỏa được nhiệt ra môi trường khiến áp suất đẩy ngưng tụ tăng phi mã.',
    dangerLevel: 'danger',
    data: { t1: 30, t2: 28, t3: 12, t4: 16, t5: 55, t6: 52, t7: 36, t8: 35, t9: 32, t10: 35, lp: 165, hp: 530, t11: 55 }
  }
];

// Khởi tạo bảng tra cứu áp suất - nhiệt độ bão hòa (P-T Chart) cho học tập
const REFRIGERANT_PT_DATA = {
  R22: [
    { temp: -15, press: 27.6 },
    { temp: -10, press: 32.8 },
    { temp: -5, press: 38.6 },
    { temp: 0, press: 45.1 },
    { temp: 5, press: 52.3 },
    { temp: 10, press: 60.3 },
    { temp: 15, press: 69.1 },
    { temp: 20, press: 78.8 },
    { temp: 25, press: 89.4 },
    { temp: 30, press: 101.0 },
    { temp: 35, press: 113.7 },
    { temp: 40, press: 127.5 },
    { temp: 45, press: 142.5 },
    { temp: 50, press: 158.8 },
    { temp: 55, press: 176.4 },
    { temp: 60, press: 195.4 }
  ],
  R32: [
    { temp: -15, press: 61.2 },
    { temp: -10, press: 72.4 },
    { temp: -5, press: 85.1 },
    { temp: 0, press: 99.3 },
    { temp: 5, press: 115.2 },
    { temp: 10, press: 132.8 },
    { temp: 15, press: 152.4 },
    { temp: 20, press: 173.9 },
    { temp: 25, press: 197.6 },
    { temp: 30, press: 223.5 },
    { temp: 35, press: 251.8 },
    { temp: 40, press: 282.6 },
    { temp: 45, press: 316.0 },
    { temp: 50, press: 352.2 },
    { temp: 55, press: 391.3 },
    { temp: 60, press: 433.5 }
  ],
  R410A: [
    { temp: -15, press: 57.8 },
    { temp: -10, press: 68.6 },
    { temp: -5, press: 80.9 },
    { temp: 0, press: 94.7 },
    { temp: 5, press: 110.1 },
    { temp: 10, press: 127.2 },
    { temp: 15, press: 146.2 },
    { temp: 20, press: 167.1 },
    { temp: 25, press: 190.1 },
    { temp: 30, press: 215.3 },
    { temp: 35, press: 242.9 },
    { temp: 40, press: 322.0 },
    { temp: 45, press: 357.6 },
    { temp: 50, press: 396.1 },
    { temp: 55, press: 437.6 },
    { temp: 60, press: 482.3 }
  ]
};

interface HistoryEntry {
  id: string;
  time: string;
  data: ScenarioData;
  panName: string;
  panCode: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('simulator'); // simulator | library | classroom | quiz | ptchart
  const [sensorData, setSensorData] = useState<ScenarioData>(SYSTEM_SCENARIOS[0].data);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [simulationHistory, setSimulationHistory] = useState<HistoryEntry[]>([]);
  const [activeComponentInfo, setActiveComponentInfo] = useState<string | null>(null);

  // Trắc nghiệm thực hành (Quiz Mode)
  const [quizActive, setQuizActive] = useState<boolean>(false);
  const [quizTarget, setQuizTarget] = useState<Scenario | null>(null);
  const [quizSelection, setQuizSelection] = useState<string>('');
  const [quizChecked, setQuizChecked] = useState<boolean>(false);
  const [quizResult, setQuizResult] = useState<boolean | null>(null);
  const [quizScore, setQuizScore] = useState<{ correct: number; total: number; streak: number }>({ correct: 0, total: 0, streak: 0 });

  // P-T Chart state
  const [ptRefrigerant, setPtRefrigerant] = useState<'R22' | 'R32' | 'R410A'>('R22');
  const [ptTemp, setPtTemp] = useState<number>(25);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Logic chẩn đoán Pan bệnh nâng cấp, chính xác theo điều kiện vật lý
  const diagnoseSystem = (data: ScenarioData) => {
    const d_T1_T2 = data.t1 - data.t2;
    const d_T4_T3 = data.t4 - data.t3;
    const d_T5_T6 = data.t5 - data.t6;
    const d_T7_T8 = data.t7 - data.t8;
    const d_T10_T9 = data.t10 - data.t9;
    const lp = data.lp;
    const hp = data.hp;
    const t11 = data.t11;
    const t5 = data.t5;

    // Bình thường
    if (d_T1_T2 >= 6 && d_T1_T2 <= 8 && lp >= 120 && lp <= 140 && hp >= 400 && hp <= 450) {
      return {
        code: 'STANDARD',
        name: 'Hệ thống hoạt động bình thường',
        desc: 'Môi chất tuần hoàn tốt, dòng lỏng và dòng hơi ngưng tụ, bay hơi đạt hiệu suất COP tối đa. Độ quá lạnh và quá nhiệt lý tưởng để bảo vệ máy nén khỏi nguy cơ ngập lỏng.',
        solution: 'Không cần can thiệp kỹ thuật. Nên duy trì chế độ bảo dưỡng, xịt rửa phin lọc gió dàn lạnh định kỳ 3-6 tháng/lần.'
      };
    }

    // Pan 1: Van tiết lưu quá bé
    if (d_T1_T2 < 6 && lp < 120 && d_T4_T3 > 8 && d_T5_T6 >= 4 && d_T5_T6 <= 7 && d_T7_T8 <= 2) {
      return {
        code: 'PAN-01',
        name: 'Pan 1: Van tiết lưu quá bé (Hạn chế dòng ga)',
        desc: 'Lượng ga lỏng đi qua van quá nghèo nàn, làm áp suất hút LP tụt mạnh. Do ga bay hơi hết ngay đầu dàn lạnh, phần đuôi dàn bị quá nhiệt rất cao (Độ quá nhiệt T4-T3 > 8°C). Máy nén chạy nóng.',
        solution: 'Điều chỉnh tăng độ mở van tiết lưu nhiệt (TXV) hoặc vệ sinh, thay thế đầu kim phun tiết lưu nếu bị nghẹt cơ học.'
      };
    }

    // Pan 2: Tiết lưu sớm
    if (d_T1_T2 < 6 && lp < 120 && d_T4_T3 > 8 && d_T7_T8 > 2) {
      return {
        code: 'PAN-02',
        name: 'Pan 2: Tiết lưu sớm (Nghẹt phin lọc / Ống dịch)',
        desc: 'Sự tắc nghẽn một phần tại phin lọc dịch tạo ra một van tiết lưu phụ bất đắc dĩ. Ga bị giảm áp và hóa hơi sớm ngay trên đường dịch gây đọng sương, đóng tuyết ở phin lọc (độ lệch nhiệt T7-T8 > 2°C).',
        solution: 'Thay thế phin lọc ga lỏng mới. Tiến hành hút chân không sâu hệ thống và nạp lại môi chất lạnh theo đúng định lượng cân.'
      };
    }

    // Pan 3: Thiếu gas
    if (d_T1_T2 < 6 && lp < 120 && d_T4_T3 > 8 && d_T5_T6 < 4) {
      return {
        code: 'PAN-03',
        name: 'Pan 3: Hệ thống bị thiếu gas',
        desc: 'Lượng môi chất nạp thiếu hụt khiến áp suất LP và HP đều giảm mạnh. Lượng dịch tích tụ ở đáy dàn ngưng tụ kém khiến độ quá lạnh T5-T6 giảm sâu (< 4°C). Máy lạnh kém.',
        solution: 'Sử dụng bọt xà phòng hoặc máy dò ga phát hiện rò rỉ trên đường ống đồng. Khắc phục điểm xì, hút chân không và nạp lại ga định lượng.'
      };
    }

    // Pan 4: Dàn bay hơi quá bé
    if (d_T1_T2 < 6 && lp < 120 && d_T4_T3 < 5) {
      return {
        code: 'PAN-04',
        name: 'Pan 4: Dàn bay hơi quá bé (Bám tuyết / Dàn lạnh quá bẩn)',
        desc: 'Dàn lạnh bị phủ bụi dày, hỏng quạt hoặc bám tuyết dày đặc khiến ga không hấp thụ được nhiệt để bay hơi. Độ quá nhiệt sụt giảm sát 0°C. Nguy hiểm lớn vì ga lỏng tràn về gây hỏng máy nén (thuỷ kích).',
        solution: 'Tắt máy, làm tan tuyết, tiến hành xịt rửa bảo dưỡng dàn lạnh bằng bơm cao áp. Kiểm tra lại hoạt động và tụ khởi động của quạt dàn lạnh.'
      };
    }

    // Pan 5: Máy nén quá bé
    if (d_T1_T2 < 6 && lp > 140 && hp < 400) {
      return {
        code: 'PAN-05',
        name: 'Pan 5: Hiệu suất máy nén kém (Luồn hơi / Hỏng lá van clape)',
        desc: 'Máy nén bị hở cụm van clape nạp/đẩy hoặc mòn xi-lanh xéc-măng. Ga nóng từ đầu đẩy rò ngược về khoang hút gây tăng áp suất hút LP, đồng thời áp suất đẩy HP sụt giảm nặng, mất chênh lệch áp suất chu trình.',
        solution: 'Đo dòng điện vận hành (sụt giảm bất thường). Cần tháo máy nén để phục hồi clape hoặc thay thế block máy nén mới phù hợp công suất.'
      };
    }

    // Pan 6: Có khí không ngưng tụ
    if (d_T1_T2 < 6 && lp > 140 && hp > 450 && d_T5_T6 > 7 && t11 > t5) {
      return {
        code: 'PAN-06',
        name: 'Pan 6: Có khí không ngưng tụ (Lẫn không khí)',
        desc: 'Quy trình hút chân không không kỹ khiến không khí bị lẫn trong vòng tuần hoàn. Khí trơ chiếm chỗ truyền nhiệt ở dàn nóng, đẩy áp suất ngưng tụ HP lên cực cao. Nhiệt độ bão hòa lý thuyết (T11) cao hơn hẳn nhiệt độ lỏng (T5).',
        solution: 'Thu hồi toàn bộ môi chất lạnh. Tiến hành thông thổi đường ống, hút chân không sâu đạt mức dưới 500 microns bằng đồng hồ micron chuyên dụng, sau đó nạp mới hoàn toàn ga sạch.'
      };
    }

    // Pan 7: Thừa gas
    if (d_T1_T2 < 6 && lp > 140 && hp > 450 && d_T5_T6 > 7) {
      return {
        code: 'PAN-07',
        name: 'Pan 7: Hệ thống bị thừa gas nạp',
        desc: 'Lượng ga nạp dư thừa dâng cao chiếm dụng diện tích tản nhiệt của dàn ngưng, làm áp suất HP tăng vọt. Dịch lỏng đọng dày ở đáy dàn ngưng được làm mát sâu khiến độ quá lạnh T5-T6 tăng mạnh (> 7°C).',
        solution: 'Sử dụng đồng hồ thu hồi ga để xả bớt môi chất lạnh từ từ ra bình chứa chuyên dụng cho tới khi áp suất và độ quá lạnh trở về dải an toàn.'
      };
    }

    // Pan 8: Dàn ngưng tụ quá bé
    if (d_T1_T2 < 6 && lp > 140 && hp > 450 && d_T5_T6 < 4 && d_T10_T9 < 6) {
      return {
        code: 'PAN-08',
        name: 'Pan 8: Dàn ngưng tụ quá bé (Dàn nóng bẩn / Quạt hỏng)',
        desc: 'Dàn nóng không giải nhiệt được do lá nhôm bị bít kín bụi hoặc quạt dàn nóng hỏng. Ga không đổi pha hiệu quả sang lỏng, áp suất HP tăng phi mã nhưng độ quá lạnh lỏng cực thấp (< 4°C). Gió thổi ra dàn nóng không nóng.',
        solution: 'Dùng máy xịt áp lực rửa sạch dàn tản nhiệt dàn nóng. Kiểm tra động cơ quạt dàn nóng, tụ khởi động quạt hoặc thay cánh quạt nếu bị nứt vỡ.'
      };
    }

    // Trạng thái mấp mé trung gian
    if (lp < 110 || hp > 460) {
      return {
        code: 'TRANSITION',
        name: 'Hệ thống mất cân bằng áp suất nghiêm trọng',
        desc: 'Các thông số nhiệt động học đang nằm ngoài dải vận hành của thiết kế chuẩn, có dấu hiệu chồng chéo giữa thiếu ga, nghẹt tiết lưu hoặc quá tải dàn nóng.',
        solution: 'Hãy chọn một kịch bản lỗi chuẩn trong thư viện hoặc nhấn nút Đặt lại chuẩn để dễ dàng quan sát động học chu trình.'
      };
    }

    return {
      code: 'UNDETERMINED',
      name: 'Chưa phát hiện lỗi đơn lẻ rõ rệt',
      desc: 'Hệ thống đang hoạt động ở trạng thái chuyển tiếp hoặc tổ hợp các giá trị trượt đang không trùng với 8 pan bệnh kinh điển cơ học.',
      solution: 'Hãy điều chỉnh các thanh trượt theo các gợi ý của sách giáo khoa để xem cơ chế phản hồi tự động.'
    };
  };

  const currentPan = diagnoseSystem(sensorData);

  // Ghi lại lịch sử so sánh
  const saveToHistory = () => {
    const entry: HistoryEntry = {
      id: Math.random().toString(36).substr(2, 9),
      time: new Date().toLocaleTimeString('vi-VN'),
      data: { ...sensorData },
      panName: currentPan.name,
      panCode: currentPan.code
    };
    setSimulationHistory(prev => [entry, ...prev].slice(0, 8));
    showToast('Đã lưu trạng thái đo lường vào bảng đối chiếu!', 'success');
  };

  const clearHistory = () => {
    setSimulationHistory([]);
    showToast('Đã xóa bảng lịch sử!', 'info');
  };

  // Nạp bài kiểm tra ngẫu nhiên
  const startQuiz = () => {
    const quizCandidates = SYSTEM_SCENARIOS.filter(sc => sc.id !== 'normal');
    const randomScenario = quizCandidates[Math.floor(Math.random() * quizCandidates.length)];

    setSensorData(randomScenario.data);
    setQuizTarget(randomScenario);
    setQuizSelection('');
    setQuizChecked(false);
    setQuizResult(null);
    setQuizActive(true);
    setActiveTab('quiz');
    showToast('Đã tạo đề thi ngẫu nhiên! Hãy phân tích các thông số nhiệt động.', 'info');
  };

  const handleQuizSubmit = () => {
    if (!quizSelection) {
      showToast('Vui lòng chọn một phương án chẩn đoán!', 'warning');
      return;
    }
    if (!quizTarget) return;

    setQuizChecked(true);
    const isCorrect = quizSelection === quizTarget.id;
    setQuizResult(isCorrect);

    setQuizScore(prev => {
      const nextCorrect = isCorrect ? prev.correct + 1 : prev.correct;
      const nextTotal = prev.total + 1;
      const nextStreak = isCorrect ? prev.streak + 1 : 0;
      return { correct: nextCorrect, total: nextTotal, streak: nextStreak };
    });

    if (isCorrect) {
      showToast('Tuyệt vời! Bạn đã chẩn đoán chính xác pan bệnh.', 'success');
    } else {
      showToast('Chưa chính xác! Hãy đọc kỹ gợi ý cơ chế vật lý để hiểu rõ căn nguyên.', 'error');
    }
  };

  // Tra cứu bảng bão hòa ga P-T
  const getPtPressure = (refrigerant: 'R22' | 'R32' | 'R410A', temp: number): number => {
    const list = REFRIGERANT_PT_DATA[refrigerant];
    // Tìm điểm gần nhất
    let closest = list[0];
    let minDiff = Math.abs(list[0].temp - temp);
    for (const item of list) {
      const diff = Math.abs(item.temp - temp);
      if (diff < minDiff) {
        minDiff = diff;
        closest = item;
      }
    }
    return closest.press;
  };

  // Giúp sinh viên hiểu rõ cấu tạo của từng thiết bị trong chu trình
  const componentDescriptions: Record<string, { title: string; desc: string; role: string }> = {
    evaporator: {
      title: 'DÀN BAY HƠI (DÀN LẠNH)',
      desc: 'Nơi ga lạnh ở trạng thái bão hòa lỏng-hơi áp suất thấp thu nhiệt từ dòng gió phòng (T1) đi qua, sôi hóa hơi và thổi ra gió mát (T2).',
      role: 'Hấp thụ nhiệt lượng dư thừa trong không gian cần làm mát.'
    },
    compressor: {
      title: 'MÁY NÉN (COMPRESSOR)',
      desc: 'Trái tim của hệ thống. Hút hơi ga áp suất thấp nhiệt độ thấp từ dàn bay hơi, nén lên áp suất cao nhiệt độ cực cao (hơi quá nhiệt) đưa tới dàn ngưng.',
      role: 'Tạo động lực tuần hoàn gas và nâng mức năng lượng áp suất/nhiệt độ.'
    },
    condenser: {
      title: 'DÀN NGƯNG TỤ (DÀN NÓNG)',
      desc: 'Nơi hơi ga áp suất cao tỏa nhiệt dung ra môi trường không khí ngoài trời (T9) thông qua gió nóng thổi ra (T10), ngưng tụ thành ga lỏng áp suất cao.',
      role: 'Thải bỏ toàn bộ nhiệt lượng hấp thụ từ phòng ra ngoài môi trường.'
    },
    expansion_valve: {
      title: 'VAN TIẾT LƯU (TXV / CAPILLARY)',
      desc: 'Hạ áp đột ngột dòng ga lỏng áp suất cao từ dàn ngưng biến thành dòng dịch bão hòa áp suất thấp trước khi phun vào dàn bay hơi.',
      role: 'Kiểm soát lưu lượng môi chất cấp vào dàn lạnh theo tải nhiệt.'
    },
    filter_drier: {
      title: 'PHIN LỌC DỊCH (FILTER DRIER)',
      desc: 'Giữ lại các mạt kim loại rỉ sét, cặn bẩn bám dính và hấp thụ hơi ẩm axit dư thừa trong đường ống ga lỏng trước khi vào cơ cấu tiết lưu.',
      role: 'Bảo vệ kim phun van tiết lưu khỏi bị tắc bẩn hoặc ăn mòn hóa học.'
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-900">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed bottom-5 right-5 z-50 px-5 py-3.5 rounded-xl shadow-2xl border transition-all duration-300 flex items-center gap-3 backdrop-blur-md max-w-sm ${
          notification.type === 'success' ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200' :
          notification.type === 'error' ? 'bg-rose-950/90 border-rose-500 text-rose-200' :
          notification.type === 'warning' ? 'bg-amber-950/90 border-amber-500 text-amber-200' :
          'bg-slate-950/90 border-cyan-500 text-cyan-200'
        }`}>
          {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
          {notification.type === 'error' && <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />}
          {notification.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />}
          {notification.type === 'info' && <Info className="w-5 h-5 text-cyan-400 shrink-0" />}
          <span className="text-xs font-medium leading-relaxed">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 md:px-8 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col xl:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4.5">
            <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-3 rounded-2xl text-white shadow-xl shadow-cyan-500/20 shrink-0">
              <Activity className="w-7 h-7 animate-pulse text-cyan-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-2xl font-black tracking-tight font-display bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-400 bg-clip-text text-transparent">
                  HVAC THERMO-SIMULATOR
                </h1>
                <span className="bg-cyan-950 text-cyan-400 border border-cyan-800 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">V2.5 - EDU</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Hệ thống mô phỏng nhiệt động học & giảng dạy chẩn đoán lỗi điều hòa không khí</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex flex-wrap bg-slate-900/90 p-1 rounded-xl border border-slate-800 gap-1 w-full xl:w-auto overflow-x-auto justify-start">
            <button
              onClick={() => { setActiveTab('simulator'); setQuizActive(false); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-200 ${activeTab === 'simulator' && !quizActive ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <Sliders className="w-3.5 h-3.5" />
              BỘ GIẢ LẬP KÉO THẢ
            </button>
            <button
              onClick={() => { setActiveTab('library'); setQuizActive(false); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-200 ${activeTab === 'library' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <Layers className="w-3.5 h-3.5" />
              THƯ VIỆN PAN BỆNH
            </button>
            <button
              onClick={() => { setActiveTab('classroom'); setQuizActive(false); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-200 ${activeTab === 'classroom' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              SỔ TAY LÝ THUYẾT
            </button>
            <button
              onClick={() => { setActiveTab('ptchart'); setQuizActive(false); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-200 ${activeTab === 'ptchart' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <Gauge className="w-3.5 h-3.5" />
              TRA CỨU P-T GAS
            </button>
            <button
              onClick={startQuiz}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-300 ${activeTab === 'quiz' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-indigo-400 bg-indigo-950/20 hover:bg-indigo-950/50 border border-indigo-900/30'}`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              THI LÂM SÀNG
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">

        {/* Giảng đường Banner thông báo */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 p-4 md:p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <h2 className="text-sm font-bold text-slate-200 tracking-wide uppercase font-display">Phòng thí nghiệm kỹ thuật số điện lạnh</h2>
            </div>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              Nhấp chọn các thanh trượt thông số cảm biến để quan sát thuật toán chẩn đoán tự động phản hồi theo thời gian thực. Sinh viên có thể bấm trực tiếp vào các thiết bị trên sơ đồ chu trình để xem cấu tạo và cơ chế hoạt động.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button 
              onClick={() => { setSensorData(SYSTEM_SCENARIOS[0].data); showToast('Đã hoàn trả hệ thống về định mức sạch!', 'success'); }}
              className="bg-slate-800 hover:bg-slate-750 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Đặt lại chu trình chuẩn
            </button>
          </div>
        </div>

        {/* Tab 1: Simulator (Giả lập) */}
        {activeTab === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Cột trái: Hệ thống thanh trượt điều khiển */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-5">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <span className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg shrink-0">
                      <Sliders className="w-4 h-4" />
                    </span>
                    Bảng Điều Khiển Cảm Biến
                  </h2>
                  <span className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-1 rounded text-slate-400 font-mono">ĐƠN VỊ CHUẨN</span>
                </div>

                {/* Phím nạp nhanh các Pan mẫu */}
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold tracking-wider block uppercase">Nạp nhanh kịch bản giảng dạy:</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {SYSTEM_SCENARIOS.map((sc, i) => {
                      const isActive = sensorData.lp === sc.data.lp && sensorData.hp === sc.data.hp && (sensorData.t1 - sensorData.t2).toFixed(1) === (sc.data.t1 - sc.data.t2).toFixed(1);
                      return (
                        <button
                          key={sc.id}
                          onClick={() => {
                            setSensorData(sc.data);
                            showToast(`Đã nạp thành công: ${sc.name}`, 'info');
                          }}
                          className={`text-[10px] p-2.5 rounded-xl text-left font-bold transition-all duration-200 border flex flex-col justify-between ${
                            isActive
                              ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/10' 
                              : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-800'
                          }`}
                        >
                          <span className="opacity-60 font-mono block text-[8px] mb-0.5">{sc.code}</span>
                          <span className="truncate w-full block">{i === 0 ? '✔️ Bình Thường' : sc.name.split(': ')[1]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Các thanh trượt điều chỉnh */}
                <div className="space-y-4 pt-3 border-t border-slate-850">
                  
                  {/* Nhóm thông số gió dàn lạnh */}
                  <div className="space-y-3.5 bg-slate-900/60 p-4 rounded-2xl border border-slate-850">
                    <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
                      <Thermometer className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold text-cyan-400 block tracking-wider uppercase">Dàn lạnh (Gió trong nhà)</span>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300">Nhiệt độ gió vào (Hồi - T1):</span>
                        <span className="font-mono font-bold text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded">{sensorData.t1} °C</span>
                      </div>
                      <input
                        type="range" min="15" max="45" step="0.5" value={sensorData.t1}
                        onChange={(e) => setSensorData({ ...sensorData, t1: parseFloat(e.target.value) })}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                      />
                      <div className="flex justify-between text-[8px] text-slate-500 mt-0.5 font-mono">
                        <span>Min: 15°C</span>
                        <span>Chuẩn: ~30°C</span>
                        <span>Max: 45°C</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300">Nhiệt độ gió ra (Thổi - T2):</span>
                        <span className="font-mono font-bold text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded">{sensorData.t2} °C</span>
                      </div>
                      <input
                        type="range" min="10" max="45" step="0.5" value={sensorData.t2}
                        onChange={(e) => setSensorData({ ...sensorData, t2: parseFloat(e.target.value) })}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                      />
                      <div className="flex justify-between text-[8px] text-slate-500 mt-0.5 font-mono">
                        <span>Min: 10°C</span>
                        <span>Chuẩn: ~23°C</span>
                        <span>Max: 45°C</span>
                      </div>
                    </div>
                  </div>

                  {/* Nhóm thông số Áp suất chu trình */}
                  <div className="space-y-3.5 bg-slate-900/60 p-4 rounded-2xl border border-slate-850">
                    <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
                      <Gauge className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-bold text-amber-500 block tracking-wider uppercase">Bộ đo áp suất Chu kỳ</span>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300">Áp suất bay hơi (Hút - LP):</span>
                        <span className="font-mono font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded">{sensorData.lp} psi</span>
                      </div>
                      <input
                        type="range" min="40" max="250" step="1" value={sensorData.lp}
                        onChange={(e) => setSensorData({ ...sensorData, lp: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                      <div className="flex justify-between text-[8px] text-slate-500 mt-0.5 font-mono">
                        <span>Min: 40 psi</span>
                        <span>Định mức: 120-140 psi</span>
                        <span>Max: 250 psi</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300">Áp suất ngưng tụ (Đẩy - HP):</span>
                        <span className="font-mono font-bold text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded">{sensorData.hp} psi</span>
                      </div>
                      <input
                        type="range" min="150" max="600" step="5" value={sensorData.hp}
                        onChange={(e) => setSensorData({ ...sensorData, hp: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                      />
                      <div className="flex justify-between text-[8px] text-slate-500 mt-0.5 font-mono">
                        <span>Min: 150 psi</span>
                        <span>Định mức: 400-450 psi</span>
                        <span>Max: 600 psi</span>
                      </div>
                    </div>
                  </div>

                  {/* Nhóm thông số ống lỏng & quá lạnh / quá nhiệt */}
                  <div className="space-y-3.5 bg-slate-900/60 p-4 rounded-2xl border border-slate-850">
                    <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-400 block tracking-wider uppercase">Độ quá nhiệt & Quá lạnh</span>
                    </div>
                    
                    {/* Chỉnh hiệu T4 - T3 */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-300">Độ Quá Nhiệt (Superheat T4-T3):</span>
                        <span className="font-mono font-bold text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded">{(sensorData.t4 - sensorData.t3).toFixed(1)} °C</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button 
                          onClick={() => setSensorData({ ...sensorData, t3: 5, t4: 7 })}
                          className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${sensorData.t4 - sensorData.t3 < 5 ? 'bg-sky-950 text-sky-400 border-sky-800' : 'bg-slate-900 text-slate-400 border-slate-800'}`}
                        >
                          Thiếu Thấp (&lt;5)
                        </button>
                        <button 
                          onClick={() => setSensorData({ ...sensorData, t3: 5, t4: 11 })}
                          className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${sensorData.t4 - sensorData.t3 >= 5 && sensorData.t4 - sensorData.t3 <= 8 ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-slate-900 text-slate-400 border-slate-800'}`}
                        >
                          Tiêu Chuẩn (5-8)
                        </button>
                        <button 
                          onClick={() => setSensorData({ ...sensorData, t3: -10, t4: 10 })}
                          className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${sensorData.t4 - sensorData.t3 > 8 ? 'bg-rose-950 text-rose-400 border-rose-800' : 'bg-slate-900 text-slate-400 border-slate-800'}`}
                        >
                          Quá Cao (&gt;8)
                        </button>
                      </div>
                    </div>

                    {/* Chỉnh hiệu T5 - T6 */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-300">Độ Quá Lạnh (Subcooling T5-T6):</span>
                        <span className="font-mono font-bold text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded">{(sensorData.t5 - sensorData.t6).toFixed(1)} °C</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button 
                          onClick={() => setSensorData({ ...sensorData, t5: 40, t6: 38 })}
                          className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${sensorData.t5 - sensorData.t6 < 4 ? 'bg-sky-950 text-sky-400 border-sky-800' : 'bg-slate-900 text-slate-400 border-slate-800'}`}
                        >
                          Giảm Thấp (&lt;4)
                        </button>
                        <button 
                          onClick={() => setSensorData({ ...sensorData, t5: 45, t6: 40 })}
                          className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${sensorData.t5 - sensorData.t6 >= 4 && sensorData.t5 - sensorData.t6 <= 7 ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-slate-900 text-slate-400 border-slate-800'}`}
                        >
                          Tiêu Chuẩn (4-7)
                        </button>
                        <button 
                          onClick={() => setSensorData({ ...sensorData, t5: 55, t6: 42 })}
                          className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${sensorData.t5 - sensorData.t6 > 7 ? 'bg-rose-950 text-rose-400 border-rose-800' : 'bg-slate-900 text-slate-400 border-slate-800'}`}
                        >
                          Quá Cao (&gt;7)
                        </button>
                      </div>
                    </div>

                    {/* Lệch phin lọc T7-T8 */}
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-300">Nghẹt phin lọc (Chênh lệch T7-T8):</span>
                        <span className="font-mono font-bold text-pink-400 bg-pink-950/50 px-1.5 py-0.5 rounded">{(sensorData.t7 - sensorData.t8).toFixed(1)} °C</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setSensorData({ ...sensorData, t7: 35, t8: 34 })}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${sensorData.t7 - sensorData.t8 <= 2 ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-slate-900 text-slate-400 border-slate-800'}`}
                        >
                          Sạch / Thông suốt (&lt;=2°C)
                        </button>
                        <button
                          onClick={() => setSensorData({ ...sensorData, t7: 32, t8: 25 })}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${sensorData.t7 - sensorData.t8 > 2 ? 'bg-rose-950 text-rose-400 border-rose-800 animate-pulse' : 'bg-slate-900 text-slate-400 border-slate-800'}`}
                        >
                          Nghẹt / Tiết lưu sớm (&gt;2°C)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Thông số phụ nhiệt độ lý thuyết T11 và dàn nóng */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850">
                      <span className="text-[10px] font-bold text-slate-400 block mb-1">Kiểm tra lẫn Khí (T11 vs T5)</span>
                      <div className="flex flex-col gap-1.5">
                        <button 
                          onClick={() => setSensorData(prev => ({ ...prev, t11: prev.t5 }))}
                          className={`text-[9px] font-bold px-2 py-1.5 rounded-lg transition-all ${sensorData.t11 === sensorData.t5 ? 'bg-teal-950 text-teal-400 border border-teal-800' : 'bg-slate-900 text-slate-500'}`}
                        >
                          Hơi bão hòa (T11 = T5)
                        </button>
                        <button 
                          onClick={() => setSensorData(prev => ({ ...prev, t11: prev.t5 + 10 }))}
                          className={`text-[9px] font-bold px-2 py-1.5 rounded-lg transition-all ${sensorData.t11 > sensorData.t5 ? 'bg-rose-950 text-rose-400 border border-rose-800 animate-pulse' : 'bg-slate-900 text-slate-500'}`}
                        >
                          Có Khí Trơ (T11 &gt; T5)
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850">
                      <span className="text-[10px] font-bold text-slate-400 block mb-1">Gió Dàn Nóng (T10-T9)</span>
                      <div className="flex flex-col gap-1.5">
                        <button 
                          onClick={() => setSensorData(prev => ({ ...prev, t9: 32, t10: 39 }))}
                          className={`text-[9px] font-bold px-2 py-1.5 rounded-lg transition-all ${sensorData.t10 - sensorData.t9 >= 6 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-900 text-slate-500'}`}
                        >
                          Tản nhiệt tốt (7°C)
                        </button>
                        <button 
                          onClick={() => setSensorData(prev => ({ ...prev, t9: 32, t10: 35 }))}
                          className={`text-[9px] font-bold px-2 py-1.5 rounded-lg transition-all ${sensorData.t10 - sensorData.t9 < 6 ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-slate-900 text-slate-500'}`}
                        >
                          Tản nhiệt yếu (3°C)
                        </button>
                      </div>
                    </div>
                  </div>

                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={saveToHistory}
                    className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-950/50"
                  >
                    <Save className="w-4 h-4" />
                    Lưu trạng thái phân tích
                  </button>
                </div>
              </div>
            </div>

            {/* Cột phải: Phán quyết thuật toán & Sơ đồ động */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Thẻ chuẩn đoán kết quả lớn */}
              <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
                <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-[10px] font-black uppercase tracking-wider ${
                  currentPan.code === 'STANDARD' ? 'bg-emerald-500/10 text-emerald-400 border-l border-b border-emerald-900/50' : 'bg-rose-500/10 text-rose-400 border-l border-b border-rose-900/50 animate-pulse'
                }`}>
                  {currentPan.code === 'STANDARD' ? 'HỆ THỐNG ĐẠT CHUẨN' : 'CẢNH BÁO SỰ CỐ'}
                </div>

                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest font-mono">Trạng thái chẩn đoán thông minh</span>
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                </div>
                <h3 className="text-xl md:text-2xl font-black text-white tracking-tight leading-snug">
                  {currentPan.name}
                </h3>

                {/* Giám sát thông số thermodynamic */}
                <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-850 mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Độ lệch T1-T2</span>
                    <span className={`text-sm font-extrabold block font-mono ${(sensorData.t1 - sensorData.t2) < 6 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {(sensorData.t1 - sensorData.t2).toFixed(1)} °C
                    </span>
                    <span className="text-[8px] text-slate-500 block">Tiêu chuẩn: 6-8°C</span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Độ quá nhiệt SH</span>
                    <span className={`text-sm font-extrabold block font-mono ${(sensorData.t4 - sensorData.t3) > 8 ? 'text-amber-400' : (sensorData.t4 - sensorData.t3) < 5 ? 'text-sky-400' : 'text-emerald-400'}`}>
                      {(sensorData.t4 - sensorData.t3).toFixed(1)} °C
                    </span>
                    <span className="text-[8px] text-slate-500 block">Tiêu chuẩn: 5-8°C</span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Độ quá lạnh SC</span>
                    <span className={`text-sm font-extrabold block font-mono ${(sensorData.t5 - sensorData.t6) > 7 ? 'text-amber-400' : (sensorData.t5 - sensorData.t6) < 4 ? 'text-sky-400' : 'text-emerald-400'}`}>
                      {(sensorData.t5 - sensorData.t6).toFixed(1)} °C
                    </span>
                    <span className="text-[8px] text-slate-500 block">Tiêu chuẩn: 4-7°C</span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Độ lệch phin</span>
                    <span className={`text-sm font-extrabold block font-mono ${sensorData.t7 - sensorData.t8 > 2 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {(sensorData.t7 - sensorData.t8).toFixed(1)} °C
                    </span>
                    <span className="text-[8px] text-slate-500 block">Tiêu chuẩn: &lt;= 2°C</span>
                  </div>
                </div>

                <div className="space-y-4 mt-5 pt-4 border-t border-slate-850">
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                      Nguyên lý nhiệt động lỗi:
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed bg-slate-900/30 p-3.5 rounded-xl border border-slate-850">
                      {currentPan.desc}
                    </p>
                  </div>
                  
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wide">
                      <Wrench className="w-3.5 h-3.5" />
                      Biện pháp xử lý của kỹ sư thực tế:
                    </h4>
                    <div className="bg-emerald-950/20 border border-emerald-900/30 text-emerald-300 rounded-xl p-3.5 text-xs flex items-start gap-2.5 shadow-sm">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <p className="leading-relaxed font-medium">{currentPan.solution}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sơ đồ động của chu trình lạnh chuyên nghiệp */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Sơ đồ nhiệt động học chu trình ga R22</h3>
                    <p className="text-[10px] text-slate-500">Bấm vào thiết bị để học cấu tạo. Xem luồng áp suất: đỏ (cao), xanh (thấp)</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-[10px] text-rose-400 font-bold">
                      <span className="w-2.5 h-2.5 rounded bg-rose-500 block"></span> Cao áp (HP)
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] text-cyan-400 font-bold">
                      <span className="w-2.5 h-2.5 rounded bg-cyan-500 block"></span> Thấp áp (LP)
                    </span>
                  </div>
                </div>

                {/* Sơ đồ SVG thiết kế tinh xảo */}
                <div className="w-full flex flex-col items-center bg-slate-900/30 p-4 rounded-xl border border-slate-850">
                  <svg viewBox="0 0 520 320" className="w-full max-w-2xl h-auto">
                    
                    {/* Định nghĩa các gradients và filters phát sáng */}
                    <defs>
                      <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                      <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                      <linearGradient id="blue-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0284c7" />
                        <stop offset="100%" stopColor="#0ea5e9" />
                      </linearGradient>
                      <linearGradient id="red-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#dc2626" />
                        <stop offset="100%" stopColor="#ef4444" />
                      </linearGradient>
                    </defs>

                    {/* ĐỐNG ỐNG ĐỒNG TUẦN HOÀN GA */}
                    {/* Hơi áp thấp (Từ đầu ra Dàn Lạnh T4 -> Đầu Hút Máy nén T12) */}
                    <path d="M 80,100 L 80,190" fill="none" stroke="#0284c7" strokeWidth="4" />
                    <path d="M 80,100 L 80,190" fill="none" stroke="#38bdf8" strokeWidth="3" className="flow-low-pressure" />

                    {/* Hơi quá nhiệt áp cao (Từ đầu đẩy máy nén T11 -> Đầu vào Dàn Nóng) */}
                    <path d="M 140,220 L 320,220" fill="none" stroke="#dc2626" strokeWidth="4" />
                    <path d="M 140,220 L 320,220" fill="none" stroke="#fca5a5" strokeWidth="3" className="flow-high-pressure" />

                    {/* Đường dịch lỏng áp cao (Đầu ra Dàn nóng T5 -> Phin lọc T7 -> Van tiết lưu T6) */}
                    <path d="M 385,200 L 385,85" fill="none" stroke="#dc2626" strokeWidth="3" />
                    <path d="M 385,200 L 385,85" fill="none" stroke="#fca5a5" strokeWidth="2" className="flow-high-pressure" />

                    {/* Hơi ẩm sương áp thấp (Sau tiết lưu -> Đầu vào Dàn lạnh T3) */}
                    <path d="M 385,60 L 385,25 L 110,25 L 110,40" fill="none" stroke="#0ea5e9" strokeWidth="3" />
                    <path d="M 385,60 L 385,25 L 110,25 L 110,40" fill="none" stroke="#7dd3fc" strokeWidth="2" className="flow-low-pressure" />

                    {/* THIẾT BỊ 1: Dàn Bay Hơi (Dàn Lạnh) */}
                    <g 
                      onClick={() => setActiveComponentInfo('evaporator')}
                      className={`cursor-pointer transition-all duration-200 group ${currentPan.code === 'PAN-04' ? 'animate-pulse' : ''}`}
                    >
                      <rect 
                        x="50" y="40" width="120" height="60" rx="8" 
                        fill="#0f172a" 
                        stroke={currentPan.code === 'PAN-04' ? '#f43f5e' : '#0ea5e9'} 
                        strokeWidth={currentPan.code === 'PAN-04' ? '3.5' : '2'} 
                        filter={currentPan.code === 'PAN-04' ? 'url(#glow-red)' : ''}
                      />
                      {/* Cuộn coil */}
                      <path d="M 60,70 L 160,70 M 60,60 L 160,60 M 60,80 L 160,80" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2,3" />
                      <text x="110" y="55" fill="#e2e8f0" fontSize="8.5" fontWeight="bold" textAnchor="middle">DÀN BAY HƠI</text>
                      <text x="110" y="90" fill="#0ea5e9" fontSize="9" fontWeight="bold" textAnchor="middle">T1-T2: {(sensorData.t1 - sensorData.t2).toFixed(1)} °C</text>
                    </g>

                    {/* THIẾT BỊ 2: Máy Nén (Block) */}
                    <g 
                      onClick={() => setActiveComponentInfo('compressor')}
                      className={`cursor-pointer transition-all duration-200 group ${currentPan.code === 'PAN-05' ? 'animate-pulse' : ''}`}
                    >
                      <circle 
                        cx="110" cy="220" r="30" 
                        fill="#1e293b" 
                        stroke={currentPan.code === 'PAN-05' ? '#f43f5e' : '#475569'} 
                        strokeWidth={currentPan.code === 'PAN-05' ? '4' : '2'}
                        filter={currentPan.code === 'PAN-05' ? 'url(#glow-red)' : ''}
                      />
                      <path d="M 100,210 L 120,210 L 110,235 Z" fill="#94a3b8" />
                      <text x="110" y="180" fill="#e2e8f0" fontSize="8.5" fontWeight="bold" textAnchor="middle">MÁY NÉN (BLOCK)</text>
                      <text x="110" y="243" fill="#94a3b8" fontSize="8.5" fontWeight="bold" textAnchor="middle">LP: {sensorData.lp} psi</text>
                    </g>

                    {/* THIẾT BỊ 3: Dàn Ngưng (Dàn Nóng) */}
                    <g 
                      onClick={() => setActiveComponentInfo('condenser')}
                      className={`cursor-pointer transition-all duration-200 group ${currentPan.code === 'PAN-08' ? 'animate-pulse' : ''}`}
                    >
                      <rect 
                        x="320" y="170" width="130" height="60" rx="8" 
                        fill="#0f172a" 
                        stroke={currentPan.code === 'PAN-08' ? '#f43f5e' : '#ef4444'} 
                        strokeWidth={currentPan.code === 'PAN-08' ? '3.5' : '2'} 
                        filter={currentPan.code === 'PAN-08' ? 'url(#glow-red)' : ''}
                      />
                      <path d="M 330,190 L 440,190 M 330,200 L 440,200 M 330,210 L 440,210" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="2,3" />
                      <text x="385" y="185" fill="#e2e8f0" fontSize="8.5" fontWeight="bold" textAnchor="middle">DÀN NGƯNG TỤ</text>
                      <text x="385" y="220" fill="#ef4444" fontSize="9" fontWeight="bold" textAnchor="middle">HP: {sensorData.hp} psi</text>
                    </g>

                    {/* THIẾT BỊ 4: Van Tiết Lưu */}
                    <g 
                      onClick={() => setActiveComponentInfo('expansion_valve')}
                      className={`cursor-pointer transition-all duration-200 group ${currentPan.code === 'PAN-01' ? 'animate-pulse' : ''}`}
                    >
                      <polygon 
                        points="375,60 395,80 375,80 395,60" 
                        fill="#0f172a" 
                        stroke={currentPan.code === 'PAN-01' ? '#f43f5e' : '#10b981'} 
                        strokeWidth={currentPan.code === 'PAN-01' ? '3.5' : '2'}
                        filter={currentPan.code === 'PAN-01' ? 'url(#glow-red)' : ''}
                      />
                      <text x="385" y="50" fill="#10b981" fontSize="8.5" fontWeight="bold" textAnchor="middle">TIẾT LƯU</text>
                    </g>

                    {/* THIẾT BỊ 5: Phin lọc dịch */}
                    <g 
                      onClick={() => setActiveComponentInfo('filter_drier')}
                      className={`cursor-pointer transition-all duration-200 group ${currentPan.code === 'PAN-02' ? 'animate-pulse' : ''}`}
                    >
                      <rect 
                        x="375" y="120" width="20" height="35" rx="4" 
                        fill="#1e293b" 
                        stroke={currentPan.code === 'PAN-02' ? '#f43f5e' : '#e2e8f0'} 
                        strokeWidth={currentPan.code === 'PAN-02' ? '3' : '1.5'}
                        filter={currentPan.code === 'PAN-02' ? 'url(#glow-red)' : ''}
                      />
                      <line x1="375" y1="137" x2="395" y2="137" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="1,1" />
                      <text x="402" y="140" fill="#e2e8f0" fontSize="7.5" textAnchor="start">PHIN</text>
                    </g>

                    {/* CẢM BIẾN CHỈ SỐ NHIỆT ĐỘ CỦA CÁC ĐIỂM NÚT */}
                    {/* T1 - Hồi gió dàn lạnh */}
                    <circle cx="50" cy="50" r="6" fill="#0284c7" />
                    <text x="40" y="53" fill="#38bdf8" fontSize="8" fontWeight="bold" textAnchor="end">T1: {sensorData.t1}°C</text>

                    {/* T2 - Gió thổi ra lạnh */}
                    <circle cx="170" cy="90" r="6" fill="#38bdf8" />
                    <text x="180" y="93" fill="#7dd3fc" fontSize="8" fontWeight="bold" textAnchor="start">T2: {sensorData.t2}°C</text>

                    {/* T3 - Nhiệt độ sôi ga bão hòa */}
                    <circle cx="110" cy="25" r="6" fill="#0ea5e9" />
                    <text x="110" y="16" fill="#7dd3fc" fontSize="8" fontWeight="bold" textAnchor="middle">T3 (Sôi): {sensorData.t3}°C</text>

                    {/* T4 - Nhiệt độ ống hút máy nén */}
                    <circle cx="80" cy="140" r="6" fill="#0284c7" />
                    <text x="70" y="143" fill="#38bdf8" fontSize="8" fontWeight="bold" textAnchor="end">T4 (Hút): {sensorData.t4}°C</text>

                    {/* T5 - Nhiệt độ bão hòa lỏng */}
                    <circle cx="385" cy="190" r="6" fill="#ef4444" />
                    <text x="402" y="193" fill="#fca5a5" fontSize="8" fontWeight="bold" textAnchor="start">T5 (Lỏng): {sensorData.t5}°C</text>

                    {/* T6 - Nhiệt độ lỏng trước tiết lưu */}
                    <circle cx="385" cy="90" r="6" fill="#b91c1c" />
                    <text x="402" y="93" fill="#fca5a5" fontSize="8" fontWeight="bold" textAnchor="start">T6: {sensorData.t6}°C</text>

                    {/* T7 - Trước phin */}
                    <circle cx="385" cy="155" r="5" fill="#f43f5e" />
                    <text x="370" y="158" fill="#fda4af" fontSize="7.5" textAnchor="end">T7: {sensorData.t7}°C</text>

                    {/* T8 - Sau phin */}
                    <circle cx="385" cy="115" r="5" fill="#f43f5e" />
                    <text x="370" y="118" fill="#fda4af" fontSize="7.5" textAnchor="end">T8: {sensorData.t8}°C</text>

                    {/* T11 - Nhiệt độ bão hòa ngưng */}
                    <circle cx="320" cy="220" r="6" fill="#dc2626" />
                    <text x="300" y="235" fill="#fca5a5" fontSize="8" fontWeight="bold" textAnchor="end">T11 (Đẩy): {sensorData.t11}°C</text>

                    {/* Đèn báo lỗi chớp nháy cảnh báo động */}
                    {currentPan.code !== 'STANDARD' && (
                      <g>
                        <circle cx="260" cy="110" r="18" fill="#ef4444" opacity="0.15" className="animate-ping" />
                        <circle cx="260" cy="110" r="10" fill="#ef4444" />
                        <text x="260" y="113" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle" className="animate-pulse">!</text>
                        <text x="260" y="132" fill="#ef4444" fontSize="8" fontWeight="bold" textAnchor="middle">SỰ CỐ CHU KỲ</text>
                      </g>
                    )}
                  </svg>
                </div>

                {/* Khung giải thích linh kiện khi sinh viên bấm chọn */}
                {activeComponentInfo && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 relative">
                    <button 
                      onClick={() => setActiveComponentInfo(null)}
                      className="absolute top-2 right-2 text-slate-500 hover:text-slate-300 text-xs font-bold font-mono px-1 bg-slate-950 rounded"
                    >
                      Đóng ×
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="p-1 bg-cyan-950 text-cyan-400 rounded text-xs font-bold">🔍 Kiến thức thiết bị</span>
                      <h4 className="text-xs font-bold text-slate-200">{componentDescriptions[activeComponentInfo].title}</h4>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{componentDescriptions[activeComponentInfo].desc}</p>
                    <div className="text-[11px] text-cyan-400 font-semibold italic">Vai trò: {componentDescriptions[activeComponentInfo].role}</div>
                  </div>
                )}
              </div>

              {/* Lịch sử lưu trữ chẩn đoán của sinh viên */}
              {simulationHistory.length > 0 && (
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <ListFilter className="w-4 h-4 text-cyan-400" />
                      Lịch sử phân tích & so sánh dữ liệu
                    </h4>
                    <button 
                      onClick={clearHistory}
                      className="text-[10px] text-rose-400 hover:text-rose-300 font-bold transition-all bg-rose-950/20 px-2 py-1 rounded-lg"
                    >
                      Xóa tất cả
                    </button>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-slate-850">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider text-[9px]">
                          <th className="p-3">Thời gian</th>
                          <th className="p-3">LP (psi)</th>
                          <th className="p-3">HP (psi)</th>
                          <th className="p-3">T1 - T2 (°C)</th>
                          <th className="p-3">Quá nhiệt SH</th>
                          <th className="p-3">Chẩn đoán thông thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 text-slate-300 font-medium">
                        {simulationHistory.map((item) => {
                          const isNormal = item.panCode === 'STANDARD';
                          return (
                            <tr key={item.id} className="hover:bg-slate-900/40 transition-all">
                              <td className="p-3 text-slate-500 font-mono text-[11px]">{item.time}</td>
                              <td className="p-3 text-amber-400 font-mono font-bold">{item.data.lp}</td>
                              <td className="p-3 text-rose-400 font-mono font-bold">{item.data.hp}</td>
                              <td className="p-3 font-mono">{(item.data.t1 - item.data.t2).toFixed(1)}°C</td>
                              <td className="p-3 font-mono text-cyan-400">{(item.data.t4 - item.data.t3).toFixed(1)}°C</td>
                              <td className="p-3">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isNormal ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/50' : 'bg-rose-950 text-rose-400 border border-rose-900/50'
                                }`}>
                                  {item.panName}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* Tab 2: Pan Library (Thư viện đối chiếu) */}
        {activeTab === 'library' && (
          <div className="space-y-6">
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-2">
              <div className="flex items-center gap-2">
                <Layers className="w-6 h-6 text-cyan-400" />
                <h2 className="text-base md:text-lg font-black tracking-tight uppercase font-display">Bộ thư viện phân tích 8 Pan lỗi kinh điển</h2>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-4xl">
                Cơ sở thuật toán lọc phân loại lỗi nhiệt động dựa trên sự dịch chuyển pha tuần hoàn ga trong máy nén một cấp. Mỗi pan bệnh bao gồm các dấu hiệu nhận dạng đặc thù và các chỉ số so sánh nghiêm ngặt.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {SYSTEM_SCENARIOS.slice(1).map((pan, index) => {
                return (
                  <div key={pan.id} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 hover:border-cyan-500/30 transition-all duration-300 flex flex-col justify-between shadow-lg hover:shadow-cyan-950/20 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-tr from-cyan-500/5 to-transparent rounded-bl-full pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-850 pb-2.5">
                        <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded-lg font-mono font-bold">
                          PAN-0{index + 1}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase font-mono">HVAC LEVEL-1</span>
                      </div>
                      
                      <div className="space-y-1">
                        <h3 className="text-sm font-extrabold text-slate-100 group-hover:text-cyan-400 transition-colors duration-200">{pan.name}</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">{pan.desc}</p>
                      </div>
                      
                      {/* Diễn giải điều kiện toán học học thuật */}
                      <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-850 space-y-1.5 text-[10px] font-mono">
                        <span className="text-slate-500 block font-bold uppercase text-[8.5px] tracking-wider mb-1">Dấu hiệu nhận dạng cảm biến:</span>
                        <div className="text-rose-400">• Chênh lệch T1 - T2 &lt; 6°C (Yếu lạnh)</div>
                        {index === 0 && (
                          <>
                            <div className="text-amber-400">• Áp suất LP &lt; 120 psi (Sụt thấp)</div>
                            <div className="text-emerald-400">• Độ quá nhiệt (T4-T3) &gt; 8°C (Rất cao)</div>
                          </>
                        )}
                        {index === 1 && (
                          <>
                            <div className="text-amber-400">• Áp suất LP &lt; 120 psi (Sụt thấp)</div>
                            <div className="text-pink-400">• Chênh phin (T7-T8) &gt; 2°C (Tiết lưu sớm)</div>
                          </>
                        )}
                        {index === 2 && (
                          <>
                            <div className="text-amber-400">• Áp suất LP &lt; 120 psi & HP sụt thấp</div>
                            <div className="text-emerald-400">• Độ quá lạnh (T5-T6) &lt; 4°C (Cực thấp)</div>
                          </>
                        )}
                        {index === 3 && (
                          <>
                            <div className="text-amber-400">• Áp suất LP &lt; 120 psi (Sụt thấp)</div>
                            <div className="text-sky-400">• Độ quá nhiệt (T4-T3) &lt; 5°C (Nguy cơ lỏng)</div>
                          </>
                        )}
                        {index === 4 && (
                          <>
                            <div className="text-amber-400">• Áp suất LP &gt; 140 psi (Nghịch lý dâng cao)</div>
                            <div className="text-rose-400">• Áp suất HP &lt; 400 psi (Sụt sâu, hở lá clape)</div>
                          </>
                        )}
                        {index === 5 && (
                          <>
                            <div className="text-amber-400">• Áp suất LP & HP đều dâng cực cao</div>
                            <div className="text-amber-500">• Nhiệt độ bão hòa khí T11 &gt; T5 (Có Khí Trơ)</div>
                          </>
                        )}
                        {index === 6 && (
                          <>
                            <div className="text-amber-400">• Áp suất LP & HP đều dâng cao</div>
                            <div className="text-emerald-400">• Độ quá lạnh (T5-T6) &gt; 7°C (Rất cao)</div>
                          </>
                        )}
                        {index === 7 && (
                          <>
                            <div className="text-rose-400">• Áp suất HP &gt; 450 psi (Cực cao)</div>
                            <div className="text-slate-400">• Chênh gió dàn nóng T10-T9 &lt; 6°C</div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="pt-4 mt-4 border-t border-slate-900 flex justify-between items-center">
                      <span className="text-[10px] text-slate-500 italic">Mô hình mẫu thiết kế</span>
                      <button
                        onClick={() => {
                          setSensorData(pan.data);
                          setActiveTab('simulator');
                          showToast(`Đã nạp thông số ${pan.name} vào bộ giả lập!`, 'success');
                        }}
                        className="bg-slate-900 hover:bg-cyan-500 hover:text-slate-950 text-cyan-400 text-xs px-3 py-1.5 rounded-xl transition-all duration-200 border border-slate-800 font-bold flex items-center gap-1"
                      >
                        Nạp vào giả lập
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Sổ tay lý thuyết (Classroom) */}
        {activeTab === 'classroom' && (
          <div className="max-w-4xl mx-auto bg-slate-950 p-6 md:p-8 rounded-3xl border border-slate-800 space-y-8 shadow-2xl">
            <div className="border-b border-slate-800 pb-5">
              <div className="flex items-center gap-2 mb-1.5">
                <BookOpen className="w-6 h-6 text-cyan-400" />
                <h2 className="text-lg md:text-xl font-black text-slate-100 uppercase tracking-tight font-display">Giáo trình đào tạo kỹ sư cơ điện lạnh thực hành</h2>
              </div>
              <p className="text-xs text-slate-400">Trang bị nền tảng lý thuyết vững vàng về chu trình máy nén hơi một cấp để chẩn đoán đúng căn nguyên sự cố.</p>
            </div>

            <div className="space-y-6 text-xs md:text-sm text-slate-300 leading-relaxed">
              
              {/* Formula Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-slate-900 to-cyan-950/40 p-5 rounded-2xl border border-cyan-900/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-extrabold text-cyan-300 uppercase tracking-wide">Độ Quá Nhiệt (Superheat - SH)</h3>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-center">
                    <code className="text-sm md:text-base font-mono font-black text-cyan-400">SH = T4 (Đầu hút) - T3 (Sôi bão hòa)</code>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Thể hiện trạng thái hơi hồi về máy nén. Tiêu chuẩn quốc tế từ <strong className="text-cyan-400">5°C đến 8°C</strong>.
                    <br />• <strong>SH quá thấp (&lt; 5°C):</strong> Nguy cơ ga lỏng chưa sôi hết lọt về máy nén gây thuỷ kích phá huỷ cơ khí.
                    <br />• <strong>SH quá cao (&gt; 8°C):</strong> Máy lạnh đói ga lỏng, máy nén chạy nóng, cuộn dây motor giải nhiệt kém.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-rose-950/40 p-5 rounded-2xl border border-rose-900/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-rose-400" />
                    <h3 className="font-extrabold text-rose-300 uppercase tracking-wide">Độ Quá Lạnh (Subcooling - SC)</h3>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-center">
                    <code className="text-sm md:text-base font-mono font-black text-rose-400">SC = T5 (Ngưng tụ bão hòa) - T6 (Ống lỏng thực tế)</code>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Đảm bảo ga lỏng đã hoá lỏng hoàn toàn trước khi tới cơ cấu tiết lưu. Tiêu chuẩn từ <strong className="text-rose-400">4°C đến 7°C</strong>.
                    <br />• <strong>SC quá thấp (&lt; 4°C):</strong> Thiếu ga hoặc tản nhiệt ngưng tụ kém, ga lỏng sủi bọt khí gây sụt công suất.
                    <br />• <strong>SC quá cao (&gt; 7°C):</strong> Thừa ga nạp, dâng lỏng làm tắc nghẽn dàn ngưng, đẩy áp suất ngưng tụ tăng phi mã.
                  </p>
                </div>
              </div>

              {/* Chi tiết 3 định luật lâm sàng */}
              <div className="space-y-4 pt-4 border-t border-slate-850">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">3 Nguyên lý so sánh bất dịch trong điện lạnh</h3>
                
                <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-850 space-y-1.5">
                  <h4 className="font-bold text-slate-200">1. Nhiệt độ bão hòa lý thuyết (T11) so với nhiệt độ lỏng thực tế (T5)</h4>
                  <p className="text-xs text-slate-400">
                    Trong chu trình ngưng tụ hoàn hảo của ga sạch, nhiệt độ bão hòa tương ứng áp suất đẩy ngưng tụ (T11) phải bằng đúng nhiệt độ đường lỏng đầu ra dàn nóng (T5). Nếu T11 lớn hơn T5 đáng kể (&gt; 5°C), chứng tỏ trong hệ thống có lẫn khí trơ (không khí không ngưng tụ), chiếm dụng thể tích trao đổi nhiệt khiến HP tăng cực cao.
                  </p>
                </div>

                <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-850 space-y-1.5">
                  <h4 className="font-bold text-slate-200">2. Mối tương quan giữa Nhiệt độ gió phòng (T1) và Chênh lệch gió ra (T1-T2)</h4>
                  <p className="text-xs text-slate-400">
                    Dàn lạnh chạy đúng công suất bắt buộc phải hạ nhiệt độ gió thổi từ 6°C đến 8°C. Nếu hiệu số này sụt giảm dưới 6°C, chắc chắn hệ thống đang gặp lỗi trao đổi nhiệt: quạt dàn lạnh bẩn, tuyết bám, thiếu lưu lượng ga hoặc hỏng máy nén.
                  </p>
                </div>

                <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-850 space-y-1.5">
                  <h4 className="font-bold text-slate-200">3. Độ chênh lệch nhiệt phin lọc dịch (T7 - T8)</h4>
                  <p className="text-xs text-slate-400">
                    Phin lọc bình thường hoạt động thông suốt, nhiệt độ trước và sau phin bằng nhau (T7-T8 &lt;= 1°C). Nếu phin bị nghẹt bẩn do cặn bám, nó đóng vai trò van tiết lưu phụ, ga tự sôi giảm áp làm T8 sụt thấp rất lạnh, đọng sương/đông tuyết. Đây chính là hiện tượng "tiết lưu sớm".
                  </p>
                </div>
              </div>

              {/* Chi tiết phần hỏi đáp lý thuyết */}
              <div className="space-y-4 pt-6 border-t border-slate-850">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Các bài tập rèn luyện tư duy tự luận điện lạnh</h3>
                
                <div className="space-y-3">
                  <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-850 space-y-2">
                    <p className="font-bold text-slate-200 text-xs md:text-sm">Câu hỏi 1: Tại sao tắc nghẽn phin lọc (Pan 2) lại làm sụt giảm nhiệt độ nghiêm trọng tại ống đồng sau phin (T8 sụt sâu)?</p>
                    <details className="group">
                      <summary className="text-xs text-cyan-400 select-none cursor-pointer font-bold flex items-center gap-1">
                        Xem hướng dẫn giải bài thi tự luận
                        <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                      </summary>
                      <div className="mt-3 text-slate-400 bg-slate-950 p-4 rounded-xl border border-slate-850 leading-relaxed text-xs">
                        Khi phin lọc bị tắc nghẽn một phần do bám cặn dầu, tiết diện hữu dụng của ống ga bị thu hẹp đột ngột. Sự cản đường này hoạt động giống hệt một van tiết lưu. Ga lỏng áp suất cao bị giảm áp cực nhanh ngay tại điểm nghẹt và tự sôi hóa hơi sương thu nhiệt nội tại, dẫn tới nhiệt độ T8 sau phin sụt giảm rất lạnh, ống đồng đổ mồ hôi đọng nước hoặc đông tuyết.
                      </div>
                    </details>
                  </div>

                  <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-850 space-y-2">
                    <p className="font-bold text-slate-200 text-xs md:text-sm">Câu hỏi 2: Tại sao áp suất ngưng tụ HP tăng rất cao nhưng độ quá lạnh lỏng (T5-T6) lại dưới 4°C trong lỗi hỏng quạt tản nhiệt dàn nóng (Pan 8)?</p>
                    <details className="group">
                      <summary className="text-xs text-cyan-400 select-none cursor-pointer font-bold flex items-center gap-1">
                        Xem hướng dẫn giải bài thi tự luận
                        <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                      </summary>
                      <div className="mt-3 text-slate-400 bg-slate-950 p-4 rounded-xl border border-slate-850 leading-relaxed text-xs">
                        Do quạt dàn nóng hỏng không thổi bớt nhiệt dung ra ngoài, lượng hơi ga áp suất cao nén từ lốc về dàn ngưng tụ không thể ngưng tụ lỏng tối đa. Dàn ngưng chứa toàn bộ hơi quá nhiệt nóng làm đẩy áp suất bão hòa đẩy ngưng tụ lên cực cao. Không thể hóa lỏng hiệu quả khiến đáy dàn không dồn được dịch lỏng, do đó độ làm mát lỏng sâu hơn bị triệt tiêu, làm độ quá lạnh T5-T6 cực kỳ bé (&lt; 4°C).
                      </div>
                    </details>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab 4: P-T Gas Chart Reference */}
        {activeTab === 'ptchart' && (
          <div className="max-w-3xl mx-auto bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-6 shadow-2xl">
            <div className="border-b border-slate-850 pb-4 text-center">
              <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                CÔNG CỤ TRA CỨU KỸ THUẬT
              </span>
              <h2 className="text-lg font-black text-white mt-2">Bảng tra cứu Áp Suất - Nhiệt Độ Bão Hòa</h2>
              <p className="text-xs text-slate-400 mt-1">Học viên tra cứu nhiệt độ sôi bão hòa tương ứng của các loại môi chất ga lạnh R22, R32, R410A.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 bg-slate-900/40 p-5 rounded-2xl border border-slate-850">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wide block">Lựa chọn loại ga lạnh:</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['R22', 'R32', 'R410A'] as const).map((ref) => (
                    <button
                      key={ref}
                      onClick={() => setPtRefrigerant(ref)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        ptRefrigerant === ref 
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md' 
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {ref}
                    </button>
                  ))}
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-800">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-300">Nhiệt độ bão hòa (Bốc hơi/Ngưng tụ):</span>
                    <span className="font-mono font-bold text-cyan-400">{ptTemp} °C</span>
                  </div>
                  <input
                    type="range" min="-15" max="60" step="5" value={ptTemp}
                    onChange={(e) => setPtTemp(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                    <span>-15°C</span>
                    <span>25°C</span>
                    <span>60°C</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-center space-y-1">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Áp suất bão hòa tương ứng (P)</span>
                  <div className="text-2xl font-black font-mono text-amber-400">
                    {getPtPressure(ptRefrigerant, ptTemp)} <span className="text-xs">psi</span>
                  </div>
                  <span className="text-[9px] text-slate-500 block font-mono">
                    ~ {(getPtPressure(ptRefrigerant, ptTemp) * 0.0689476).toFixed(2)} bar
                  </span>
                </div>
              </div>

              {/* Bảng giá trị đối chiếu nhanh */}
              <div className="bg-slate-900/20 rounded-2xl border border-slate-850 p-4 space-y-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide block">Bảng bão hòa đối chiếu nhanh ({ptRefrigerant})</span>
                <div className="overflow-y-auto max-h-56 pr-1 rounded-xl border border-slate-850">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-slate-500 text-[9px] uppercase tracking-wider font-bold">
                        <th className="p-2.5">Nhiệt độ (°C)</th>
                        <th className="p-2.5">Áp suất (psi)</th>
                        <th className="p-2.5">Áp suất (bar)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 font-mono text-slate-300">
                      {REFRIGERANT_PT_DATA[ptRefrigerant].map((row) => (
                        <tr key={row.temp} className={`hover:bg-slate-900/50 ${ptTemp === row.temp ? 'bg-cyan-950/40 text-cyan-400 font-bold' : ''}`}>
                          <td className="p-2.5">{row.temp} °C</td>
                          <td className="p-2.5 text-amber-400">{row.press}</td>
                          <td className="p-2.5 text-slate-500">{(row.press * 0.0689476).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Quiz Mode (Trắc nghiệm thực hành) */}
        {activeTab === 'quiz' && (
          <div className="max-w-3xl mx-auto bg-slate-950 p-6 md:p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl relative overflow-hidden">
            
            {/* Background pattern */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/5 rounded-full filter blur-2xl pointer-events-none"></div>

            <div className="border-b border-slate-800 pb-4 text-center space-y-1 relative">
              <span className="inline-flex items-center gap-1.5 text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-900 px-3 py-1 rounded-full font-black uppercase tracking-wider">
                <GraduationCap className="w-3.5 h-3.5" />
                Đánh giá lâm sàng kỹ sư
              </span>
              <h2 className="text-lg md:text-xl font-black text-white font-display">Bài kiểm tra chẩn đoán chu trình ẩn</h2>
              <p className="text-xs text-slate-400">Các thông số cảm biến đã được nạp ngẫu nhiên ở một pan bệnh. Hãy tính toán Superheat, Subcooling và đưa ra phán quyết!</p>
            </div>

            {/* Scoreboard */}
            <div className="grid grid-cols-3 gap-3 text-center bg-slate-900/50 p-3 rounded-2xl border border-slate-850">
              <div className="p-1">
                <span className="text-[9px] text-slate-500 block uppercase font-bold">Số câu đúng</span>
                <span className="text-sm font-black text-emerald-400">{quizScore.correct} <span className="text-slate-500">/ {quizScore.total}</span></span>
              </div>
              <div className="p-1 border-x border-slate-800">
                <span className="text-[9px] text-slate-500 block uppercase font-bold">Chuỗi thắng</span>
                <span className="text-sm font-black text-amber-400">🔥 {quizScore.streak}</span>
              </div>
              <div className="p-1">
                <span className="text-[9px] text-slate-500 block uppercase font-bold">Tỉ lệ đạt</span>
                <span className="text-sm font-black text-cyan-400">
                  {quizScore.total > 0 ? `${Math.round((quizScore.correct / quizScore.total) * 100)}%` : '0%'}
                </span>
              </div>
            </div>

            {/* Các thông số đo được thực tế của đề thi */}
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-850 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 space-y-0.5">
                <span className="text-[10px] text-slate-500 block font-bold uppercase">Gió vào T1</span>
                <span className="text-sm font-black font-mono text-cyan-400">{sensorData.t1} °C</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 space-y-0.5">
                <span className="text-[10px] text-slate-500 block font-bold uppercase">Gió ra T2</span>
                <span className="text-sm font-black font-mono text-cyan-400">{sensorData.t2} °C</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 space-y-0.5">
                <span className="text-[10px] text-slate-500 block font-bold uppercase">Áp suất LP</span>
                <span className="text-sm font-black font-mono text-amber-500">{sensorData.lp} psi</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 space-y-0.5">
                <span className="text-[10px] text-slate-500 block font-bold uppercase">Áp suất HP</span>
                <span className="text-sm font-black font-mono text-rose-500">{sensorData.hp} psi</span>
              </div>
              
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 space-y-0.5">
                <span className="text-[10px] text-slate-500 block font-bold uppercase">Nhiệt ống hút T4</span>
                <span className="text-sm font-black font-mono text-sky-400">{sensorData.t4} °C</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 space-y-0.5">
                <span className="text-[10px] text-slate-500 block font-bold uppercase">Nhiệt độ sôi T3</span>
                <span className="text-sm font-black font-mono text-indigo-400">{sensorData.t3} °C</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 space-y-0.5">
                <span className="text-[10px] text-slate-500 block font-bold uppercase">Nhiệt độ lỏng T5</span>
                <span className="text-sm font-black font-mono text-pink-400">{sensorData.t5} °C</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 space-y-0.5">
                <span className="text-[10px] text-slate-500 block font-bold uppercase">Nhiệt ống lỏng T6</span>
                <span className="text-sm font-black font-mono text-teal-400">{sensorData.t6} °C</span>
              </div>
            </div>

            {/* Gợi ý cho học viên tính toán thông số */}
            <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-850 flex items-start gap-3 text-xs leading-relaxed text-slate-400">
              <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-300 block mb-0.5">Gợi ý phân tích nhanh dành cho bạn:</span>
                • Hiệu số bốc hơi <strong className="text-cyan-400">T1 - T2 = {(sensorData.t1 - sensorData.t2).toFixed(1)} °C</strong> (nhỏ hơn 6°C là máy làm lạnh kém).
                <br />• Độ quá nhiệt <strong className="text-cyan-400">SH (T4 - T3) = {(sensorData.t4 - sensorData.t3).toFixed(1)} °C</strong> (bình thường là 5-8°C).
                <br />• Độ quá lạnh <strong className="text-rose-400">SC (T5 - T6) = {(sensorData.t5 - sensorData.t6).toFixed(1)} °C</strong> (bình thường là 4-7°C).
              </div>
            </div>

            {/* Các phương án chẩn đoán chọn lựa */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Chọn 1 chẩn đoán xác đáng nhất:</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SYSTEM_SCENARIOS.slice(1).map((pan) => (
                  <label 
                    key={pan.id} 
                    className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all duration-200 ${
                      quizSelection === pan.id 
                        ? 'bg-indigo-950/40 border-indigo-500 text-indigo-200 shadow-lg shadow-indigo-950/50' 
                        : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="quiz-selection"
                        value={pan.id}
                        checked={quizSelection === pan.id}
                        onChange={(e) => setQuizSelection(e.target.value)}
                        disabled={quizChecked}
                        className="accent-indigo-500 h-4 w-4"
                      />
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold block">{pan.name}</span>
                        <span className="text-[10px] text-slate-500 block font-mono">{pan.code}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Khung phản hồi kết quả thi */}
            {quizChecked && quizTarget && (
              <div className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2.5 ${
                quizResult 
                  ? 'bg-emerald-950/20 border-emerald-500/50 text-emerald-300' 
                  : 'bg-rose-950/20 border-rose-500/50 text-rose-300'
              }`}>
                <div className="flex items-center gap-2 font-black text-sm">
                  {quizResult ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <span>🎉 ĐÁP ÁN CHÍNH XÁC! XỨNG ĐÁNG KỸ SƯ BẬC CAO!</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                      <span>❌ ĐÁP ÁN CHƯA ĐÚNG! HÃY NGHIÊN CỨU LẠI CHU TRÌNH.</span>
                    </>
                  )}
                </div>
                <div className="bg-slate-950/40 p-3 rounded-xl space-y-1 text-[11px] text-slate-400 border border-slate-900">
                  <p><strong>Dấu hiệu đúng của {quizTarget.name}:</strong></p>
                  <p>{quizTarget.desc}</p>
                </div>
                <p className="text-[11px]"><strong>Giải pháp khắc phục sự cố:</strong> {diagnoseSystem(quizTarget.data).solution}</p>
              </div>
            )}

            <div className="flex gap-4 pt-2">
              {!quizChecked ? (
                <button
                  onClick={handleQuizSubmit}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-950/50 flex items-center justify-center gap-1.5"
                >
                  <Award className="w-4 h-4" />
                  Nộp bài & Chấm điểm tự động
                </button>
              ) : (
                <button
                  onClick={startQuiz}
                  className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold py-3 px-6 rounded-xl transition-all border border-slate-700 flex items-center justify-center gap-1.5"
                >
                  <Play className="w-4 h-4 text-cyan-400" />
                  Bắt đầu bài thi tiếp theo
                </button>
              )}
            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-8 px-6 mt-12 text-center text-xs text-slate-500 space-y-1.5">
        <div className="max-w-7xl mx-auto">
          <p>© 2026 HVAC THERMO-SIMULATOR PRO. Sản phẩm thiết kế chuyên dụng cho kỹ thuật viên và sinh viên Cơ Điện Lạnh.</p>
          <p className="text-[10px] text-slate-600">Giao diện responsive trực quan, hỗ trợ giảng dạy tự động trên máy tính, máy tính bảng và điện thoại.</p>
        </div>
      </footer>
    </div>
  );
}
