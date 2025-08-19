import * as sdk from "microsoft-cognitiveservices-speech-sdk";

export async function POST(req) {
  try {
    const { text, voice } = await req.json();
    console.log('TTS Request received for text:', text, 'voice:', voice);

    if (!text) {
      return Response.json({ error: "No text provided" }, { status: 400 });
    }

    // Verify Azure credentials are present
    if (!process.env.AZURE_SPEECH_KEY || !process.env.AZURE_SPEECH_REGION) {
      console.error('Missing Azure credentials:', {
        hasKey: !!process.env.AZURE_SPEECH_KEY,
        hasRegion: !!process.env.AZURE_SPEECH_REGION
      });
      throw new Error('Azure Speech credentials not configured');
    }

    // Create the speech config
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      process.env.AZURE_SPEECH_KEY,
      process.env.AZURE_SPEECH_REGION
    );

    // Configure Japanese voice based on selected teacher
    speechConfig.speechSynthesisVoiceName = voice;
    speechConfig.speechSynthesisLanguage = "ja-JP";
    
    // Set output format to get better audio quality
    speechConfig.speechSynthesisOutputFormat =
      sdk.SpeechSynthesisOutputFormat.Riff24Khz16BitMonoPcm;

    console.log('Speech config created with voice:', speechConfig.speechSynthesisVoiceName);

    // Create the synthesizer with audio output format
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig);
    console.log('Synthesizer created');

    let visemeData = [];
    synthesizer.visemeReceived = (s, e) => {
      visemeData.push([e.audioOffset / 10000, e.visemeId]); // Convert from 100ns to ms
    };

    // Get audio data with visemes
    const result = await new Promise((resolve, reject) => {
      console.log('Starting speech synthesis...');
      synthesizer.speakTextAsync(
        text,
        (result) => {
          if (!result) {
            reject(new Error("No result received from speech synthesis"));
            return;
          }

          console.log('Speech synthesis completed, got audio data:', !!result.audioData);
          
          // Convert AudioData to Uint8Array if it exists
          const audioArray = result.audioData ? new Uint8Array(result.audioData) : null;
          
          if (!audioArray || audioArray.length === 0) {
            reject(new Error("No audio data received"));
            return;
          }

          resolve({
            audioData: audioArray,
            visemes: visemeData
          });
          
          synthesizer.close();
        },
        (error) => {
          console.error('Speech synthesis error:', error);
          synthesizer.close();
          reject(error);
        }
      );
    });

    if (!result.audioData) {
      throw new Error("No audio data in result");
    }

    console.log('Sending response with audio length:', result.audioData.length);
    
    // Return both audio data and viseme data
    return new Response(JSON.stringify({
      audio: Array.from(result.audioData),
      visemes: result.visemes
    }), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("TTS Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
