# iPhone UI/UX Components (Mobile-First)

## <768px Simplified Mode
- Single-column card; large typography; 44-56pt touch targets.
- Bottom Sheet for rating (1-4) instead of full-screen modal.
- Sticky footer with primary actions (Flip, Reveal, Rate).
- Safe Area compliance; avoid notch overlaps; use blur backgrounds.

## Card Interaction
- Swipe to flip: horizontal swipe reveals backside; subtle haptics.
- Long-press to show tooltip (floating mini-card) for linked words in sentences.
- Drag-to-dismiss Bottom Sheet; keyboard-aware for SPELL mode.

## Tooltip (Floating Mini-card)
- Anchored to tapped word; shows phonetic, meaning, actions (Add to queue, Open card).
- Dismiss on outside tap or swipe down; accessible (VoiceOver labels).

## Choice & Spell Modes
- Choice: options sourced from "to-learn queue"; ensure thumb-reach layout.
- Spell: show input with auto-focus; display similarity feedback; color-coded score.

## Visual Priority
- Badge colors: 🔴 P1, 🟠 P2, 🟡 P3, 🔵 P4.
- Dashboard bar chart for dialect distribution.

## Performance & Polish
- Pre-render next card; use Reanimated for 60fps transitions.
- Use iOS Haptics for correct/wrong feedback.
- Offline banner + retry actions when network drops.
