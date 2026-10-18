// src/pages/Results.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  CheckCircle,
  AlertTriangle,
  Info,
  Heart,
  Brain,
  Clock,
  Users,
  ChevronDown,
  ChevronUp,
  Home,
  AlertCircle,
  FileCheck2,
} from "lucide-react";

import StressLow from "../assets/stress_low.png";
import StressMedium from "../assets/stress_medium.png";
import StressHigh from "../assets/stress_high.png";
import { API_BASE_URL } from "../config/api.ts";
import { TOTAL_BINARY_INDICATORS, DISCLAIMER_LABEL } from "../utils/Scoring.ts";

interface IndicatorItem {
  key: string;
  label: string;
  userFriendlyLabel?: string;
  kelompok: string;
  sScore: number;
  status: 0 | 1;
}

interface ResultData {
  name: string;
  age: number;
  status: string;
  version?: string;
  score_total: number;
  problematic_category: number;
  stressLevel: "rendah" | "sedang" | "tinggi";
  score_category?: Record<string, IndicatorItem> | null;
  score_details?: any;
  disclaimer?: string;
}

function ExpandableSection({
  title,
  icon,
  children,
  defaultExpanded = false,
  colorClass = "blue",
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  colorClass?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-${colorClass}-50 to-${colorClass}-100 hover:from-${colorClass}-100 hover:to-${colorClass}-200 transition-all duration-200`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${colorClass}-500 text-white shadow-sm`}
          >
            {icon}
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-800 text-left">
            {title}
          </h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-600 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-600 flex-shrink-0" />
        )}
      </button>

      {isExpanded && <div className="p-6 space-y-4">{children}</div>}
    </div>
  );
}

export default function Results() {
  const navigate = useNavigate();
  const [data, setData] = useState<ResultData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const respondentId = localStorage.getItem("respondent_id");

  useEffect(() => {
    setIsLoaded(false);
    if (!respondentId) {
      navigate("/questionnaire");
      return;
    }

    axios
      .get(`${API_BASE_URL}/results/${respondentId}`)
      .then((res) => {
        setData(res.data);
        setTimeout(() => setIsLoaded(true), 400);
      })
      .catch((err) => {
        console.error("Error fetching result:", err);
        navigate("/questionnaire");
      });
  }, [respondentId, navigate]);

  if (!data || !isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-700 font-medium text-sm">
            Menganalisis hasil skrining Anda...
          </p>
        </div>
      </div>
    );
  }

  const { name, age, status, stressLevel, score_category } = data;

  // Ekstrak indikator berisiko (status 1) dari score_category
  const flaggedIndicators: IndicatorItem[] = [];
  if (score_category && typeof score_category === "object") {
    Object.values(score_category).forEach((ind: any) => {
      if (ind && ind.status === 1) {
        flaggedIndicators.push(ind);
      }
    });
  }

  const config = {
    rendah: {
      color: "emerald",
      bgGradient: "from-emerald-50 to-teal-50",
      title: "Tingkat Stres Kerja: Rendah",
      message:
        "Bagus! Kondisi Anda saat ini berada di tingkat stres kerja rendah. Tetap pertahankan keseimbangan kerja dan kesehatan diri.",
      img: StressLow,
      scoreColor: "text-emerald-700",
      bgColor: "bg-emerald-500",
      badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
    },
    sedang: {
      color: "amber",
      bgGradient: "from-amber-50 to-orange-50",
      title: "Tingkat Stres Kerja: Sedang",
      message:
        "Perhatian! Anda terindikasi mengalami stres kerja tingkat sedang. Perhatikan faktor-faktor pemicu dan luangkan waktu untuk relaksasi serta istirahat.",
      img: StressMedium,
      scoreColor: "text-amber-700",
      bgColor: "bg-amber-500",
      badge: "bg-amber-100 text-amber-800 border-amber-300",
    },
    tinggi: {
      color: "red",
      bgGradient: "from-red-50 to-rose-50",
      title: "Tingkat Stres Kerja: Tinggi",
      message:
        "Peringatan! Anda terindikasi mengalami tingkat stres kerja tinggi yang membutuhkan perhatian khusus. Sangat disarankan berkonsultasi dengan profesional.",
      img: StressHigh,
      scoreColor: "text-red-700",
      bgColor: "bg-red-500",
      badge: "bg-red-100 text-red-800 border-red-300",
    },
  };

  const cfg = config[stressLevel] || config.rendah;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${cfg.bgGradient} p-4 sm:p-6 md:p-8`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Banner Disclaimer */}
        <div className="bg-amber-100/90 border border-amber-300 text-amber-900 px-4 py-3 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-medium shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0" />
          <span>
            <strong>Pemberitahuan:</strong> {DISCLAIMER_LABEL}. Hasil ini ditujukan sebagai informasi awal untuk evaluasi kondisi kerja pribadi.
          </span>
        </div>

        {/* Header Responden */}
        <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl">
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{name}</h2>
              <p className="text-xs text-gray-500">
                Usia: {age} tahun | Posisi: {status}
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-1.5 rounded-full text-xs font-semibold">
            <CheckCircle className="w-4 h-4" />
            Skrining 68 Pertanyaan Selesai
          </div>
        </div>

        {/* Kartu Hasil Utama */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className={`bg-gradient-to-r ${cfg.bgGradient} p-8 text-center border-b border-gray-100`}>
            <div className="flex justify-center mb-4">
              <img
                src={cfg.img}
                alt="Ilustrasi Tingkat Stres"
                className="w-36 h-36 object-contain drop-shadow-md"
              />
            </div>
            <span className={`inline-block px-4 py-1 rounded-full text-xs font-bold border mb-2 ${cfg.badge}`}>
              HASIL SKRINING
            </span>
            <h1 className={`text-2xl sm:text-3xl font-extrabold ${cfg.scoreColor}`}>
              {cfg.title}
            </h1>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <p className="text-gray-700 leading-relaxed text-center max-w-2xl mx-auto text-sm sm:text-base">
              {cfg.message}
            </p>

            {stressLevel === "tinggi" && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-900 text-sm sm:text-base">
                    Saran Tindak Lanjut Profesional
                  </h4>
                  <p className="text-red-700 text-xs sm:text-sm mt-1 leading-relaxed">
                    Jika Anda merasa gejala stres ini mulai mengganggu aktivitas sehari-hari, Anda disarankan untuk berkonsultasi dengan psikolog, konselor, atau fasilitas pelayanan kesehatan terdekat.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Daftar Indikator Berisiko (Bahasa Awam) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-gray-100 space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                  Indikasi Faktor Risiko di Tempat Kerja
                </h3>
                <p className="text-xs text-gray-500">
                  Evaluasi dari 21 indikator tuntutan pekerjaan, sumber daya, dan kondisi kesehatan
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">
              {flaggedIndicators.length} dari {TOTAL_BINARY_INDICATORS} Berisiko
            </span>
          </div>

          {flaggedIndicators.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="font-semibold text-emerald-900 text-sm sm:text-base">
                Tidak Ditemukan Indikasi Faktor Risiko yang Signifikan
              </p>
              <p className="text-xs sm:text-sm text-emerald-700 max-w-md mx-auto">
                Kondisi hubungan kerja, keseimbangan kerja dan kehidupan pribadi, sumber daya pekerjaan, serta respon fisik dan emosional Anda saat ini terpantau baik.
              </p>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <p className="text-xs text-gray-600">
                Berikut adalah aspek-aspek yang terindikasi memerlukan perhatian atau perbaikan:
              </p>
              <div className="grid grid-cols-1 gap-3">
                {flaggedIndicators.map((ind, idx) => (
                  <div
                    key={ind.key || idx}
                    className="p-4 rounded-xl border border-rose-100 bg-rose-50/60 flex items-start gap-3"
                  >
                    <span className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900 text-sm">
                          {ind.label}
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 bg-rose-100 text-rose-700 rounded-md font-semibold">
                          {ind.kelompok}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 mt-1 leading-relaxed">
                        {ind.userFriendlyLabel || `Terindikasi adanya risiko pada aspek ${ind.label}.`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SECTION Edukasi 1: Apakah Stres Itu? */}
        <ExpandableSection
          title="Apakah Stres Kerja Itu?"
          icon={<Info className="w-5 h-5" />}
          colorClass="blue"
          defaultExpanded={false}
        >
          <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
            <p>
              Stres terkait pekerjaan adalah pola reaksi yang terjadi saat pekerja dihadapkan pada tuntutan yang tidak seimbang dengan sumber daya atau kemampuan beradaptasi.
            </p>
            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <h5 className="font-bold text-gray-800 text-xs mb-1">Respon Fisik</h5>
                <p className="text-xs text-gray-600">Jantung berdebar, tekanan darah naik, ketegangan otot, sakit kepala, kelelahan kronis.</p>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <h5 className="font-bold text-gray-800 text-xs mb-1">Respon Emosi</h5>
                <p className="text-xs text-gray-600">Mudah tersinggung, cemas berlebih, hilangnya motivasi, perasaan murung atau sedih.</p>
              </div>
            </div>
          </div>
        </ExpandableSection>

        {/* SECTION Edukasi 2: Penyebab Stres Kerja */}
        <ExpandableSection
          title="Penyebab Stres Terkait Pekerjaan"
          icon={<AlertTriangle className="w-5 h-5" />}
          colorClass="amber"
          defaultExpanded={false}
        >
          <div className="grid sm:grid-cols-2 gap-4 text-xs sm:text-sm text-gray-700">
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-2">
              <h5 className="font-bold text-amber-900">Faktor Tempat Kerja:</h5>
              <ul className="space-y-1 list-disc list-inside text-gray-600">
                <li>Konflik antar personal dan tuntutan pekerjaan yang mengganggu kehidupan pribadi</li>
                <li>Kurangnya apresiasi atau kejelasan umpan balik</li>
                <li>Konflik komunikasi antar rekan atau atasan</li>
                <li>Ketidakpastian perubahan organisasi</li>
              </ul>
            </div>
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-2">
              <h5 className="font-bold text-amber-900">Faktor Peran Rumah & Keluarga:</h5>
              <ul className="space-y-1 list-disc list-inside text-gray-600">
                <li>Konflik peran ganda antara pekerjaan dan rumah tangga</li>
                <li>Kelelahan terbawa dari kantor ke kehidupan keluarga</li>
                <li>Waktu pribadi yang tersita habis untuk urusan kantor</li>
              </ul>
            </div>
          </div>
        </ExpandableSection>

        {/* SECTION Edukasi 3: Manajemen Stres Kerja */}
        <ExpandableSection
          title="Tips Manajemen Stres Kerja"
          icon={<Brain className="w-5 h-5" />}
          colorClass="purple"
          defaultExpanded={false}
        >
          <div className="space-y-3 text-xs sm:text-sm text-gray-700">
            <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-200 flex items-start gap-3">
              <Clock className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-purple-900">Atur Batasan Waktu & Istirahat</h5>
                <p className="text-gray-600 mt-0.5">Terapkan jeda singkat (micro-break) saat bekerja dan pisahkan waktu istirahat dari urusan tugas.</p>
              </div>
            </div>
            <div className="p-3.5 bg-teal-50 rounded-xl border border-teal-200 flex items-start gap-3">
              <Heart className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-teal-900">Aktivitas Fisik & Relaksasi</h5>
                <p className="text-gray-600 mt-0.5">Latihan pernapasan atau jalan santai ringan dapat membantu menstabilkan detak jantung dan hormon stres.</p>
              </div>
            </div>
            <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200 flex items-start gap-3">
              <Users className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-blue-900">Komunikasi Terbuka</h5>
                <p className="text-gray-600 mt-0.5">Bicarakan kendala hubungan kerja atau keseimbangan antara pekerjaan dan keluarga secara konstruktif bersama rekan atau pimpinan Anda.</p>
              </div>
            </div>
          </div>
        </ExpandableSection>

        {/* Tombol Kembali ke Beranda */}
        <div className="text-center pt-4 pb-8">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3.5 rounded-full font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all text-sm"
          >
            <Home className="w-4 h-4" />
            Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  );
}
