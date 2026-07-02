
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Mic, MicOff, X, AlertCircle, Sparkles, Volume2, VolumeX, Send, RefreshCw, MessageSquare } from 'lucide-react';
import { FarmData, BudgetResult, Language } from '../types';
import { getGeminiApiKey } from '../utils/geminiHelper';

interface Message {
  sender: 'user' | 'ai';
  text: string;
  time: string;
}

interface VoiceAssistantProps {
  inlineTrigger?: boolean;
  farmData?: FarmData | null;
  budgetResult?: BudgetResult | null;
  language: Language;
  onToggleIrrigation?: (status: boolean) => void;
  isIrrigating?: boolean;
  onAddCalendarEvent?: (event: any) => void;
  onUpdateFarmProfile?: (updatedData: Partial<FarmData>) => void;
  onChangeLanguage?: (lang: Language) => void;
}

// Localized UI and text labels for English, Hindi, and Hebrew
const localTexts: Record<Language, {
  standby: string;
  listening: string;
  analyzing: string;
  speaking: string;
  micBlocked: string;
  generalError: string;
  inputPlaceholder: string;
  advisorTitle: string;
  quickPromptsTitle: string;
  contextBanner: string;
  noContextBanner: string;
  welcomeMsg: string;
  setupRequiredMsg: string;
  prompts: {
    soil: string;
    budget: string;
    alerts: string;
  }
}> = {
  en: {
    standby: "Tap mic or type a question...",
    listening: "I'm listening closely...",
    analyzing: "Analyzing farm records...",
    speaking: "Speaking...",
    micBlocked: "Microphone blocked. Please type or use quick prompts below!",
    generalError: "Voice engine error. Please type or select a question below!",
    inputPlaceholder: "Ask about watering, crop health...",
    advisorTitle: "Agentic AI Voice Assistant",
    quickPromptsTitle: "Quick Questions",
    contextBanner: "Live Soil & Crop Context Grounded",
    noContextBanner: "Set up profile to unlock full metrics",
    welcomeMsg: "Hello! I am your Agentic AI Voice Assistant. Tap the mic or type any question, and I can take real actions like toggling valves, updating your profile, or scheduling tasks!",
    setupRequiredMsg: "Welcome! To help you properly with smart irrigation, please complete your 'Farmer Profile' tab first. This lets me map your soil moisture, crop needs, and optimize your water budget!",
    prompts: {
      soil: "How is my crop health and soil moisture level?",
      budget: "Can you summarize my weekly water budget allocation?",
      alerts: "Are there any action plans for active alerts or warnings?"
    }
  },
  hi: {
    standby: "माइक टैप करें या प्रश्न टाइप करें...",
    listening: "मैं ध्यान से सुन रहा हूँ...",
    analyzing: "खेत के रिकॉर्ड का विश्लेषण...",
    speaking: "बोल रहा हूँ...",
    micBlocked: "माइक्रोफ़ोन अवरुद्ध है। कृपया टाइप करें या नीचे त्वरित प्रश्नों का उपयोग करें!",
    generalError: "आवाज इंजन त्रुटि। कृपया टाइप करें या नीचे कोई प्रश्न चुनें!",
    inputPlaceholder: "सिंचाई, फसल स्वास्थ्य के बारे में पूछें...",
    advisorTitle: "एजेंटिक एआई वॉयस असिस्टेंट",
    quickPromptsTitle: "त्वरित प्रश्न",
    contextBanner: "सक्रिय मिट्टी और फसल संदर्भ लोड किया गया",
    noContextBanner: "पूर्ण नियंत्रण के लिए प्रोफ़ाइल सेटअप करें",
    welcomeMsg: "नमस्ते! मैं आपका एजेंटिक एआई वॉयस असिस्टेंट हूं। माइक पर टैप करें या कुछ भी टाइप करें, और मैं सक्रिय रूप से वाल्व बदलने, प्रोफाइल अपडेट करने या कार्यों को शेड्यूल करने जैसे वास्तविक कदम उठा सकता हूँ!",
    setupRequiredMsg: "स्वागत है! स्मार्ट सिंचाई में आपकी मदद करने के लिए, पहले अपने 'प्रोफ़ाइल' टैब को पूरा करें। इससे मुझे आपकी मिट्टी की नमी, फसल की जरूरतों और जल बजट को समझने में मदद मिलेगी!",
    prompts: {
      soil: "मेरी फसल का स्वास्थ्य और मिट्टी की नमी का स्तर कैसा है?",
      budget: "क्या आप मेरे साप्ताहिक जल बजट आवंटन का विवरण दे सकते हैं?",
      alerts: "क्या सक्रिय अलर्ट के लिए कोई समाधान योजना है?"
    }
  },
  he: {
    standby: "הקש על המיקרופון או הקלד שאלה...",
    listening: "אני מקשיב לחקלאי...",
    analyzing: "מנתח נתוני משק...",
    speaking: "מדבר אליך...",
    micBlocked: "הגישה למיקרופון חסומה. אנא הקלד שאלה או בחר קישור מהיר למטה!",
    generalError: "שגיאה במנוע הקולי. נסה להקליד כעת או לבחור למטה!",
    inputPlaceholder: "שאל על השקיה, בריאות היבול שלך...",
    advisorTitle: "עוזר קולי בינה מלאכותית סוכן",
    quickPromptsTitle: "שאלות נפוצות מומלצות",
    contextBanner: "נתוני קרקע ויבול מוזנים ברקע",
    noContextBanner: "הגדר פרופיל משק לצורך השקה מלאה",
    welcomeMsg: "שלום! אני עוזר ה-AI הקולי הסוכן שלך. הקש על המיקרופון או הקלד שאלה ואוכל לבצע פעולות אמיתיות כמו פתיחת שסתומים, עדכון פרופיל או קביעת משימות!",
    setupRequiredMsg: "ברוך הבא! כדי שאוכל לעזור לך באופן מדויק עם השקיה חכמה, אנא השלם תחילה את כרטיסיית 'פרופיל חקלאי'. זה יאפשר לי למפות את חיישני הלחות ולייעל את התקציב!",
    prompts: {
      soil: "מה מצב בריאות היבול ולחות הקרקע כרגע?",
      budget: "תוכל לסכם את הקצאת תקציב המים שבועי שלי?",
      alerts: "האם יש תוכנית פעולה להתראות ואזהרות פעילות?"
    }
  }
};

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ 
  inlineTrigger = false, 
  farmData, 
  budgetResult, 
  language,
  onToggleIrrigation,
  isIrrigating = false,
  onAddCalendarEvent,
  onUpdateFarmProfile,
  onChangeLanguage
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'analyzing' | 'speaking'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [allVoices, setAllVoices] = useState<SpeechSynthesisVoice[]>([]);

  const texts = localTexts[language] || localTexts.en;

  // Initialize conversation log
  const [messages, setMessages] = useState<Message[]>([]);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Read synthesis voices dynamically when they load in backgrounds
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const loadVoices = () => {
        setAllVoices(window.speechSynthesis.getVoices());
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Load initial welcome message based on setup status
  useEffect(() => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (!farmData) {
      setMessages([{
        sender: 'ai',
        text: texts.setupRequiredMsg,
        time: timeStr
      }]);
    } else {
      setMessages([{
        sender: 'ai',
        text: texts.welcomeMsg,
        time: timeStr
      }]);
    }
  }, [farmData, language]);

  // Handle smooth auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, voiceStatus]);

  // Clean up speech recognition and synthesis on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const initRecognition = () => {
    let rec = recognitionRef.current;
    
    if (!rec) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        return null;
      }
      rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;

      rec.onstart = () => {
        setVoiceStatus('listening');
        setErrorMessage(null);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
          handleUserQuery(transcript);
        }
      };

      rec.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage(texts.micBlocked);
        } else if (event.error === 'no-speech') {
          setErrorMessage(language === 'hi' ? "कोई आवाज सुनाई नहीं दी। कृपया फिर से माइक पर टैप करके बोलें, या नीचे दिए गए टेक्स्ट बॉक्स में प्रश्न टाइप करें।" : language === 'he' ? "לא נקלט דיבור. נסו שוב או הקלידו את השאלה למטה." : "We couldn't hear any speech. Please tap the mic again and speak, or type your question below.");
        } else if (event.error === 'network') {
          setErrorMessage(language === 'hi' ? "नेटवर्क कनेक्टिविटी त्रुटि आ रही है। कृपया नीचे दिए गए इनपुट का उपयोग करके अपना प्रश्न टाइप करें।" : language === 'he' ? "שגיאת רשת במנוע הזיהוי הקולי. אנא הקלד את השאלה." : "Network/speech service unavailable. Rest assured you can type your query in the textbox!");
        } else {
          setErrorMessage(texts.generalError);
        }
        setVoiceStatus('idle');
      };

      rec.onend = () => {
        setVoiceStatus(prev => prev === 'listening' ? 'idle' : prev);
      };

      recognitionRef.current = rec;
    }

    const langMap: Record<Language, string> = {
      en: 'en-US',
      hi: 'hi-IN',
      he: 'he-IL'
    };
    rec.lang = langMap[language] || 'en-US';
    return rec;
  };

  const startListening = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel(); // Mute ongoing audio playback on new interaction
    }
    setErrorMessage(null);
    const rec = initRecognition();
    if (!rec) {
      setErrorMessage(texts.generalError);
      return;
    }
    
    try {
      rec.start();
    } catch (e) {
      console.error("Failed to start voice recognition:", e);
      try { rec.abort(); rec.start(); } catch(_) {}
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setVoiceStatus('idle');
  };

  const playTTS = (text: string) => {
    if (isAudioMuted) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel(); // Stop playing first

    // Clean up typical markdown elements from spoken verbal text
    const cleanSpokenText = text
      .replace(/\*+/g, '')
      .replace(/#+/g, '')
      .replace(/`+/g, '')
      .replace(/[-+•]/g, ' ')
      .replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '') // remove emojis
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanSpokenText);
    
    const langMap: Record<Language, string> = {
      en: 'en-US',
      hi: 'hi-IN',
      he: 'he-IL'
    };
    utterance.lang = langMap[language] || 'en-US';

    // Prioritize selecting a female accent voice
    const femaleKeywords = ['female', 'samantha', 'zira', 'hazel', 'kalpana', 'heera', 'google हिन्दी', 'carmit', 'susan', 'karen', 'victoria', 'moira', 'tessa'];
    const voicesList = allVoices.length > 0 ? allVoices : window.speechSynthesis.getVoices();
    
    // Find matching language voices
    const langPrefix = utterance.lang.split('-')[0];
    const langVoices = voicesList.filter(v => 
      v.lang.startsWith(langPrefix) || 
      v.lang.replace('_', '-').startsWith(langPrefix)
    );

    let selectedVoice = null;
    if (langVoices.length > 0) {
      // Find a female voice match
      selectedVoice = langVoices.find(v => 
        femaleKeywords.some(kw => v.name.toLowerCase().includes(kw))
      );
      // Fallback to first language-matched voice
      if (!selectedVoice) {
        selectedVoice = langVoices[0];
      }
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => setVoiceStatus('speaking');
    utterance.onend = () => setVoiceStatus('idle');
    utterance.onerror = () => setVoiceStatus('idle');

    window.speechSynthesis.speak(utterance);
  };

  const handleUserQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, {
      sender: 'user',
      text: queryText,
      time: timeStr
    }]);

    setVoiceStatus('analyzing');
    setErrorMessage(null);

    try {
      const apiKey = getGeminiApiKey();
      if (!apiKey) {
        setMessages(prev => [...prev, {
          sender: 'ai',
          text: language === 'hi' 
            ? "मुझे खेद है! मुझे आपका Gemini API Key नहीं मिला। अपनी स्थानीय .env फ़ाइल में VITE_GEMINI_API_KEY=your_actual_key सेट करें।" 
            : language === 'he' 
            ? "מצטער! מפתח ה-API של Gemini חסר. הגדר VITE_GEMINI_API_KEY=your_key_here בקובץ ה-.env שלך." 
            : "I'm sorry! Your Gemini API Key could not be resolved. Please make sure that you have set VITE_GEMINI_API_KEY=your_actual_key in a local .env file inside VS Code to enable the AI Advisor.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        setVoiceStatus('idle');
        return;
      }
      const ai = new GoogleGenAI({ apiKey });

      const farmContext = farmData ? `
        Farmer Location: ${farmData.location}
        Crop growing: ${farmData.crop} on ${farmData.area} hectares.
        Current Soil Moisture sensor level: ${farmData.soilMoisture}%.
        Target Soil Moisture: ${budgetResult?.targetMoisture || 80}%.
        Irrigation Deficit percentage: ${budgetResult?.netDeficit || 0}%.
        Weekly water volume quota needed: ${budgetResult?.totalWaterNeeded || 'N/A'} cubic meters.
        Crop Water Use Efficiency Index: ${budgetResult?.efficiencyScore || 'N/A'}%.
        Water Supply Source: Groundwater Table (Depth is ${farmData.groundwaterLevel || 10} meters).
        Active system warnings: ${budgetResult?.alerts?.map(a => a.message).join(', ') || 'All systems are running optimally without active warnings.'}.
        Smart Valve Status: ${isIrrigating ? 'OPEN (Flowing Water active now)' : 'CLOSED (Standby mode, no flow)'}.
      ` : "Farm profile not completed yet.";

      const resolvedLangName = language === 'hi' ? 'Hindi' : language === 'he' ? 'Hebrew' : 'English';

      const systemInstruction = `You are the AgroFlow expert Agricultural Field Agent and conversational smart-irrigation advisor. 
      You are giving advice to the farmer. Your speaking style is supportive, companionable, encouraging, and clear.
      
      Live Farm Status & Grounded Metrics:
      ${farmContext}

      Active Agent Capabilities (Functions):
      1. You can start/stop water irrigation (toggleIrrigationValve). If user requests to open, turn on, shut off, or water the field, invoke this tool.
      2. You can schedule farm events in the calendar (scheduleAgriculturalTask).
      3. You can update crop, area, or location details in the profile (updateFarmCropOrLocation).

      Response Guidelines:
      1. Reference the exact measurements (moisture %, alerts, groundwater depth, weekly water quantity in m³) to sound deeply calculated and informed.
      2. If you execute a function, explain confirming the exact physical action you took on the farm.
      3. Speak STRICTLY in ${resolvedLangName}.
      4. Avoid code blocks, deep schemas or lists. Keep the response to 2 to 4 friendly verbal sentences which are extremely elegant to listen to or read.`;

      const toolsList: any[] = [
        {
          name: 'toggleIrrigationValve',
          description: 'Turn the smart irrigation farm valve or water pump ON or OFF. Use this when the user says "turn on the pump", "water my fields", "stop irrigation", "shut off the valve", "सिंचाई बंद करो", "सिंचाई चालू करो", "הפעל השקיה", "עצור השקיה" etc.',
          parameters: {
            type: Type.OBJECT,
            properties: {
              active: {
                type: Type.BOOLEAN,
                description: 'Set to true to start watering/turn valve on, or false to stop watering/shut valve off.'
              }
            },
            required: ['active']
          }
        },
        {
          name: 'scheduleAgriculturalTask',
          description: 'Schedule a farming task like water irrigation, NPK fertilization, or harvesting in the farm calendar.',
          parameters: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'Task label, e.g., "AI Guided Watering", "NPK Soil Fertilization", "Pre-harvest cut"' },
              date: { type: Type.STRING, description: 'Schedules date in YYYY-MM-DD format (must look forward, e.g., 2026-06-03 or tomorrow).' },
              time: { type: Type.STRING, description: 'Formatted hour of scheduling, e.g., "06:00 AM", "05:30 PM"' },
              amount: { type: Type.STRING, description: 'Water volume in cubic meters or fertilizer load, e.g., "65 m³", "20 kg"' },
              type: { type: Type.STRING, description: 'Shorthand keyword type', enum: ['irrigation', 'fertilizer', 'harvest'] }
            },
            required: ['title', 'date', 'time', 'amount', 'type']
          }
        },
        {
          name: 'updateFarmCropOrLocation',
          description: 'Update the crop type or physical farm location parameters in the farmer profile.',
          parameters: {
            type: Type.OBJECT,
            properties: {
              crop: { type: Type.STRING, description: 'Name of crop (e.g. Wheat, Rice, Cotton, Maize, Vegetables, Corn)' },
              location: { type: Type.STRING, description: 'Farm geographical location/town name (e.g., Punjab, Rajasthan, Local)' },
              area: { type: Type.NUMBER, description: 'Total land area in Hectares.' }
            }
          }
        }
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: queryText,
        config: {
          systemInstruction,
          temperature: 0.5,
          tools: [{ functionDeclarations: toolsList }]
        }
      });

      // Handle server-side function calling response
      if (response.functionCalls && response.functionCalls.length > 0) {
        const call = response.functionCalls[0];
        const { name, args } = call;
        let actionResponseText = "";

        if (name === 'toggleIrrigationValve') {
          const activate = !!(args as any).active;
          if (onToggleIrrigation) {
            onToggleIrrigation(activate);
          }
          if (language === 'hi') {
            actionResponseText = activate 
              ? "निश्चित रूप से! मैंने आपके खेत के लिए स्मार्ट सिंचाई वाल्व और वॉटर पंप चालू कर दिया है। पानी का प्रवाह अब सक्रिय है, और आपकी मिट्टी की नमी धीरे-धीरे बढ़ना शुरू हो जाएगी।"
              : "ठीक है, मैंने आपके सिंचाई वाल्व को बंद कर दिया है। पानी का प्रवाह सुरक्षित रूप से रोक दिया गया है।";
          } else if (language === 'he') {
            actionResponseText = activate
              ? "בשמחה! פתחתי את שסתום ההשקיה החכם עבורך. זרימת המים החלה כעת בשטח השדה."
              : "סגרתי את שסתום ההשקיה לבקשתך. מערכת ההשקיה הופסקה בצורה בטוחה כעת.";
          } else {
            actionResponseText = activate
              ? "Certainly! I have toggled your smart irrigation pump and valve ON. The water flow is now active, and soil moisture will begin recovering."
              : "Acknowledged. I have shut down the smart irrigation valve. The water flow has been safely stopped.";
          }
        } 
        else if (name === 'scheduleAgriculturalTask') {
          const { title, date, time, amount, type } = args as any;
          const newEvent = {
            id: 'ai-evt-' + Date.now(),
            title: title || 'Irrigation Event',
            date: date || new Date().toISOString().split('T')[0],
            time: time || '08:00 AM',
            amount: amount || '40 m³',
            type: type || 'irrigation'
          };
          if (onAddCalendarEvent) {
            onAddCalendarEvent(newEvent);
          }
          if (language === 'hi') {
            actionResponseText = `मैंने ${date} को ${time} बजे ${amount} की मात्रा के साथ आपके कृषि कैलेंडर में '${title}' शेड्यूल्ड कर दिया है।`;
          } else if (language === 'he') {
            actionResponseText = `קבעתי בהצלחה את '${title}' ביומן החקלאי שלך ל-${date} בשעה ${time} עם נפח של ${amount}.`;
          } else {
            actionResponseText = `I have successfully scheduled '${title}' on your agricultural calendar for ${date} at ${time} with a dosage of ${amount}.`;
          }
        } 
        else if (name === 'updateFarmCropOrLocation') {
          const { crop, location, area } = args as any;
          const updates: Partial<FarmData> = {};
          if (crop) updates.crop = crop;
          if (location) updates.location = location;
          if (area) updates.area = Number(area);

          if (onUpdateFarmProfile) {
            onUpdateFarmProfile(updates);
          }

          const changes = [];
          if (crop) changes.push(`crop to ${crop}`);
          if (location) changes.push(`location to ${location}`);
          if (area) changes.push(`land area to ${area} Hectares`);

          if (language === 'hi') {
            actionResponseText = `मैंने आपकी प्रोफ़ाइल में खेत के मानकों को सफलतापूर्वक अपडेट कर दिया है: ${changes.join(', ')}। नया जल बजट तैयार किया जा रहा है।`;
          } else if (language === 'he') {
            actionResponseText = `עדכנתי את הגדרות המשק בהצלחה: ${changes.join(', ')}. תקציב המים החדש מחושב מחדש ברקע.`;
          } else {
            actionResponseText = `I have updated your farmer parameters successfully: ${changes.join(', ')}. The optimized water budget is re-calculating under the hood.`;
          }
        }

        setMessages(prev => [...prev, {
          sender: 'ai',
          text: actionResponseText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        setVoiceStatus('idle');
        playTTS(actionResponseText);
        return;
      }

      const replyStr = response.text || "I was unable to retrieve a response. Please let me know how else I can help.";
      
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: replyStr,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

      setVoiceStatus('idle');
      playTTS(replyStr);

    } catch (apiErr: any) {
      console.error("Gemini Advisor Query Error:", apiErr);
      setErrorMessage("Advisor limit reached. Please check manual calculations.");
      setVoiceStatus('idle');
    }
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    const query = textInput;
    setTextInput("");
    handleUserQuery(query);
  };

  const handleChipClick = (promptQuery: string) => {
    handleUserQuery(promptQuery);
  };

  const toggleOpen = () => {
    if (!isOpen) {
      setIsOpen(true);
      setErrorMessage(null);
    } else {
      setIsOpen(false);
      stopListening();
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  };

  const buttonClass = isOpen
    ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-100'
    : 'bg-emerald-600 text-white shadow-xl hover:bg-emerald-700 hover:scale-105 active:scale-95';

  return (
    <>
      {/* Floating Panel (Advisor Panel) */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 md:bottom-24 md:right-8 w-[340px] md:w-[400px] h-[520px] max-h-[85vh] bg-white rounded-[32px] shadow-2xl border border-emerald-50 flex flex-col overflow-hidden z-[100] animate-in slide-in-from-bottom-6 duration-300">
          
          {/* Panel Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 p-4 shrink-0 text-white flex justify-between items-center">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="p-2 bg-white/10 rounded-2xl">
                <Sparkles className="w-5 h-5 text-emerald-100" />
              </div>
              <div>
                <h3 className="font-semibold text-sm tracking-tight leading-none">{texts.advisorTitle}</h3>
                <span className="text-[10px] text-emerald-100/90 flex items-center mt-1">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${voiceStatus !== 'idle' ? 'bg-amber-400 animate-ping' : 'bg-emerald-300'} rtl:ml-1.5 rtl:mr-0`} />
                  {voiceStatus === 'listening' ? texts.listening 
                    : voiceStatus === 'analyzing' ? texts.analyzing 
                    : voiceStatus === 'speaking' ? texts.speaking 
                    : texts.standby}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 rtl:space-x-reverse">
              <button 
                onClick={() => {
                  const muted = !isAudioMuted;
                  setIsAudioMuted(muted);
                  if (muted && typeof window !== 'undefined') {
                    window.speechSynthesis?.cancel();
                    if (voiceStatus === 'speaking') setVoiceStatus('idle');
                  }
                }} 
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-emerald-100"
                title={isAudioMuted ? "Unmute Voice" : "Mute Voice"}
              >
                {isAudioMuted ? <VolumeX className="w-4 h-4 text-red-300" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button 
                onClick={toggleOpen} 
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Context Banner */}
          <div className="px-4 py-1.5 shrink-0 text-[10px] font-medium border-b border-gray-100 flex items-center justify-between text-gray-500 bg-emerald-50/50">
            <div className="flex items-center space-x-1 md:space-x-2">
              <span>{farmData ? texts.contextBanner : texts.noContextBanner}</span>
              {farmData && (
                <span className="text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full font-bold">
                  {farmData.crop}
                </span>
              )}
            </div>
            
            {/* Inline Language Selector */}
            {onChangeLanguage && (
              <div className="flex items-center space-x-1 border-l border-emerald-200/50 pl-2 rtl:pr-2 rtl:pl-0 rtl:border-r rtl:border-l-0">
                <button
                  type="button"
                  onClick={() => onChangeLanguage('en')}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                    language === 'en' 
                      ? 'bg-emerald-600 text-white' 
                      : 'text-gray-400 hover:text-emerald-600'
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => onChangeLanguage('hi')}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                    language === 'hi' 
                      ? 'bg-emerald-600 text-white' 
                      : 'text-gray-400 hover:text-emerald-600'
                  }`}
                  title="Hindi language"
                >
                  हिन्दी
                </button>
                <button
                  type="button"
                  onClick={() => onChangeLanguage('he')}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                    language === 'he' 
                      ? 'bg-emerald-600 text-white' 
                      : 'text-gray-400 hover:text-emerald-600'
                  }`}
                  title="Hebrew language"
                >
                  עברית
                </button>
              </div>
            )}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/60 scrollbar-thin">
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'ms-auto items-end' : 'me-auto items-start'}`}
              >
                <div className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                  msg.sender === 'user' 
                    ? 'bg-emerald-600 text-white rounded-br-none' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                }`}>
                  <p>{msg.text}</p>
                </div>
                <span className="text-[9px] text-gray-400 mt-1 px-1">{msg.time}</span>
              </div>
            ))}
            
            {/* Thinking / Analyzing Indicator */}
            {voiceStatus === 'analyzing' && (
              <div className="flex items-center space-x-2 p-2 bg-emerald-50 rounded-2xl border border-emerald-100/55 max-w-[120px] animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                <span className="text-[10px] font-semibold text-emerald-800">Analyzing...</span>
              </div>
            )}

            {/* Speaking / Pulsing Audio Waveform Visualizer */}
            {voiceStatus === 'speaking' && (
              <div className="flex items-center justify-center space-x-1 h-6 bg-emerald-50/30 rounded-full w-24 px-3 py-1 border border-emerald-100/40">
                {[1, 2, 3, 4, 5].map(v => (
                  <span 
                    key={v} 
                    className="w-1 bg-emerald-600 rounded-full animate-bounce" 
                    style={{ 
                      height: `${20 + Math.random() * 80}%`,
                      animationDelay: `${v * 0.15}s`,
                      animationDuration: '0.6s' 
                    }} 
                  />
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts (Chips Drawer) */}
          <div className="p-3 shrink-0 bg-white border-t border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2 px-1">
              {texts.quickPromptsTitle}
            </span>
            <div className="flex flex-col space-y-1.5 max-h-24 overflow-y-auto">
              <button 
                onClick={() => handleChipClick(texts.prompts.soil)}
                className="w-full text-left text-[11px] font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 py-1.5 px-3 rounded-xl transition-all truncate"
              >
                🌱 {texts.prompts.soil}
              </button>
              <button 
                onClick={() => handleChipClick(texts.prompts.budget)}
                className="w-full text-left text-[11px] font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 py-1.5 px-3 rounded-xl transition-all truncate"
              >
                💧 {texts.prompts.budget}
              </button>
              {budgetResult?.alerts && budgetResult.alerts.length > 0 && (
                <button 
                  onClick={() => handleChipClick(texts.prompts.alerts)}
                  className="w-full text-left text-[11px] font-medium text-red-800 bg-red-50 hover:bg-red-100 py-1.5 px-3 rounded-xl transition-all truncate animate-pulse border border-red-200"
                >
                  ⚠️ {texts.prompts.alerts}
                </button>
              )}
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-2 shrink-0 bg-amber-50 border-t border-amber-100 text-[10px] text-amber-800 flex items-start px-4">
              <AlertCircle className="w-3.5 h-3.5 mr-2 shrink-0 text-amber-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Footer (Input + Mic) */}
          <div className="p-4 shrink-0 bg-white border-t border-gray-100 flex items-center space-x-2 rtl:space-x-reverse">
            <button
              onClick={voiceStatus === 'listening' ? stopListening : startListening}
              className={`p-3.5 rounded-full flex items-center justify-center transition-all ${
                voiceStatus === 'listening'
                  ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-100'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
              }`}
              title={voiceStatus === 'listening' ? "Stop recording" : "Talk to advisor"}
            >
              {voiceStatus === 'listening' ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <form onSubmit={handleSendText} className="flex-1 flex items-center space-x-1.5 rtl:space-x-reverse">
              <input 
                type="text" 
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={texts.inputPlaceholder}
                disabled={voiceStatus === 'analyzing'}
                className="flex-1 h-11 px-4 bg-gray-50 hover:bg-gray-100/90 focus:bg-white border-none rounded-2xl text-xs placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/30 transition-all outline-none"
              />
              <button 
                type="submit"
                disabled={!textInput.trim() || voiceStatus === 'analyzing'}
                className="p-3 bg-emerald-600 rounded-2xl hover:bg-emerald-700 disabled:opacity-40 text-white transition-colors"
                title="Send query"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      )}

      {/* Main Activation Button */}
      {inlineTrigger ? (
        <div className="relative w-full h-full">
          <button
            onClick={toggleOpen}
            className={`w-full h-full rounded-full transition-all flex items-center justify-center relative overflow-hidden ${buttonClass}`}
            title="Open AI Farm Advisor"
          >
            {isOpen ? <X className="w-5 h-5" /> : <MessageSquare className="w-5 h-5 animate-bounce-subtle" />}
          </button>
        </div>
      ) : (
        <button
          onClick={toggleOpen}
          className={`p-5 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center relative overflow-hidden ${buttonClass}`}
          title="Open AI Farm Advisor"
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6 animate-bounce-subtle" />}
        </button>
      )}
    </>
  );
};

export default VoiceAssistant;

