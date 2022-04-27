## Introduction
---------------
When recruiters are in the process of hiring new employees, they must speak to a varying degree of candidates in order to find those in which are best suited for the role that they are hiring for. During this process, the recruiter must take note of key information regarding the candidates within their conversation, such as:

- Desired salary
- Desired locations
- Working environment
- Expected hours, etc.

It is considered common practice for recruiters to take such notes while on call with a candidate. However, this can lead to information being falsely recorded or potentially lost amidst conversation. This can result in incorrectly determining the right candidate for a potential role within the company, which is the job of the recruiter.

The application we have developed attempts to solve this problem, by developing a system which allows for an audio recording to be analysed for the recruiter, in order to determine any valuable information which may have been captured.

Within this repository, you will find a web application in the form of a Chrome browser extension. The purpose of this application is to allow the recruiter to provide audio files to be **transcribed** directly into their browser window and see the results directly.

This application also provides useful key insights based on the results of the transcription which can prove to be useful in the recruitment process.

## Prerequisites
-------------
1. **AWS account**

    1.1. After creating your AWS account, log in as the root account. Within the **Cognito** services, an identity pool must be created. An **identity pool** is used to grant access for users to access other AWS services through generated credentials (An identity pool ID). Take note of the identity pool ID, as we will need it for later.

    1.2. Within this identity pool, under the **Unauthenticated Identities** tab, ensure to check the box **Enable access to unauthenticated identities**

    1.3. Note the **Unauthenticated role** name, this is the role in which we will add policies to, in order to access the necessary services.

    1.4. To create the necessary policies for this role, visit the **IAM** service available in AWS. This allows us to manage all the roles and users associated with the AWS account. Under the **Roles** section, you should see the unauthenticated role that was created with your identity pool.

    1.5. Open this and click the **Add permissions** button, alongside the **Attach Policies**, then **Create Policy**.

    1.6. For the unauthenticated user to use this application, we must add the services that are needed. (Transcribe, Comprehend, S3, Cognito Identity). Since we are only using the application ourselves, select for the role to have all access levels
    (Read, Write etc.) and allow access to all resources within these services. However, this should be changed accordingly for security purposes when used in a live environment.

    1.7. Once created, return to the unauthenticated user and add the created policy.

    1.8. Within the files located in the libs folder of this application, change the **Identity Pool ID** to the provided ID you received on creating your identity pool.

2. **AWS Bucket**

    2.1. To create a bucket, navigate to the S3 service in your AWS console **console.aws.com**

    2.2. Click on **Create Bucket** and untick **Block all public access** and confirm. Click **Create bucket**. 

    2.3. Open your new bucket and click on **Permissions**. Update the CORS with the following:
    `[
        {
            "AllowedHeaders": [
                "*"
            ],
            "AllowedMethods": [
                "HEAD",
                "GET",
                "PUT",
                "DELETE"
            ],
            "AllowedOrigins": [
                "*"
            ],
            "ExposeHeaders": []
        }
    ]`
    
    2.4. Update all of the **Bucket** parameters found in the index.js file of this application.


## Bundling the scripts (Developer Tool)
This is a static site consisting only of HTML, CSS, and client-side JavaScript. 

However, a build step is required to enable the modules to work natively in the browser.

To bundle the JavaScript and Node.js for this example in a single file named main.js, 
enter the following command in a terminal window within your IDE in the src folder of this directory:

`../node_modules/.bin/webpack index.js --mode development --target web --devtool false -o main.js`

To note: This is only needed to be done if changes are made to any of the .js files since I have included the main.js within this repo. If this does not work, install the specified versions of webpack and webpack-cli within the package.json globally and run:

`webpack index.js --mode development --target web --devtool false -o main.js`


## Running the application
Navigate to **chrome://extensions** in your Google Chrome browser. Enable **Developer Mode**. Click on **Load unpacked** and choose the root directory of this folder. You may now use the browser extension.
