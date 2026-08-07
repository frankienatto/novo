# Security Specification

## Data Invariants
- Admin users have full access to all collections
- General Staff members have access to collections based on their roles, but for now we'll allow authenticated staff/users to read/write their specific scopes.
- Unauthenticated users cannot read or write any sensitive property data.

## The "Dirty Dozen" Payloads
1. **Unauthenticated Read** - Attempting to read guests without a token -> PERMISSION_DENIED
2. **Unauthenticated Write** - Attempting to create a booking without a token -> PERMISSION_DENIED
3. **Spoofing ID** - User attempting to create a booking for another user ID -> PERMISSION_DENIED
4. **Invalid Field Type** - Sending `role` as an integer instead of string -> PERMISSION_DENIED
5. **Ghost Field** - Adding `isAdmin: true` to a user payload -> PERMISSION_DENIED
6. **Data Deletion** - Non-admin deleting a critical guest record -> PERMISSION_DENIED
7. **PII Blanket Read** - Reading all users' private info -> PERMISSION_DENIED
8. **Negative Cost** - Sending a transaction with a negative amount -> PERMISSION_DENIED
9. **Massive Payload** - Sending a string of 2MB in a description -> PERMISSION_DENIED
10. **Role Escalation** - Non-admin escalating to admin in staff profile -> PERMISSION_DENIED
11. **Malicious ID injection** - Injecting weird characters in ID -> PERMISSION_DENIED
12. **Bypassing State constraints** - Changing a 'Done' task back to 'To Do' -> PERMISSION_DENIED
