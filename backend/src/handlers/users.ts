import {
    APIGatewayProxyEventV2WithJWTAuthorizer,
    APIGatewayProxyResultV2,
} from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
    DynamoDBDocumentClient,
    GetCommand,
    PutCommand,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME!;

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

interface UserProfile {
    email: string;
    givenName: string;
    familyName: string;
    bio?: string;
    avatarUrl?: string;
    [key: string]: unknown;
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

const jsonResponse = (
    statusCode: number,
    body: Record<string, unknown>,
): APIGatewayProxyResultV2 => ({
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
});

const extractClaims = (
    event: APIGatewayProxyEventV2WithJWTAuthorizer,
): { userId: string; email: string } => {
    const claims = event.requestContext.authorizer.jwt.claims;
    const userId = claims.sub as string;
    const email = claims.email as string;

    if (!userId) {
        throw new Error('Missing sub claim in JWT');
    }

    return { userId, email };
};

// ----------------------------------------------------------------
// GET /api/users/me — read user profile
// ----------------------------------------------------------------

const getProfile = async (
    userId: string,
): Promise<APIGatewayProxyResultV2> => {
    const result = await docClient.send(
        new GetCommand({
            TableName: TABLE_NAME,
            Key: {
                PK: `USER#${userId}`,
                SK: 'PROFILE',
            },
        }),
    );

    if (!result.Item) {
        return jsonResponse(404, { message: 'Profile not found' });
    }

    // Strip internal keys from response
    const { PK, SK, GSI1PK, GSI1SK, ...profile } = result.Item;
    return jsonResponse(200, profile);
};

// ----------------------------------------------------------------
// PUT /api/users/me — create or update user profile
// ----------------------------------------------------------------

const putProfile = async (
    userId: string,
    email: string,
    body: string | undefined,
): Promise<APIGatewayProxyResultV2> => {
    if (!body) {
        return jsonResponse(400, { message: 'Request body is required' });
    }

    let parsed: UserProfile;
    try {
        parsed = JSON.parse(body) as UserProfile;
    } catch {
        return jsonResponse(400, { message: 'Invalid JSON in request body' });
    }

    if (!parsed.givenName || !parsed.familyName) {
        return jsonResponse(400, {
            message: 'givenName and familyName are required',
        });
    }

    const now = new Date().toISOString();

    await docClient.send(
        new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                PK: `USER#${userId}`,
                SK: 'PROFILE',
                GSI1PK: `EMAIL#${email}`,
                GSI1SK: `USER#${userId}`,
                userId,
                email,
                givenName: parsed.givenName,
                familyName: parsed.familyName,
                bio: parsed.bio ?? '',
                avatarUrl: parsed.avatarUrl ?? '',
                updatedAt: now,
                createdAt: now, // Overwritten on updates — see below
            },
        }),
    );

    return jsonResponse(200, {
        message: 'Profile saved',
        userId,
        email,
    });
};

// ----------------------------------------------------------------
// Router
// ----------------------------------------------------------------

export const handler = async (
    event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
    try {
        const { userId, email } = extractClaims(event);
        const method = event.requestContext.http.method;

        switch (method) {
            case 'GET':
                return await getProfile(userId);
            case 'PUT':
                return await putProfile(userId, email, event.body);
            default:
                return jsonResponse(405, { message: `Method ${method} not allowed` });
        }
    } catch (error) {
        console.error('Unhandled error:', error);
        return jsonResponse(500, { message: 'Internal server error' });
    }
};
