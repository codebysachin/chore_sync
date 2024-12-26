# Contributing to KinKeeper

First off, thank you for considering contributing to KinKeeper! It's people like you that make KinKeeper such a great tool for families.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to [codebysachin@gmail.com].

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

### Pull Request Process

1. Fork the repo and create your branch from `main`:
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. If you've added code that should be tested, add tests.

3. Ensure your code follows the project's coding standards:
   - Use consistent naming conventions
   - Follow React Native best practices
   - Write meaningful comments
   - Keep functions small and focused

4. Update the documentation if you make changes to:
   - The interface
   - Dependencies
   - Project setup requirements

5. Make sure your code lints:
   ```bash
   npm run lint
   # OR
   yarn lint
   ```

6. Issue your pull request!

### Project Structure
```
kinkeeper/
├── src/
│   ├── components/
│   ├── screens/
│   ├── navigation/
│   ├── services/
│   ├── store/
│   └── utils/
├── __tests__/
└── assets/
```

### Coding Style Guidelines

- Use TypeScript for type safety
- Follow functional programming principles
- Use hooks for state management
- Keep components small and reusable
- Write meaningful test cases

### Commit Messages

- Use clear and meaningful commit messages
- Follow the format: `type(scope): message`
- Types: feat, fix, docs, style, refactor, test, chore
- Example: `feat(tasks): add recurring tasks functionality`

## Testing

We maintain a high standard of code quality through testing:

```bash
# Run all tests
npm test

# Run specific test file
npm test path/to/test-file

# Run tests in watch mode
npm test -- --watch
```

## Bug Reports

We use GitHub issues to track public bugs. Report a bug by opening a new issue:

1. Use a clear and descriptive title
2. Describe the exact steps to reproduce the issue
3. Provide specific examples if possible
4. Describe the behavior you observed and what you expected
5. Include screenshots if relevant
6. List your environment details:
   - Device/OS version
   - React Native version
   - Node version

## Feature Requests

We love feature suggestions! Please use GitHub issues to propose new features:

1. Use a clear and descriptive title
2. Explain in detail how the feature would work
3. Explain why this feature would be useful
4. Provide examples of how users would use this feature
5. Consider potential drawbacks or challenges

## Setting Up Your Development Environment

1. Install required dependencies:
   ```bash
   npm install
   # OR
   yarn install
   ```

2. Set up your environment variables:
   ```bash
   cp .env.example .env
   ```

3. Set up development tools:
   - ESLint
   - Prettier
   - TypeScript
   - React Native Debugger

## License
By contributing to KinKeeper, you agree that your contributions will be licensed under its MIT License.

## Questions?
Don't hesitate to ask questions via GitHub issues or reach out to the maintainers directly.

---

Thank you for contributing to KinKeeper! 🎉
