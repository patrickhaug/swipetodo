# Morphing Card/List Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the morphing between focus mode (card stack) and list mode so items maintain consistent order during and after the transition.

**Architecture:** Remove the `.reverse()` hack entirely. Use explicit z-index for stacking in focus mode. Ensure `myTodos` order is stable and derived correctly. The same items should appear in the same logical order regardless of view mode.

**Tech Stack:** React Native, react-native-reanimated, react-native-gesture-handler

---

## Spec

### Data Model
- `myTodos`: Array of Todo items, sorted by `sort_order` ascending
- `myTodos[0]` = first todo = top of stack in focus mode = top of list in list mode
- Order NEVER changes when toggling views (only changes via explicit reorder or flip-to-back)

### Focus Mode (Card Stack)
- Cards stacked at screen center
- `myTodos[0]` is the FRONT card (fully visible, interactive)
- `myTodos[1]` peeks below/behind with slight offset and scale
- `myTodos[2]` peeks further below/behind
- Z-order: myTodos[0] on top, higher indices behind

### List Mode
- Vertical list from top of container
- `myTodos[0]` is at the TOP of the list (smallest Y position)
- Each subsequent item is below the previous
- Items don't overlap, z-index doesn't matter

### Morph Animation
- Items animate from their focus positions to their list positions
- During animation, items may overlap temporarily
- Z-order must remain consistent: myTodos[0] always on top
- No visual "resorting" - items should move smoothly to their final positions

### Interactions
- **Swipe left** (focus: front card only, list: any item): Mark done
- **Swipe right** (focus: front card only): Flip to back of stack AND switch to list view
- **Pull down** (focus: front card only): Switch to list view
- **Long press + drag** (list mode only): Reorder items
- **Tap header arrow**: Toggle between focus/list modes

---

## Root Cause Analysis

The bug is caused by `.reverse()` on the render array at line 161:
```javascript
{visibleItems.map(...).reverse()}
```

This reverses JSX elements AFTER they're created with their original indices. React reconciles by key (todo.id), but the render order affects stacking when z-index isn't properly respected by React Native.

**Problems with this approach:**
1. Render order and logical order are different, causing confusion
2. Z-index behavior is inconsistent across platforms
3. During animations, the stacking can appear wrong

**Solution:**
1. Remove `.reverse()` entirely
2. Render items in their natural order (myTodos[0] first)
3. Use higher z-index values for front cards (e.g., 1000 - index * 100)
4. Ensure z-index is properly applied to Animated.View

---

## Task 1: Simplify the Render Loop

**Files:**
- Modify: `/Users/patrick.haug/check/mobile/app/(tabs)/mine.tsx:144-162`

**Step 1: Remove the .reverse() and render in natural order**

Replace lines 144-162:
```javascript
      {/* Morphing items */}
      <View style={styles.morphContainer}>
        {visibleItems.map((todo, index) => (
          <MorphingItem
            key={todo.id}
            todo={todo}
            index={index}
            totalItems={visibleItems.length}
            morphProgress={morphProgress}
            draggingIndex={draggingIndex}
            dragY={dragY}
            screenHeight={screenHeight}
            onSwipeLeft={() => handleMarkDone(todo)}
            onSwipeRight={index === 0 ? handleFlipToBack : undefined}
            onPullDown={index === 0 ? morphToList : undefined}
            onReorder={handleReorder}
          />
        ))}
      </View>
```

**Step 2: Verify no TypeScript errors**

Run: `cd /Users/patrick.haug/check/mobile && npx tsc --noEmit`
Expected: No errors

---

## Task 2: Fix Z-Index for Proper Stacking

**Files:**
- Modify: `/Users/patrick.haug/check/mobile/app/(tabs)/mine.tsx:368`

**Step 1: Use large z-index gaps and reverse the calculation**

The problem: Without `.reverse()`, items render in order (index 0 first, index 2 last). In React Native, later siblings can appear on top by default. We need z-index to override this.

Replace the z-index calculation at line 368:
```javascript
      // Front card (index 0) gets highest zIndex, back cards get lower
      // Use large gaps (100) to ensure RN respects the order
      zIndex: isDragging ? 2000 : 1000 - index * 100,
```

This gives:
- Index 0: zIndex 1000 (front, on top)
- Index 1: zIndex 900
- Index 2: zIndex 800
- Dragging: zIndex 2000 (always on top)

**Step 2: Verify the app runs correctly**

Run: `cd /Users/patrick.haug/check/mobile && npx expo start`
Expected: App starts without errors

---

## Task 3: Add pointerEvents to Ensure Only Front Card is Interactive in Focus Mode

**Files:**
- Modify: `/Users/patrick.haug/check/mobile/app/(tabs)/mine.tsx:352-370`

**Step 1: Add pointerEvents to itemStyle**

This ensures that in focus mode, only the front card receives touch events (belt and suspenders approach - the gesture already checks `isFirst`, but this prevents any edge cases).

Add to the return object in `itemStyle` useAnimatedStyle:
```javascript
      // Only front card should receive touches in focus mode
      // In list mode (progress > 0.7), all items are interactive
      pointerEvents: (progress < 0.3 && index > 0) ? 'none' : 'auto',
```

Note: This property should be returned but will need to be applied separately to the Animated.View since it's not an animated property.

Actually, `pointerEvents` can't be animated. Instead, we should handle this in the gesture callbacks (which we already do). Skip this task.

---

## Task 3 (Revised): Verify Order Stability

**Files:**
- Verify: `/Users/patrick.haug/check/mobile/contexts/TodosContext.tsx:33-38`

**Step 1: Confirm myTodos derivation is correct**

The current implementation:
```javascript
const myTodos = useMemo(
  () => todos
    .filter(t => t.status === 'assigned' && t.assigned_to === user?.id)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
  [todos, user]
)
```

This is correct:
- Filters to only user's assigned todos
- Sorts by sort_order ascending (0, 1, 2, ...)
- Memoized to prevent unnecessary recalculations

No changes needed, just verify understanding.

---

## Task 4: Test the Implementation

**Manual Test Plan:**

1. **Focus Mode Display**
   - Open app, go to "Mine" tab
   - Verify front card is fully visible
   - Verify back cards peek behind with offset and smaller scale
   - Verify front card is on TOP (not obscured by back cards)

2. **Toggle to List Mode**
   - Tap the header arrow
   - Verify items animate smoothly from stack to list
   - Verify items end up in correct order (same order as stack)
   - Verify no visual "crossing" or "resorting" during animation

3. **Toggle Back to Focus Mode**
   - Tap the header arrow again
   - Verify items animate back to stack
   - Verify same card is in front as before

4. **Swipe Left to Complete (Focus Mode)**
   - Swipe front card left
   - Verify it animates off-screen and is removed
   - Verify next card becomes the new front card

5. **Swipe Right to Flip (Focus Mode)**
   - Swipe front card right
   - Verify card goes to back of stack
   - Verify view switches to list mode
   - Verify the flipped card is now at BOTTOM of list

6. **Drag Reorder (List Mode)**
   - Long-press an item in list mode
   - Drag it to a new position
   - Verify items shift to make room
   - Verify new order persists
   - Toggle to focus mode and back
   - Verify order is maintained

---

## Task 5: Commit

**Step 1: Stage and commit**

```bash
cd /Users/patrick.haug/check/mobile
git add app/\(tabs\)/mine.tsx
git commit -m "$(cat <<'EOF'
fix: remove .reverse() hack, use explicit zIndex for card stacking

The morphing between focus mode and list mode was causing visual
reordering bugs. Root cause was using .reverse() on the render array
to control stacking order, which is fragile and conflicts with
React Native's z-index handling.

Solution:
- Render items in natural order (myTodos[0] first)
- Use large z-index gaps (1000, 900, 800...) for reliable stacking
- Front card (index 0) always has highest z-index

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Summary

The fix is simple:
1. Remove `.reverse()` from line 161
2. Ensure z-index has large gaps (1000 - index * 100) at line 368

The order of `myTodos` is already stable (derived from sort_order). The issue was purely visual - using render order to control stacking instead of proper z-index.
