# Ludo Backend

## Production Security Features

- **Helmet**: Sets secure HTTP headers
- **CORS**: Cross-origin resource sharing (configure whitelist in production)
- **Rate Limiting**: 100 requests/minute per IP
- **Input Sanitization**: Prevents NoSQL injection (express-mongo-sanitize)
- **HPP**: HTTP parameter pollution protection
- **Centralized Error Handling**: All errors are logged and returned in a standard format
- **Environment Variable Validation**: All env vars are validated with Zod

### CORS Whitelist Example

In `app.ts`, replace:

```ts
app.use(cors());
```

with:

```ts
app.use(cors({ origin: ["https://your-frontend.com"] }));
```

for production deployments.
