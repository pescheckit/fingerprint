# DeviceCreep Design Notes

## 👁️ Eye Effect Feature (MUST KEEP!)

**User Request:** Bring back the DeviceCreep eye effect!

**Behavior:**
- When cursor hovers or text is selected: Show 👁️
- When not selected: Hide the eye (or different state)
- Creates a "watching" effect that fits the DeviceCreep theme

**Possible Implementation:**
```css
.title::before {
  content: "👁️";
  opacity: 0;
  transition: opacity 0.3s;
}

.title:hover::before,
.title::selection::before {
  opacity: 1;
}
```

Or interactive eye that follows cursor?

**Priority:** HIGH - User specifically requested this!

---

## Dark Mode Requirements

- Light mode (default)
- Dark mode toggle (☀️/🌙)
- Smooth transitions
- localStorage persistence
- System preference detection

---

## Current Color Scheme

- Purple gradient: `#667eea` to `#764ba2`
- Keep this in both modes!
