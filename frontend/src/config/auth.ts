import { Amplify } from 'aws-amplify';

export const authConfig = {
    userPoolId: import.meta.env.VITE_USER_POOL_ID,
    userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
    apiUrl: import.meta.env.VITE_API_URL,
};

Amplify.configure({
    Auth: {
        Cognito: {
            userPoolId: authConfig.userPoolId,
            userPoolClientId: authConfig.userPoolClientId,
        },
    },
});

export default authConfig;
