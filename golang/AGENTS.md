# Go Development Rules

These rules apply when working in Go codebases.

## Formatting

- **gofmt** and **goimports** are mandatory -- no style debates
- Run `gofmt -w .` and `goimports -w .` after editing `.go` files

## Design Principles

- Accept interfaces, return structs
- Keep interfaces small (1-3 methods)
- Define interfaces where they are used, not where they are implemented

## Error Handling

Always wrap errors with context:

```go
if err != nil {
    return fmt.Errorf("failed to create user: %w", err)
}
```

## Patterns

### Functional Options

```go
type Option func(*Server)

func WithPort(port int) Option {
    return func(s *Server) { s.port = port }
}

func NewServer(opts ...Option) *Server {
    s := &Server{port: 8080}
    for _, opt := range opts {
        opt(s)
    }
    return s
}
```

### Dependency Injection

```go
func NewUserService(repo UserRepository, logger Logger) *UserService {
    return &UserService{repo: repo, logger: logger}
}
```

## Testing

Use the standard `go test` with **table-driven tests**.

### Race Detection

Always run with the `-race` flag:

```bash
go test -race ./...
```

### Coverage

```bash
go test -cover ./...
```

Target 80%+ coverage.

## Security

### Secret Management

```go
apiKey := os.Getenv("OPENAI_API_KEY")
if apiKey == "" {
    log.Fatal("OPENAI_API_KEY not configured")
}
```

### Security Scanning

```bash
gosec ./...
```

### Context & Timeouts

Always use `context.Context` for timeout control:

```go
ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
defer cancel()
```

## Post-Edit Actions

After editing `.go` files:
- Run `gofmt -w <file>` and `goimports -w <file>`
- Run `go vet ./...` for static analysis
- Run `staticcheck ./...` if available

See `/golang-patterns` and `/golang-testing` skills for comprehensive reference.
