---
name: Edit form fields wiped by background refetch
description: Controlled edit-form inputs that hydrate from a query via useEffect get clobbered mid-edit when the query refetches.
---

A "populate edit fields from server data" `useEffect` keyed on the query result will re-run on every refetch and overwrite whatever the user is currently typing. Symptom reported by users: "I can't type into the field" / typed text vanishes.

**Why:** the admin Customer Profile query uses `staleTime: 0` and is invalidated by many mutations plus a 5s WrapGen poll, so background refetches happen often while a user is in edit mode. Each one produced a fresh `data.customer` reference, re-firing the populate effect and resetting all edit-field state.

**How to apply:** any effect that syncs server data into local controlled edit state must short-circuit while the user is actively editing — guard with `if (editing) return;` and include the editing flag in the dependency array so fields re-sync on cancel/save (when editing flips back to false). Applies to any form, not just VRM. Don't assume `refetchOnWindowFocus: false` makes this safe — explicit `invalidateQueries` and polling still trigger refetches.
