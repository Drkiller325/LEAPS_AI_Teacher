# Installation Guide
This guide will help you set up the platform and run it locally:
## Prerequisites
-	NodeJS latest version;
-	Ollama (for AI responses);
-	Azure API key (optional, for high-quality voice synthesis).
## Installation steps:
Install the requirements 
`pip install -r requirements.txt`
Setup environment variables Create an .env file in the project root with the following variables:
`Azure_API_KEY=your_elevenlabs_api_key`   
`EINSTEIN_VOICE_ID=your_elevenlabs_voice_id`  

Note: The Azure API key is optional. If not provided, the app will fall back to browser-based text-to-speech.
Set up Ollama Install Ollama from ollama.ai and pull the necessary model:  
`ollama pull llama3.1:8b`

## Run the application
`npm run dev`  
## Troubleshooting:
-	Node version mismatch/issues, try pip install nodejs
-	Firewall access: insure that the app is an exception in the firewall in the windows defender settings 
-	microphone Access: if you're having trouble with microphone access, ensure your browser has permission to use the microphone and that your microphone is properly connected.
