# BACKLOG

- Concurrency token in the database:
  - In Entity Framework (EF), a concurrency token is used to handle optimistic concurrency control — a way to prevent conflicting updates to the same data when multiple users or processes are working with it at the same time.
  - Add more transactions to avoid partial data creation

- Tokens:
  - Shorter token time. Refresh tokens.
  - Revoke tokens
  - Invalidate tokens for removed users
  - Change private cert to make all tokens invalid

- Typescript
  - Make sure there is no or minimum non class items in the code such as `undefined` or `any`

- Double-check for similar semantics that can be moved into a shared React component.
  - Break down huge components like AssignmentManagement to multiple modules

- Optionally notify users when new assignment is available for them when they added, removed or the assignment time is changed

- Allow user to set/change SSL certificate 

- Make sure removal the module also removes all associated static files

- Allow users modify mail templates
