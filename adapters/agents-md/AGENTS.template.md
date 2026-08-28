# Project Agent Instructions

This repository uses Devland.

Canonical project facts: `.devland/project.yaml`  
Current work state: `.devland/state.yaml`

For engineering changes, use `devland context develop-change [change-json]` when the Devland CLI is available and treat the returned `devland.context/v1` payload as the effective workflow, policies, profiles, execution lane, and canonical references for the task. Request state hydration only when current/recent work coordination materially matters.

Read project-specific architecture, decision, and change artifacts only when referenced by canonical state or relevant to the requested work. Repository source and configuration evidence describe what currently exists. Active approved change artifacts may describe what should change.

Memory ownership is explicit: Devland Core owns reusable engineering semantics, `.devland/project.yaml` owns durable project memory, `.devland/state.yaml` owns lightweight current-work memory, and conversation/session memory is transient context only. Do not copy Devland rules into this file or promote chat memory into project truth without updating the canonical project source.

This adapter is an entry point and is not an independent source of truth. Never claim repository, version-control, CI, release, or deployment actions that the current runtime cannot actually perform.
