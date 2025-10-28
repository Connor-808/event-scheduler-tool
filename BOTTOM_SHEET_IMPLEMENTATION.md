# Bottom Sheet Name Prompt Implementation

## Overview
Implemented a native-feeling bottom sheet that prompts users for their name when voting for the first time.

## Components Created

### 1. BottomSheet Component (`components/ui/bottom-sheet.tsx`)
Reusable bottom sheet component with:
- ✅ Smooth slide-up animation (300ms ease-out)
- ✅ Semi-transparent backdrop (40% black opacity)
- ✅ Rounded top corners (20px border-radius)
- ✅ Visual handle/pill at top center
- ✅ 24px padding
- ✅ Max height: 60vh
- ✅ Glassmorphism effect (backdrop blur)
- ✅ Prevents body scroll when open
- ✅ iOS safe area support
- ✅ Configurable dismissible behavior

### 2. NamePrompt Component (`components/ui/name-prompt.tsx`)
Name input bottom sheet with:
- ✅ Friendly heading: "What should we call you?" (20px, semibold)
- ✅ Subtext: "Your friends will see this name when you vote" (14px, gray)
- ✅ Single text input (48px height for touch targets)
- ✅ Validation: 2-30 characters, trimmed whitespace
- ✅ Full-width purple gradient button (56px height)
- ✅ Button disabled/grayed until valid input
- ✅ Auto-focus on input after animation
- ✅ Enter key submits
- ✅ iOS zoom prevention (16px font-size)

## Cookie Management (`lib/utils.ts`)

Added three helper functions:
```typescript
getUserName()    // Returns stored name or null
setUserName()    // Saves name with 30-day expiration
hasUserName()    // Checks if valid name exists
```

Cookie details:
- **Name**: `muuvs_user_name`
- **Expiration**: 30 days
- **Validation**: 2-30 characters after trimming

## Integration (`app/event/[id]/page.tsx`)

### Flow Logic
1. User loads voting page
2. If name exists in cookie → auto-fills display name
3. User selects time slots and clicks submit
4. **Check**: Does user have name in cookie OR typed a name?
   - **Yes** → Submit votes directly
   - **No** → Show bottom sheet
5. User enters name in bottom sheet
6. Name saved to cookie (30 days)
7. Bottom sheet dismisses
8. Votes automatically submitted

### Key Features
- ✅ Non-dismissible sheet (user must provide name)
- ✅ Seamless auto-submission after name entry
- ✅ Name persists across events (30 days)
- ✅ Users can override saved name via input field
- ✅ Works for both first-time votes and updates

## Mobile Experience

### Interactions
- ✅ Backdrop tap does NOT dismiss
- ✅ No swipe-to-dismiss
- ✅ Auto-focus on input
- ✅ Keyboard pushes sheet up naturally
- ✅ Smooth slide-down on completion
- ✅ Prevents background scroll

### Design
- Matches modern iOS/Android bottom sheet patterns
- Purple gradient button for premium feel
- Clean, minimal UI
- Large touch targets (48px+)
- Feels native and expected

## Testing Checklist

- [ ] First-time user without name → sees bottom sheet
- [ ] User with saved name → submits directly
- [ ] User types name in input field → bypasses bottom sheet
- [ ] Name persists for 30 days
- [ ] Works on iOS Safari
- [ ] Works on Android Chrome
- [ ] Keyboard doesn't cover input
- [ ] Can't dismiss without entering name
- [ ] Validation prevents invalid names
- [ ] Auto-focus works after animation

## Files Modified/Created

**New Files:**
- `components/ui/bottom-sheet.tsx`
- `components/ui/name-prompt.tsx`

**Modified Files:**
- `lib/utils.ts` - Added cookie management functions
- `app/event/[id]/page.tsx` - Integrated bottom sheet flow
- `app/globals.css` - Added bottom sheet CSS

