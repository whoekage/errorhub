# Migration Plan to New Architecture

## 1. Preparation

- Create new services with direct access to repositories
- Move business logic from old repositories to services
- Adapt tests to work with the new architecture

## 2. Testing

- Run all tests on the new architecture
- Check integration tests
- Check endpoint tests

## 3. Code Cleanup

- Remove old repositories
- Update documentation
- Update CI/CD pipelines if necessary 