// Imports: Contains the necessary commands and clients that are needed for the application
import { GetTranscriptionJobCommand, StartTranscriptionJobCommand, DeleteTranscriptionJobCommand } from "@aws-sdk/client-transcribe";
import { DetectKeyPhrasesCommand } from "@aws-sdk/client-comprehend";
import { GetObjectCommand, DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { transcribeClient } from "../libs/transcribeClient.js";
import { s3Client } from "../libs/s3Client.js";
import { comprehendClient } from "../libs/comprehendClient.js";

// Global variables
var fileInput, button, fileField, statusMessage;
var loader, transcriptionField, insightsField, fileName;
var fileType, file, status;

// Async Function: Invoked when the user presses to begin the process
async function upload() {
  try {
    // Used to determine the statuses of upload and transcription
    let objExists = false;

    // Retrieve the necessary elements from the HTML page
    fileInput = document.querySelector("#myFile");
    fileField = document.getElementById("myFile");
    transcriptionField = document.getElementById("transcription");
    insightsField = document.getElementById("keyWords");

    loader = document.getElementById("loader");
    statusMessage = document.getElementById("status");
    button = document.getElementById("audio-button");

    // Clear the current text fields
    transcriptionField.value = "";
    insightsField.value = "";

    // Retrieve the file name with the file type and without
    file = fileInput.files[0].name.toString();
    fileName = file.split('.').slice(0, -1).join('.');
    fileType = file.split(".").pop();

    // Update the HTML page
    button.hidden = true;
    fileField.hidden = true;
    loader.hidden = false;

    // S3 Command Input: Delete Object 
    //(https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/interfaces/deleteobjectscommandinput.html)
    const deleteObj = {
      Bucket: "mobuicead",
      Key: fileName
    }

    // Delete the recording if it exists in the bucket already and await results
    // This is purely to prove that the object specified by the user does get updated
    // More proof of concept
    await s3Client.send(new DeleteObjectCommand(deleteObj)).then
      (
        (data) => {
          // Log command output to the console
          console.log("File deleted from bucket", data);
        },
        (error) => {
          // Log any necessary errors
          console.log("Error: File not found", error);
        });


    // S3 Command Input: Put Object
    // Allows us to upload the object to the bucket (provided the proper permissions are in place)
    //(https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/putobjectcommand.html)  
    const upload = {
      Bucket: "mobuicead",

      // Name of the file 
      Key: fileInput.files[0].name,

      // Content of file specified by the user
      Body: fileInput.files[0],
    };

    // Update HTML page
    statusMessage.innerHTML = "Uploading file..";

    // Send the command to the s3Client and await results
    await s3Client.send(new PutObjectCommand(upload)).then(
      (data) => {
        // Log the object details to the console
        console.log("Upload successful", data);
      },
      (error) => {
        // Display any necessary error
        console.log("Error: ", error);
      });

    // S3 Command Input: Get Object
    // Used to determine if the bucket has been updated with the object
    //https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/getobjectcommand.html)    
    const objExistsParam = {
      Bucket: "mobuicead",
      Key: upload.Key
    };

    // Create the necessary command to be used until the object is in the bucket
    const checkObjectCommand = new GetObjectCommand(objExistsParam);

    // While: The object has not been found as of yet in the bucket...
    while (!objExists) {
      await s3Client.send(checkObjectCommand).then
        (
          (data) => {
            // If the object exists, log to console and break the loop
            console.log("File exists in bucket...", data);
            objExists = true;
          },
          (error) => {
            // Log any necessary errors to the console
            console.log("Error searching for file in bucket", error);
          });
    }

    // Once the upload has been successful, invoke the transcribe method
    transcribe();
  }
  catch (error) {
    // Log necessary error to the console
    console.log("There was an unexpected error encountered", data);
  }
}

// Async Function: Invoked when the selected object has been uploaded
async function transcribe() {
  try {

    // Begin the transcription and update the status message
    statusMessage.innerHTML = "Beginning transcription...";

    // Log to console
    console.log("Transcription started");

    // Transcribe Command Input: Delete Transcription Job
    // Each transcription created is logged by its name. Due to AWS Transcribe only allowing unique values for job names
    // instead of autogenerating their own, my temporary workaround was to delete a previous job if it shares the same name
    // (https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-transcribe/classes/deletetranscriptionjobcommand.html)
    const deleteJob = {
      TranscriptionJobName: fileName
    };

    // Delete job if it already exists and await results
    await transcribeClient.send(new DeleteTranscriptionJobCommand(deleteJob))
      .then
      (
        (data) => {
          // Log the associated information
          console.log("Job deleted", data);
        },
        (error) => {
          // Log any errors encountered
          console.log("Job doesn't exist, continuing job...");
        }
      )


    const transcription = {
      TranscriptionJobName: fileName,
      LanguageCode: 'en-IE',
      MediaFormat: fileType,
      Media: {
        MediaFileUri: `s3://${"mobuicead"}/${file}`
      },
      OutputBucketName: "mobuicead"
    };

    // Transcribe Command Input: Get Transcription Job
    // Used to determine if the transcription has been completed
    // Starting the transcription returns successful when began accordingly,
    // However, doesn't return response when complete, therefore this was the
    // solution I came up with
    //(https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-transcribe/classes/starttranscriptionjobcommand.html)
    const transcribeStatus = {
      TranscriptionJobName: fileName
    };

    // Create a command to determine if the transcription status is complete
    // Prevents objects being continously created when checking its status
    const readyCommand = new GetTranscriptionJobCommand(transcribeStatus);

    // Send the command to the transcribe client and wait for response
    const data = await transcribeClient.send(new StartTranscriptionJobCommand(transcription));
    statusMessage.innerHTML = "Transcription in progress, please wait..";

    // While: The job status is still not complete..
    while (true) {
      status = await transcribeClient.send(readyCommand);

      if (status.TranscriptionJob.TranscriptionJobStatus == "COMPLETED") {
        console.log(status);
        break;
      }
    }

    // S3 Command Input: Get Object
    // Used to retrieve the results of the transcription
    //https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/getobjectcommand.html)    
    const retrieveResults = {
      Bucket: "mobuicead",
      Key: `${fileName}.json`
    };

    // Send command to the S3 client and wait for the response
    const jsonInfo = await s3Client.send(new GetObjectCommand(retrieveResults));
    console.log(jsonInfo)

    console.log("Transcription complete", status);

    //https://github.com/aws/aws-sdk-js-v3/issues/1877#issuecomment-776187712
    // Used to convert the ReadableStream to JSON
    // Response allows for processing a ReadableStream Object, which the s3Client returns
    const info = await new Response(jsonInfo.Body, {}).json();

    // Retrieve transcription results from JSON 
    const transcribeResults = info.results.transcripts[0].transcript;

    // Place results onto the HTML page
    transcriptionField.value = transcribeResults;

    // Write the details of the returned data to console
    console.log(transcribeResults);

    // Update to notify of successful transcription
    statusMessage.innerHTML = "Transcription complete, looking for keywords..";

    // Comprehend Input: Detect key phrases of a text
    // (https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-comprehend/classes/detectkeyphrasescommand.html)
    const compInput = {
      LanguageCode: "en",
      Text: transcribeResults
    };

    // Search for key insights into the transcription results
    const keyPhrases = await comprehendClient.send(new DetectKeyPhrasesCommand(compInput));
    console.log(keyPhrases);

    // Create an array based on the results of the key insights
    let objArray = keyPhrases.KeyPhrases;
    let keyWords = [];

    // Retrieve all keywords from the objects within array and add them
    // to another array
    objArray.forEach(element => keyWords.push(element.Text))
    insightsField.value = "";

    // Add each keyword within the array to the HTML page
    keyWords.forEach(element => insightsField.value += element + "\n");

    // Notify user of successful completion of key insights
    statusMessage.innerHTML = "Complete!";

    // Update HTML
    button.hidden = false;
    fileField.hidden = false;
    loader.hidden = true;
  }
  catch (error) {
    console.log("ERROR: Unexpected error ", error);
  }
}

// Adds an event listener to the HTML button
document.getElementById("audio-button").addEventListener("click", upload);

