import { GetTranscriptionJobCommand, StartTranscriptionJobCommand, DeleteTranscriptionJobCommand } from "@aws-sdk/client-transcribe";
import { DetectKeyPhrasesCommand } from "@aws-sdk/client-comprehend";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { transcribeClient } from "../libs/transcribeClient.js";
import { s3Client } from "../libs/s3Client.js";
import { comprehendClient } from "../libs/comprehendClient.js";


// Define the necessary parameters for beginning a Transcribe request
const transcribeParam = {
  TranscriptionJobName: "job1",
  LanguageCode: 'en-IE',
  MediaFormat: "mp3",
  Media: {
    // Ideally, the user specifies a location in a bucket for this
    MediaFileUri: "s3://mobuicead/roadwork.mp3",
  },
  OutputBucketName: "mobuicead"
};

// Define parameters to determine when the transcription is complete
const transcribeStatus = {
  TranscriptionJobName: "job1"
};

const s3Download = {
  Bucket: "mobuicead",
  Key: "job1.json"
};

const deleteJob = {
  TranscriptionJobName: "job1"
};

// Function - Returns the result of a promise
// function transcribeResults(){

//   // Promise - Resolves when the current status of the transcription job is complete
//   return new Promise(resolve => {
//     async function checkStatus(){
//       const status = await transcribeClient.send
//       (
//         new GetTranscriptionJobCommand(job)
//       );

//       // If: The transcription job is complete...
//       if(status.TranscriptionJob.TranscriptionJobStatus == "COMPLETED")
//       {
//         // Resolve the promise
//         resolve(status);
//       }
//       else
//       {
//         console.log(status.TranscriptionJob.TranscriptionJobStatus);
//         console.log("Job in still in progress..")

//         // Set a timer and recall the function
//         window.setTimeout(checkStatus,8000);
//       }
//     }
//     // Invoke the function to check job status
//     checkStatus();
//   })
// }

// Called when the user presses the butto
async function transcribe() {
  try {

    // Used to determine job status
    let status;
    let button = document.getElementById("audio-button");
    let statusMessage = document.getElementById("status");
    let loader = document.getElementById("loader");
    let jobText = document.getElementById("transcription");
    let keyText = document.getElementById("keyWords");

    // Update HTML
    button.hidden = true;
    loader.hidden = false;
    statusMessage.innerHTML = "Creating transcription..";


    // Notify user that the transcription has begun
    console.log("Transcription started");

    // Create two commands (Start the transcription and view job status)
    const jobCommand = new StartTranscriptionJobCommand(transcribeParam);
    const readyCommand = new GetTranscriptionJobCommand(transcribeStatus);
    const deleteCommand = new DeleteTranscriptionJobCommand(deleteJob); // testing purposes

    // For testing: Deleting job if it exists
    const del = await transcribeClient.send(deleteCommand).catch(console.log("Job doesn't exist,continuing.."));

    // Send transcribe job command and wait for results
    const data = await transcribeClient.send(jobCommand);

    // While: The job status is  still not complete..
    while (true) {      
      status = await transcribeClient.send(readyCommand);


      if (status.TranscriptionJob.TranscriptionJobStatus == "COMPLETED") {
        break;
      }
    }

    // Create new command based on the saved location of the JSON file
    const getFileCommand = new GetObjectCommand(s3Download);

    // Send command to the S3 client
    const jsonInfo = await s3Client.send(getFileCommand);

    // Response allows for processing a ReadableStream Object, which the s3Client returns
    console.log("Transcription complete", status);

    //https://github.com/aws/aws-sdk-js-v3/issues/1877#issuecomment-776187712
    // Used to convert the ReadableStream to JSON
    const info = await new Response(jsonInfo.Body, {}).json();

    // Retrieve transcription result from JSON 
    const transcription = info.results.transcripts[0].transcript;
    jobText.value = transcription;

    // Write the details of the returned data to console
    console.log(transcription);

    // Update to notify of successful transcription
    statusMessage.innerHTML = "Transcription complete, looking for keywords..";

    // AMAZON INPUT: See key insights of transcription
    const compInput = {
      LanguageCode: "en",
      Text: transcription
    };

    // COMMAND: Amazon Comprehend - Send request to Comprehend Client
    const comprehendCommand = new DetectKeyPhrasesCommand(compInput);
    const keyPhrases = await comprehendClient.send(comprehendCommand);

    let objArray = keyPhrases.KeyPhrases;
    let keyWords = [];

    // Retrieve all keywords from objects within array and add them
    // to another array
    objArray.forEach(element => keyWords.push(element.Text))
    keyText.value = "";
    keyWords.forEach(element => keyText.value+=element + "\n");

    statusMessage.innerHTML = "Complete!";
    loader.hidden = true;
  }
  catch (err) {
    console.log("Error", err);
  }
}

document.getElementById("audio-button").addEventListener("click", transcribe);

