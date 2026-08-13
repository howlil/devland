# ClipLingo Evidence

At the pinned snapshot, ClipLingo is a Windows-first native translation utility whose normal translation path is offline after language packs are installed. Product priorities include reliable text capture/popup behavior, privacy, low perceived latency, near-zero idle CPU, and CJK quality.

V1 targets Windows 10/11, selected real text without OCR, local CPU inference, model lifecycle management, and direct desktop distribution. Early non-goals include a cloud translation backend, user accounts, early OCR, GPU requirement, and speculative non-Windows implementations.

The engineering context records a Rust/Tauri shell, Svelte/TypeScript UI, and future isolated C++ inference worker. Current Iteration 001 is planned to prove Windows text capture/popup behavior with deterministic fake translation before real ML. The iteration explicitly measures latency, idle CPU/memory, compatibility, and privacy behavior.
