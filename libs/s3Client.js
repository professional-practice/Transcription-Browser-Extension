import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
import { S3Client } from '@aws-sdk/client-s3';

// Set the AWS Region.
const REGION = "us-east-1"; //e.g. "us-east-1"

// Set the identity pool id
const IDENTITY_POOL_ID = "us-east-1:db36d853-1f65-4c66-bbe2-09a26ac483a5";

// Create anAmazon EC2 service client object.
const s3Client = new S3Client({
    region: REGION,
    credentials: fromCognitoIdentityPool({
      client: new CognitoIdentityClient({ region: REGION }),
      identityPoolId: IDENTITY_POOL_ID,
    }),
  });

export { s3Client };