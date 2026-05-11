import React, { useRef, useState } from 'react';
import { Camera, Upload, CheckCircle2, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface CameraCaptureProps {
  onCapture: (value: number, type: 'water' | 'heating') => void;
  onCancel: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processImage = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        // Pass to Gemini to extract meter reading
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('API key missing');

        const ai = new GoogleGenAI({ apiKey: apiKey });
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            { role: 'user', parts: [
              { text: 'Extrahiere den genauen Zählerstand (nur die Zahl, z.B. 12345.6) von diesem Bild eines Wasser- oder Heizungszählers. Gib auch den Typ (water oder heating) zurück. Antworte in JSON-Format wie {"value": 1234.5, "type": "water"}.' },
              { inlineData: { mimeType: file.type, data: base64Data } }
            ]}
          ],
          config: {
              responseMimeType: "application/json",
          }
        });

        const resultText = response.text;
        if (!resultText) throw new Error('No text returned from Gemini');
        const result = JSON.parse(resultText);
        
        if (result.value) {
            onCapture(Number(result.value), result.type || 'water');
        } else {
            throw new Error('Could not parse value');
        }
        setLoading(false);
      };
    } catch (err: any) {
      console.error(err);
      setError('Fehler bei der Bilderkennung. Bitte manuell eingeben.');
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processImage(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
        <h3 className="text-xl font-bold text-slate-800 mb-4">Zählerstand scannen</h3>
        
        <div className="flex flex-col gap-4">
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            className="hidden" 
          />
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-xl font-medium transition"
          >
            {loading ? <Loader2 className="animate-spin w-6 h-6" /> : <Camera className="w-6 h-6" />}
            {loading ? 'Analysiere Bild...' : 'Kamera öffnen'}
          </button>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button onClick={onCancel} className="mt-2 text-slate-500 font-medium hover:text-slate-800 transition">
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
};
