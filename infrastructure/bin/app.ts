#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AuthStack } from '../lib/auth-stack';
import { DatabaseStack } from '../lib/database-stack';
import { ApiStack } from '../lib/api-stack';

const app = new cdk.App();

const envConfig = {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    },
};

const authStack = new AuthStack(app, 'BaselineAuthStack', {
    ...envConfig,
    description: 'Baseline AWS — Cognito authentication stack',
    // productionDomain: 'https://app.example.com',  // Uncomment when ready
});

const databaseStack = new DatabaseStack(app, 'BaselineDatabaseStack', {
    ...envConfig,
    description: 'Baseline AWS — DynamoDB database stack',
});

new ApiStack(app, 'BaselineApiStack', {
    ...envConfig,
    description: 'Baseline AWS — API Gateway and Lambda stack',
    userPool: authStack.userPool,
    userPoolClient: authStack.userPoolClient,
    table: databaseStack.table,
});

app.synth();
