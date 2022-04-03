

## Prerequisites
-------------
1. An AWS account

    1.1. After creating your AWS account, log in as the root account. Within the **Cognito** services, an identity pool must be created. An **identity pool** is used to grant access for users to access other AWS services through generated credentials (An identity pool ID). Take note of the identity pool ID, as we will need it for later.

    1.2. Within this identity pool, under the **Unauthenticated Identities** tab, ensure to check the box **Enable access to unauthenticated identities**

    1.3. Note the **Unauthenticated role** name, this is the role in which we will add policies to, in order to access the necessary services.

    1.4. To create the necessary policies for this role, visit the **IAM** service available in AWS. This allows us to manage all the roles and users associated with the AWS account. Under the **Roles** section, you should see the unauthenticated role that was created with your identity pool.

    1.5. Open this and click the **Add permissions** button, alongside the **Attach Policies**, then **Create Policy**.

    1.6. For the unauthenticated user to use this application, we must add the services that are needed. (Transcribe, Comprehend, S3, Cognito Identity). Since we are only using the application ourselves, select for the role to have all access levels
    (Read, Write etc.) and access all resources within these services. Howeverthis should be changed accordingly for security purposes when used in a live environment.

    1.7. Once created, return to the unauthenticated user and add the created policy.

    1.8. Within the files located in the libs folder, change the **Identity Pool ID** to provided ID you received on creating your identity pool.

2. AWS Bucket
    2.1. To create a bucket, navigate to the S3 service in your AWS console **console.aws.com**

    2.2. Click on **Create Bucket** and untick **Block all public access** and confirm. Click **Create bucket**. 

    2.3. Cpen your new bucket and click on **Permissions**. Update the CORS with the following:
    [
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
    ]

    2.4. Update all of the **Bucket** parameters found in the index.js


## Bundling the scripts (Developer Tool)
This is a static site consisting only of HTML, CSS, and client-side JavaScript. 

However, a build step is required to enable the modules to work natively in the browser.

To bundle the JavaScript and Node.js for this example in a single file named main.js, 
enter the following command in a terminal window within your IDE in the src folder of this directory:

**../node_modules/.bin/webpack index.js --mode development --target web --devtool false -o main.js**

To note: This is only needed to be done if changes are made to any of the .js files since I have included the main.js within this repo. If this does not work, install the specified versions of webpack and webpack-cli globally and run:

**webpack index.js --mode development --target web --devtool false -o main.js**


## Running the application
Navigate to **chrome://extensions** in your Google Chrome browser. Enable **Developer Mode**. Click on **Load unpacked** and choose the root directory of this folder. You may now use the browser extension.

## Twilio
This browser extension was built so call recordings from Twilio calls could be uploaded for further insights

1. Create a Twilio Account
2. Purchase a local Twilio number 
3. Navigate to **TwiML Bins** and create a new Bin with the following XML:
<?xml version="1.0" encoding="UTF-8"?>
 <Response>
    <Dial record="record-from-answer">
    <Number>{Number to be redirected to}</Number>
    </Dial>
</Response>

Do note: For a free trial number, the redirected number must first be authenticated, this can be added under **Verified Caller ID**

4. Navigate to **Phone Calls - Active Numbers** and select your number
5. Under **A Call Comes In**, change this to a TwiML Bin and select your newly created Bin
6. You should now see call recordings once finished under **Monitor - Logs - Call recordings**
7. Download the call of your choosing in either .wav or .mp3 and upload to the browser extension!




