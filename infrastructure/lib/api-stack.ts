import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigwv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as apigwv2Authorizers from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import { Construct } from 'constructs';

export interface ApiStackProps extends cdk.StackProps {
    readonly userPool: cognito.IUserPool;
    readonly userPoolClient: cognito.IUserPoolClient;
    readonly table: dynamodb.ITable;
}

export class ApiStack extends cdk.Stack {
    public readonly httpApi: apigwv2.HttpApi;

    constructor(scope: Construct, id: string, props: ApiStackProps) {
        super(scope, id, props);

        // ----------------------------------------------------------------
        // Cognito JWT Authorizer
        // ----------------------------------------------------------------
        const authorizer = new apigwv2Authorizers.HttpUserPoolAuthorizer(
            'CognitoAuthorizer',
            props.userPool,
            {
                userPoolClients: [props.userPoolClient],
            },
        );

        // ----------------------------------------------------------------
        // HTTP API (API Gateway v2)
        // ----------------------------------------------------------------
        this.httpApi = new apigwv2.HttpApi(this, 'HttpApi', {
            apiName: 'baseline-api',
            description: 'Baseline AWS HTTP API',
            corsPreflight: {
                allowOrigins: ['http://localhost:5173'],
                allowMethods: [
                    apigwv2.CorsHttpMethod.GET,
                    apigwv2.CorsHttpMethod.PUT,
                    apigwv2.CorsHttpMethod.POST,
                    apigwv2.CorsHttpMethod.DELETE,
                    apigwv2.CorsHttpMethod.OPTIONS,
                ],
                allowHeaders: [
                    'Content-Type',
                    'Authorization',
                    'X-Amz-Date',
                    'X-Api-Key',
                ],
                allowCredentials: true,
                maxAge: cdk.Duration.hours(1),
            },
        });

        // ----------------------------------------------------------------
        // Shared Lambda configuration
        // ----------------------------------------------------------------
        const lambdaDefaults = {
            runtime: lambda.Runtime.NODEJS_22_X,
            memorySize: 256,
            timeout: cdk.Duration.seconds(10),
            tracing: lambda.Tracing.ACTIVE,
            architecture: lambda.Architecture.ARM_64,
        };

        const codePath = '../../backend/dist/handlers';

        // ----------------------------------------------------------------
        // Health Check Lambda — public (no auth)
        // ----------------------------------------------------------------
        const healthFunction = new lambda.Function(this, 'HealthFunction', {
            ...lambdaDefaults,
            functionName: 'baseline-health',
            handler: 'health.handler',
            code: lambda.Code.fromAsset(codePath),
            description: 'Health check endpoint',
            logRetention: logs.RetentionDays.ONE_WEEK,
        });

        this.httpApi.addRoutes({
            path: '/api/health',
            methods: [apigwv2.HttpMethod.GET],
            integration: new apigwv2Integrations.HttpLambdaIntegration(
                'HealthIntegration',
                healthFunction,
            ),
        });

        // ----------------------------------------------------------------
        // Users Lambda — auth required
        // ----------------------------------------------------------------
        const usersFunction = new lambda.Function(this, 'UsersFunction', {
            ...lambdaDefaults,
            functionName: 'baseline-users',
            handler: 'users.handler',
            code: lambda.Code.fromAsset(codePath),
            description: 'User profile management',
            logRetention: logs.RetentionDays.ONE_WEEK,
            environment: {
                TABLE_NAME: props.table.tableName,
            },
        });

        // Least privilege: grant read/write access to the DynamoDB table
        props.table.grantReadWriteData(usersFunction);

        this.httpApi.addRoutes({
            path: '/api/users/me',
            methods: [apigwv2.HttpMethod.GET, apigwv2.HttpMethod.PUT],
            integration: new apigwv2Integrations.HttpLambdaIntegration(
                'UsersIntegration',
                usersFunction,
            ),
            authorizer,
        });

        // ----------------------------------------------------------------
        // CloudFormation Outputs
        // ----------------------------------------------------------------
        new cdk.CfnOutput(this, 'ApiUrl', {
            value: this.httpApi.apiEndpoint,
            description: 'HTTP API URL',
            exportName: 'BaselineApiUrl',
        });
    }
}
