/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Camera, Film, Copy, Check, Loader2, Wand2, Info, ChevronDown, ChevronUp, Clapperboard } from "lucide-react";

const SYSTEM_INSTRUCTION = `Você é um Diretor de Fotografia e Especialista em Prompts para IA de Vídeo (como Veo, Sora, Runway, Luma e Kling). Sua função é transformar ideias simples dos usuários em prompts de vídeo em inglês, que sejam altamente detalhados e com rigor técnico cinematográfico.

Para cada ideia recebida, você deve estruturar o prompt final considerando os seguintes elementos, misturados de forma fluida em um único parágrafo:

Subject & Action: O sujeito principal, suas características físicas e a ação exata que está executando.
Environment & Production Design: O cenário, os detalhes do fundo e a paleta de cores.
Lighting & Atmosphere: O esquema de luz (ex: volumetric lighting, golden hour, neon practical lights, chiaroscuro) e a atmosfera emocional da cena.
Camera Movement & Angle: Movimentos precisos da câmera (ex: slow pan, fast whip pan, steady tracking shot, low angle, drone shot).
Camera & Lens Specs: Especificações do equipamento simulado para dar textura (ex: shot on ARRI Alexa 65, 35mm lens, anamorphic, shallow depth of field, motion blur).

Entregue apenas o texto do prompt final em inglês, otimizado para a geração do vídeo, sem explicações adicionais.`;

const PRESETS = {
  subject: [
    { label: 'Human', value: 'Human' },
    { label: 'Robot', value: 'Robot/Android' },
    { label: 'Creature', value: 'Mythical Creature' },
    { label: 'Vehicle', value: 'Futuristic Vehicle' },
    { label: 'Landscape', value: 'Vast Landscape' },
  ],
  action: [
    { label: 'Walking', value: 'Walking slowly' },
    { label: 'Running', value: 'Running intensely' },
    { label: 'Fighting', value: 'Engaged in combat' },
    { label: 'Flying', value: 'Soaring through the air' },
    { label: 'Floating', value: 'Floating in zero gravity' },
    { label: 'Exploding', value: 'Exploding/Disintegrating' },
  ],
  environment: [
    { label: 'Cyberpunk', value: 'Cyberpunk Neon City' },
    { label: 'Forest', value: 'Ancient Misty Forest' },
    { label: 'Space', value: 'Deep Space Nebula' },
    { label: 'Desert', value: 'Post-apocalyptic Desert' },
    { label: 'Victorian', value: 'Gothic Victorian Room' },
    { label: 'Underwater', value: 'Abyssal Underwater' },
  ],
  timeOfDay: [
    { label: 'Dawn', value: 'Dawn/Sunrise' },
    { label: 'High Noon', value: 'High Noon' },
    { label: 'Golden Hour', value: 'Golden Hour' },
    { label: 'Blue Hour', value: 'Blue Hour' },
    { label: 'Midnight', value: 'Midnight' },
    { label: 'Twilight', value: 'Twilight' },
  ],
  weather: [
    { label: 'Clear', value: 'Clear Sky' },
    { label: 'Rain', value: 'Heavy Rain' },
    { label: 'Fog', value: 'Thick Fog' },
    { label: 'Snow', value: 'Snowing' },
    { label: 'Dust', value: 'Dust Storm' },
    { label: 'Thunder', value: 'Thunderstorm' },
  ],
  colorPalette: [
    { label: 'Teal & Orange', value: 'Teal and Orange' },
    { label: 'Monochrome', value: 'Monochrome/B&W' },
    { label: 'Vibrant', value: 'Vibrant Neon' },
    { label: 'Pastel', value: 'Pastel Tones' },
    { label: 'Sepia', value: 'Sepia/Vintage' },
    { label: 'High Sat', value: 'High Saturation' },
  ],
  lighting: [
    { 
      label: 'Golden Hour', 
      value: 'Golden Hour (Aconchego e Realidade, Dia a dia e Vlogs)',
      feeling: 'Aconchego e Realidade',
      application: 'Dia a dia e Vlogs'
    },
    { 
      label: 'Estúdio Suave', 
      value: 'Soft Studio Lighting (Clareza e Confiança, Informação e Tutoriais)',
      feeling: 'Clareza e Confiança',
      application: 'Informação e Tutoriais'
    },
    { 
      label: 'Neon / Bi-Color', 
      value: 'Neon Practical Lights (Energia e Inovação, Entretenimento e Tech)',
      feeling: 'Energia e Inovação',
      application: 'Entretenimento e Tech'
    },
    { 
      label: 'Dramática', 
      value: 'High-contrast Chiaroscuro (Seriedade e Elegância, Narrativas e Luxo)',
      feeling: 'Seriedade e Elegância',
      application: 'Narrativas e Luxo'
    },
    { 
      label: 'Volumétrica', 
      value: 'Volumetric God Rays (Inspiração e Épico, Motivacional)',
      feeling: 'Inspiração e Épico',
      application: 'Motivacional'
    },
  ],
  camera: [
    { label: 'Low Angle', value: 'Low Angle' },
    { label: 'High Angle', value: 'High Angle' },
    { label: 'Eye-Level', value: 'Eye-Level Shot' },
    { label: 'Bird\'s Eye', value: 'Bird\'s Eye View' },
    { label: 'Close-up', value: 'Close-up Shot' },
    { label: 'Medium Shot', value: 'Medium Shot' },
    { label: 'Wide Shot', value: 'Wide Shot' },
    { label: 'Over Shoulder', value: 'Over-the-shoulder Shot' },
    { label: 'Drone', value: 'Aerial Drone Shot' },
  ],
  composition: [
    { label: 'Rule of Thirds', value: 'Rule of Thirds composition' },
    { label: 'Symmetrical', value: 'Perfectly Symmetrical composition' },
    { label: 'Leading Lines', value: 'Strong Leading Lines' },
    { label: 'Dutch Angle', value: 'Dutch Angle/Canted Frame' },
    { label: 'Golden Ratio', value: 'Golden Ratio composition' },
    { label: 'Centered', value: 'Dead-center framing' },
  ],
  movement: [
    { label: 'Static', value: 'Static Shot' },
    { label: 'Handheld', value: 'Handheld/Shaky Cam' },
    { label: 'Zoom Out', value: 'Zoom Out' },
    { label: 'Zoom In', value: 'Zoom In' },
    { label: 'Follow', value: 'Camera follows the subject' },
    { label: 'Pan Left', value: 'Pan Left' },
    { label: 'Pan Right', value: 'Pan Right' },
    { label: 'Tilt Up', value: 'Tilt Up' },
    { label: 'Tilt Down', value: 'Tilt Down' },
    { label: 'Orbit', value: 'Orbit around the subject' },
    { label: 'Dolly In', value: 'Dolly In' },
    { label: 'Dolly Out', value: 'Dolly Out' },
    { label: 'Jib Up', value: 'Jib Up' },
    { label: 'Jib Down', value: 'Jib Down' },
    { label: 'Drone', value: 'Aerial Drone Shot' },
    { label: 'Dolly Left', value: 'Dolly Left' },
    { label: 'Dolly Right', value: 'Dolly Right' },
    { label: '360 Roll', value: '360-degree Roll' },
  ],
  lens: [
    { label: 'Anamorphic', value: 'Anamorphic Lens' },
    { label: '35mm', value: '35mm Vintage' },
    { label: '50mm', value: '50mm Prime' },
    { label: 'Macro', value: 'Macro Lens' },
    { label: 'Fish-eye', value: 'Fish-eye Distortion' },
    { label: 'IMAX', value: 'IMAX 70mm' },
  ],
  style: [
    { 
      label: 'Cinematic', 
      value: 'Cinematic Style (Brand Awareness, Inspiração e Qualidade)',
      objective: 'Brand Awareness',
      feeling: 'Inspiração e Qualidade'
    },
    { 
      label: 'UGC / Handheld', 
      value: 'UGC / Handheld Style (Vendas / Engajamento, Confiança e Proximidade)',
      objective: 'Vendas / Engajamento',
      feeling: 'Confiança e Proximidade'
    },
    { 
      label: 'Stop Motion', 
      value: 'Stop Motion Style (Viralização, Criatividade e Curiosidade)',
      objective: 'Viralização',
      feeling: 'Criatividade e Curiosidade'
    },
    { 
      label: 'Lo-Fi / Retrô', 
      value: 'Lo-Fi / Retrô Style (Identidade Visual, Emoção e Estilo)',
      objective: 'Identidade Visual',
      feeling: 'Emoção e Estilo'
    },
  ]
};

const MovementAnimation = ({ type }: { type: string }) => {
  const cameraVariants = {
    'Static Shot': {
      animate: {}
    },
    'Handheld/Shaky Cam': {
      animate: {
        x: [0, -1, 1, -0.5, 0.5, 0],
        y: [0, 0.5, -0.5, 1, -1, 0],
        transition: { repeat: Infinity, duration: 2 }
      }
    },
    'Zoom Out': {
      animate: { scale: [1.5, 0.8, 1.5], transition: { repeat: Infinity, duration: 3, ease: "easeInOut" } }
    },
    'Zoom In': {
      animate: { scale: [0.8, 1.5, 0.8], transition: { repeat: Infinity, duration: 3, ease: "easeInOut" } }
    },
    'Camera follows the subject': {
      animate: { 
        x: [-10, 10, -10], 
        transition: { repeat: Infinity, duration: 4, ease: "easeInOut" } 
      }
    },
    'Pan Left': {
      animate: { x: [-15, 15, -15], transition: { repeat: Infinity, duration: 3, ease: "easeInOut" } }
    },
    'Pan Right': {
      animate: { x: [15, -15, 15], transition: { repeat: Infinity, duration: 3, ease: "easeInOut" } }
    },
    'Tilt Up': {
      animate: { y: [15, -15, 15], transition: { repeat: Infinity, duration: 3, ease: "easeInOut" } }
    },
    'Tilt Down': {
      animate: { y: [-15, 15, -15], transition: { repeat: Infinity, duration: 3, ease: "easeInOut" } }
    },
    'Orbit around the subject': {
      animate: { 
        x: [15, 0, -15, 0, 15],
        scale: [0.9, 1.1, 0.9, 0.7, 0.9],
        transition: { repeat: Infinity, duration: 4, ease: "linear" }
      }
    },
    'Dolly In': {
      animate: { scale: [0.8, 1.4, 0.8], transition: { repeat: Infinity, duration: 3 } }
    },
    'Dolly Out': {
      animate: { scale: [1.4, 0.8, 1.4], transition: { repeat: Infinity, duration: 3 } }
    },
    'Jib Up': {
      animate: { y: [15, -15, 15], scale: [1, 0.9, 1], transition: { repeat: Infinity, duration: 4 } }
    },
    'Jib Down': {
      animate: { y: [-15, 15, -15], scale: [0.9, 1, 0.9], transition: { repeat: Infinity, duration: 4 } }
    },
    'Aerial Drone Shot': {
      animate: { 
        x: [-15, 15, -15],
        y: [-10, 10, -10],
        scale: [0.7, 1, 0.7],
        rotate: [-5, 5, -5],
        transition: { repeat: Infinity, duration: 6 }
      }
    },
    'Dolly Left': {
      animate: { x: [20, -20, 20], transition: { repeat: Infinity, duration: 3 } }
    },
    'Dolly Right': {
      animate: { x: [-20, 20, -20], transition: { repeat: Infinity, duration: 3 } }
    },
    '360-degree Roll': {
      animate: { rotate: [0, 360], transition: { repeat: Infinity, duration: 5, ease: "linear" } }
    }
  };

  const animation = cameraVariants[type as keyof typeof cameraVariants] || {};

  return (
    <div className="w-14 h-14 flex items-center justify-center bg-[#0a0a0a] rounded-lg overflow-hidden mb-2 border border-white/10 relative perspective-500">
      {/* Moving City Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 flex justify-around px-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-[1px] h-full bg-white/20 relative overflow-hidden">
              <motion.div 
                className="absolute top-[-10px] left-0 w-full h-3 bg-white/60 rounded-full"
                animate={{ y: [0, 60] }}
                transition={{ repeat: Infinity, duration: 0.8 + i * 0.3, ease: "linear" }}
              />
              <motion.div 
                className="absolute top-[-30px] left-0 w-full h-3 bg-red-500/40 rounded-full"
                animate={{ y: [0, 60] }}
                transition={{ repeat: Infinity, duration: 1 + i * 0.2, ease: "linear", delay: 0.4 }}
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Character Container (Camera) */}
      <motion.div 
        className="relative z-10 flex flex-col items-center"
        {...animation}
      >
        {/* Smoke Effect */}
        <motion.div 
          className="absolute -top-1 -right-1 w-1 h-1 bg-white/40 rounded-full blur-[1px]"
          animate={{ y: [0, -12], x: [0, 3], opacity: [0, 1, 0], scale: [1, 4] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
        />
        
        {/* Head */}
        <div className="w-4 h-4 bg-[#8E9299] rounded-full relative shadow-lg">
          {/* Sunglasses */}
          <div className="absolute top-1.5 left-0 w-full h-1 bg-black rounded-full" />
          {/* Beard */}
          <div className="absolute bottom-[-2px] left-0 w-full h-3 bg-white rounded-b-full" />
        </div>
        
        {/* Body */}
        <div className="w-5 h-6 bg-black rounded-t-md mt-0.5 relative">
          {/* Backpack Straps */}
          <div className="absolute top-0 left-1 w-[1px] h-full bg-blue-500/40" />
          <div className="absolute top-0 right-1 w-[1px] h-full bg-blue-500/40" />
        </div>
        
        {/* Skateboard (Yellow) */}
        <div className="w-7 h-1.5 bg-yellow-400 rounded-full mt-0.5 rotate-[12deg] shadow-md flex items-center justify-around px-1">
          <div className="w-1 h-1 bg-green-500 rounded-full" />
          <div className="w-1 h-1 bg-green-500 rounded-full" />
        </div>
      </motion.div>
    </div>
  );
};

const CompositionPreview = ({ type }: { type: string }) => {
  const images: Record<string, string> = {
    'Rule of Thirds composition': '/images/comp_1.png',
    'Perfectly Symmetrical composition': '/images/comp_2.png',
    'Strong Leading Lines': '/images/comp_3.png',
    'Dutch Angle/Canted Frame': '/images/comp_4.png',
    'Golden Ratio composition': '/images/comp_5.png',
    'Dead-center framing': '/images/comp_6.png',
  };

  const imageUrl = images[type];

  return (
    <div className="w-14 h-14 border border-white/10 rounded-md mb-2 relative overflow-hidden bg-[#111]">
      {imageUrl && (
        <img 
          src={imageUrl} 
          alt={type} 
          className="w-full h-full object-cover opacity-60" 
          referrerPolicy="no-referrer"
        />
      )}
      
      {/* Overlay Guides */}
      {type === 'Rule of Thirds composition' && (
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
          <div className="border-r border-b border-white/40" />
          <div className="border-r border-b border-white/40" />
          <div className="border-b border-white/40" />
          <div className="border-r border-b border-white/40" />
          <div className="border-r border-b border-white/40" />
          <div className="border-b border-white/40" />
        </div>
      )}
      {type === 'Perfectly Symmetrical composition' && (
        <div className="absolute inset-y-0 left-1/2 w-[1px] bg-white/60 pointer-events-none" />
      )}
      {type === 'Strong Leading Lines' && (
        <svg className="absolute inset-0 w-full h-full text-white/40 pointer-events-none" viewBox="0 0 40 40">
          <line x1="0" y1="40" x2="20" y2="20" stroke="currentColor" strokeWidth="1" />
          <line x1="40" y1="40" x2="20" y2="20" stroke="currentColor" strokeWidth="1" />
        </svg>
      )}
      {type === 'Golden Ratio composition' && (
        <svg className="absolute inset-0 w-full h-full text-white/60 pointer-events-none" viewBox="0 0 40 40" fill="none">
          <path d="M40 40C40 17.9086 22.0914 0 0 0" stroke="currentColor" strokeWidth="1" />
          <rect x="0" y="0" width="24.7" height="40" stroke="currentColor" strokeWidth="0.5" />
        </svg>
      )}
      {type === 'Dead-center framing' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-6 h-6 border border-white/40 rounded-full" />
          <div className="absolute w-full h-[1px] bg-white/20" />
          <div className="absolute h-full w-[1px] bg-white/20" />
        </div>
      )}
    </div>
  );
};

const CameraPreview = ({ type }: { type: string }) => {
  const images: Record<string, string> = {
    'Low Angle': '/images/cam_1.png',
    'High Angle': '/images/cam_2.png',
    'Eye-Level Shot': '/images/cam_3.png',
    'Bird\'s Eye View': '/images/cam_4.png',
    'Close-up Shot': '/images/cam_5.png',
    'Medium Shot': '/images/cam_6.png',
    'Wide Shot': '/images/cam_7.png',
    'Over-the-shoulder Shot': '/images/cam_8.png',
    'Aerial Drone Shot': '/images/cam_9.png',
  };

  const imageUrl = images[type];

  return (
    <div className="w-14 h-14 border border-white/10 rounded-md mb-2 relative overflow-hidden bg-[#111]">
      {imageUrl && (
        <img 
          src={imageUrl} 
          alt={type} 
          className="w-full h-full object-cover" 
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );
};

const LightingPreview = ({ type }: { type: string }) => {
  const images: Record<string, string> = {
    'Golden Hour (Aconchego e Realidade, Dia a dia e Vlogs)': '/images/light_1.png',
    'Soft Studio Lighting (Clareza e Confiança, Informação e Tutoriais)': '/images/light_2.png',
    'High-contrast Chiaroscuro (Seriedade e Elegância, Narrativas e Luxo)': '/images/light_3.png',
    'Neon Practical Lights (Energia e Inovação, Entretenimento e Tech)': '/images/light_4.png',
    'Volumetric God Rays (Inspiração e Épico, Motivacional)': '/images/light_5.png',
  };

  const imageUrl = images[type];

  return (
    <div className="w-14 h-14 border border-white/10 rounded-md mb-2 relative overflow-hidden bg-[#111]">
      {imageUrl && (
        <img 
          src={imageUrl} 
          alt={type} 
          className="w-full h-full object-cover" 
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );
};

export default function App() {
  const [subjectInput, setSubjectInput] = useState('');
  const [actionInput, setActionInput] = useState('');
  const [detailsInput, setDetailsInput] = useState('');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('16:9');
  const [selections, setSelections] = useState({
    subject: '',
    action: '',
    environment: '',
    timeOfDay: '',
    weather: '',
    colorPalette: '',
    lighting: '',
    camera: '',
    composition: '',
    movement: '',
    lens: '',
    style: ''
  });
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'found' | 'missing'>('checking');
  const resultRef = useRef<HTMLDivElement>(null);

  // Verifica a chave ao carregar a página
  useState(() => {
    const key = (import.meta.env as any)?.VITE_GEMINI_API_KEY || 
                (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '');
    if (key && key !== 'undefined' && key !== '') {
      setApiKeyStatus('found');
    } else {
      setApiKeyStatus('missing');
    }
  });

  const toggleSelection = (category: keyof typeof selections, value: string) => {
    setSelections(prev => ({
      ...prev,
      [category]: prev[category] === value ? '' : value
    }));
  };

  const generatePrompt = async () => {
    const hasInput = subjectInput.trim() || actionInput.trim() || detailsInput.trim() || Object.values(selections).some(v => v);
    if (!hasInput) return;

    setIsLoading(true);
    setGeneratedPrompt('');
    
    try {
      const apiKey = (import.meta.env as any)?.VITE_GEMINI_API_KEY || 
                    (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '');
      
      if (!apiKey || apiKey === 'undefined' || apiKey === '') {
        setGeneratedPrompt('ERRO: Chave API não encontrada. Vá em Settings > Environment Variables na Vercel e adicione VITE_GEMINI_API_KEY.');
        setIsLoading(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const context = Object.entries(selections)
        .filter(([_, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
        
      const promptWithContext = `
        Subject: ${subjectInput}
        Action: ${actionInput}
        Additional Details: ${detailsInput}
        Aspect Ratio: ${selectedAspectRatio}
        Selected Presets: ${context}
      `;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: promptWithContext,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.8,
        },
      });

      const text = response.text || '';
      setGeneratedPrompt(text);
      
      // Scroll to result after a short delay for animation
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (error: any) {
      console.error("Error generating prompt:", error);
      setGeneratedPrompt(`Erro ao gerar prompt: ${error.message || 'Erro desconhecido'}. Verifique sua chave API e conexão.`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedPrompt) return;
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#E4E3E0] font-sans selection:bg-[#F27D26] selection:text-black">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#F27D26]/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-24">
        {/* API Status Indicator */}
        <div className="mb-8 flex justify-end">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-mono uppercase tracking-widest ${
            apiKeyStatus === 'found' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 
            apiKeyStatus === 'missing' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 
            'bg-white/5 border-white/10 text-white/40'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              apiKeyStatus === 'found' ? 'bg-emerald-500 animate-pulse' : 
              apiKeyStatus === 'missing' ? 'bg-red-500' : 
              'bg-white/20'
            }`} />
            {apiKeyStatus === 'found' ? 'AI Signal: Active' : 
             apiKeyStatus === 'missing' ? 'AI Signal: Offline' : 
             'AI Signal: Checking...'}
          </div>
        </div>

        {/* Header */}
        <header className="mb-16 space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-2 text-[#F27D26] font-mono text-xs tracking-[0.2em] uppercase"
          >
            <Film size={14} />
            <span>Director of Photography AI</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tighter leading-[0.9] uppercase"
          >
            Cine<span className="text-[#F27D26]">Prompt</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-[#8E9299] max-w-xl leading-relaxed"
          >
            Transform your raw ideas into high-fidelity cinematic instructions for Video AI models.
          </motion.p>
        </header>

        {/* Directing Presets */}
        <section className="space-y-10 mb-16">
          {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map((category) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-[#F27D26]" />
                <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">{category}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {PRESETS[category].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => toggleSelection(category, option.value)}
                    className={`px-4 py-2 rounded-lg border text-[10px] font-mono transition-all duration-300 uppercase tracking-wider flex flex-col items-center min-w-[80px] ${
                      selections[category] === option.value
                        ? 'bg-[#F27D26] border-[#F27D26] text-black font-bold shadow-[0_0_15px_rgba(242,125,38,0.3)]'
                        : 'bg-white/5 border-white/10 text-white/40 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    {category === 'movement' && <MovementAnimation type={option.value} />}
                    {category === 'composition' && <CompositionPreview type={option.value} />}
                    {category === 'camera' && <CameraPreview type={option.value} />}
                    {category === 'lighting' && <LightingPreview type={option.value} />}
                    <span>{option.label}</span>
                    {category === 'style' && (option as any).objective && (
                      <div className="mt-1 flex flex-col items-center opacity-50 text-[7px] leading-tight text-center">
                        <span>{ (option as any).objective }</span>
                        <span>{ (option as any).feeling }</span>
                      </div>
                    )}
                    {category === 'lighting' && (option as any).feeling && (
                      <div className="mt-1 flex flex-col items-center opacity-50 text-[7px] leading-tight text-center">
                        <span>{ (option as any).feeling }</span>
                        <span>{ (option as any).application }</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-blue-500" />
              <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">Aspect Ratio</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: '16:9', value: '16:9', desc: 'Widescreen' },
                { label: '2.35:1', value: '2.35:1 Anamorphic', desc: 'Cinematic' },
                { label: '9:16', value: '9:16', desc: 'Vertical' },
                { label: '1:1', value: '1:1', desc: 'Square' },
                { label: '4:3', value: '4:3', desc: 'Classic' },
              ].map((ratio) => (
                <button
                  key={ratio.value}
                  onClick={() => setSelectedAspectRatio(ratio.value)}
                  className={`px-4 py-2 rounded-lg border text-xs font-mono transition-all duration-300 ${
                    selectedAspectRatio === ratio.value
                      ? 'bg-blue-500 border-blue-500 text-white font-bold shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                      : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span>{ratio.label}</span>
                    <span className="text-[8px] opacity-50">{ratio.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Input Section */}
        <section className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-3 bg-[#F27D26]" />
                <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">The Subject</h3>
              </div>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#F27D26]/20 to-transparent rounded-xl blur opacity-30 group-focus-within:opacity-100 transition duration-500" />
                <input
                  type="text"
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  placeholder="Who or what is in the scene?"
                  className="relative w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F27D26]/50 transition-colors placeholder:text-white/10"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-3 bg-[#F27D26]" />
                <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">The Action</h3>
              </div>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#F27D26]/20 to-transparent rounded-xl blur opacity-30 group-focus-within:opacity-100 transition duration-500" />
                <input
                  type="text"
                  value={actionInput}
                  onChange={(e) => setActionInput(e.target.value)}
                  placeholder="What are they doing exactly?"
                  className="relative w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F27D26]/50 transition-colors placeholder:text-white/10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-[#F27D26]" />
              <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Additional Details / Atmosphere</h3>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="relative group"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#F27D26]/20 to-transparent rounded-2xl blur opacity-30 group-focus-within:opacity-100 transition duration-500" />
              <div className="relative bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
                <textarea
                  value={detailsInput}
                  onChange={(e) => setDetailsInput(e.target.value)}
                  placeholder="Describe the mood, specific textures, or any other details..."
                  className="w-full h-32 bg-transparent p-6 text-lg focus:outline-none resize-none placeholder:text-white/20"
                />
                <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-t border-white/10">
                  <div className="flex gap-4 text-white/40">
                    <Camera size={18} className="hover:text-[#F27D26] transition-colors cursor-help" title="Camera Specs" />
                    <Clapperboard size={18} className="hover:text-[#F27D26] transition-colors cursor-help" title="Directing" />
                  </div>
                  <button
                    onClick={generatePrompt}
                    disabled={isLoading || (!subjectInput.trim() && !actionInput.trim() && !detailsInput.trim() && !Object.values(selections).some(v => v))}
                    className="flex items-center gap-2 bg-[#F27D26] hover:bg-[#ff8c3a] disabled:bg-white/10 disabled:text-white/20 text-black font-bold px-6 py-2 rounded-full transition-all active:scale-95"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        <span>Directing...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 size={18} />
                        <span>Generate Prompt</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Results Section */}
          <AnimatePresence>
            {generatedPrompt && (
              <motion.div
                ref={resultRef}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-4 pt-8"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-mono text-xs tracking-widest uppercase text-white/40">Cinematic Prompt Output</h2>
                  <button 
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 text-xs font-mono uppercase hover:text-[#F27D26] transition-colors"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy Prompt'}
                  </button>
                </div>
                
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-b from-[#F27D26]/10 to-transparent rounded-2xl blur-xl opacity-50" />
                  <div className="relative bg-[#151515] border border-[#F27D26]/20 p-8 rounded-2xl leading-relaxed text-xl md:text-2xl font-serif italic text-white/90 shadow-2xl">
                    {generatedPrompt}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3 pt-4">
                  {['4K', 'ARRI Alexa', '35mm', 'Cinematic', 'Anamorphic'].map((tag) => (
                    <span key={tag} className="px-3 py-1 rounded-full border border-white/10 text-[10px] uppercase tracking-widest text-white/40">
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Footer Info */}
        <footer className="mt-32 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-white/20 text-xs font-mono uppercase tracking-widest">
          <div className="flex items-center gap-4">
            <span>© 2026 CinePrompt AI</span>
            <span className="w-1 h-1 bg-white/20 rounded-full" />
            <span>DP Specialist Engine</span>
          </div>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Documentation</a>
            <a href="#" className="hover:text-white transition-colors">API Keys</a>
          </div>
        </footer>
      </main>
    </div>
  );
}
