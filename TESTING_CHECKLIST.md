# Accessibility Testing Checklist
## Clubinho Bookstore Management System

**Implementation Date:** 2025-11-30
**Testing Required Before Production Deployment**

---

## 1. AUTOMATED TESTING

### A. Lighthouse Audit (Chrome DevTools)
**Target Scores:**
- [ ] Accessibility: 95-100
- [ ] Performance: 90+
- [ ] Best Practices: 95+
- [ ] SEO: 95+

**How to Run:**
1. Open Chrome DevTools (F12)
2. Navigate to Lighthouse tab
3. Select "Accessibility" category
4. Click "Generate report"
5. Review and fix any issues

**Expected Results:**
- ✅ All buttons have accessible names
- ✅ Form elements have labels
- ✅ Color contrast meets WCAG AA
- ✅ Touch targets are adequate
- ✅ Skip navigation link present

---

### B. axe DevTools (Chrome Extension)
**Installation:** https://chrome.google.com/webstore/detail/axe-devtools

**Steps:**
1. Install axe DevTools extension
2. Open extension on each page
3. Click "Scan ALL of my page"
4. Review violations and warnings
5. Fix critical issues first

**Expected Issues to Check:**
- [ ] No violations (Critical/Serious)
- [ ] Minimal warnings
- [ ] All ARIA labels recognized

---

### C. WAVE Tool (Web Accessibility Evaluation Tool)
**URL:** https://wave.webaim.org/

**Steps:**
1. Go to WAVE website
2. Enter page URL or paste HTML
3. Review visual indicators
4. Check "Details" tab for full report

**What to Check:**
- [ ] No errors (red icons)
- [ ] Warnings addressed (yellow icons)
- [ ] Structural elements detected (green icons)
- [ ] ARIA usage validated

---

## 2. KEYBOARD NAVIGATION TESTING

### A. Tab Order Test
**Test Each Page:**

**Base Navigation:**
1. [ ] Tab lands on "Skip to main content" first
2. [ ] Press Enter to skip to main content
3. [ ] Tab through floating tools menu (desktop)
4. [ ] Tab through main content area
5. [ ] Tab through bottom navigation
6. [ ] Tab order is logical and predictable

**Dashboard:**
1. [ ] Quick actions are keyboard accessible
2. [ ] Search form can be focused
3. [ ] All links can be activated with Enter
4. [ ] Tab order: Header → Quick actions → Search → Customer balances → Orders → Bottom nav

**Customers:**
1. [ ] Search input is focusable
2. [ ] Sort dropdown is keyboard operable
3. [ ] "Add Customer" button is focusable
4. [ ] All action buttons (Print, Edit, Delete) are keyboard accessible
5. [ ] Tab order is logical

**Books:**
1. [ ] Search input is focusable
2. [ ] "Add Asset" button is focusable
3. [ ] Edit/Delete buttons are keyboard accessible

**Orders:**
1. [ ] Tab navigation works
2. [ ] Search input is focusable
3. [ ] "Add Order" button is accessible
4. [ ] Edit/Delete buttons work with keyboard

---

### B. Focus Visibility Test
**Verify Focus Indicators:**

1. [ ] All focusable elements have visible focus indicator
2. [ ] Focus indicator is 3px solid outline
3. [ ] Focus indicator has 2px offset
4. [ ] Focus indicator color contrasts with background
5. [ ] Focus moves logically through page

**Test Pattern:**
```
Tab → Should see focus ring on:
- Skip link (appears on focus)
- Floating tools buttons
- Main content elements
- Bottom navigation items
```

---

### C. Modal Keyboard Test
**Test All Modals:**

**Add Customer Modal:**
1. [ ] Click "Add Customer" or use keyboard to open
2. [ ] Focus moves to modal on open
3. [ ] Tab through all form fields
4. [ ] Tab order: Name → Address → Telephone → Delivery time → Cancel → Add
5. [ ] Esc key closes modal
6. [ ] Focus returns to trigger button on close
7. [ ] Click outside modal closes it

**Edit Customer Modal:**
1. [ ] Same tests as Add Customer
2. [ ] Focus moves to first input on open

**Delete Customer Modal:**
1. [ ] Same tests as Add Customer
2. [ ] Warning message is readable

**Books and Orders Modals:**
1. [ ] Test same pattern for each modal type
2. [ ] Verify no focus trap (can Esc out)

---

## 3. SCREEN READER TESTING

### A. NVDA (Windows) - Free
**Download:** https://www.nvaccess.org/download/

**Test Steps:**
1. [ ] Install and start NVDA
2. [ ] Navigate to each page
3. [ ] Use Tab to move through elements
4. [ ] Verify NVDA announces element type and label
5. [ ] Test forms: labels should be read with inputs

**What to Listen For:**
- "Button: Add Customer"
- "Edit box: Customer Name, required"
- "Link: Go to Dashboard"
- "Navigation, Main navigation"
- "Button: Edit [Customer Name]"
- Icons should NOT be announced

---

### B. VoiceOver (macOS/iOS) - Built-in
**Activate:** Cmd+F5 (macOS) or Settings → Accessibility (iOS)

**macOS Test:**
1. [ ] Activate VoiceOver (Cmd+F5)
2. [ ] Use VO+Right Arrow to navigate
3. [ ] Verify announcements are clear
4. [ ] Test forms with VO+Space to activate

**iOS Test (on iPhone/iPad):**
1. [ ] Settings → Accessibility → VoiceOver → On
2. [ ] Swipe right to move focus
3. [ ] Double-tap to activate
4. [ ] Test touch targets (should be easy to find)

**What to Listen For:**
- "Skip to main content, link"
- "Dashboard, link, current page"
- "Add Customer, button"
- "Customer Name, required, edit text"
- "Search customers, search field"

---

### C. Screen Reader Checklist
**Test on Each Page:**

1. [ ] Skip navigation link is announced
2. [ ] Heading hierarchy is correct (H1 → H2 → H3)
3. [ ] Form labels are associated with inputs
4. [ ] Required fields are announced as required
5. [ ] Buttons have descriptive names
6. [ ] Links describe their destination
7. [ ] Icons are hidden (not announced)
8. [ ] Navigation landmarks are announced
9. [ ] Modal title is announced on open
10. [ ] Error messages are announced

---

## 4. TOUCH TARGET TESTING

### A. Mobile Device Testing
**Test on Actual Devices:**

**iPhone/iPad:**
1. [ ] Open Safari on iOS device
2. [ ] Navigate to each page
3. [ ] Tap all buttons - should be easy to hit
4. [ ] Verify no accidental taps on nearby buttons
5. [ ] Test bottom navigation - all items tappable

**Android:**
1. [ ] Open Chrome on Android device
2. [ ] Same tests as iOS
3. [ ] Verify touch targets are comfortable

**Minimum Sizes to Verify:**
- [ ] Action buttons (edit/delete): 48x48px
- [ ] Bottom navigation items: 60px tall
- [ ] Primary buttons: 44px minimum height
- [ ] Checkboxes: 20x20px
- [ ] Floating FAB: 56x56px (mobile)

---

### B. Touch Target Spacing
**Visual Inspection:**

1. [ ] Open Chrome DevTools Device Toolbar
2. [ ] Select mobile device (iPhone 12, Pixel 5)
3. [ ] Inspect spacing between buttons
4. [ ] Verify 8px minimum gap between interactive elements

**Areas to Check:**
- [ ] Customer action buttons (Print, Edit, Delete)
- [ ] Book action buttons (Edit, Delete)
- [ ] Order action buttons (Edit, Delete)
- [ ] Modal footer buttons (Cancel, Submit)
- [ ] Batch control buttons

---

## 5. VISUAL ACCESSIBILITY TESTING

### A. Color Contrast
**Use WebAIM Contrast Checker:** https://webaim.org/resources/contrastchecker/

**Test Combinations:**
1. [ ] Primary text on background (must be 4.5:1)
2. [ ] Button text on button background (must be 4.5:1)
3. [ ] Link text on background (must be 4.5:1)
4. [ ] Status badge text on badge background (must be 4.5:1)
5. [ ] Form input text on input background (must be 4.5:1)

**Expected Ratios:**
- Normal text (under 18pt): 4.5:1
- Large text (18pt+ or bold 14pt+): 3:1
- UI components: 3:1

---

### B. Zoom and Reflow Testing
**Test at Different Zoom Levels:**

1. [ ] 100% zoom - normal appearance
2. [ ] 150% zoom - text is readable
3. [ ] 200% zoom - no horizontal scroll (WCAG AA)
4. [ ] 400% zoom - content reflows correctly

**Browser Zoom:**
- Chrome: Ctrl/Cmd + Plus
- Firefox: Ctrl/Cmd + Plus
- Safari: Cmd + Plus

**What to Check:**
- [ ] Text remains readable
- [ ] No content is cut off
- [ ] No horizontal scroll bar
- [ ] Layouts adapt gracefully

---

### C. High Contrast Mode (Windows)
**Activate:**
1. Settings → Ease of Access → High Contrast
2. Select "High contrast black" theme
3. Test application

**What to Verify:**
- [ ] Borders are visible on cards
- [ ] Focus indicators are stronger (4px)
- [ ] Text is readable
- [ ] Buttons are clearly defined

---

## 6. REDUCED MOTION TESTING

### A. Enable Reduced Motion
**macOS:**
- System Preferences → Accessibility → Display → Reduce motion

**Windows:**
- Settings → Ease of Access → Display → Show animations in Windows

**Test:**
1. [ ] Enable reduced motion setting
2. [ ] Reload application
3. [ ] Verify no animations play
4. [ ] Transitions are instant
5. [ ] Pull-to-refresh doesn't animate

---

## 7. FORM TESTING

### A. Required Field Validation
**Test Each Form:**

**Add Customer:**
1. [ ] Try to submit without name - should fail
2. [ ] Verify error message appears
3. [ ] Verify `aria-invalid="true"` on input
4. [ ] Screen reader announces error

**Add Book:**
1. [ ] Same pattern as customer

**Add Order:**
1. [ ] Test required fields
2. [ ] Verify validation messages

---

### B. Label Association
**Visual Test:**

1. [ ] Click each label
2. [ ] Verify cursor moves to associated input
3. [ ] Works for: text inputs, textareas, selects, checkboxes

**Code Inspection:**
```html
<!-- Correct pattern -->
<label for="customer_name">Customer Name</label>
<input id="customer_name" name="customer_name">

<!-- All forms should follow this pattern -->
```

---

## 8. RESPONSIVE TESTING

### A. Breakpoint Testing
**Test at Standard Widths:**

1. [ ] 320px - Small mobile (iPhone SE)
2. [ ] 375px - Mobile (iPhone 12)
3. [ ] 768px - Tablet (iPad)
4. [ ] 1024px - Desktop
5. [ ] 1920px - Large desktop

**What to Check:**
- [ ] Bottom nav appears on mobile
- [ ] Floating tools menu appears on desktop
- [ ] FAB appears on mobile
- [ ] Layout doesn't break
- [ ] Touch targets are appropriate size

---

### B. Orientation Testing
**Mobile Devices:**

1. [ ] Portrait mode - test all features
2. [ ] Landscape mode - verify layout adapts
3. [ ] No content is cut off in either orientation

---

## 9. CROSS-BROWSER TESTING

### A. Desktop Browsers
**Test in Each Browser:**

1. [ ] Chrome (latest version)
   - Focus indicators visible
   - ARIA labels working
   - Modals functional

2. [ ] Firefox (latest version)
   - Focus indicators visible
   - ARIA labels working
   - Modals functional

3. [ ] Safari (latest version)
   - Focus indicators visible
   - ARIA labels working
   - Modals functional

4. [ ] Edge (latest version)
   - Focus indicators visible
   - ARIA labels working
   - Modals functional

---

### B. Mobile Browsers
**Test on Devices:**

1. [ ] iOS Safari (iPhone)
2. [ ] Chrome Mobile (Android)
3. [ ] Samsung Internet (Samsung devices)

---

## 10. PERFORMANCE TESTING

### A. Page Load Performance
**Lighthouse Performance Audit:**

1. [ ] Dashboard load time < 2.5s (LCP)
2. [ ] Customers page load < 2.5s
3. [ ] Books page load < 2.5s
4. [ ] Orders page load < 2.5s

**Expected Metrics:**
- Largest Contentful Paint (LCP): < 2.5s
- First Input Delay (FID): < 100ms
- Cumulative Layout Shift (CLS): < 0.1

---

## 11. REGRESSION TESTING

### A. Existing Functionality
**Verify Nothing Broke:**

1. [ ] All forms submit correctly
2. [ ] Search functionality works
3. [ ] Modals open and close
4. [ ] Data displays correctly
5. [ ] Statistics calculate properly
6. [ ] Links navigate correctly
7. [ ] Authentication works (if applicable)
8. [ ] Theme toggle works

---

## 12. FINAL PRE-DEPLOYMENT CHECKLIST

### Before Going Live:

**Code Quality:**
- [ ] All console errors resolved
- [ ] No JavaScript errors in browser console
- [ ] HTML validates (W3C Validator)
- [ ] CSS is minified (if using build process)

**Accessibility:**
- [ ] Lighthouse accessibility score 95+
- [ ] axe DevTools shows no violations
- [ ] WAVE shows no errors
- [ ] Keyboard navigation tested
- [ ] Screen reader tested (NVDA or VoiceOver)
- [ ] Touch targets verified
- [ ] Color contrast checked

**Performance:**
- [ ] Lighthouse performance score 90+
- [ ] Images optimized
- [ ] Fonts loading correctly
- [ ] No render-blocking resources

**Browser Testing:**
- [ ] Chrome tested
- [ ] Firefox tested
- [ ] Safari tested
- [ ] Edge tested
- [ ] Mobile browsers tested

**Responsive:**
- [ ] Mobile layout correct
- [ ] Tablet layout correct
- [ ] Desktop layout correct
- [ ] Touch targets appropriate for device

**Documentation:**
- [ ] ACCESSIBILITY_IMPLEMENTATION_SUMMARY.md reviewed
- [ ] Testing results documented
- [ ] Known issues logged (if any)

---

## 13. ISSUE LOGGING TEMPLATE

**If Issues Found:**

```markdown
## Issue: [Brief Description]

**Severity:** Critical / High / Medium / Low
**Page:** Dashboard / Customers / Books / Orders
**Browser:** Chrome / Firefox / Safari / Edge
**Device:** Desktop / Mobile / Tablet

**Description:**
[Detailed description of the issue]

**Steps to Reproduce:**
1. Go to [page]
2. Click [element]
3. Observe [problem]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**WCAG Criterion:**
[Which WCAG criterion is violated, if applicable]

**Screenshot:**
[If applicable]

**Fix Priority:**
[Immediate / Before Launch / Post-Launch]
```

---

## 14. SUCCESS CRITERIA

**Deployment Approved When:**

✅ Lighthouse Accessibility: 95+
✅ axe DevTools: Zero violations
✅ WAVE: Zero errors
✅ Keyboard navigation: 100% functional
✅ Screen reader: All elements announced correctly
✅ Touch targets: All meet 44x44px minimum
✅ Color contrast: All text meets WCAG AA
✅ Forms: All labels associated
✅ Cross-browser: No major issues
✅ Mobile: Touch-friendly on iOS and Android

---

**Testing Completed By:** _________________
**Date:** _________________
**Status:** Pass / Fail / Conditional Pass
**Notes:** _________________

---

**Last Updated:** November 30, 2025
**Project:** Clubinho Bookstore Management System
**Version:** 2.0 (Accessibility Enhanced)
