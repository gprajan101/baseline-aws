#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AuthStack } from '../lib/auth-stack';
import { DatabaseStack } from '../lib/database-stack';

const app = new cdk.App();

new AuthStack(app, 'BaselineAuthStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    },
    description: 'Baseline AWS — Cognito authentication stack',
    // productionDomain: 'https://app.example.com',  // Uncomment when ready
});

new DatabaseStack(app, 'BaselineDatabaseStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    },
    description: 'Baseline AWS — DynamoDB database stack',
});

app.synth();
