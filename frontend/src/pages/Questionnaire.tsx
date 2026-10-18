// src/pages/Questionnaire.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { questions } from "../data/questions.ts";
import { calculateScores } from "../utils/Scoring.ts";
import { categories } from "../data/categories.ts";
import axios from "axios";
import { API_BASE_URL } from "../config/api.ts";

export default function Questionnaire() {
  const navigate = useNavigate();

  const [answers, setAnswers] = useState<Record<number, number>>(() => {
    const saved = localStorage.getItem("survey_answers");
    return saved ? JSON.parse(saved) : {};
  });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() => {
    const saved = localStorage.getItem("survey_index");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentMotivation, setCurrentMotivation] = useState("");
  const [showMotivation, setShowMotivation] = useState(false);
  const [normsMap, setNormsMap] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/norms`)
      .then((res) => {
        if (res.data?.norms) {
          setNormsMap(res.data.norms);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch norms, will use defaults:", err);
      });
  }, []);

  const motivationalMessages = [
    {
      text: "Terima kasih sudah meluangkan waktu untuk diri sendiri.",
      emoji: "💛",
      color: "from-rose-500 to-pink-500",
    },
    {
      text: "Jawaban Anda membantu memahami kondisi Anda dengan lebih baik.",
      emoji: "🧡",
      color: "from-purple-500 to-rose-500",
    },
    {
      text: "Anda melakukan yang terbaik, tetap lanjut ya.",
      emoji: "✨",
      color: "from-blue-500 to-indigo-500",
    },
    {
      text: "Fokus sebentar saja, ini untuk kebaikan Anda juga.",
      emoji: "🌿",
      color: "from-green-500 to-emerald-500",
    },
    {
      text: "Anda sudah melalui banyak hal, terima kasih sudah terus maju.",
      emoji: "🌼",
      color: "from-yellow-500 to-amber-500",
    },
    {
      text: "Kesehatan mental Anda penting. Teruskan ya.",
      emoji: "💖",
      color: "from-pink-500 to-rose-500",
    },
    {
      text: "Tetap tenang, Anda menjawab dengan sangat baik.",
      emoji: "🌙",
      color: "from-indigo-500 to-purple-500",
    },
    {
      text: "Perjalanan ini tentang Anda. Pelan-pelan tidak apa-apa.",
      emoji: "🕊️",
      color: "from-teal-500 to-cyan-500",
    },
    {
      text: "Anda layak mendapatkan ruang untuk memahami diri sendiri.",
      emoji: "💐",
      color: "from-rose-500 to-pink-600",
    },
    {
      text: "Sedikit lagi, Anda sudah sangat konsisten.",
      emoji: "⭐",
      color: "from-amber-500 to-orange-500",
    },
  ];

  const currentQuestion = questions[currentQuestionIndex];
  const category = categories[currentQuestion?.category];
  const progress = Math.round(
    ((currentQuestionIndex + 1) / questions.length) * 100
  );

  const categoryThemes: Record<
    string,
    {
      primary: string;
      bg: string;
      border: string;
      text: string;
      button: string;
      icon: string;
      accent: string;
    }
  > = {
    I: {
      primary: "from-rose-500 to-pink-600",
      bg: "bg-rose-50",
      border: "border-rose-200",
      text: "text-rose-800",
      button: "bg-rose-500 hover:bg-rose-600",
      icon: "bg-rose-500",
      accent: "rose",
    },
    II: {
      primary: "from-emerald-500 to-teal-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-800",
      button: "bg-emerald-500 hover:bg-emerald-600",
      icon: "bg-emerald-500",
      accent: "emerald",
    },
    IV: {
      primary: "from-amber-500 to-orange-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-800",
      button: "bg-amber-500 hover:bg-amber-600",
      icon: "bg-amber-500",
      accent: "amber",
    },
    V: {
      primary: "from-purple-500 to-violet-600",
      bg: "bg-purple-50",
      border: "border-purple-200",
      text: "text-purple-800",
      button: "bg-purple-500 hover:bg-purple-600",
      icon: "bg-purple-500",
      accent: "purple",
    },
    VI: {
      primary: "from-pink-500 to-rose-600",
      bg: "bg-pink-50",
      border: "border-pink-200",
      text: "text-pink-800",
      button: "bg-pink-500 hover:bg-pink-600",
      icon: "bg-pink-500",
      accent: "pink",
    },
    VII: {
      primary: "from-indigo-500 to-blue-600",
      bg: "bg-indigo-50",
      border: "border-indigo-200",
      text: "text-indigo-800",
      button: "bg-indigo-500 hover:bg-indigo-600",
      icon: "bg-indigo-500",
      accent: "indigo",
    },
  };

  const answerColors: Array<{
    bg: string;
    hover: string;
    border: string;
    selectedBg: string;
    selectedBorder: string;
    selectedText: string;
    badge: string;
    accent: string;
  }> = [
    {
      bg: "bg-gradient-to-r from-violet-500 to-purple-600",
      hover: "hover:from-violet-600 hover:to-purple-700",
      border: "border-violet-300 hover:border-violet-500",
      selectedBg: "bg-violet-50",
      selectedBorder: "border-violet-500",
      selectedText: "text-violet-900",
      badge: "bg-violet-100 text-violet-700 border-violet-300",
      accent: "violet",
    },
    {
      bg: "bg-gradient-to-r from-emerald-500 to-teal-600",
      hover: "hover:from-emerald-600 hover:to-teal-700",
      border: "border-emerald-300 hover:border-emerald-500",
      selectedBg: "bg-emerald-50",
      selectedBorder: "border-emerald-500",
      selectedText: "text-emerald-900",
      badge: "bg-emerald-100 text-emerald-700 border-emerald-300",
      accent: "emerald",
    },
    {
      bg: "bg-gradient-to-r from-rose-500 to-pink-600",
      hover: "hover:from-rose-600 hover:to-pink-700",
      border: "border-rose-300 hover:border-rose-500",
      selectedBg: "bg-rose-50",
      selectedBorder: "border-rose-500",
      selectedText: "text-rose-900",
      badge: "bg-rose-100 text-rose-700 border-rose-300",
      accent: "rose",
    },
    {
      bg: "bg-gradient-to-r from-amber-500 to-orange-600",
      hover: "hover:from-amber-600 hover:to-orange-700",
      border: "border-amber-300 hover:border-amber-500",
      selectedBg: "bg-amber-50",
      selectedBorder: "border-amber-500",
      selectedText: "text-amber-900",
      badge: "bg-amber-100 text-amber-700 border-amber-300",
      accent: "amber",
    },
    {
      bg: "bg-gradient-to-r from-blue-500 to-cyan-600",
      hover: "hover:from-blue-600 hover:to-cyan-700",
      border: "border-blue-300 hover:border-blue-500",
      selectedBg: "bg-blue-50",
      selectedBorder: "border-blue-500",
      selectedText: "text-blue-900",
      badge: "bg-blue-100 text-blue-700 border-blue-300",
      accent: "blue",
    },
  ];

  const currentTheme =
    categoryThemes[currentQuestion?.category] || categoryThemes["I"];

  const handleAnswer = (actualScore: number) => {
    const newAnswers = { ...answers, [currentQuestion.id]: actualScore };
    setAnswers(newAnswers);
    localStorage.setItem("survey_answers", JSON.stringify(newAnswers));

    const answeredCount = Object.keys(newAnswers).length;
    if (
      answeredCount % 10 === 0 ||
      answeredCount === Math.floor(questions.length / 2)
    ) {
      const randomMessage =
        motivationalMessages[
          Math.floor(Math.random() * motivationalMessages.length)
        ];
      setCurrentMotivation(JSON.stringify(randomMessage));
      setShowMotivation(true);

      setTimeout(() => {
        setShowMotivation(false);
      }, 3500);
    }

    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setIsTransitioning(true);
        setTimeout(() => {
          const nextIndex = currentQuestionIndex + 1;
          setCurrentQuestionIndex(nextIndex);
          localStorage.setItem("survey_index", nextIndex.toString());
          setIsTransitioning(false);
        }, 200);
      } else {
        setShowResult(true);
      }
    }, 300);
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        const prevIndex = currentQuestionIndex - 1;
        setCurrentQuestionIndex(prevIndex);
        localStorage.setItem("survey_index", prevIndex.toString());
        setIsTransitioning(false);
      }, 200);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const unansweredQuestions = questions.filter((q) => !answers[q.id]);
    if (unansweredQuestions.length > 0) {
      alert(
        `Masih ada ${unansweredQuestions.length} pertanyaan yang belum dijawab. Silakan lengkapi terlebih dahulu.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const scores = calculateScores(answers, normsMap);
      const respondent = JSON.parse(localStorage.getItem("respondent") || "{}");

      const payload = {
        name: respondent.name || "Anonymous",
        age: respondent.age || 0,
        status: respondent.status || "Unknown",
        education: respondent.education || null,
        marital_status: respondent.marital_status || null,
        work_period: respondent.work_period || null,
        smoking: respondent.smoking || null,
        problematic_category: scores.totalBinaryFlags,
        score_total: scores.totalBinaryFlags,
        stress_level: scores.stressLevel,
        wfc_index: null,
        stress_index: null,
        score_category: JSON.stringify(scores.perIndicator),
        score_details: JSON.stringify(scores),
        answers: answers,
      };

      const res = await axios.post(`${API_BASE_URL}/respondent`, payload, {
        headers: { "Content-Type": "application/json" },
      });

      if (res.status === 201) {
        const respondentId = res.data.id;
        if (respondentId) {
          localStorage.setItem("respondent_id", respondentId.toString());
          localStorage.removeItem("survey_answers");
          localStorage.removeItem("survey_index");
          navigate("/results");
        } else {
          throw new Error("Respondent ID tidak ditemukan");
        }
      }
    } catch (error: any) {
      console.error("❌ Error saat submit:", error);
      alert(error.response?.data?.message || "Terjadi kesalahan saat menyimpan data skrining.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md mx-auto text-center space-y-6 sm:space-y-8 bg-white p-8 sm:p-12 rounded-3xl shadow-xl border-2 border-gray-200">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto border-3 border-emerald-200 shadow-lg">
            <svg
              className="w-8 h-8 sm:w-10 sm:h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Terima kasih!
            </h2>
            <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
              Anda telah menyelesaikan seluruh{" "}
              <span className="font-semibold text-gray-900 bg-purple-100 px-2 py-1 rounded-full">
                {questions.length}
              </span>{" "}
              pertanyaan dengan baik.
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:cursor-not-allowed text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transform hover:scale-105"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Menyimpan Hasil...
              </>
            ) : (
              "Lihat Hasil Skrining"
            )}
          </button>
        </div>
      </div>
    );
  }

  let motivationData = { text: "", emoji: "", color: "" };
  try {
    if (currentMotivation) {
      motivationData = JSON.parse(currentMotivation);
    }
  } catch (e) {
    console.error("Error parsing motivation:", e);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 flex flex-col">
      {showMotivation && motivationData.text && (
        <div className="fixed top-20 sm:top-24 left-1/2 transform -translate-x-1/2 z-50 px-4 w-full max-w-md">
          <div
            className={`animate-bounce bg-gradient-to-r ${motivationData.color} text-white px-6 py-4 rounded-2xl shadow-2xl border-2 border-white/40`}
          >
            <div className="flex items-center gap-3">
              <div className="text-3xl">{motivationData.emoji}</div>
              <div className="flex-1">
                <p className="font-bold text-sm sm:text-base leading-tight">
                  {motivationData.text}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`bg-gradient-to-r ${currentTheme.primary} shadow-lg flex-shrink-0`}>
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="text-center space-y-3">
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Skrining Stres Kerja
            </h1>

            <div className="flex items-center justify-center gap-3 text-sm text-white/90 font-medium">
              <span>
                Pertanyaan {currentQuestionIndex + 1} dari {questions.length}
              </span>
              <span>•</span>
              <span>{progress}% selesai</span>
            </div>

            <div className="w-full max-w-md mx-auto">
              <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden border border-white/30">
                <div
                  className="bg-white h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col justify-between">
          <div
            className={`transition-all duration-300 ${
              isTransitioning
                ? "opacity-0 transform translate-y-2"
                : "opacity-100 transform translate-y-0"
            }`}
          >
            {/* Instruksi Kategori */}
            <div className={`${currentTheme.bg} border-2 ${currentTheme.border} rounded-2xl p-4 sm:p-5 shadow-sm mb-6`}>
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 ${currentTheme.icon} text-white rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold`}
                >
                  {currentQuestion?.category}
                </div>
                <div>
                  <h3 className={`font-bold ${currentTheme.text} text-sm sm:text-base`}>
                    Bagian {currentQuestion?.category}
                  </h3>
                  <p className={`${currentTheme.text} text-xs sm:text-sm mt-1 leading-relaxed`}>
                    {category?.instruction}
                  </p>
                </div>
              </div>
            </div>

            {/* Pertanyaan */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-gray-100 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                  No. {currentQuestion?.id} (Kode: {currentQuestion?.code})
                </span>
                <span className="text-xs text-gray-500">
                  {currentQuestion?.indicator}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 leading-relaxed">
                {currentQuestion?.text}
              </h2>
            </div>

            {/* Pilihan Jawaban */}
            <div className="space-y-3">
              {(category?.options ?? []).map((optionText, optIndex) => {
                const colorTheme = answerColors[optIndex % answerColors.length];
                const actualScore = currentQuestion?.scores[optIndex] ?? (optIndex + 1);
                const isSelected = answers[currentQuestion?.id] === actualScore;

                return (
                  <button
                    key={`${currentQuestion?.id}-${optIndex}`}
                    onClick={() => handleAnswer(actualScore)}
                    className={`w-full p-4 sm:p-5 rounded-xl border-2 text-left transition-all duration-200 group flex items-center justify-between shadow-sm hover:shadow-md ${
                      isSelected
                        ? `${colorTheme.selectedBg} ${colorTheme.selectedBorder} ${colorTheme.selectedText}`
                        : `bg-white hover:bg-slate-50 border-gray-200 text-gray-800`
                    }`}
                  >
                    <span className="font-medium text-sm sm:text-base">
                      {optionText}
                    </span>
                    {isSelected && (
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${colorTheme.badge}`}>
                        Dipilih
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigasi Bawah */}
          <div className="flex items-center justify-between pt-8 border-t border-gray-200 mt-8">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                currentQuestionIndex === 0
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 shadow-sm"
              }`}
            >
              ← Sebelumnya
            </button>

            <span className="text-xs text-gray-500">
              Pilih jawaban untuk lanjut otomatis
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
