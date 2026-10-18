// LandingPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Stethoscope,
  User,
  ArrowRight,
  CheckCircle,
  Star,
  Heart,
  Lock,
  UserCircle,
} from "lucide-react";
import axios from "axios";
// Import gambar - pastikan path benar
import Female from "../assets/Female.png";
import { API_BASE_URL } from "../config/api";
import { questions } from "../data/questions";
import { categories } from "../data/categories";

export default function LandingPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/doctor/login`, {
        username,
        password,
      });

      if (res.data.success) {
        localStorage.setItem("doctor_token", res.data.token);
        window.location.href = "/dashboard";
      } else {
        alert("Username atau password salah");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat login");
    }
  };

  // Cek progress survey
  useEffect(() => {
    const savedAnswers = localStorage.getItem("survey_answers");
    const savedIndex = localStorage.getItem("survey_index");

    if (savedAnswers && savedIndex) {
      setShowResumeModal(true);
    }
  }, []);

  const handleResume = () => {
    setShowResumeModal(false);
    navigate("/questionnaire");
  };

  const handleRestart = () => {
    localStorage.clear();
    setShowResumeModal(false);
    navigate("/form");
  };

  const startSurvey = () => {
    navigate("/form");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center shadow-lg">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800">
                DINI <span className="text-blue-600">Sehat Mental</span>
              </h1>
            </div>
          </div>

          {/* Login Button */}
          <button
            onClick={() => setShowLoginModal(true)}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-medium hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Login Dokter</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-8 md:py-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
                <CheckCircle className="h-4 w-4" />
                Platform Skrining Stres Kerja
              </div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-800 leading-tight">
                Digital Interactive{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">
                  Normalization
                </span>{" "}
                Intervention
              </h2>

              <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                Instrumen skrining stres kerja komprehensif yang meliputi
                stresor, gejala, transaksional dan peran ganda untuk pekerja
                perempuan berbasis digital.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">
                  {questions.length}
                </div>
                <div className="text-xs md:text-sm text-slate-600">
                  Pertanyaan
                </div>
              </div>
              <div className="text-center p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="text-2xl md:text-3xl font-bold text-green-600 mb-1">
                  {Object.keys(categories).length}
                </div>
                <div className="text-xs md:text-sm text-slate-600">
                  Kategori
                </div>
              </div>
              <div className="text-center p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-1">
                  3
                </div>
                <div className="text-xs md:text-sm text-slate-600">
                  Level Analisis
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-4">
              <button
                onClick={startSurvey}
                className="group inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <User className="h-5 w-5" />
                Mulai Skrinning Sekarang
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="text-sm text-slate-500 mt-3">
                ✨ Tanpa perlu login
              </p>
            </div>
          </div>

          {/* Right Content - Visual */}
          <div className="relative">
            {/* Main Illustration Card */}
            <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">
              {/* Doctor Illustration - FIXED */}
              <div className="w-full aspect-square bg-gradient-to-br from-blue-100 to-teal-100 rounded-2xl flex items-center justify-center mb-6 relative overflow-hidden">
                {!imageError ? (
                  <img
                    src={Female}
                    alt="Female Doctor Illustration"
                    className="w-full h-full object-contain p-4 animate-float"
                    onError={() => {
                      console.error("Failed to load image:", Female);
                      setImageError(true);
                    }}
                  />
                ) : (
                  // Fallback jika gambar gagal dimuat
                  <div className="flex flex-col items-center justify-center text-center p-8">
                    <UserCircle className="h-32 w-32 text-blue-400 mb-4" />
                    <p className="text-slate-600 text-sm">Ilustrasi Dokter</p>
                  </div>
                )}

                {/* Floating elements */}
                <div className="absolute top-6 left-6 w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                <div className="absolute top-12 right-8 w-2 h-2 bg-green-400 rounded-full animate-pulse delay-300"></div>
                <div className="absolute bottom-8 left-12 w-4 h-4 bg-purple-400 rounded-full animate-pulse delay-700"></div>
              </div>

              {/* Feature Cards */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                  <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-800 text-sm">
                      Skrinning Stres Kerja
                    </div>
                    <div className="text-xs text-slate-600">
                      Evaluasi tingkat stres kerja
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                  <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Star className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-800 text-sm">
                      Analisis Real-time
                    </div>
                    <div className="text-xs text-slate-600">
                      Hasil instan setelah pengisian
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                  <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Heart className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-800 text-sm">
                      Khusus pekerja perempuan
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating decorative elements */}
            <div className="absolute -top-6 -left-6 w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full opacity-10 animate-pulse"></div>
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-to-br from-teal-400 to-green-500 rounded-full opacity-10 animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 -left-4 w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full opacity-20 animate-bounce"></div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center">
        <p className="text-slate-500 text-sm">
          © 2025 DINI Sehat Mental. Platform Skrining Stres Kerja untuk pekerja
          perempuan
        </p>
      </footer>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 transform transition-all">
            <div className="text-center mb-6">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                Login Dokter
              </h3>
              <p className="text-slate-600 text-sm">
                Masuk ke dashboard untuk melihat hasil survey responden
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masukkan username"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masukkan password"
                  required
                />
              </div>
              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="w-full border border-slate-200 text-slate-600 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resume Survey Modal */}
      {showResumeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 transform transition-all">
            <div className="text-center mb-6">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                Lanjutkan Survey?
              </h3>
              <p className="text-slate-600">
                Kami mendeteksi survey yang belum selesai. Apakah Anda ingin
                melanjutkan atau memulai baru?
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleResume}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Lanjutkan Survey
              </button>
              <button
                onClick={handleRestart}
                className="w-full border border-slate-200 text-slate-600 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
              >
                Mulai Baru
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
