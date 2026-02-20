import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

const VERSION = process.env.npm_package_version ?? '0.1.0';

export const handler = async (
    _event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: VERSION,
        }),
    };
};
