import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfrontOrigins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

export class FrontendStack extends cdk.Stack {
    public readonly bucket: s3.Bucket;
    public readonly distribution: cloudfront.Distribution;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // ----------------------------------------------------------------
        // S3 Bucket — private, encrypted, SSL enforced
        // ----------------------------------------------------------------
        this.bucket = new s3.Bucket(this, 'FrontendBucket', {
            bucketName: `baseline-frontend-${this.account}`,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            encryption: s3.BucketEncryption.S3_MANAGED,
            enforceSSL: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
        });

        // ----------------------------------------------------------------
        // CloudFront Distribution with Origin Access Control (OAC)
        // ----------------------------------------------------------------
        this.distribution = new cloudfront.Distribution(this, 'Distribution', {
            comment: 'Baseline AWS — Frontend SPA',
            defaultBehavior: {
                origin: cloudfrontOrigins.S3BucketOrigin.withOriginAccessControl(this.bucket),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
                allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                compress: true,
            },
            defaultRootObject: 'index.html',

            // SPA routing: return index.html for 403/404
            errorResponses: [
                {
                    httpStatus: 403,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                    ttl: cdk.Duration.minutes(5),
                },
                {
                    httpStatus: 404,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                    ttl: cdk.Duration.minutes(5),
                },
            ],

            // HTTPS: TLS 1.2 minimum, HTTP/2 + HTTP/3
            minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
            httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,

            // Price class — NA + EU for cost-effective coverage
            priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        });

        // ----------------------------------------------------------------
        // Bucket Deployment — deploy frontend and invalidate CloudFront
        // ----------------------------------------------------------------
        new s3deploy.BucketDeployment(this, 'DeployFrontend', {
            sources: [s3deploy.Source.asset('../../frontend/dist')],
            destinationBucket: this.bucket,
            distribution: this.distribution,
            distributionPaths: ['/*'],
        });

        // ----------------------------------------------------------------
        // CloudFormation Outputs
        // ----------------------------------------------------------------
        new cdk.CfnOutput(this, 'CloudFrontDomainName', {
            value: this.distribution.distributionDomainName,
            description: 'CloudFront distribution domain name',
            exportName: 'BaselineFrontendDomain',
        });

        new cdk.CfnOutput(this, 'DistributionId', {
            value: this.distribution.distributionId,
            description: 'CloudFront distribution ID',
            exportName: 'BaselineFrontendDistributionId',
        });

        new cdk.CfnOutput(this, 'BucketName', {
            value: this.bucket.bucketName,
            description: 'Frontend S3 bucket name',
            exportName: 'BaselineFrontendBucketName',
        });
    }
}
