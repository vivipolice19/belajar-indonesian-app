# Design Guidelines: Indonesian Language Learning PWA

## Design Approach
**Reference-Based Approach** inspired by **Duolingo** (gamified learning), **Kahoot** (quiz engagement), and **Habitica** (habit tracking). This app prioritizes playful engagement and progression visibility to motivate daily learning.

## Core Design Principles
1. **Playful & Approachable**: Rounded corners, friendly shapes, celebration moments
2. **Progress Transparency**: Always-visible XP/level indicators
3. **Immediate Feedback**: Instant visual rewards for all interactions
4. **Mobile-First**: Touch-friendly targets, thumb-zone optimization

## Typography System
- **Primary Font**: Nunito (Google Fonts) - playful, rounded, highly legible
- **Hierarchy**:
  - App Title/Headers: 700 weight, text-2xl to text-3xl
  - Level/XP Display: 800 weight, text-xl
  - Card Content: 600 weight, text-lg
  - Body Text: 400 weight, text-base
  - Microcopy: 400 weight, text-sm

## Layout System
**Spacing Primitives**: Tailwind units of 3, 4, 6, 8, 12 for consistent rhythm
- Card padding: p-6
- Section gaps: gap-4 to gap-6
- Screen padding: px-4 py-6
- Component spacing: space-y-4

## Component Library

### Header Bar (Fixed Top)
- Contains: Mascot icon (left), XP/Level display (center), Streak counter (right)
- Height: h-16
- Background: Slightly elevated with subtle shadow
- XP Progress Bar: Full-width bar underneath header (h-2, rounded-full)

### Mascot Character
- Simple SVG face icon (circle with eyes and smile)
- Size: w-12 h-12 in header, w-24 h-24 when featured
- Expressions: 3 states (neutral, happy when XP gained, celebrating on level-up)

### Word Cards (Flashcards)
- Large tap target: min-h-48, rounded-2xl
- Layout: Centered Indonesian word (text-2xl, font-bold), Japanese meaning below (text-lg)
- Transform on tap: Brief scale animation (scale-95)
- Speaker icon: Bottom-right corner for pronunciation

### Quiz Interface
- Question card at top: rounded-xl, p-6
- 4 answer buttons: Full-width, h-14, rounded-lg, gap-3
- Feedback state: Correct (green pulse), Wrong (red shake) - described via animation classes

### Mini-Game Card
- Timer display: Large circular progress (w-32 h-32), countdown in center
- Tap zone: Large central button (w-40 h-40, rounded-full)
- Score popup: Floating +XP indicator that fades upward

### Daily Mission Panel
- Compact card: p-4, rounded-lg
- Checkbox + Mission text (horizontal layout)
- Bonus XP indicator (text-sm, subtle)

### Level-Up Modal
- Full-screen overlay with backdrop blur
- Center card: p-8, rounded-2xl, max-w-sm
- Contains: Large level number, mascot celebration, "Continue" button

### Navigation Tabs (Bottom)
- Fixed bottom bar: h-16
- 4 tabs: Cards, Quiz, Game, Progress
- Icon + label layout, active state with indicator

## Interaction Patterns
- **Tap Feedback**: All interactive elements scale slightly on touch (active:scale-95)
- **XP Gain**: +XP number floats up and fades (animate-bounce then fade)
- **Streak Flame**: Subtle pulse animation when active
- **Card Flip**: 180deg rotate on tap (transform transition)
- **Progress Bar**: Smooth width transition when XP increases

## Screen Layouts

### Home Screen
- Header (XP bar + stats)
- Mascot greeting section: py-6
- Daily mission card
- Quick action buttons: 3 large rounded cards in vertical stack (gap-4)
  - "Practice Words" 
  - "Take Quiz"
  - "Play Mini-Game"

### Word Cards Screen
- Header with count (e.g., "Card 3/10")
- Large centered flashcard
- Previous/Next buttons at bottom (horizontal layout, gap-4)
- Navigation: Swipe gestures suggested with subtle arrows

### Quiz Screen
- Question counter at top
- Question card
- 4 answer buttons grid
- Results summary card after completion

### Progress Screen
- Large level circle at top
- XP breakdown (today, total)
- Streak calendar (7-day grid with checkmarks)
- Statistics cards (words learned, quizzes completed)

## Accessibility
- Touch targets: Minimum 44x44px (h-11 or larger)
- Focus indicators: Ring offset on keyboard navigation
- Font scaling: Use rem units, support system text size preferences
- Contrast: Ensure readable text in all states

## PWA Elements
- Install prompt: Dismissible banner at bottom (first visit only)
- Offline indicator: Subtle toast when connection lost
- App icon: 512x512 mascot design with solid background

**No hero images needed** - This is a mobile utility app focused on cards and UI components rather than marketing imagery. All visual interest comes from the mascot, progress indicators, and interactive game elements.