# Proxy Page — UI/UX Improvements

> Generated from designer agent analysis of `src/routes/proxy.tsx`
> Date: 2026-04-22

## Current Pain Points
1. **Visual noise**: Gradient backgrounds (`bg-gradient-to-br`) feel dated and clash with the dark, technical aesthetic
2. **Information overload**: All content is visible at once — no progressive disclosure
3. **Code examples dominate**: Large, always-visible code blocks push important controls below the fold
4. **Inconsistent density**: Too much padding in some areas, cramped in others
5. **Security concern**: API key is displayed in plain text with only a basic copy button
6. **No status context**: User can't see which account/model is being used for requests

## Proposed Improvements

### 1. Remove Gradient Backgrounds
- Replace `bg-gradient-to-br from-slate-800 to-slate-900` with solid `bg-card` or subtle borders
- Use elevation (borders, subtle shadows) instead of gradients to create hierarchy
- Align with the rest of the app which uses flat, technical styling

### 2. Tabs-Based Layout
Organize the page into tabs:
- **Status** (default): Service state, quick actions, health metrics
- **Routing**: Model mapping, account scheduling, protocol settings
- **API Docs**: Code examples, endpoint documentation, IDE configs
- **Logs**: Live traffic feed, error history

### 3. Compact Protocol Selector
- Current: large buttons with icons
- Proposed: `Select` dropdown or compact segmented control
- Save horizontal space for more important controls

### 4. Collapsible Code Examples
- Wrap each code block in a `Collapsible` or `Accordion`
- Show only the title + language icon by default
- Expand on click
- Add nested tabs for different languages (cURL, Python, JavaScript, TypeScript)

### 5. Security-Focused API Key Display
- Mask the API key by default (show `sk-••••••••`)
- Reveal on explicit "Show" toggle
- Add "Regenerate" button with confirmation dialog
- Show "Last used" timestamp
- Add warning if key is the default/weak key

### 6. Configurable Model Mapping Table
- Instead of a static list, show an editable table:
  - Requested model | Resolved model | Provider | Status
- Allow users to add custom mappings
- Show which mappings are active/inactive
- Validate that resolved models exist in the account pool

### 7. Account Quota Context
- Show the currently selected "primary" account with its quota bar
- If auto-switching is enabled, show "Pool Mode: Active (N accounts)"
- Link to the account pool page for detailed management

### 8. Toast Copy Feedback
- When user clicks "Copy", show a `Toast` or `Sonner` notification
- Current: no feedback — user doesn't know if copy succeeded
- Message: "Copied to clipboard" or "Failed to copy"

### 9. Health Metrics Stub
- Even if backend metrics aren't wired yet, create the UI skeleton
- Show placeholder charts with "Coming soon" badge
- This sets expectations and makes the page feel more complete

### 10. Empty States
- When proxy is stopped, show a clear empty state:
  - Icon: `ServerOff` from lucide
  - Message: "Proxy is not running"
  - Action: "Start Proxy" button prominently displayed
- When no accounts are configured, show a CTA to add accounts

---

## Design Principles
- **Density over whitespace**: This is a developer tool — show more information per pixel
- **Progressive disclosure**: Hide advanced options behind tabs/accordions
- **Immediate feedback**: Every action should have a visible result (toast, spinner, state change)
- **Security first**: API keys and sensitive data should never be displayed casually
