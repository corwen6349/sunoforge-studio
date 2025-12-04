
import { LiveModifier, MusicStyle, AIProvider, AIModel } from './types';

export const MUSIC_STYLES: MusicStyle[] = [
  { id: 'auto', label: '自动匹配 (Auto)', value: '', icon: 'Sparkles' },
  { id: 'pop', label: '流行 (Pop)', value: 'Pop, Catchy, Melodic, Polished', icon: 'Music2' },
  { id: 'rock', label: '摇滚 (Rock)', value: 'Rock, Electric Guitar, Driving, Energetic', icon: 'Guitar' },
  { id: 'jazz', label: '爵士 (Jazz)', value: 'Jazz, Swing, Saxophone, Double Bass, Smooth', icon: 'Saxophone' }, 
  { id: 'classical', label: '古典 (Classical)', value: 'Classical, Orchestral, Piano, Strings, Cinematic', icon: 'Piano' }, 
  { id: 'rap', label: '说唱 (Rap)', value: 'Hip Hop, Rap, Trap, Heavy Bass, Rhythmic, Flow', icon: 'Mic' },
  { id: 'electronic', label: '电子 (Electronic)', value: 'Electronic, Synth, EDM, Dance, Futuristic', icon: 'Zap' },
  { id: 'rnb', label: 'R&B', value: 'R&B, Soul, Groovy, Smooth Vocals, Emotional', icon: 'Heart' },
  { id: 'folk', label: '民谣 (Folk)', value: 'Folk, Acoustic Guitar, Storytelling, Warm, Indie', icon: 'TreePine' },
  { id: 'metal', label: '金属 (Metal)', value: 'Heavy Metal, Distortion, Aggressive, Fast Tempo', icon: 'Skull' },
];

export const LIVE_MODIFIERS: LiveModifier[] = [
  {
    id: 'live_crowd',
    label: '现场观众氛围',
    description: '增加观众噪音、欢呼声和体育场混响效果 (Stadium Reverb)。',
    icon: 'Users'
  },
  {
    id: 'harmonies',
    label: '丰富和声',
    description: '生成背景人声、层叠和声以及复杂的和声结构 (Layered Vocals)。',
    icon: 'Mic2'
  },
  {
    id: 'spoken_word',
    label: '口白与互动',
    description: '添加与观众的真实口语互动或独白 (Spoken Word/Monologue)。',
    icon: 'MessageSquare'
  },
  {
    id: 'humming_intro',
    label: '哼唱旋律',
    description: '加入随意的哼唱、吟唱作为前奏或过门 (Humming/Crooning)。',
    icon: 'Music'
  },
  {
    id: 'imperfect_raw',
    label: '原始不完美感',
    description: '模仿现场呼吸声、微小的拍子偏差和原始能量 (Raw Production)。',
    icon: 'Zap'
  },
  {
    id: 'count_in',
    label: '录音室倒数/前奏',
    description: '歌曲开始前的 "1, 2, 3, 4" 倒数或试音声音 (Studio Chatter)。',
    icon: 'Timer'
  },
  {
    id: 'voice_cracks',
    label: '情感哽咽/破音',
    description: '模拟情绪激动时的声音颤抖或破音 (Voice Cracks/Tremolo)。',
    icon: 'HeartCrack'
  },
  {
    id: 'laugh_giggle',
    label: '笑场与轻笑',
    description: '歌手在演唱间隙的自然笑声或轻笑 (Giggle/Laughter)。',
    icon: 'Smile'
  },
  {
    id: 'heavy_breath',
    label: '呼吸声与叹息',
    description: '强调换气声、深呼吸或情感叹息 (Heavy Breathing/Sighs)。',
    icon: 'Wind'
  },
  {
    id: 'acapella_break',
    label: '清唱片段',
    description: '突然停止伴奏，只保留人声演唱 (Acapella/Breakdown)。',
    icon: 'Mic'
  },
  {
    id: 'emotional_adlibs',
    label: '情感即兴 (Ad-libs)',
    description: '插入富有表现力的即兴唱段、呐喊和情感纹理 (Emotional Vocal)。',
    icon: 'Sparkles'
  },
  {
    id: 'extended_jam',
    label: '延长器乐演奏',
    description: '增加独奏段落 (Solo) 和延长的器乐间奏 (Extended Outro)。',
    icon: 'Guitar'
  },
  {
    id: 'vocal_texture',
    label: '人声质感/气声',
    description: '强调歌手的呼吸声、气泡音或嘶哑感 (Breathy/Raspy Vocals)。',
    icon: 'Waves'
  },
  {
    id: 'call_response',
    label: '呼喊与回应',
    description: '歌手与人群或乐器之间的互动段落 (Call and Response)。',
    icon: 'Megaphone'
  },
  {
    id: 'room_tone',
    label: '录音室底噪',
    description: '增加真实的房间环境音和设备底噪 (Room Tone/Ambience)。',
    icon: 'Speaker'
  }
];

export const EXAMPLE_PROMPTS = [
  "一首关于机器人在赛博朋克城市发现情感的合成器浪潮 (Synthwave) 歌曲",
  "一首关于离家远行的原声民谣，带有淡淡的忧伤",
  "充满活力的 K-Pop 夏日恋爱赞歌",
  "关于一把丢失吉他的粗犷三角洲蓝调 (Delta Blues)"
];

export const AI_PROVIDERS: { id: AIProvider; name: string }[] = [
  { id: 'google', name: 'Google Gemini' },
  { id: 'deepseek', name: 'DeepSeek' }
];

export const AI_MODELS: AIModel[] = [
  // Google Models
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'google' },
  
  // DeepSeek Models
  { id: 'deepseek-chat', name: 'DeepSeek V3 (Chat)', provider: 'deepseek' },
  { id: 'deepseek-reasoner', name: 'DeepSeek R1 (Reasoner)', provider: 'deepseek' },
];
