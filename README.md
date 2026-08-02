# Movie Ticket Customer H5

Independent C-end mobile H5 for the movie ticket agent project.

## Commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm typecheck
```

The Java ticket service is expected at `http://localhost:8080` by default. Set `API_BASE_URL` when the service is hosted elsewhere.

The first scaffold follows the current backend authentication contract: phone/password login returns `token` and `user`. Refresh/logout are intentionally kept behind the session adapter until the backend contract is finalized.
