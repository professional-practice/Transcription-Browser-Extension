

## Prerequisites
-------------
1. An AWS account

2. Within the **Cognito** services, an identity pool must be created. An **identity pool** is used to grant access for users to access other AWS services through generated credentials (An identity pool ID)

3. Within this identity pool, under the "Unauthenticated Identities" tab, ensure to check the box "Enable access to unauthenticated identities"

4. Note the **Unauthenticated role** name, this is the role in which we will add policies to, in order to access the necessary services.

5. To create the necessary policies for this role, visit the IAM service available in AWS. This allows to manage all the roles and users associated with the AWS account. Under the **Roles** section, you should see the unauthenticated role that was created with your identity pool.

6. Open this and click the **Add permissions** button, alongside the **Attach Policies**, then **Create Policy**.

7. For the unauthenticated user to use this application, we must add the services that are needed. (Transcribe, Comprehend, S3). Since we are only using the application ourselves, select for the role to have all access levels
(Read, Write etc.) and access all resources within these services. Howeverthis should be changed accordingly for security purposes when used in a live environment.

8. Once created, return to the unauthenticated user and add the created policy.

9. Within the files located in the libs folder, change the **Identity Pool ID** to provided ID you received on creating your identity pool.

## Bundling the scripts
This is a static site consisting only of HTML, CSS, and client-side JavaScript. 

However, a build step is required to enable the modules to work natively in the browser.

To bundle the JavaScript and Node.js for this example in a single file named main.js, 
enter the following command in the command line in the src folder of this directory:

webpack index.js --mode development --target web --devtool false -o main.js


## Running the application





