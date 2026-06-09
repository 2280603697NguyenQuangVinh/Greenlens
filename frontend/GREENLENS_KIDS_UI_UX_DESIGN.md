# GreenLens Kids - UI/UX Design System

## Overview
GreenLens Kids is an educational mobile and web application designed for children aged 6-12 to learn waste classification through interactive learning and gamification. This design system ensures a playful, colorful, and intuitive experience that encourages environmental awareness.

---

## 1. Overall Design System

### 1.1 Application Color System

#### Primary Color Palette
- **Primary Green**: `#4ADE80` (Light Green) - Main action buttons, highlights
- **Secondary Green**: `#22C55E` (Medium Green) - Secondary actions, progress indicators
- **Dark Green**: `#166534` (Forest Green) - Text, important information
- **Background Green**: `#E8F8EF` (Mint Green) - App background, safe areas

#### Secondary Color Palette
- **Accent Orange**: `#F97316` - XP points, achievements, important alerts
- **Accent Yellow**: `#EAB308` - Stars, rewards, level indicators
- **Accent Purple**: `#A855F7` - Quiz elements, brain/challenge features
- **Accent Blue**: `#3B82F6` - Camera, technology features, mini-games
- **Accent Red**: `#EF4444` - Errors, warnings, incorrect answers

#### Neutral Colors
- **White**: `#FFFFFF` - Cards, modals, content areas
- **Light Gray**: `#F3F4F6` - Disabled states, subtle backgrounds
- **Medium Gray**: `#9CA3AF` - Secondary text, placeholders
- **Dark Gray**: `#374151` - Primary text, headings

#### Color Usage Guidelines
- Use primary green for main CTAs and positive feedback
- Use accent colors to differentiate feature areas (purple for quiz, blue for camera, orange for rewards)
- Maintain high contrast ratios (minimum 4.5:1 for text)
- Avoid using more than 3-4 colors per screen to prevent visual overload
- Use color consistently across similar elements (e.g., all XP indicators use orange)

### 1.2 Typography

#### Font Family
- **Primary Font**: 'Nunito' (Google Fonts) - Rounded, friendly, highly readable
- **Fallback**: System sans-serif fonts

#### Font Scale

**Headings**
- **H1 (Hero)**: 32px / 40px (mobile/desktop), font-weight: 900 (Black)
- **H2 (Section)**: 24px / 28px, font-weight: 800 (Extra Bold)
- **H3 (Card Title)**: 20px / 24px, font-weight: 700 (Bold)

**Body Text**
- **Body Large**: 18px / 20px, font-weight: 600 (Semi-Bold)
- **Body Regular**: 16px / 18px, font-weight: 500 (Medium)
- **Body Small**: 14px / 16px, font-weight: 500 (Medium)

**Interactive Elements**
- **Button Text**: 18px / 20px, font-weight: 700 (Bold)
- **Navigation Labels**: 10px / 12px, font-weight: 700 (Bold)
- **Captions/Labels**: 12px / 14px, font-weight: 600 (Semi-Bold)

#### Typography Guidelines
- Use sentence case for all UI elements (except proper nouns)
- Maintain generous line spacing (1.4-1.6 for body text)
- Use bold weights for emphasis, avoid italics (harder for children to read)
- Ensure minimum font size of 14px for readability
- Use uppercase sparingly, only for very short labels (2-3 characters)

### 1.3 Overall Component Design Philosophy

#### Design Principles
- **Rounded Corners**: All elements use generous border-radius (12px-24px) for friendly appearance
- **Large Touch Targets**: Minimum 44x44px for interactive elements (Apple HIG standard)
- **Clear Iconography**: Simple, recognizable icons with consistent stroke width (2.5px)
- **Friendly Shapes**: Organic shapes, soft shadows, no sharp edges
- **Visual Hierarchy**: Size, color, and position clearly indicate importance
- **Consistent Spacing**: 8px grid system for consistent padding and margins

#### Shadow System
- **Subtle**: `box-shadow: 0 2px 8px rgba(0,0,0,0.08)` - Cards, buttons
- **Medium**: `box-shadow: 0 4px 16px rgba(0,0,0,0.12)` - Elevated elements
- **Strong**: `box-shadow: 0 8px 32px rgba(0,0,0,0.16)` - Modals, important popups
- **Colored Shadows**: Use theme colors for themed elements (e.g., green shadow for eco features)

#### Border Radius Scale
- **Small**: 8px - Tags, badges
- **Medium**: 16px - Cards, inputs
- **Large**: 24px - Buttons, containers
- **Extra Large**: 32px - Hero elements, large cards

### 1.4 Navigation Flow

#### High-Level User Journey
```
Splash Screen → Login/Register → Onboarding → Dashboard
                                           ↓
                    ┌──────────────────────┴──────────────────────┐
                    ↓              ↓              ↓              ↓
                 Camera          Quiz        Mini Game      Profile
                    ↓              ↓              ↓              ↓
                 Results        Score         Game Over      Stats
                    ↓              ↓              ↓              ↓
                Dashboard ←──── Rewards ←──── Streak ←──── Settings
```

#### Navigation Structure
- **Bottom Navigation Bar**: Persistent access to 5 main features
  - Home (Dashboard)
  - Quiz
  - Camera (centered, prominent)
  - Mini Game
  - Profile

- **Hierarchical Navigation**: Deep screens use back buttons
- **Modal Navigation**: Settings, confirmations use overlay modals
- **Gesture Navigation**: Swipe back on mobile, browser back on web

#### Navigation Guidelines
- Maximum 3 levels deep to prevent confusion
- Always provide clear back buttons
- Use consistent iconography across navigation
- Highlight current location in navigation bar
- Camera button should be visually distinct (larger, centered)

### 1.5 Reward Animations

#### Animation Style
- **Bouncy & Playful**: Use spring physics (overshoot 20-30%)
- **Colorful**: Confetti, sparkles, particle effects
- **Sound-Ready**: Visual cues designed to sync with sound effects
- **Short Duration**: 1.5-2.5 seconds total

#### Animation Types
- **Badge Earned**: Scale up from center, confetti burst, badge spins
- **Level Up**: Number counts up, background flash, character celebration
- **Streak Achievement**: Fire animation, flame grows, number pulses
- **XP Gained**: Floating +XP text, progress bar fills with glow
- **Quiz Correct**: Checkmark bounces, green flash, stars appear
- **Task Complete**: Checkmark draws itself, card transforms, confetti

#### Animation Principles
- Use easing functions that feel natural (ease-out-back for bouncy effects)
- Animate multiple properties simultaneously for richness
- Provide skip option for longer animations
- Ensure animations don't interfere with usability
- Maintain 60fps performance on target devices

### 1.6 Gamification Elements Visual Style

#### Points (XP) Display
- **Format**: Large orange number with star icon
- **Location**: Top right of screens, profile header
- **Animation**: Numbers count up when earned, subtle pulse on display
- **Style**: Orange background (`#F97316`), white text, rounded container

#### Level System
- **Display**: Circular badge with level number
- **Progress**: Circular progress ring or horizontal bar
- **Color**: Gradient from current level color to next level color
- **Animation**: Progress fills smoothly, level change triggers celebration

#### Badges
- **Style**: Circular or rounded-square icons with emoji or illustration
- **States**: 
  - Locked: Grayscale, opacity 50%, question mark overlay
  - Unlocked: Full color, subtle glow, animated on first view
  - New: "New" badge indicator, pulse animation
- **Display**: Grid layout in rewards screen, small icons in profile
- **Size**: 64x64px in grid, 32x32px in profile

#### Streak System
- **Icon**: Flame emoji 🔥 with animated fire effect
- **Display**: Orange container with flame icon and day count
- **Animation**: Flame flickers, number pulses when streak increases
- **Color**: Orange gradient background, white text

---

## 2. Specific UI Screens

### 2.1 Login/Register Screen

#### Primary Layout
- **Centered Card Design**: White card on mint green background
- **Top Section**: Large recycling emoji (♻️) or mascot illustration
- **Middle Section**: Form fields with underline style
- **Bottom Section**: Action buttons and helper links

#### Key Interactive Elements
- **Email/Username Field**: Large input with green underline, placeholder text
- **Password Field**: Password input with show/hide toggle (eye icon)
- **Login Button**: Full-width, gradient green, large text, slight shadow
- **Register Link**: Text link below button
- **Forgot Password**: Optional link (may require parental gate)

#### Information Hierarchy
1. App logo/mascot (largest element)
2. Welcome message ("Chào các bạn")
3. Subtitle ("Đăng nhập để tiếp tục")
4. Form fields
5. Primary action button
6. Secondary links

#### Visual Style
- **Background**: Mint green (`#E8F8EF`)
- **Card**: White with subtle shadow, rounded top corners (32px)
- **Inputs**: White background, green underline on focus, large touch targets
- **Button**: Gradient from light green to medium green, rounded corners (24px)
- **Typography**: Bold headings, medium body text

### 2.2 Home Dashboard

#### Primary Layout
- **Header**: User avatar, name, level, streak counter, XP display
- **Hero Banner**: Large camera CTA with illustration
- **Daily Quests Section**: List of daily tasks with completion status
- **Quick Access**: Grid of feature cards (Quiz, Mini Game, Rewards)
- **Bottom**: Navigation bar (persistent)

#### Key Interactive Elements
- **User Profile Card**: Avatar, name, level badge, streak flame, XP star
- **Camera CTA Banner**: Large gradient card, "Scan Nature" button
- **Daily Quest Items**: Checkable tasks with XP rewards
- **Feature Cards**: Tappable cards with icons and labels
- **Navigation Bar**: 5-icon bottom navigation

#### Information Hierarchy
1. User info (avatar, name, level)
2. Camera CTA (primary action)
3. Daily quests (secondary actions)
4. Quick access cards
5. Navigation

#### Visual Style
- **Header**: White background, green accents, rounded avatar
- **Hero Banner**: Gradient green, rounded corners (24px), shadow
- **Quest Items**: White cards with green checkmarks when complete
- **Feature Cards**: White with colored icon backgrounds, subtle shadows
- **Overall**: Mint green background, generous spacing

### 2.3 AI Camera Screen

#### Primary Layout
- **Full Screen Camera**: Camera view takes entire screen
- **Top Bar**: Back button, flash toggle
- **Center Overlay**: Viewfinder frame with corner markers
- **Bottom Area**: Capture button (large, centered)
- **Processing Overlay**: Full-screen overlay with spinner

#### Key Interactive Elements
- **Back Button**: Top-left, circular, semi-transparent background
- **Flash Toggle**: Top-right, circular, semi-transparent background
- **Viewfinder Frame**: Rounded rectangle with green corner accents
- **Capture Button**: Large circular button with camera icon
- **Processing Indicator**: Animated spinner with "AI đang phân loại..." text

#### Information Hierarchy
1. Camera view (primary content)
2. Viewfinder frame (guidance)
3. Capture button (primary action)
4. Top controls (secondary actions)

#### Visual Style
- **Background**: Black/dark for camera view
- **Viewfinder**: Semi-transparent white overlay, green corner accents
- **Capture Button**: White circle with green camera icon, shadow
- **Processing**: Dark overlay with green spinner, white text
- **Overall**: Minimal UI to focus on camera content

### 2.4 AI Result Screen

#### Primary Layout
- **Bottom Sheet**: Slides up from bottom with classification result
- **Handle Bar**: Small horizontal bar at top for grip indication
- **Result Card**: Large item name, classification type, confidence score
- **Educational Info**: Description of waste type and disposal instructions
- **Action Buttons**: "Add to Collection" and "Try Again"

#### Key Interactive Elements
- **Result Display**: Large item name with checkmark indicator
- **Classification Badge**: Color-coded badge (recyclable, organic, hazardous)
- **XP Reward**: Orange badge showing +XP earned
- **Educational Card**: Information about proper disposal
- **Action Buttons**: Primary (add to collection) and secondary (try again)

#### Information Hierarchy
1. Item name and classification (most important)
2. XP reward (motivation)
3. Educational information (learning)
4. Action buttons

#### Visual Style
- **Background**: Camera view dimmed with overlay
- **Bottom Sheet**: White with rounded top corners (32px), shadow
- **Classification Badge**: Green for recyclable, brown for organic, red for hazardous
- **XP Badge**: Orange with star icon
- **Buttons**: Gradient green for primary, gray for secondary

### 2.5 Quiz Screen

#### Primary Layout
- **Header**: Quiz icon, progress indicator, question counter
- **Progress Bar**: Horizontal bar showing quiz progress
- **Question Card**: Large question text with illustration
- **Answer Options**: Vertical stack of tappable answer cards
- **Next Button**: Appears after answering, slides up from bottom

#### Key Interactive Elements
- **Progress Bar**: Animated fill from left to right
- **Question Counter**: "X / Y" format in pill-shaped container
- **Answer Cards**: Large tappable areas with hover/active states
- **Feedback Icons**: Checkmark for correct, X for incorrect
- **Next Button**: Slides up with animation after selection

#### Information Hierarchy
1. Current question
2. Answer options
3. Progress indicator
4. Next button (conditional)

#### Visual Style
- **Background**: Mint green
- **Question Card**: White with subtle shadow, large text
- **Answer Cards**: White with colored borders, rounded corners (16px)
- **Correct Answer**: Green background with checkmark
- **Incorrect Answer**: Red background with X icon
- **Progress Bar**: Purple fill with rounded ends

### 2.6 Mini Game Screen

#### Primary Layout
- **Header**: Game icon, timer, score display
- **Game Area**: Large central area for falling items
- **Start Screen**: Title, instructions, play button
- **Game Over Screen**: Final score, play again button
- **Bottom**: Navigation bar (persistent)

#### Key Interactive Elements
- **Timer Display**: Countdown timer in pill-shaped container
- **Score Display**: Points earned in yellow container
- **Falling Items**: Animated waste items and marine animals
- **Tap Targets**: Large touch areas for catching items
- **Play Button**: Large, prominent button with play icon

#### Information Hierarchy
1. Game area (primary interaction)
2. Timer and score (secondary info)
3. Start/game over screens (modal overlays)

#### Visual Style
- **Background**: Ocean blue gradient
- **Game Items**: Emoji-based (🥤 for recyclable, 🐢 for marine life)
- **Timer**: White pill with blue text
- **Score**: Yellow pill with black text
- **Start Screen**: Centered overlay with game title
- **Overall**: Playful, animated, engaging

### 2.7 Daily Activity Screen

#### Primary Layout
- **Header**: Calendar icon, "Daily Quests" title
- **Date Selector**: Horizontal scroll of days
- **Activity List**: Vertical list of daily tasks
- **Progress Summary**: Overall completion percentage
- **Reward Preview**: Show upcoming reward for completion

#### Key Interactive Elements
- **Date Selector**: Horizontal scroll with day indicators
- **Activity Cards**: Checkable tasks with descriptions and XP rewards
- **Progress Bar**: Visual representation of daily completion
- **Reward Preview**: Locked reward with progress indicator
- **Completion Animation**: Celebration when all tasks done

#### Information Hierarchy
1. Current day's activities
2. Progress summary
3. Date selector
4. Reward preview

#### Visual Style
- **Background**: Mint green
- **Date Selector**: Horizontal scroll, current day highlighted
- **Activity Cards**: White with green checkmarks when complete
- **Progress Bar**: Gradient green fill
- **Reward Preview**: Grayscale when locked, full color when unlocked

### 2.8 Reward & Badge Screen

#### Primary Layout
- **Header**: Trophy icon, "Your Rewards" title
- **Stats Summary**: Total XP, current level, progress to next level
- **Level Progress**: Large progress bar with level indicators
- **Badge Grid**: 2-column grid of earned and locked badges
- **Achievement Details**: Modal showing badge specifics

#### Key Interactive Elements
- **Stats Cards**: Large cards showing XP and level
- **Progress Bar**: Interactive with level milestones
- **Badge Grid**: Tappable badges with detail modals
- **Locked Badges**: Grayscale with question mark overlay
- **New Badges**: "New" indicator with pulse animation

#### Information Hierarchy
1. Stats summary (XP, level)
2. Level progress
3. Badge collection
4. Achievement details

#### Visual Style
- **Background**: Mint green
- **Stats Cards**: White with colored icon backgrounds
- **Progress Bar**: Gradient green with level markers
- **Badges**: Circular with emoji icons, colored backgrounds
- **Locked Badges**: Grayscale, opacity 50%, question mark
- **Overall**: Celebratory, achievement-focused

### 2.9 User Profile Screen

#### Primary Layout
- **Header**: User icon, "Hồ Sơ" title
- **Profile Card**: Avatar, name, level, stats grid
- **Achievements Section**: List of earned achievements with dates
- **Settings Section**: Account settings, logout button
- **Bottom**: Navigation bar (persistent)

#### Key Interactive Elements
- **Profile Card**: Avatar with edit option, name display
- **Stats Grid**: 2x2 grid of key statistics (streak, XP, badges, level)
- **Achievement List**: Scrollable list with icons and dates
- **Settings Button**: Access to account settings
- **Logout Button**: Red button for sign out

#### Information Hierarchy
1. Profile card (avatar, name, level)
2. Stats grid
3. Achievements
4. Settings

#### Visual Style
- **Background**: Mint green
- **Profile Card**: White with gradient avatar background
- **Stats Grid**: Colored cards with icons and numbers
- **Achievements**: White cards with checkmarks
- **Logout**: Red button with warning icon
- **Overall**: Personal, informative, clean

---

## 3. Reusable Components Design

### 3.1 Buttons

#### Primary Button
- **Visual Design**: Gradient background (light to medium green), rounded corners (24px), subtle shadow
- **Size**: Minimum 48px height, full width or appropriate content width
- **Typography**: Bold, white text, 18px font size
- **States**:
  - Default: Gradient green, shadow
  - Hover: Slightly darker gradient, scale 1.02
  - Active/Pressed: Scale 0.98, darker gradient
  - Disabled: Gray gradient, opacity 50%, no interaction
- **Usage**: Main CTAs, form submissions, primary actions

#### Secondary Button
- **Visual Design**: White background, green border, rounded corners (24px)
- **Size**: Same as primary button
- **Typography**: Bold, green text, 18px font size
- **States**:
  - Default: White with green border
  - Hover: Light green background
  - Active: Medium green background, white text
  - Disabled: Gray border, opacity 50%
- **Usage**: Secondary actions, cancel operations, alternative options

#### Icon Button
- **Visual Design**: Circular, colored background, centered icon
- **Size**: 44x44px minimum (touch target)
- **States**:
  - Default: Solid color background
  - Hover: Slightly darker color
  - Active: Scale 0.95
- **Usage**: Navigation actions, tool toggles, quick actions

#### Floating Action Button (FAB)
- **Visual Design**: Large circular button, elevated shadow, prominent icon
- **Size**: 56x56px (standard), 64x64px (extended)
- **States**:
  - Default: Gradient green, strong shadow
  - Hover: Scale 1.05
  - Active: Scale 0.95
- **Usage**: Primary action in camera screen, quick add actions

### 3.2 Cards

#### Standard Card
- **Visual Design**: White background, rounded corners (16px), subtle shadow
- **Padding**: 16px internal padding
- **Content**: Flexible, can contain text, images, or other components
- **States**:
  - Default: White background, shadow
  - Hover: Slight lift (shadow increases), scale 1.01
  - Active: Scale 0.99
  - Disabled: Gray background, opacity 50%
- **Usage**: Information display, content containers, feature cards

#### Interactive Card
- **Visual Design**: Same as standard card but with tappable feedback
- **States**:
  - Default: White background
  - Hover/Pressed: Light green background, scale effect
  - Selected: Green border, green background tint
- **Usage**: Selectable items, quiz answers, feature selection

#### Achievement Card
- **Visual Design**: White background, colored left border (4px), rounded corners
- **Content**: Icon, title, description, date earned
- **States**:
  - Unlocked: Full color, checkmark icon
  - Locked: Grayscale, opacity 60%, question mark
  - New: "New" badge, pulse animation
- **Usage**: Achievement display, badge collection

### 3.3 Progress Bars

#### Linear Progress Bar
- **Visual Design**: Horizontal bar with rounded ends, background track, filled progress
- **Size**: Height 8px (standard), 12px (prominent)
- **Colors**: Gray background track, colored fill (green for progress, purple for quiz, blue for camera)
- **Animation**: Smooth fill from left to right (300-500ms duration)
- **States**:
  - Empty: Gray track only
  - In Progress: Animated fill
  - Complete: Full fill with subtle glow
- **Usage**: Quiz progress, level progress, task completion

#### Circular Progress
- **Visual Design**: Circular ring with stroke-dasharray animation
- **Size**: 64x64px (standard), 96x96px (large)
- **Colors**: Same as linear progress
- **Animation**: Rotating fill effect
- **Usage**: Level indicator, loading states, circular stats

#### Step Progress
- **Visual Design**: Horizontal sequence of circles with connecting lines
- **Size**: Circle diameter 32px, line height 4px
- **States**:
  - Completed: Filled circle with checkmark
  - Current: Larger circle, pulsing
  - Future: Empty circle with gray line
- **Usage**: Onboarding steps, multi-step processes

### 3.4 XP System Display

#### XP Badge
- **Visual Design**: Orange rounded rectangle or circle, star icon, number
- **Size**: 40x20px (small), 64x32px (medium)
- **Animation**: Number counts up when earned, subtle pulse
- **Location**: Top right of screens, profile header, reward cards
- **Style**: Orange background (`#F97316`), white text, star icon

#### XP Popup
- **Visual Design**: Floating +XP text that animates upward and fades
- **Animation**: Starts at action location, floats up 100px, fades out over 1s
- **Size**: Large text (24px), bold weight
- **Color**: Orange with white text
- **Usage**: Immediate feedback when XP is earned

#### Level Progress Display
- **Visual Design**: Large progress indicator with current and next level
- **Components**: Current level badge, progress bar, next level preview
- **Animation**: Progress fills smoothly, level change triggers celebration
- **Style**: Gradient from current level color to next level color

### 3.5 Badge Popup

#### Badge Earned Modal
- **Visual Design**: Centered modal with badge illustration, confetti animation
- **Size**: 80% screen width, max 400px
- **Components**:
  - Badge illustration (large, centered)
  - Badge name (bold, large text)
  - Badge description (medium text)
  - "New" badge indicator
  - Confetti particle animation
  - "Awesome!" or celebration text
  - Continue button
- **Animation**: 
  - Modal scales up from center (spring animation)
  - Badge spins and bounces
  - Confetti explodes from badge
  - Text fades in sequentially
- **Duration**: 2-3 seconds total, skippable
- **Sound**: Celebration sound effect on appearance

#### Badge Collection Grid Item
- **Visual Design**: Circular badge with emoji or illustration
- **Size**: 64x64px in grid, 32x32px in compact view
- **States**:
  - Locked: Grayscale, opacity 50%, question mark overlay
  - Unlocked: Full color, subtle glow
  - New: "New" badge, pulse animation
- **Interaction**: Tap to view details modal

### 3.6 Navigation Bar

#### Bottom Navigation Bar
- **Visual Design**: Fixed at bottom, 5 icons, green background
- **Height**: 64px standard, 80px with safe area
- **Components**:
  - 4 standard navigation items (Home, Quiz, Mini Game, Profile)
  - 1 prominent center item (Camera) - larger, elevated
  - Active state indicator (color change, subtle scale)
  - Labels below icons (10px font, bold)
- **States**:
  - Inactive: Green-600 color, opacity 70%
  - Active: Green-800 color, scale 1.05
  - Camera: Always prominent, gradient background
- **Animation**: Subtle scale on active, smooth color transition

#### Top Navigation Bar
- **Visual Design**: White background, left back button, right action buttons
- **Height**: 56px standard
- **Components**:
  - Back button (left)
  - Title (center)
  - Action buttons (right)
- **States**: Standard button states for interactive elements

#### Breadcrumb Navigation
- **Visual Design**: Horizontal breadcrumb trail with chevrons
- **Size**: 14px font, medium weight
- **Color**: Gray for inactive, green for current
- **Usage**: Deep navigation paths, settings hierarchy

### 3.7 Modal/Dialog Windows

#### Standard Modal
- **Visual Design**: Centered overlay, white background, rounded corners (24px)
- **Size**: 80% screen width, max 400px, auto height
- **Components**:
  - Title (bold, large)
  - Content (medium text)
  - Action buttons (primary and secondary)
  - Close button (top-right X)
  - Backdrop (semi-transparent black)
- **Animation**: Scale up from center with fade-in backdrop
- **States**:
  - Open: Scaled up, backdrop visible
  - Closing: Scale down, fade out
- **Usage**: Confirmations, settings, important messages

#### Bottom Sheet
- **Visual Design**: Slides up from bottom, rounded top corners (32px)
- **Size**: Full width, 50-80% screen height
- **Components**:
  - Handle bar (horizontal grip indicator)
  - Title
  - Content
  - Action buttons
- **Animation**: Slides up from bottom with spring physics
- **Usage**: Camera results, selection menus, detailed information

#### Alert/Toast
- **Visual Design**: Small banner at top or bottom, auto-dismissing
- **Size**: Full width minus margins, 48-64px height
- **Components**:
  - Icon (left)
  - Message (center)
  - Close button (right, optional)
- **Animation**: Slides in from top or bottom, auto-dismisses after 3s
- **Types**:
  - Success: Green background, checkmark icon
  - Error: Red background, X icon
  - Warning: Yellow background, warning icon
  - Info: Blue background, info icon

---

## 4. Responsive Design Guidelines

### 4.1 Breakpoints
- **Mobile**: 320px - 767px (primary target)
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px+ (secondary target)

### 4.2 Mobile-First Approach
- Design primarily for mobile (6-12 year old users)
- Scale up for larger screens with expanded layouts
- Maintain touch targets across all devices
- Adapt navigation for desktop (bottom nav becomes side rail or top nav)

### 4.3 Responsive Components
- **Grid**: 1 column on mobile, 2-3 columns on tablet/desktop
- **Navigation**: Bottom bar on mobile, side rail on desktop
- **Modals**: Full screen on mobile, centered on desktop
- **Typography**: Scale font sizes proportionally
- **Spacing**: Increase padding/margins on larger screens

---

## 5. Accessibility Considerations

### 5.1 Visual Accessibility
- High contrast ratios (minimum 4.5:1 for text)
- Color-blind friendly palette (avoid red/green for critical info)
- Large touch targets (minimum 44x44px)
- Clear visual hierarchy with size and weight, not just color

### 5.2 Cognitive Accessibility
- Simple, consistent navigation
- Clear feedback for all actions
- Avoid overwhelming information density
- Use icons alongside text labels
- Provide undo options for destructive actions

### 5.3 Motor Accessibility
- Large touch targets throughout
- Gesture alternatives (buttons alongside swipes)
- No time-limited interactions (or provide extend option)
- Keyboard navigation support on desktop

---

## 6. Animation & Micro-interactions

### 6.1 Animation Principles
- Purposeful: Every animation has a clear purpose
- Performant: Maintain 60fps on target devices
- Consistent: Use similar easing and timing throughout
- Subtle: Don't distract from core functionality

### 6.2 Common Animations
- **Page Transitions**: Slide from right (400ms, ease-out)
- **Modal Open**: Scale up with fade (300ms, ease-out-back)
- **Button Press**: Scale down (100ms, ease-in-out)
- **Loading**: Spinner or skeleton screen
- **Success**: Checkmark draws itself (500ms)
- **Error**: Shake animation (300ms)

### 6.3 Micro-interactions
- Button hover: Slight scale and color shift
- Card hover: Lift effect with shadow increase
- Input focus: Border color change and subtle glow
- Scroll: Subtle parallax on hero elements
- Pull to refresh: Spinner animation

---

## 7. Icon System

### 7.1 Icon Library
- **Primary**: Lucide React (consistent, modern, customizable)
- **Supplemental**: Custom emoji and illustrations for personality

### 7.2 Icon Guidelines
- **Stroke Width**: 2.5px for consistency
- **Size**: 24px standard, scale proportionally
- **Color**: Inherit from parent or use theme colors
- **Rounded**: Use rounded line caps and joins for friendliness

### 7.3 Custom Icons
- Mascot character for branding
- Waste type icons (recyclable, organic, hazardous)
- Achievement badges with unique designs
- Environmental elements (trees, leaves, earth)

---

## 8. Design Tokens

### 8.1 Spacing Scale (8px grid)
- 4px: xs
- 8px: sm
- 16px: md
- 24px: lg
- 32px: xl
- 48px: 2xl
- 64px: 3xl

### 8.2 Border Radius Scale
- 8px: sm
- 16px: md
- 24px: lg
- 32px: xl
- 9999px: full (circle)

### 8.3 Shadow Scale
- none: box-shadow: none
- sm: box-shadow: 0 2px 8px rgba(0,0,0,0.08)
- md: box-shadow: 0 4px 16px rgba(0,0,0,0.12)
- lg: box-shadow: 0 8px 32px rgba(0,0,0,0.16)
- xl: box-shadow: 0 16px 64px rgba(0,0,0,0.20)

### 8.4 Z-Index Scale
- 0: Base layer
- 10: Cards, elevated content
- 20: Dropdowns, tooltips
- 30: Modals, bottom sheets
- 40: Toast notifications
- 50: Overlay/backdrop

---

## 9. Brand Guidelines

### 9.1 Logo Usage
- Primary logo: Recycling symbol with friendly mascot
- Minimum size: 32x32px
- Clear space: Equal to logo height on all sides
- Background: Use on light or dark backgrounds with appropriate contrast

### 9.2 Mascot Character
- Friendly, approachable design
- Green color scheme to match brand
- Used in onboarding, empty states, celebrations
- Consistent style across all illustrations

### 9.3 Voice & Tone
- Friendly and encouraging
- Simple language appropriate for 6-12 year olds
- Positive reinforcement ("Great job!", "Awesome!")
- Clear instructions without jargon
- Celebratory language for achievements

---

## 10. Implementation Notes

### 10.1 Technology Stack
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS for utility classes
- **Animations**: Framer Motion for complex animations
- **Icons**: Lucide React for consistent iconography
- **Fonts**: Google Fonts (Nunito)

### 10.2 Component Library
- Build reusable components based on this design system
- Use Storybook for component documentation
- Implement design tokens as CSS variables or Tailwind config
- Create component variants for different states and sizes

### 10.3 Testing
- Test on actual devices (iOS and Android)
- Verify touch target sizes on different screen sizes
- Test animations for performance on lower-end devices
- Validate accessibility with screen readers

---

## Conclusion

This design system provides a comprehensive foundation for building GreenLens Kids - a playful, educational, and engaging application for teaching waste classification to children. The system emphasizes child-friendly design principles, consistent visual language, and delightful interactions that motivate learning through gamification.

All design decisions prioritize the target audience (children aged 6-12) while maintaining accessibility and performance across web and mobile platforms. The component-based approach ensures consistency and efficiency in implementation.
