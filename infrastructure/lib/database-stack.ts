import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class DatabaseStack extends cdk.Stack {
    public readonly table: dynamodb.Table;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // ----------------------------------------------------------------
        // Users Table — Single-table design
        // ----------------------------------------------------------------
        this.table = new dynamodb.Table(this, 'UsersTable', {
            tableName: 'BaselineUsers',

            // Partition key + sort key for single-table design
            partitionKey: {
                name: 'PK',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'SK',
                type: dynamodb.AttributeType.STRING,
            },

            // On-demand billing (PAY_PER_REQUEST) — serverless free tier
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,

            // Point-in-time recovery
            pointInTimeRecovery: true,

            // AWS-managed encryption at rest
            encryption: dynamodb.TableEncryption.AWS_MANAGED,

            // Retain table on stack deletion
            removalPolicy: cdk.RemovalPolicy.RETAIN,
        });

        // ----------------------------------------------------------------
        // GSI1 — Email lookups
        // ----------------------------------------------------------------
        this.table.addGlobalSecondaryIndex({
            indexName: 'GSI1',
            partitionKey: {
                name: 'GSI1PK',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'GSI1SK',
                type: dynamodb.AttributeType.STRING,
            },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // ----------------------------------------------------------------
        // CloudFormation Outputs
        // ----------------------------------------------------------------
        new cdk.CfnOutput(this, 'TableName', {
            value: this.table.tableName,
            description: 'DynamoDB Users table name',
            exportName: 'BaselineUsersTableName',
        });

        new cdk.CfnOutput(this, 'TableArn', {
            value: this.table.tableArn,
            description: 'DynamoDB Users table ARN',
            exportName: 'BaselineUsersTableArn',
        });
    }
}
