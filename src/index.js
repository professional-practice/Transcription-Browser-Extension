import { GetTranscriptionJobCommand, StartTranscriptionJobCommand, DeleteTranscriptionJobCommand } from "@aws-sdk/client-transcribe";
import { StartStreamTranscriptionCommand } from "@aws-sdk/client-transcribe-streaming";
import { DetectKeyPhrasesCommand } from "@aws-sdk/client-comprehend";
import { GetObjectCommand, DeleteObjectCommand, CreateBucketCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { transcribeClient } from "../libs/transcribeClient.js";
import { streamClient } from "../libs/streamClient.js";
import { s3Client } from "../libs/s3Client.js";
import { comprehendClient } from "../libs/comprehendClient.js";
import MicrophoneStream from "microphone-stream";
import { pcmEncodeChunk } from "../libs/audioUtilities.js";

// Called when the user presses the butto
async function transcribe() {
  try {

    // Used to determine the statuses of upload and transcription
    let status;
    let objExists = false;
    var fileInput = document.querySelector("#myFile");
    console.log(fileInput.files[0]);
    let button = document.getElementById("audio-button");
    let file = document.getElementById("myFile");
    let statusMessage = document.getElementById("status");
    let loader = document.getElementById("loader");
    let jobText = document.getElementById("transcription");
    let keyText = document.getElementById("keyWords");

    // Retrieve the file name with file type and without
    var job = fileInput.files[0].name.toString();
    var filejobName = job.split('.').slice(0, -1).join('.');
    var fileType = job.split(".").pop();

    // Update HTML
    button.hidden = true;
    file.hidden = true;
    loader.hidden = false;

    const deleteObj = {
      Bucket: "mobuicead",
      Key: filejobName
    }

    // Delete the recording if it exists in the bucket already
    await s3Client.send(new DeleteObjectCommand(deleteObj)).then
    (
      (data) => {
        console.log("File deleted from bucket", data);
      },
      (error) => {
        console.log("Error: File not found", error);
      });
    

    // Specifying details for file upload
    const upload = {
      Bucket: "mobuicead",

      Key: fileInput.files[0].name,

      // Content of the new object.
      Body: fileInput.files[0],
    };

    statusMessage.innerHTML = "Uploading file..";
    const toUpload = await s3Client.send(new PutObjectCommand(upload));

    const objExistsParam = {
      Bucket: "mobuicead",
      Key: upload.Key
    };

    const checkObjectCommand = new GetObjectCommand(objExistsParam);
    //statusMessage.innerHTML = "Checking for file in bucket..";

    // While: The object has not been found as of yet in the bucket...
    // while (true) {
    while (!objExists) {
      await s3Client.send(checkObjectCommand).then
        (
          (data) => {
            console.log("File exists in bucket...", data);
            objExists = true;
          },
          (error) => {
            console.log("Error searching for file in bucket", error);
          });
    }

    statusMessage.innerHTML = "Beginning transcription...";

    // Notify user that the transcription has begun
    console.log("Transcription started");

    const deleteJob = {
      TranscriptionJobName: filejobName
    };

    // Deleting job if it already exists
    await transcribeClient.send(new DeleteTranscriptionJobCommand(deleteJob))
      .then
      (
        (data) => {
          console.log("Job deleted", data);
        },
        (error) => {
          console.log("Job doesn't exist, continuing job...");
        }
      )

    console.log(filejobName);

    // Define parameters for the transcribe status and what to transcribe
    const transcribeStatus = {
      TranscriptionJobName: filejobName
    };

    const transcribeParam = {
      TranscriptionJobName: filejobName,
      LanguageCode: 'en-IE',
      MediaFormat: fileType,
      Media: {
        MediaFileUri: `s3://mobuicead/${job}`
      },
      OutputBucketName: upload.Bucket
    };

    // Create two commands (Start the transcription and view job status)
    // Prevents from continously creating new objects while waiting
    const jobCommand = new StartTranscriptionJobCommand(transcribeParam);
    const readyCommand = new GetTranscriptionJobCommand(transcribeStatus);

    // Send transcribe job command and wait for results
    const data = await transcribeClient.send(jobCommand);
    statusMessage.innerHTML = "Transcription in progress, please wait..";

    // While: The job status is  still not complete..
    while (true) {
      status = await transcribeClient.send(readyCommand);

      if (status.TranscriptionJob.TranscriptionJobStatus == "COMPLETED") {
        break;
      }
    }

    const resultsParam = {
      Bucket: "mobuicead",
      Key: `${filejobName}.json`
    };

    // Send command to the S3 client
    const jsonInfo = await s3Client.send(new GetObjectCommand(resultsParam));

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
    keyWords.forEach(element => keyText.value += element + "\n");

    statusMessage.innerHTML = "Complete!";

    // Update HTML
    button.hidden = false;
    file.hidden = false;
    loader.hidden = true;
  }
  catch (err) {
    console.log("Error", err);
  }
}

// async function stream() {
//   try {
//     console.log("Recording begun");

//     // Start the browser microphone
//     const micStream = new MicrophoneStream();

//     // Set the microphone stream
//     micStream.setStream(
//       await window.navigator.mediaDevices.getUserMedia({
//         video: false,
//         audio: true,
//       })
//     );

//     // Acquire the stream
//     const audioStream = async function* () {
//       for await (const chunk of micStream) {
//         yield {
//           AudioEvent: {
//             AudioChunk: pcmEncodeChunk(
//               chunk
//             ) /* pcm Encoding is optional depending on the source. */,
//           },
//         };
//       }
//     };

//     console.log("Acquired the stream..");

//     // Send stream to be transcribed
//     const streamJob = {
//       LanguageCode: "en-US",
//       MediaEncoding: "pcm",
//       MediaSampleRateHertz: 44100,
//       AudioStream: audioStream()
//     };

//     const streamCommand = new StartStreamTranscriptionCommand(streamJob);

//     streamClient.send(streamCommand)
//       .then(
//         (data) => {
//           console.log("Successful", data);
//         },
//         (error) => {
//           console.log("Error", error);
//         }
//       );
//   }
//   catch (error) {

//   }
// }

document.getElementById("audio-button").addEventListener("click", transcribe);

