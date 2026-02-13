# Baseline AWS

Baseline secure serverless web application on AWS.

## Project Structure

```
baseline-aws/
├── infrastructure/     # AWS CDK infrastructure stacks
│   ├── bin/            # CDK app entry point
│   ├── lib/            # CDK stacks and constructs
│   └── test/           # Infrastructure tests
├── backend/            # Lambda functions and backend logic
│   ├── src/
│   │   ├── functions/  # Lambda handler files
│   │   ├── shared/     # Shared utilities
│   │   └── types/      # TypeScript type definitions
│   └── test/           # Backend tests
├── frontend/           # React frontend (Vite)
│   ├── src/
│   └── public/
├── .github/workflows/  # GitHub Actions CI/CD
├── scripts/            # Build and deployment scripts
└── docs/               # Documentation
```

## Prerequisites

- Node.js 22 LTS
- AWS CLI v2 with SSO configured (`--profile dev`)
- AWS CDK (`npm install -g aws-cdk`)

## Getting Started

```bash
# Install all workspace dependencies
npm install

# Build all workspaces
npm run build

# Run all tests
npm test

# Deploy to AWS
npm run deploy

# Destroy all AWS resources
npm run destroy
```

## Workspaces

| Workspace | Description | Scripts |
|-----------|-------------|---------|
| `infrastructure` | CDK stacks | `build`, `test`, `synth`, `deploy`, `destroy`, `diff` |
| `backend` | Lambda functions | `build`, `test`, `lint` |
| `frontend` | React app | `dev`, `build`, `test`, `lint` |
