
import { GoogleGenAI, Type } from "@google/genai";
import { Property, Tenant, ContractAnalysis, MeterType, MarketData, Reminder, Transaction, Loan } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateExitStrategy = async (
  property: Property,
  marketValue: number,
  targetInterestRate: number
): Promise<string> => {
  const currentLoans = property.loans?.map(l => 
    `${l.bankName}: Restschuld ${l.currentBalance}€, Zins ${l.interestRate}%, Ende Bindung ${l.fixedUntil}`
  ).join('\n') || 'Keine Darlehen erfasst.';

  const prompt = `Du bist ein hochspezialisierter Immobilien-Stratege. Analysiere die Exit- und Finanzierungsstrategie für:
  Objekt: ${property.name}
  Kaufdatum: ${property.purchaseDate || 'Unbekannt'}
  Kaufpreis: ${property.purchasePrice || 0}€
  Geschätzter Marktwert: ${marketValue}€
  Aktuelle Darlehen:
  ${currentLoans}
  Angenommener Marktzins für Umschuldung: ${targetInterestRate}%

  Bitte erstelle eine detaillierte Analyse zu folgenden Punkten:
  1. Umschuldungs-Check: Lohnt sich ein vorzeitiger Ausstieg? (Schätzung Vorfälligkeitsentschädigung vs. Zinsersparnis).
  2. Verkaufs-Timing: Unter Berücksichtigung der 10-Jahres-Frist (Spekulationssteuer).
  3. Steuer-Optimierung: Möglichkeiten wie § 7b EStG (Sonder-AfA) oder Erhaltungsaufwand vs. Anschaffungskosten.
  4. Exit-Szenarien: Halten (Buy & Hold) vs. Verkauf (Fix & Flip).

  Sprache: Deutsch. Ton: Analytisch, präzise, professionell. Nutze Markdown.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    return response.text || "Analyse fehlgeschlagen.";
  } catch (error) {
    console.error("Gemini Exit Strategy Error:", error);
    return "Fehler bei der Strategie-Analyse.";
  }
};

export const generateSubsidyAdvice = async (
  property: Property,
  measures: string[]
): Promise<string> => {
  const prompt = `Du bist Experte für staatliche Fördermittel (KfW, BAFA) in Deutschland.
  Objekt: ${property.name} (${property.type})
  Geplante Maßnahmen: ${measures.join(', ')}

  Erstelle einen Leitfaden:
  1. Welche spezifischen Programme passen? (z.B. KfW 261, 461, BAFA BEG EM).
  2. Wie hoch sind die maximalen Zuschüsse oder Tilgungszuschüsse?
  3. Schritt-für-Schritt Anleitung zur Beantragung (Energieeffizienz-Experte Einbindung etc.).
  4. Kumulierbarkeit: Können Programme kombiniert werden?

  Nutze aktuelle Informationen zu den Förderrichtlinien. Markdown-Format.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    return response.text || "Förder-Check fehlgeschlagen.";
  } catch (error) {
    console.error("Gemini Subsidy Error:", error);
    return "Fehler bei der Fördermittelberatung.";
  }
};

export const generateEnergyConsultation = async (
  property: Property,
  additionalInfo: { yearBuilt: string, heatingType: string, insulation: string }
): Promise<string> => {
  const prompt = `Du bist ein Experte für Energieeffizienz und Gebäudesanierung. Analysiere folgendes Objekt für eine energetische Modernisierung:
  Objekt: ${property.name}
  Typ: ${property.type}
  Baujahr: ${additionalInfo.yearBuilt}
  Aktuelle Heizung: ${additionalInfo.heatingType}
  Dämmzustand: ${additionalInfo.insulation}
  Einheiten: ${property.units.length}
  
  Fragestellung:
  1. Sollte der Vermieter eher in eine Solaranlage (PV) oder eine Wärmepumpe investieren?
  2. Was sind die Voraussetzungen für eine effiziente Wärmepumpe bei diesem Baujahr?
  3. Wie hoch ist das Einsparpotenzial für Mieter und Vermieter?
  4. Welche Fördermittel (KfW/BAFA) sind relevant?
  
  Antworte strukturiert in Markdown mit einer klaren Empfehlung.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    return response.text || "Analyse fehlgeschlagen.";
  } catch (error) {
    console.error("Gemini Energy Consult Error:", error);
    return "Fehler bei der Energieberatung.";
  }
};

export const generateReminderEmail = async (
  reminder: Reminder,
  property?: Property
): Promise<string> => {
  const prompt = `Erstelle eine professionelle E-Mail-Erinnerung für folgenden Termin:
  Thema: ${reminder.title}
  Datum: ${reminder.date}
  Kategorie: ${reminder.category}
  Objekt: ${property ? property.name + ' (' + property.address + ')' : 'Allgemein'}
  
  Der Ton soll höflich, sachlich und professionell sein. 
  Wenn es um eine Zählerablesung geht, bitte den Empfänger höflich um Zugang oder Übermittlung der Daten.
  Wenn es um einen Handwerker geht, bestätige kurz den Termin.
  Wenn es um ein auslaufendes Darlehen (Darlehensauslauf) geht, sende eine Benachrichtigung an den Vermieter/Eigentümer (oder bereite sie für die Bank vor), um rechtzeitig über eine Anschlussfinanzierung zu verhandeln.
  
  Gib nur den Text der E-Mail (Betreff und Body) zurück.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Fehler bei der Generierung.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Entschuldigung, der E-Mail-Entwurf konnte nicht erstellt werden.";
  }
};

export const generateInvestmentStrategy = async (
  property: Property,
  metrics: { grossYield: number, netYield: number, cashflow: number }
): Promise<string> => {
  const prompt = `Du bist ein erfahrener Immobilien-Investmentberater. Analysiere folgendes Objekt für einen Investor:
  Objekt: ${property.name}
  Adresse: ${property.address}
  Kaufpreis: ${property.purchasePrice || 'Unbekannt'}€
  Bruttorendite: ${metrics.grossYield.toFixed(2)}%
  Nettorendite: ${metrics.netYield.toFixed(2)}%
  Monatlicher Cashflow: ${metrics.cashflow.toFixed(2)}€
  
  Erstelle eine kurze, prägnante Einschätzung:
  1. Ist das Objekt ein "Selbstläufer" (positiver Cashflow)?
  2. Empfehlungen zur Optimierung (Mietpotenzial, Zinsmanagement).
  3. Risikoeinschätzung.
  
  Ton: Professionell, analytisch, direkt.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    return response.text || "Analyse fehlgeschlagen.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Fehler bei der Investitionsanalyse.";
  }
};

export const generateTenantFinancialEmail = async (
  tenant: Tenant,
  property: Property,
  transactions: Transaction[],
  topic: 'rent_adjustment' | 'utility_payment'
): Promise<string> => {
  const financialContext = transactions
    .slice(-5)
    .map(t => `${t.date}: ${t.description} (${t.amount}€)`)
    .join('\n');

  const prompt = `Erstelle eine professionelle E-Mail an einen Mieter.
  Mieter: ${tenant.firstName} ${tenant.lastName}
  Objekt: ${property.name}, ${property.address}
  Thema: ${topic === 'rent_adjustment' ? 'Ankündigung einer Mietanpassung' : 'Information zu Nebenkostenzahlungen'}
  
  Finanzieller Kontext (letzte Transaktionen):
  ${financialContext}
  
  Anforderungen:
  1. Professioneller, höflicher Ton.
  2. Bezugnahme auf das Objekt.
  3. Bei Mietanpassung: Erkläre sachlich die Notwendigkeit (z.B. Indexmiete oder Marktanpassung).
  4. Bei Nebenkosten: Erwähne anstehende Zahlungen oder Verrechnungen basierend auf dem Kontext.
  
  Gib nur den Text der E-Mail (Betreff und Body) zurück.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Fehler bei der Generierung.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Fehler beim Erstellen des E-Mail-Entwurfs.";
  }
};

export const fetchMarketAnalysis = async (property: Property): Promise<MarketData | null> => {
  const prompt = `Führe eine Marktanalyse für folgende Immobilie durch:
  Adresse: ${property.address}
  Typ: ${property.type}
  
  Suche auf Immobilienportalen nach:
  1. Durchschnittlicher Mietpreis pro m² (kalt) in dieser Lage.
  2. Durchschnittlicher Verkaufspreis pro m² in dieser Lage.
  3. Aktueller Markttrend für diesen Standort.
  
  Antworte in einem validen JSON-Format mit folgenden Feldern:
  averageRentPerM2 (Zahl), averageSalePerM2 (Zahl), marketTrend ('rising', 'stable', 'falling'), summary (Text).`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const data = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => ({
        title: chunk.web?.title || "Quelle",
        uri: chunk.web?.uri || ""
      }))
      .filter((s: any) => s.uri) || [];

    return {
      averageRentPerM2: data.averageRentPerM2 || 0,
      averageSalePerM2: data.averageSalePerM2 || 0,
      marketTrend: data.marketTrend || 'stable',
      summary: data.summary || text,
      sources: sources
    };
  } catch (error) {
    console.error("Market Analysis Error:", error);
    return null;
  }
};

export const extractMeterData = async (
  base64Image: string,
  mimeType: string
): Promise<{ type: MeterType; value: number; serialNumber: string; unit: string } | null> => {
  const data = base64Image.split(',')[1] || base64Image;

  const prompt = `Analysiere dieses Bild eines Zählers (Strom, Gas oder Wasser). 
  Extrahiere folgende Informationen:
  1. Typ des Zählers (Strom, Gas oder Wasser)
  2. Aktueller Zählerstand (nur die Ziffern vor dem Komma/den roten Feldern)
  3. Die Zählernummer (Seriennummer auf dem Gerät)
  4. Die Einheit (kWh oder m³)
  
  Gib das Ergebnis strikt als JSON zurück.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      // Fix: contents must wrap parts in an object
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { data, mimeType } }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ['Strom', 'Gas', 'Wasser'] },
            value: { type: Type.NUMBER },
            serialNumber: { type: Type.STRING },
            unit: { type: Type.STRING }
          },
          required: ['type', 'value', 'unit']
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Meter Extraction Error:", error);
    return null;
  }
};

export const generateTenantLetter = async (
  tenant: Tenant,
  property: Property,
  subject: string,
  context: string
): Promise<string> => {
  const prompt = `Erstelle einen formellen Brief an einen Mieter auf Deutsch.
  Absender: Vermieter
  Empfänger: ${tenant.firstName} ${tenant.lastName}, wohnhaft in ${property.address}
  Betreff: ${subject}
  Zusatzinfo: ${context}
  Der Ton soll professionell, höflich aber bestimmt sein. Verwende das aktuelle Datum.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Fehler bei der Generierung.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Entschuldigung, der Brief konnte nicht generiert werden.";
  }
};

export const generateExpose = async (
  property: Property, 
  purpose: 'Vermietung' | 'Verkauf' = 'Vermietung',
  targetGroup: string = 'Allgemein',
  tone: string = 'Modern & Begeisternd',
  highlights: string = ''
): Promise<string> => {
  const totalArea = property.units.reduce((sum, u) => sum + u.size, 0);
  const unitCount = property.units.length;

  const prompt = `Erstelle ein hochprofessionelles und überzeugendes Immobilien-Exposé für folgendes objekt:
  
  DETAILS:
  Name: ${property.name}
  Typ: ${property.type}
  Adresse: ${property.address}
  Einheiten: ${unitCount}
  Gesamtfläche: ${totalArea} m²
  ${highlights ? `BESONDERE HIGHLIGHTS: ${highlights}` : ''}
  
  KONFIGURATION:
  Zweck: ${purpose}
  Zielgruppe: ${targetGroup}
  Schreibstil: ${tone}

  STRUKTUR & ANFORDERUNGEN:
  1. Eine fesselnde Headline, die genau auf ${targetGroup} zugeschnitten ist.
  2. Einleitung: Wecke Begehrlichkeiten und nutze den Stil "${tone}".
  3. Objektbeschreibung: Nutze die harten Fakten (${totalArea} m², ${unitCount} Einheiten).
  4. Highlights: Gehe besonders auf ${highlights || 'die Qualität des Objekts'} ein.
  5. Lagebericht: Beschreibe die Vorzüge der Lage in ${property.address} (Infrastruktur, Lebensqualität).
  6. Call-to-Action: Ein starker Abschluss, der zur Kontaktaufnahme auffordert.
  
  Sprache: Deutsch. Formatierung: Nutze Markdown für eine schöne Struktur (Überschriften, Fettschrift, Aufzählungszeichen).`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Fehler bei der Generierung.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Entschuldigung, das Exposé konnte nicht generiert werden.";
  }
};

export const generateUtilityStatementLetter = async (
  tenant: Tenant,
  property: Property,
  year: string,
  totalCosts: number,
  tenantShare: number,
  prepaid: number,
  balance: number,
  breakdown: Record<string, number>
): Promise<string> => {
  const breakdownStr = Object.entries(breakdown)
    .map(([cat, val]) => `- ${cat}: ${val.toFixed(2)}€`)
    .join('\n');

  const prompt = `Erstelle ein formelles Anschreiben zur Betriebskostenabrechnung für das Jahr ${year}.
  Objekt: ${property.name}, ${property.address}
  Mieter: ${tenant.firstName} ${tenant.lastName}
  
  Finanzielle Details des Gesamtobjekts:
  - Gesamtkosten: ${totalCosts.toFixed(2)}€
  - Kostenstellen-Aufschlüsselung:
${breakdownStr}
  
  Details für diesen Mieter:
  - Anteil des Mieters: ${tenantShare.toFixed(2)}€
  - Geleistete Vorauszahlungen: ${prepaid.toFixed(2)}€
  - Ergebnis: ${balance > 0 ? `Nachzahlung von ${balance.toFixed(2)}€` : `Guthaben von ${Math.abs(balance).toFixed(2)}€`}
  
  Bitte erstelle einen professionellen Brief, der die Gesamtkosten kurz erwähnt und die individuelle Berechnung erläutert. Weise höflich auf die Nachzahlung oder das Guthaben hin. Nenne eine Frist von 30 Tagen. Verwende ein sauberes Layout mit Markdown.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Fehler bei der Generierung.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Entschuldigung, das Anschreiben konnte nicht generiert werden.";
  }
};

export const analyzeContract = async (
  fileData: string, 
  mimeType: string
): Promise<ContractAnalysis | null> => {
  const base64Data = fileData.split(',')[1] || fileData;

  const prompt = `Analysiere diesen Mietvertrag und extrahiere die wichtigsten Informationen. 
  Bitte identifiziere:
  - Mietbeginn
  - Mietende (falls befristet)
  - Miethöhe (Kaltmiete)
  - Kündigungsfrist
  - Ungewöhnliche oder problematische Klauseln
  - Potenzielle Risiken für den Vermieter
  - Eine kurze Zusammenfassung des Vertrags.

  Gib die Antwort in strukturiertem JSON-Format zurück.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      // Fix: contents must wrap parts in an object
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { data: base64Data, mimeType: mimeType } }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            leaseStart: { type: Type.STRING },
            leaseEnd: { type: Type.STRING },
            rentAmount: { type: Type.STRING },
            noticePeriod: { type: Type.STRING },
            unusualClauses: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            risks: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            summary: { type: Type.STRING }
          },
          required: ['unusualClauses', 'risks', 'summary']
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result as ContractAnalysis;
  } catch (error) {
    console.error("Contract Analysis Error:", error);
    return null;
  }
};
