
# SunoForge Studio 🎵

SunoForge Studio 是一个专业的 AI 音乐制作辅助工具，专为 Suno AI（以及其他音乐生成模型）设计。它利用 Google Gemini 和 DeepSeek 的强大能力，帮助用户生成高质量、结构严谨且富有创意的音乐提示词（Prompts）、歌词和专辑概念。

![SunoForge Studio Screenshot](https://via.placeholder.com/1200x600?text=SunoForge+Studio+Interface)

## ✨ 主要功能

*   **多模型支持 (Multi-Model Support)**：
    *   **Google Gemini**：内置支持 Gemini 2.5 Flash / 2.0 Flash，响应速度快，多模态能力强。
    *   **DeepSeek**：集成 DeepSeek V3 (Chat) 和 R1 (Reasoner) 模型，提供卓越的推理能力和中文创作体验。
*   **专业提示词生成**：基于音乐理论和 Suno 社区的最佳实践，生成包含元标签（Metatags）的专业提示词。
*   **多模式创作**：
    *   **单曲模式**：生成单曲的完整结构、歌词和风格描述。
    *   **专辑模式**：构思整张专辑的概念，生成曲目列表（Tracklist）及主打歌详情。
*   **拟人化/现场要素 (Live Elements)**：一键添加“录音室倒数”、“观众欢呼”、“呼吸声”、“情感破音”等 15+ 种拟人化标签，让 AI 音乐听起来更像真人演绎。
*   **风格模仿 (Mimic Mode)**：
    *   支持上传音频文件或粘贴链接。
    *   利用 AI 分析参考音频的风格、BPM 和氛围，生成风格相似的新歌（*注：多模态音频分析目前主要由 Gemini 模型支持*）。
*   **MIDI 导出**：根据生成的和弦进行（Chord Progression），一键导出 `.mid` 文件，方便在 DAW 中二次创作。
*   **高级配置**：
    *   支持多种人声类型（男声、女声、童声、老年声、中性声）。
    *   内置 10+ 种主流音乐风格预设。
*   **格式导出**：支持导出为 TXT 文本、JSON 数据或复制到剪贴板。
*   **美观界面**：支持浅色/深色/跟随系统主题，响应式设计，适配移动端。

## 🛠️ 技术栈

*   **Frontend**: React 19, TypeScript
*   **Styling**: Tailwind CSS
*   **Icons**: Lucide React
*   **AI Engine**: 
    *   Google Gemini API (`@google/genai` SDK)
    *   DeepSeek API (REST)
*   **Build**: 推荐使用 Vite (当前代码结构适配 ES Modules)

## 🚀 快速开始 (本地开发)

### 1. 初始化项目

如果你还没有项目环境，可以创建一个新的 Vite 项目并将代码复制进去：

```bash
npm create vite@latest suno-forge -- --template react-ts
cd suno-forge
npm install
```

### 2. 安装依赖

安装本项目所需的依赖包：

```bash
npm install @google/genai lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 3. 配置 Tailwind CSS

修改 `tailwind.config.js`：

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // 重要：开启 class 模式以支持主题切换
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        suno: {
          900: '#0f0f13',
          800: '#18181b',
          700: '#27272a',
          600: '#52525b',
        }
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      }
    },
  },
  plugins: [],
}
```

### 4. 设置环境变量

在项目根目录创建 `.env` 文件，并填入你的 API Keys。本项目支持通过环境变量预配置 Key，方便容器化部署。

```env
# Google Gemini API Key (必须)
VITE_API_KEY=your_google_gemini_api_key_here

# DeepSeek API Key (可选，如果未配置，用户需在网页设置中手动输入)
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

*注意：在 Vite 环境下，代码中使用 `process.env.API_KEY` 或 `process.env.DEEPSEEK_API_KEY` 时，请确保你的打包工具（如 vite.config.ts 中的 `define`）能够正确注入这些变量。*

### 5. 运行项目

```bash
npm run dev
```

## ⚙️ 模型配置与 API Key

### Google Gemini
*   **配置方式**：通常通过环境变量 (`.env`) 配置。
*   **获取 Key**：前往 [Google AI Studio](https://aistudio.google.com/) 免费申请。

### DeepSeek
*   **配置方式**：
    1.  **推荐**：用户可以在应用界面左下角的 **"设置" (Settings)** 页面中手动输入 Key。该 Key 仅存储在浏览器的 LocalStorage 中。
    2.  **部署时配置**：开发者可以通过环境变量 `DEEPSEEK_API_KEY` 预置 Key（适用于私有部署）。
*   **获取 Key**：前往 [DeepSeek 开放平台](https://platform.deepseek.com/) 申请。

## 📦 部署指南 (Vercel / Netlify)

本项目是一个纯静态的单页应用（SPA），非常容易部署。

### Vercel 部署

1.  将代码推送到 GitHub/GitLab。
2.  登录 Vercel 并导入项目。
3.  在 **Environment Variables** (环境变量) 设置中添加：
    *   Key: `API_KEY` (或 `VITE_API_KEY`，视具体配置而定) -> Value: Google Key
    *   Key: `DEEPSEEK_API_KEY` (可选) -> Value: DeepSeek Key
4.  点击 **Deploy**。

### Netlify 部署

1.  将代码推送到 GitHub。
2.  在 Netlify 中 "New site from Git"。
3.  在 **Site configuration** -> **Environment variables** 中添加 API Keys。
4.  点击 **Deploy site**。

## 📄 许可证

MIT License.

---

**SunoForge Studio** - 让 AI 音乐创作更具灵魂。
