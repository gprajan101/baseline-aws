import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export interface AuthStackProps extends cdk.StackProps {
    /** Production domain for OAuth callback (e.g., https://app.example.com) */
    readonly productionDomain?: string;
}

export class AuthStack extends cdk.Stack {
    public readonly userPool: cognito.UserPool;
    public readonly userPoolClient: cognito.UserPoolClient;

    constructor(scope: Construct, id: string, props?: AuthStackProps) {
        super(scope, id, props);

        // ----------------------------------------------------------------
        // User Pool
        // ----------------------------------------------------------------
        this.userPool = new cognito.UserPool(this, 'UserPool', {
            userPoolName: 'baseline-user-pool',

            // Sign-in configuration
            signInAliases: {
                email: true,
            },
            selfSignUpEnabled: true,

            // Auto-verify email
            autoVerify: {
                email: true,
            },

            // Standard attributes
            standardAttributes: {
                email: {
                    required: true,
                    mutable: true,
                },
                givenName: {
                    required: true,
                    mutable: true,
                },
                familyName: {
                    required: true,
                    mutable: true,
                },
            },

            // Password policy: 12+ chars, mixed case, digits, symbols
            passwordPolicy: {
                minLength: 12,
                requireLowercase: true,
                requireUppercase: true,
                requireDigits: true,
                requireSymbols: true,
                tempPasswordValidity: cdk.Duration.days(7),
            },

            // MFA: optional with TOTP
            mfa: cognito.Mfa.OPTIONAL,
            mfaSecondFactor: {
                sms: false,
                otp: true,
            },

            // Account recovery via email only
            accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,

            // Security
            advancedSecurityMode: cognito.AdvancedSecurityMode.ENFORCED,

            // Removal policy — RETAIN in production, DESTROY for dev
            removalPolicy: cdk.RemovalPolicy.RETAIN,
        });

        // ----------------------------------------------------------------
        // Callback URLs
        // ----------------------------------------------------------------
        const callbackUrls = ['http://localhost:5173/callback'];
        const logoutUrls = ['http://localhost:5173/'];

        if (props?.productionDomain) {
            callbackUrls.push(`${props.productionDomain}/callback`);
            logoutUrls.push(`${props.productionDomain}/`);
        }

        // ----------------------------------------------------------------
        // User Pool Client — SPA with SRP auth flow
        // ----------------------------------------------------------------
        this.userPoolClient = this.userPool.addClient('SpaClient', {
            userPoolClientName: 'baseline-spa-client',

            // SRP auth flow only — no direct password flow
            authFlows: {
                userSrp: true,
                userPassword: false,
                adminUserPassword: false,
                custom: false,
            },

            // OAuth configuration
            oAuth: {
                flows: {
                    authorizationCodeGrant: true,
                    implicitCodeGrant: false,
                },
                scopes: [
                    cognito.OAuthScope.OPENID,
                    cognito.OAuthScope.EMAIL,
                    cognito.OAuthScope.PROFILE,
                ],
                callbackUrls,
                logoutUrls,
            },

            // Token validity
            accessTokenValidity: cdk.Duration.hours(1),
            idTokenValidity: cdk.Duration.hours(1),
            refreshTokenValidity: cdk.Duration.days(30),

            // Security: prevent user existence errors
            preventUserExistenceErrors: true,

            // No client secret for SPA (public client)
            generateSecret: false,
        });

        // ----------------------------------------------------------------
        // CloudFormation Outputs
        // ----------------------------------------------------------------
        new cdk.CfnOutput(this, 'UserPoolId', {
            value: this.userPool.userPoolId,
            description: 'Cognito User Pool ID',
            exportName: 'BaselineUserPoolId',
        });

        new cdk.CfnOutput(this, 'UserPoolArn', {
            value: this.userPool.userPoolArn,
            description: 'Cognito User Pool ARN',
            exportName: 'BaselineUserPoolArn',
        });

        new cdk.CfnOutput(this, 'UserPoolClientId', {
            value: this.userPoolClient.userPoolClientId,
            description: 'Cognito User Pool Client ID',
            exportName: 'BaselineUserPoolClientId',
        });
    }
}
