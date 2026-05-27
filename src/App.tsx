/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useCallback } from 'react';
import { 
  Camera, 
  Upload, 
  History, 
  User, 
  Car, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Loader2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import ReactMarkdown from 'react-markdown';

interface Damage {
  type: string;
  severity: 'Baixa' | 'Média' | 'Alta';
  estimatedCost: string;
  explanation: string;
  location: string;
}

interface AnalysisResult {
  vehicleModel?: string;
  damages: Damage[];
  totalEstimatedCost: string;
  overallSeverity: 'Baixa' | 'Média' | 'Alta';
  recommendation: string;
}

const DEMO_CAR_IMAGES = [
  {
    name: "Arranhão Lateral",
    url: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&q=80&w=600",
    description: "Arranhões e riscos na lataria lateral"
  },
  {
    name: "Amassado Leve",
    url: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=600",
    description: "Amassados para funilaria"
  },
  {
    name: "Danos Frontais",
    url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=600",
    description: "Para-choque ou faróis danificados"
  }
];

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showCamera, setShowCamera] = useState(false);

  const selectDemoImage = (url: string) => {
    setImage(url);
    setResult(null);
    setError(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      setShowCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError("Não foi possível acessar a câmera. Verifique as permissões.");
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setImage(dataUrl);
      
      // Stop camera
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setShowCamera(false);
      setResult(null);
      setError(null);
    }
  };

  const analyzeImage = async () => {
    if (!image) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze-damage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ imageBase64: image })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro no servidor ao processar análise.");
      }

      const parsedResult = await response.json();
      setResult(parsedResult);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocorreu um erro ao analisar a imagem. Tente novamente.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Baixa': return 'text-green-600 bg-green-50 border-green-100';
      case 'Média': return 'text-yellow-600 bg-yellow-50 border-yellow-100';
      case 'Alta': return 'text-red-600 bg-red-50 border-red-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Car className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              DamageScan <span className="text-blue-600">Auto</span>
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#" className="text-sm font-medium text-blue-600">Nova Vistoria</a>
            <a href="#" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">Histórico</a>
          </nav>

          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <History className="w-5 h-5" />
            </button>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 transition-all shadow-md active:scale-95">
              Entrar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Content */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1]">
                Inteligentes com <br />
                <span className="text-blue-600">Estimativa de Custo.</span>
              </h1>
              <p className="text-lg text-slate-500 max-w-md leading-relaxed">
                Identifique danos automaticamente e receba uma estimativa instantânea de reparo baseada no mercado brasileiro.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <button 
                onClick={startCamera}
                className="flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95"
              >
                <Camera className="w-5 h-5" />
                Tirar Foto
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-white border border-slate-200 px-8 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
              >
                <Upload className="w-5 h-5" />
                Upload Imagem
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileUpload}
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-8">
              {[
                { label: 'VISTORIAS', value: '0', icon: <History className="w-4 h-4" /> },
                { label: 'PRECISÃO', value: '98%', icon: <ShieldCheck className="w-4 h-4" /> },
                { label: 'IA', value: 'GEMINI 3', icon: <Zap className="w-4 h-4" /> },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="text-blue-600 mb-1">{stat.icon}</div>
                  <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                  <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Demo vehicle section */}
            <div className="pt-8 border-t border-slate-200 mt-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Testar com Veículos de Exemplo</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Não tem uma foto de carro danificado em mãos? Escolha um dos exemplos reais de avarias abaixo para testar instantaneamente a vistoria inteligente:
              </p>
              <div className="grid grid-cols-3 gap-3">
                {DEMO_CAR_IMAGES.map((demo, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectDemoImage(demo.url)}
                    className={cn(
                      "group text-left bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm hover:border-blue-400 transition-all duration-300 relative aspect-[4/3] flex flex-col justify-end p-2",
                      image === demo.url && "ring-2 ring-blue-500 border-transparent shadow-md"
                    )}
                  >
                    <img
                      src={demo.url}
                      alt={demo.name}
                      className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent" />
                    <div className="relative z-10">
                      <p className="text-[10px] font-bold text-white leading-tight uppercase tracking-wider truncate">
                        {demo.name}
                      </p>
                      <p className="text-[8px] text-slate-300 leading-tight truncate">
                        {demo.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Content - Image/Camera Area */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-white relative overflow-hidden">
              <div className={cn(
                "aspect-[4/3] rounded-[1.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden transition-all",
                image ? "border-none" : "hover:border-blue-300 hover:bg-blue-50/30"
              )}>
                {showCamera ? (
                  <div className="absolute inset-0 bg-black">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      className="w-full h-full object-cover"
                    />
                    <button 
                      onClick={capturePhoto}
                      className="absolute bottom-6 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full border-4 border-slate-300 flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                    >
                      <div className="w-12 h-12 bg-blue-600 rounded-full" />
                    </button>
                    <button 
                      onClick={() => setShowCamera(false)}
                      className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>
                ) : image ? (
                  <img src={image} alt="Veículo" className="w-full h-full object-cover" />
                ) : (
                  <div 
                    className="relative w-full h-full group cursor-pointer overflow-hidden"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {/* Modern Illustrative Background */}
                    <div className="absolute inset-0 bg-slate-900">
                      <img 
                        src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1000" 
                        alt="Carro Exemplo" 
                        className="w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                    </div>

                    {/* Tech Overlays */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-10">
                      <motion.div 
                        animate={{ 
                          scale: [1, 1.1, 1],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="absolute w-48 h-48 border border-blue-500/30 rounded-full"
                      />
                      <motion.div 
                        animate={{ 
                          rotate: 360 
                        }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute w-64 h-64 border-t-2 border-l-2 border-blue-500/20 rounded-full"
                      />
                      
                      {/* Scanning Line */}
                      <motion.div 
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_15px_rgba(96,165,250,0.5)] z-20"
                      />

                      <div className="relative z-30">
                        <div className="w-20 h-20 bg-blue-600/20 backdrop-blur-xl rounded-3xl flex items-center justify-center mx-auto mb-6 border border-blue-400/30 shadow-2xl shadow-blue-500/20 group-hover:bg-blue-600/30 transition-colors">
                          <Upload className="text-blue-400 w-10 h-10" />
                        </div>
                        <h3 className="text-white text-2xl font-bold mb-2 tracking-tight">Pronto para Analisar</h3>
                        <p className="text-slate-300 text-sm max-w-[200px] mx-auto leading-relaxed">
                          Arraste ou clique para enviar a foto do seu veículo
                        </p>
                        <div className="mt-6 flex items-center justify-center gap-2">
                          <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-widest border border-white/10">AI Scanning</span>
                          <span className="px-3 py-1 bg-blue-600/20 backdrop-blur-md rounded-full text-[10px] font-bold text-blue-400 uppercase tracking-widest border border-blue-500/20">HD Quality</span>
                        </div>
                      </div>
                    </div>

                    {/* Corner Accents */}
                    <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-blue-500/50 rounded-tl-lg" />
                    <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-blue-500/50 rounded-tr-lg" />
                    <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-blue-500/50 rounded-bl-lg" />
                    <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-blue-500/50 rounded-br-lg" />
                  </div>
                )}
              </div>

              {image && !isAnalyzing && !result && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6"
                >
                  <button 
                    onClick={analyzeImage}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-[0.98]"
                  >
                    Analisar Danos
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </motion.div>
              )}

              {isAnalyzing && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                  <p className="text-slate-900 font-bold text-lg">Analisando veículo...</p>
                  <p className="text-slate-500 text-sm">Identificando danos e custos</p>
                </div>
              )}
            </div>

            {/* Floating Badge */}
            <div className="absolute -top-4 -right-4 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 animate-bounce">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="text-green-600 w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                <p className="text-sm font-bold text-slate-900">Pronto para análise</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Results Section */}
        <AnimatePresence>
          {result && (
            <motion.section 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-24 space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-slate-900">Relatório de Danos</h2>
                  <p className="text-slate-500 flex items-center gap-2">
                    <Car className="w-4 h-4" />
                    {result.vehicleModel || 'Veículo Identificado'}
                  </p>
                </div>
                <div className="bg-blue-600 text-white p-6 rounded-3xl shadow-xl shadow-blue-100 flex items-center gap-6">
                  <div>
                    <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-1">Total Estimado</p>
                    <p className="text-3xl font-black">{result.totalEstimatedCost}</p>
                  </div>
                  <div className="w-px h-12 bg-blue-500/50" />
                  <div>
                    <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-1">Severidade Geral</p>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold",
                      result.overallSeverity === 'Baixa' ? "bg-green-400 text-green-900" :
                      result.overallSeverity === 'Média' ? "bg-yellow-400 text-yellow-900" :
                      "bg-red-400 text-red-900"
                    )}>
                      {result.overallSeverity}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {result.damages.map((damage, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={cn("px-3 py-1 rounded-lg text-xs font-bold border", getSeverityColor(damage.severity))}>
                        {damage.severity}
                      </div>
                      <div className="text-slate-400 group-hover:text-blue-600 transition-colors">
                        <Info className="w-5 h-5" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">{damage.type}</h3>
                    <p className="text-sm text-slate-400 font-medium mb-4 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {damage.location}
                    </p>
                    <p className="text-slate-600 text-sm leading-relaxed mb-6">
                      {damage.explanation}
                    </p>
                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Custo de Reparo</span>
                      <span className="text-lg font-bold text-blue-600">{damage.estimatedCost}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div className="flex-1 space-y-2 text-center md:text-left">
                  <h4 className="text-xl font-bold">Recomendação do Sistema</h4>
                  <p className="text-slate-400 leading-relaxed">
                    {result.recommendation}
                  </p>
                </div>
                <button className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-bold hover:bg-slate-100 transition-all active:scale-95 whitespace-nowrap">
                  Agendar Reparo
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3"
          >
            <AlertTriangle className="w-5 h-5" />
            <p className="font-medium">{error}</p>
          </motion.div>
        )}
      </main>

      <footer className="mt-24 border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
              <Car className="text-slate-400 w-5 h-5" />
            </div>
            <span className="text-lg font-bold text-slate-400">
              DamageScan <span className="text-slate-300">Auto</span>
            </span>
          </div>
          <p className="text-slate-400 text-sm">
            © 2024 DamageScan Auto. Todos os direitos reservados.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors">Privacidade</a>
            <a href="#" className="text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors">Termos</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
