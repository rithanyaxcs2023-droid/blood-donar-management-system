
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { supabase } from '../lib/supabase';
import { BloodType } from '../types';

const LiveAssistant: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const sessionRef = useRef<any>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Function Declarations for Gemini
  const searchDonorsTool: FunctionDeclaration = {
    name: 'search_donors',
    description: 'Search for blood donors in the database by blood type or location.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        bloodType: { type: Type.STRING, description: 'The blood type to search for (e.g., O+, A-)' },
        location: { type: Type.STRING, description: 'The city or area to search in' }
      }
    }
  };

  const checkInventoryTool: FunctionDeclaration = {
    name: 'check_inventory',
    description: 'Get the current stock levels for all blood types.',
    parameters: { type: Type.OBJECT, properties: {} }
  };

  const registerDonorTool: FunctionDeclaration = {
    name: 'register_donor',
    description: 'Register a new donor into the HemoFlow system.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        bloodType: { type: Type.STRING, enum: Object.values(BloodType) },
        contact: { type: Type.STRING },
        location: { type: Type.STRING }
      },
      required: ['name', 'bloodType', 'contact', 'location']
    }
  };

  // Helper methods for base64 encoding/decoding
  const encode = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
    return buffer;
  };

  const toggleAssistant = async () => {
    if (isActive) {
      cleanup();
      setIsActive(false);
      return;
    }

    try {
      setIsConnecting(true);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            console.log('Gemini Live Connected with Tool Support');
            setIsActive(true);
            setIsConnecting(false);
            
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
              
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };

              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Tool Calls
            if (message.toolCall) {
              setIsProcessing(true);
              const session = await sessionPromise;
              const functionResponses = [];

              for (const fc of message.toolCall.functionCalls) {
                let result;
                try {
                  if (fc.name === 'search_donors') {
                    let query = supabase.from('donors').select('*');
                    if (fc.args.bloodType) query = query.eq('blood_type', fc.args.bloodType);
                    if (fc.args.location) query = query.ilike('location', `%${fc.args.location}%`);
                    const { data } = await query;
                    result = data || [];
                  } else if (fc.name === 'check_inventory') {
                    const { data } = await supabase.from('donors').select('blood_type, is_available');
                    const counts = data?.reduce((acc: any, d: any) => {
                      if (d.is_available) acc[d.blood_type] = (acc[d.blood_type] || 0) + 1;
                      return acc;
                    }, {});
                    result = counts;
                  } else if (fc.name === 'register_donor') {
                    const { data, error } = await supabase.from('donors').insert([{
                      name: fc.args.name,
                      blood_type: fc.args.bloodType,
                      contact: fc.args.contact,
                      location: fc.args.location,
                      is_available: true
                    }]);
                    result = error ? { error: error.message } : { status: "success", message: "Donor registered successfully" };
                  }
                } catch (e) {
                  result = { error: "Failed to execute database operation" };
                }

                functionResponses.push({
                  id: fc.id,
                  name: fc.name,
                  response: { result }
                });
              }

              session.sendToolResponse({ functionResponses });
              setIsProcessing(false);
            }

            // Handle Transcripts
            if (message.serverContent?.outputTranscription) {
              setTranscripts(prev => [...prev.slice(-3), `AI: ${message.serverContent!.outputTranscription!.text}`]);
            } else if (message.serverContent?.inputTranscription) {
              setTranscripts(prev => [...prev.slice(-3), `You: ${message.serverContent!.inputTranscription!.text}`]);
            }

            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }
          },
          onerror: (e) => console.error('Live Error:', e),
          onclose: () => setIsActive(false),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "You are HemoFlow AI. Use tools to find donors, check inventory, or register donors. Be extremely brief in your verbal responses.",
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          tools: [{ functionDeclarations: [searchDonorsTool, checkInventoryTool, registerDonorTool] }],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error('Failed to start assistant:', err);
      setIsConnecting(false);
    }
  };

  const cleanup = () => {
    if (sessionRef.current) sessionRef.current.close();
    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
  };

  useEffect(() => {
    return () => cleanup();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center relative overflow-hidden">
        {isProcessing && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
            <span className="w-2 h-2 bg-red-600 rounded-full"></span>
            Database Operation in Progress
          </div>
        )}

        <div className="mb-8">
          <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center transition-all duration-700 ${
            isActive ? 'bg-red-600 scale-110 shadow-2xl shadow-red-200' : 'bg-slate-50'
          }`}>
            {isActive ? (
              <div className="flex gap-1 items-center">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="w-1.5 h-8 bg-white rounded-full animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}></div>
                ))}
              </div>
            ) : (
              <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            )}
          </div>
        </div>

        <h2 className="text-3xl font-black text-slate-800 mb-2">
          {isActive ? 'Listening...' : 'Voice Command Center'}
        </h2>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          {isActive 
            ? 'Try: "Register a new donor Jane Doe with O positive in Brooklyn"' 
            : 'Enable the AI to manage blood repository tasks hands-free.'}
        </p>

        <div className="space-y-3 mb-8 min-h-[140px] flex flex-col justify-end">
          {transcripts.map((t, i) => (
            <div key={i} className={`p-4 rounded-2xl text-sm transition-all duration-300 ${t.startsWith('You:') ? 'bg-slate-100 text-slate-700 self-end max-w-[80%]' : 'bg-red-50 text-red-800 self-start max-w-[80%]'}`}>
              {t}
            </div>
          ))}
          {!isActive && (
            <div className="p-4 border-2 border-dashed border-slate-100 rounded-2xl text-slate-300 text-xs font-bold uppercase tracking-widest">
              Awaiting Activation
            </div>
          )}
        </div>

        <button 
          onClick={toggleAssistant}
          disabled={isConnecting}
          className={`w-full py-5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
            isActive 
              ? 'bg-slate-900 text-white hover:bg-slate-800' 
              : 'bg-red-600 text-white hover:bg-red-700 shadow-xl shadow-red-200'
          } ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isConnecting ? 'Establishing Connection...' : isActive ? 'Stop Assistant' : 'Activate Real-time Voice AI'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-100">
          <h4 className="text-sm font-bold text-slate-400 uppercase mb-4 tracking-tighter">Voice Shortcuts</h4>
          <ul className="space-y-3">
            {['"Check current AB- levels"', '"Find donors in Manhattan"', '"Register donor Mike, B+, 555-0199"'].map(s => (
              <li key={s} className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span> {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-slate-900 p-6 rounded-3xl text-white">
          <h4 className="text-sm font-bold text-slate-500 uppercase mb-4 tracking-tighter">System Health</h4>
          <div className="flex items-center justify-between">
            <span className="text-xs">Gemini Live Latency</span>
            <span className="text-xs font-mono text-green-400">~240ms</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs">Database Sync</span>
            <span className="text-xs font-mono text-blue-400">Enabled (Real-time)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveAssistant;
