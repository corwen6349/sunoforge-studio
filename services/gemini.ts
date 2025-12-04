
import { GoogleGenAI, Type } from "@google/genai";
import { LIVE_MODIFIERS, MUSIC_STYLES } from "../constants";
import { AIProvider } from "../types";

// Knowledge base derived from Suno Wiki / Community Best Practices
const SUNO_KNOWLEDGE_BASE = `
  Suno AI Best Practices & Tagging Guide:
  
  1. Structure Tags (Metatags):
     - [Intro]: Start of song.
     - [Verse]: Storytelling sections.
     - [Pre-Chorus]: Build up tension.
     - [Chorus]: Main hook, energetic.
     - [Bridge]: Shift in mood/tempo.
     - [Solo] / [Instrumental Interlude]: Instrumental sections.
     - [Outro] / [Fade Out] / [Big Finish]: Ending styles.
  
  2. Vocal/Performance Tags:
     - [Spoken Word], [Narration]: For non-singing parts.
     - [Whisper], [Shout], [Scream], [Whistle]: Vocal textures.
     - [Female Narrator], [Male Announcer]: Specific voice types.
     - [Child Singer], [Kids Choir]: Youthful voices.
     - [Elderly Singer], [Gravelly Voice]: Mature voices.
     - [Audience Cheering], [Applause], [Crowd Noise]: Live ambience.
     - [Backing Vocals], [Choir], [Harmony]: Layered voices.
     - [Humming], [Crooning]: For melody humming.
     - [Laughter], [Giggle]: For natural reactions.
     - [Sigh], [Breathing]: For emotional pauses.
     - [Voice Crack], [Sobbing]: For intense emotion.
  
  3. Style Prompt Keywords (Genre & Vibe):
     - "Live Recording", "Concert Hall", "Acoustic Room", "Lo-fi Production".
     - "Raw", "Unpolished", "Reverb", "Echo", "Intimate".
     - "Anthemic", "Driving", "Soaring", "Melancholic".
`;

// Helper to clean JSON string from Markdown code blocks
const cleanJsonString = (str: string) => {
  return str.replace(/```json\n?|```/g, '').trim();
};

// DeepSeek API Handler
const generateWithDeepSeek = async (
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string
) => {
  // R1 (deepseek-reasoner) often returns thinking process, and might not support json_object strict mode.
  // V3 (deepseek-chat) supports json_object.
  const isV3 = model === 'deepseek-chat';
  
  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        stream: false,
        // Only use JSON mode for V3 to avoid errors on R1 or other models
        response_format: isV3 ? { type: "json_object" } : undefined
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`DeepSeek API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) throw new Error("No content returned from DeepSeek");
    
    // Parse JSON manually
    const jsonStr = cleanJsonString(content);
    return JSON.parse(jsonStr);

  } catch (error) {
    console.error("DeepSeek Request Failed:", error);
    throw error;
  }
};

export const generateRandomTopic = async (
  provider: AIProvider = 'google',
  model: string = 'gemini-2.5-flash',
  deepseekApiKey?: string
): Promise<string> => {
  const promptText = "请生成一个富有创意、画面感强且适合制作成歌曲的主题描述（中文）。只需返回这一段描述文字，不要包含任何前缀或解释。例如：“一个孤独的宇航员在火星看着地球升起，思念家乡的民谣”。";
  
  if (provider === 'deepseek') {
    if (!deepseekApiKey) throw new Error("DeepSeek API Key is missing");
    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deepseekApiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: promptText }],
          stream: false
        })
      });
      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || "无法从 DeepSeek 获取主题";
    } catch (e) {
       console.error(e);
       return "在一个赛博朋克风格的雨夜，侦探在霓虹灯下寻找失落的记忆。";
    }
  }

  // Default to Gemini
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: model.startsWith('gemini') ? model : 'gemini-2.5-flash',
      contents: promptText
    });
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Error generating random topic:", error);
    return "在一个赛博朋克风格的雨夜，侦探在霓虹灯下寻找失落的记忆。"; 
  }
};

export const generateSong = async (
  topic: string, 
  modifierIds: string[], 
  mode: 'single' | 'album' = 'single',
  voiceType: 'auto' | 'male' | 'female' | 'child' | 'elderly' | 'androgynous' = 'auto',
  musicalStyleId: string = 'auto',
  referenceAudio?: { data: string, mimeType: string },
  referenceLink?: string,
  // AI Config Params
  provider: AIProvider = 'google',
  modelId: string = 'gemini-2.5-flash',
  deepseekApiKey?: string
) => {
  const selectedModifiers = LIVE_MODIFIERS.filter(m => modifierIds.includes(m.id));
  const selectedStyle = MUSIC_STYLES.find(s => s.id === musicalStyleId);
  
  const modifierDescriptions = selectedModifiers.map(m => `- ${m.label} (${m.description})`).join('\n');

  // Construct vocal preference string
  let vocalInstruction = "";
  switch (voiceType) {
    case 'male':
      vocalInstruction = "STRICTLY use 'Male Vocals' in Style Prompt. Add tags like [Male Singer] where appropriate.";
      break;
    case 'female':
      vocalInstruction = "STRICTLY use 'Female Vocals' in Style Prompt. Add tags like [Female Singer] where appropriate.";
      break;
    case 'child':
      vocalInstruction = "STRICTLY use 'Child Vocals', 'Youthful Voice', or 'Kids Choir' in Style Prompt. Add tags like [Child Singer] where appropriate.";
      break;
    case 'elderly':
      vocalInstruction = "STRICTLY use 'Elderly Vocals', 'Mature Voice', or 'Gravelly Voice' in Style Prompt. Add tags like [Elderly Singer] where appropriate.";
      break;
    case 'androgynous':
      vocalInstruction = "STRICTLY use 'Androgynous Vocals' or 'Gender Neutral Voice' in Style Prompt. Add tags like [Androgynous Singer] where appropriate.";
      break;
    default:
      vocalInstruction = "Select the most appropriate vocal type (Male/Female/Mixed/Choir) based on the genre and mood.";
      break;
  }

  // Construct style preference string
  let styleInstruction = "Determine the best musical genre and vibe based on the user's topic.";
  if (selectedStyle && selectedStyle.id !== 'auto') {
    styleInstruction = `The user has explicitly selected the musical style: "${selectedStyle.label}". You MUST include the following keywords in the Style Prompt: "${selectedStyle.value}". Combine these with other fitting descriptors.`;
  }

  // Handle Mimic Mode Logic
  let mimicInstruction = "";
  if (referenceAudio || referenceLink) {
    styleInstruction = "IGNORE user's manual style selection if it conflicts. ANALYZE the provided audio/reference input.";
    mimicInstruction = `
      **MIMIC MODE ACTIVATED**
      ${referenceAudio ? "An audio file has been provided." : ""}
      ${referenceLink ? `A reference link has been provided: ${referenceLink}` : ""}
      
      YOUR TASK:
      1. ANALYZE the audio/reference to determine its: BPM, Genre, Instruments, Vocal Style, and Production Vibe.
      2. GENERATE a Style Prompt that perfectly matches this reference.
      3. WRITE lyrics about the user's TOPIC ("${topic}"), but fit the flow/meter of the reference style.
    `;
  }

  const baseInstructions = `
    You are an expert Suno AI music producer. Use the provided "Suno Knowledge Base" to generate professional-grade prompts.
    
    ${SUNO_KNOWLEDGE_BASE}

    The user has requested the following "Humanization/Live" elements:
    ${modifierDescriptions}

    Vocal Preference: ${vocalInstruction}
    Musical Style Preference: ${styleInstruction}
    
    ${mimicInstruction}

    CRITICAL INSTRUCTION:
    - You MUST explicitly include relevant Metatags in the lyrics (e.g., [Spoken: "One, two..."], [Audience Cheering], [Humming], [Laughter]) based on the selected modifiers.
    - The "Style Prompt" MUST include specific technical terms like 'Live', 'Raw', 'Acoustic', 'Reverb', 'Studio Chatter' if requested.
    - The "Style Prompt" MUST include the vocal gender/type as specified in preferences.
    - The "Style Prompt" MUST prioritize the selected musical style keywords if provided (unless Mimic Mode is active, then prioritize the reference).
    - OUTPUT MUST BE VALID JSON ONLY. NO MARKDOWN, NO COMMENTARY.
  `;

  let userPrompt = '';
  
  // JSON Schema definition for prompt injection (used for DeepSeek which lacks strict Schema objects in some SDKs)
  const jsonStructureHint = `
    Respond in strict JSON format with the following structure:
    {
      "type": "single" | "album",
      "title": "string",
      "albumTitle": "string (optional)",
      "trackList": [ { "position": number, "title": "string", "style": "string", "duration": "string" } ] (optional),
      "stylePrompt": "string",
      "lyrics": "string",
      "coverArtPrompt": "string",
      "explanation": "string",
      "musicalKey": "string",
      "bpm": "string",
      "chordProgression": ["string"]
    }
  `;

  if (mode === 'single') {
    userPrompt = `
      ${baseInstructions}
      
      Create a complete SINGLE SONG production plan based on the theme: "${topic}".

      Requirements:
      1. **Title**: A catchy title in Chinese.
      2. **Style Prompt**: Comma-separated tags optimized for Suno. Combine genre + vibe + technical modifiers + vocal type (e.g., 'J-Pop, Live Concert, Stadium Reverb, Female Vocals'). Keep tags in English.
      3. **Lyrics**: Full lyrics in Chinese.
         - STRICTLY use standard Suno metatags in English (e.g., [Verse], [Chorus]).
         - Format Lyrics: Use clear line breaks between sections.
         - Place section headers (e.g. [Verse 1], [Chorus]) on their own lines.
         - Integrate specific "Live" interactions if modifiers are selected (e.g., [Crowd: "Hey! Hey!"], [Singer: "Let me hear you!"], [Humming]).
      4. **Cover Art**: Visual description for the single cover.
      5. **Explanation**: Brief Chinese explanation of how these tags enhance the live/human feel (or mimic the reference).
      6. **Musical Composition**: Suggest a Musical Key, BPM, and a Chord Progression for the main hook.

      ${jsonStructureHint}
    `;
  } else {
    userPrompt = `
      ${baseInstructions}
      
      Create a CONCEPT ALBUM production plan based on the theme: "${topic}".

      Requirements:
      1. **Title**: The name of the LEAD SINGLE (Main Focus Track) of the album in Chinese.
      2. **Album Title**: A creative name for the full Album.
      3. **Tracklist**: Generate a tracklist of 6-8 songs that tell a story. For each track, provide a title and a 2-3 word style description.
      4. **Style Prompt**: The Suno Style Prompt for the LEAD SINGLE. Keep tags in English.
      5. **Lyrics**: Full lyrics for the LEAD SINGLE (Focus Track) only. Use Chinese lyrics with English Suno metatags ([Verse], [Chorus], etc.). Ensure headers are on new lines.
      6. **Cover Art**: Visual description for the ALBUM cover.
      7. **Explanation**: Brief Chinese explanation of the album concept and live production choices.
      8. **Musical Composition**: Suggest a Musical Key, BPM, and a Chord Progression for the Lead Single.

      ${jsonStructureHint}
    `;
  }

  // --- DEEPSEEK HANDLER ---
  if (provider === 'deepseek') {
    if (!deepseekApiKey) throw new Error("Please enter your DeepSeek API Key in Settings.");
    
    // DeepSeek cannot process image/audio binary directly in this simplified flow via standard chat completions usually without specific multimodal endpoints.
    // If referenceAudio is present, we might need to warn user or use text description if we can't upload.
    // However, DeepSeek V3 is text-centric mostly (multimodal exists but varies). 
    // For this implementation, we will assume Text-Only prompt if DeepSeek is used, or warn if audio is present.
    if (referenceAudio) {
      console.warn("DeepSeek provider currently supports text-only prompts in this implementation. Audio ignored.");
    }

    const result = await generateWithDeepSeek(deepseekApiKey, modelId, "You are a helpful AI music assistant.", userPrompt);
    
    // Fallback ensure type
    result.type = mode;
    return {
      ...result,
      id: crypto.randomUUID(),
      createdAt: Date.now()
    };
  }

  // --- GOOGLE GEMINI HANDLER ---
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Prepare contents for multimodal request
  const reqContents: any[] = [];
  
  if (referenceAudio) {
    reqContents.push({
      inlineData: {
        mimeType: referenceAudio.mimeType,
        data: referenceAudio.data
      }
    });
  }
  
  // Note: We strip the raw JSON structure hint for Gemini SDK because we use responseSchema below, 
  // but keeping it in text prompt doesn't hurt and reinforces the instruction.
  reqContents.push({ text: userPrompt });

  try {
    const response = await ai.models.generateContent({
      model: modelId.startsWith('gemini') ? modelId : 'gemini-2.5-flash',
      contents: reqContents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ["single", "album"] },
            title: { type: Type.STRING, description: "Song title (or Lead Single title if album)" },
            albumTitle: { type: Type.STRING, description: "Album title (only if album mode)" },
            trackList: {
              type: Type.ARRAY,
              description: "List of tracks if album mode",
              items: {
                type: Type.OBJECT,
                properties: {
                  position: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  style: { type: Type.STRING },
                  duration: { type: Type.STRING }
                }
              }
            },
            stylePrompt: { type: Type.STRING },
            lyrics: { type: Type.STRING },
            coverArtPrompt: { type: Type.STRING },
            explanation: { type: Type.STRING },
            musicalKey: { type: Type.STRING, description: "Key of the song (e.g. C Major)" },
            bpm: { type: Type.STRING, description: "Tempo in BPM (e.g. 120)" },
            chordProgression: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Main chord progression array (e.g. ['C', 'G', 'Am', 'F'])" 
            }
          },
          required: ["title", "stylePrompt", "lyrics", "coverArtPrompt"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const result = JSON.parse(text);
    
    result.type = mode;

    return {
      ...result,
      id: crypto.randomUUID(),
      createdAt: Date.now()
    };
  } catch (error) {
    console.error("Error generating song:", error);
    throw new Error("生成失败，请检查网络、API Key 或重试。(如果上传了音频，文件可能过大)");
  }
};
