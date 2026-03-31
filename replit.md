# インドネシア語学習アプリ - Belajar

## Overview
Belajarは、インドネシア語を楽しく学べるPWA（Progressive Web App）です。マスコットキャラクター、学習ゲーム（タイピング、マッチング）、**無限ランダム学習システム**、そして**Google Gemini APIによる無限AI学習コンテンツ生成**を通じて、ユーザーが飽きずに継続的に学習できることを目指しています。主要機能として、単語カード、文章学習、4択クイズ、音声発音（Web Speech API + 音響効果）、**AI単語生成、AI文章生成、高度翻訳**などがあります。PWA対応により、オフラインでの利用やホーム画面への追加も可能です。

**重要な設計方針**: 
- **シンプルな学習体験**: XP・レベル・ログインボーナス・デイリーミッションなどのゲーミフィケーション要素は削除し、純粋な学習に集中
- **レベル制限なし**: 全ての学習コンテンツ（基本150語、文章40文）が最初から利用可能
- **無限ランダム**: カード学習とクイズは無限にランダム出題され、終わりがない（最近30問は重複を避ける）
- **AI無限学習**: Google Gemini API（gemini-2.5-flash）を使用して、テーマ・難易度・シチュエーションに応じた単語・文章を無限に生成。**サーバー側でAPIキーを管理するため、ユーザーはAPIキー設定不要で即座に利用可能**
- **高度翻訳**: 日本語⇔インドネシア語の本格翻訳に加え、文法解説・用例・発音ガイドを提供（翻訳方向に応じて適切な言語で文法解説）

## User Preferences
I prefer iterative development. Ask before making major architectural changes or introducing new libraries. I appreciate clear, concise explanations and prefer to focus on high-level features first, then dive into details. I do not want the agent to make changes to folder `shared/`.

## System Architecture
### UI/UX Decisions
- **Color Scheme**: Primary orange, accent yellow.
- **Font**: Nunito (rounded, playful).
- **Animations**: Custom CSS for engaging user experience.
- **Responsive Design**: Mobile-first approach.
- **Components**: MascotIcon, Header (simplified - mascot + theme toggle), BottomNav (no level restrictions).

### Technical Implementations
- **Simplified Design** (Updated 2026-02-02):
    - XP、レベル、ストリーク、ログインボーナス、デイリーミッションを完全削除
    - 純粋な学習体験に集中したシンプルなUI
    - 進捗ページは学習した単語・文章・発音練習の統計のみを表示
- **AI-Powered Learning** (Gemini API):
    - **AI無限単語カード**: Google Gemini gemini-2.5-flash generates unlimited vocabulary based on user-selected themes and difficulty levels.
    - **AI無限文章学習**: Generates unlimited Indonesian sentences based on situations and difficulty levels.
    - **AI高度翻訳**: Advanced translation service supporting Japanese↔Indonesian with comprehensive grammar explanations (in appropriate language based on translation direction), pronunciation guides, and contextual example sentences.
    - **サーバー管理APIキー**: APIキーはサーバー側の環境変数（GEMINI_API_KEY）で管理。
    - **Rate Limiting**: p-retry with exponential backoff retries to handle Gemini API rate limits gracefully.
- **Basic Learning Features**:
    - **Word Cards**: 150 Indonesian words with flashcard format, tap to reveal Japanese meaning, audio pronunciation. **All words available from start, displayed in infinite random shuffled order**.
    - **Sentence Learning**: 40 Indonesian sentences with flashcard format, audio pronunciation. **All sentences available from start, displayed in infinite random shuffled order**.
    - **Quizzes**: Infinite word quiz and infinite sentence quiz with 4-choice format. **Smart randomization avoids repeating recent 30 questions** using localStorage. Features prominent audio pronunciation buttons using Web Speech API + **sound effects (correct: ping-pong sound, incorrect: buzzer sound)** using Web Audio API.
    - **Typing Game**: Type Indonesian words from Japanese meanings (60 seconds), with "show answer" and "skip" options.
    - **Matching Game**: Pair Indonesian words with Japanese meanings (6 pairs).
- **PWA Features**: Offline functionality via Service Worker caching, ability to add to home screen, responsive design.
- **Progress Tracking**: Simple learning statistics (words/sentences learned, pronunciations practiced, quizzes completed) stored in localStorage.

### Feature Specifications
- **Mascot Character**: Visual feedback based on learning progress.
- **Infinite Random Learning**: All word and sentence content is available from the start. Content is presented in randomized infinite loops.
- **Audio Pronunciation**: Integrated Web Speech API for all words, sentences, and quiz questions.
- **Sound Effects**: Web Audio API generates ping-pong sound for correct quiz answers and buzzer sound for incorrect answers.
- **Quizzes**: Multiple-choice format for both words and sentences with infinite random question generation.

## External Dependencies
- **React 18 + TypeScript**: Core frontend framework.
- **Wouter**: Client-side routing.
- **TailwindCSS + shadcn/ui**: Styling and UI component library.
- **Lucide React**: Icon library.
- **LocalStorage**: For client-side data persistence (learning progress).
- **PWA Manifest & Service Worker**: For PWA capabilities (offline support, home screen installation).
- **Web Speech API**: For Indonesian pronunciation (words, sentences, quiz questions).
- **Web Audio API**: For sound effects (correct/incorrect quiz answer feedback).
- **Google Gemini API**: gemini-2.5-flash for AI content generation (vocabulary, sentences, translation). APIキーはサーバー側で管理（GEMINI_API_KEY環境変数）。
- **p-retry**: Rate limiting and retry logic for Gemini API calls.
- **Express Backend**: Server-side API endpoints for AI features.
