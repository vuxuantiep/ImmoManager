
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

const AIFeedbackAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: 'Hallo! Ich bin dein ImmoTiep Mentor. Was brennt dir auf der Seele? Hast du Ideen, wie wir die App noch besser machen können?' }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isProcessing) return;

    const currentInput = userInput;
    setUserInput('');
    setMessages(prev => [...prev, { role: 'user', text: currentInput }]);
    setIsProcessing(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const prompt = `Du bist der "ImmoTiep Mentor", ein KI-Assistent für den Entwickler Vu Xuan Tiep. 
      Der Nutzer gibt folgendes Feedback zur App: "${currentInput}".
      Antworte extrem freundlich, kurz und bestätige, dass der Entwickler Tiep sich das anschauen wird.
      Füge am Ende deiner Antwort einen Block "[REPORT_START]" gefolgt von einer stichpunktartigen Zusammenfassung des Feedbacks und "[REPORT_END]" hinzu.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      const aiText = response.text || 'Vielen Dank für dein Feedback! Ich leite es direkt an Herrn Tiep weiter.';
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Huch, da hat meine Verbindung kurz gewackelt. Aber ich merke mir dein Feedback!' }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const sendEmail = () => {
    const lastReport = [...messages].reverse().find(m => m.role === 'ai' && m.text.includes('[REPORT_START]'));
    let content = "";
    if (lastReport) {
      content = lastReport.text.split('[REPORT_START]')[1].split('[REPORT_END]')[0].trim();
    } else {
      content = messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n\n');
    }

    const subject = encodeURIComponent('ImmoTiep Feedback Report');
    const body = encodeURIComponent(`Hallo Herr Tiep,\n\nhier ist eine Zusammenfassung des Nutzer-Feedbacks:\n\n${content}\n\nViele Grüße,\ndein KI-Mentor`);
    window.location.href = `mailto:vuxuantiep@gmail.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-[999] font-sans">
      {isOpen ? (
        <div className="bg-white w-80 sm:w-96 rounded-[2.5rem] shadow-2xl border border-indigo-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-500">
          <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <i className="fa-solid fa-robot"></i>
              </div>
              <div>
                <span className="font-black text-[10px] uppercase tracking-widest block opacity-60">Assistant</span>
                <span className="font-black text-xs uppercase tracking-tighter">ImmoTiep Mentor</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 p-5 space-y-4 max-h-[400px] overflow-y-auto bg-slate-50 custom-scrollbar">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-3xl text-[11px] font-bold leading-relaxed shadow-sm ${
                  m.role === 'user' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white border border-slate-100 text-slate-700'
                }`}>
                  {m.text.split('[REPORT_START]')[0].trim()}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
                  <i className="fa-solid fa-ellipsis fa-bounce text-indigo-400"></i>
                </div>
              </div>
            )}
          </div>

          <div className="p-5 bg-white border-t space-y-3">
            <form onSubmit={handleSubmit} className="flex items-center space-x-2">
              <input 
                className="flex-1 bg-slate-100 border border-slate-200 p-3.5 rounded-2xl text-[11px] font-black outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                placeholder="Was möchtest du ändern?..."
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
              />
              <button type="submit" className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-black transition-all shadow-lg active:scale-95">
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </form>
            <button 
              onClick={sendEmail}
              className="w-full bg-slate-900 text-white py-3.5 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] flex items-center justify-center space-x-2 hover:bg-indigo-600 transition-all shadow-xl active:scale-95"
            >
              <i className="fa-solid fa-envelope"></i>
              <span>Report an Tiep senden</span>
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-indigo-600 text-white rounded-[1.8rem] shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all group relative border-4 border-white"
        >
          <i className="fa-solid fa-comment-dots text-2xl"></i>
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-white animate-pulse"></span>
          <div className="absolute right-full mr-5 bg-slate-900 text-white px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
            ImmoTiep Mentor fragen
          </div>
        </button>
      )}
    </div>
  );
};

export default AIFeedbackAssistant;
