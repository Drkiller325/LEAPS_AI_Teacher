import axios from "axios";

const formalExample = {
  japanese: [
    { word: "日本", reading: "にほん" },
    { word: "に" },
    { word: "住んで", reading: "すんで" },
    { word: "います" },
    { word: "か" },
    { word: "?" },
  ],
  grammarBreakdown: [
    {
      english: "Do you live in Japan?",
      japanese: [
        { word: "日本", reading: "にほん" },
        { word: "に" },
        { word: "住んで", reading: "すんで" },
        { word: "います" },
        { word: "か" },
        { word: "?" },
      ],
      chunks: [
        {
          japanese: [{ word: "日本", reading: "にほん" }],
          meaning: "Japan",
          grammar: "Noun",
        },
        {
          japanese: [{ word: "に" }],
          meaning: "in",
          grammar: "Particle",
        },
        {
          japanese: [{ word: "住んで", reading: "すんで" }, { word: "います" }],
          meaning: "live",
          grammar: "Verb + て form + います",
        },
        {
          japanese: [{ word: "か" }],
          meaning: "question",
          grammar: "Particle",
        },
        {
          japanese: [{ word: "?" }],
          meaning: "question",
          grammar: "Punctuation",
        },
      ],
    },
  ],
};

const casualExample = {
  japanese: [
    { word: "日本", reading: "にほん" },
    { word: "に" },
    { word: "住んで", reading: "すんで" },
    { word: "いる" },
    { word: "の" },
    { word: "?" },
  ],
  grammarBreakdown: [
    {
      english: "Do you live in Japan?",
      japanese: [
        { word: "日本", reading: "にほん" },
        { word: "に" },
        { word: "住んで", reading: "すんで" },
        { word: "いる" },
        { word: "の" },
        { word: "?" },
      ],
      chunks: [
        {
          japanese: [{ word: "日本", reading: "にほん" }],
          meaning: "Japan",
          grammar: "Noun",
        },
        {
          japanese: [{ word: "に" }],
          meaning: "in",
          grammar: "Particle",
        },
        {
          japanese: [{ word: "住んで", reading: "すんで" }, { word: "いる" }],
          meaning: "live",
          grammar: "Verb + て form + いる",
        },
        {
          japanese: [{ word: "の" }],
          meaning: "question",
          grammar: "Particle",
        },
        {
          japanese: [{ word: "?" }],
          meaning: "question",
          grammar: "Punctuation",
        },
      ],
    },
  ],
};

export async function GET(req) {
  const searchParams = req.nextUrl.searchParams;
  const question = searchParams.get("question");
  const speech = searchParams.get("speech") || "formal";

  try {
    const chatCompletion = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        messages: [
          {
            role: "system",
            content: `You are a Japanese language teacher. 
Your student asks you how to say something from english to japanese.
You should respond with: 
- english: the english version ex: "Do you live in Japan?"
- japanese: the japanese translation in split into words ex: ${JSON.stringify(
              speech === "formal" ? formalExample.japanese : casualExample.japanese
            )}
- grammarBreakdown: an explanation of the grammar structure per sentence ex: ${JSON.stringify(
              speech === "formal" ? formalExample.grammarBreakdown : casualExample.grammarBreakdown
            )}
`,
          },
          {
            role: "system",
            content: `You always respond with a JSON object with the following format: 
{
  "answer": {
    "english": "",
    "japanese": [{
      "word": "",
      "reading": ""
    }],
    "grammarBreakdown": [{
      "english": "",
      "japanese": [{
        "word": "",
        "reading": ""
      }],
      "chunks": [{
        "japanese": [{
          "word": "",
          "reading": ""
        }],
        "meaning": "",
        "grammar": ""
      }]
    }]
  }
}`,
          },
          {
            role: "user",
            content: `How to say ${question} in Japanese in ${speech} speech?`,
          },
        ],
        model: "mistralai/mistral-small-3.1-24b-instruct:free",
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://openrouter.ai/",
          "X-Title": "r3f-ai-language-teacher",
        },
      }
    );

    console.log("chatCompletion", chatCompletion);

    // Check for OpenRouter specific errors (like rate limits)
    if (chatCompletion.data.error) {
      console.error("Error from OpenRouter API:", chatCompletion.data.error.message);
      throw new Error(`OpenRouter API Error: ${chatCompletion.data.error.message}`);
    }
    
    // Check if choices exist before accessing
    if (!chatCompletion.data.choices || chatCompletion.data.choices.length === 0) {
        console.error("No choices received from AI API:", chatCompletion.data);
        throw new Error("No choices received from AI API");
    }

    // Extract the content from the response
    const content = chatCompletion.data.choices[0].message.content;
    
    // Attempt to remove markdown fences before parsing
    let jsonString = content.trim();
    if (jsonString.startsWith("```json")) {
      jsonString = jsonString.substring(7, jsonString.length - 3).trim();
    } else if (jsonString.startsWith("```")) {
      jsonString = jsonString.substring(3, jsonString.length - 3).trim();
    }

    // Clean common JSON issues before attempting to parse
    // 1. Replace smart quotes with standard double quotes
    jsonString = jsonString.replace(/[""'']/g, '"');

    // 2. Attempt to escape internal unescaped quotes in string values
    // Example: "key": "abc"def" -> "key": "abc\\"def"
    // This specifically looks for a quote within a string value that's preceded by non-quote characters
    // and followed by non-quote characters and then the string's closing quote.
    jsonString = jsonString.replace(/(":\\s*"[^"]*)"([^"]*")/g, '$1\\\\"$2');
    
    // 3. Remove trailing commas from objects and arrays
    // Matches a comma (,), followed by optional whitespace (\\\\s*),
    // and then a closing brace (}) or bracket (])
    // Replaces it with just the closing brace/bracket
    jsonString = jsonString.replace(/,\\\\s*([}\\\\]])/g, "$1");

    // 4. Attempt to fix missing commas between objects in an array
    // Matches a closing curly brace }, optional whitespace, and an opening curly brace {
    // Replaces it with }, { to insert the missing comma.
    jsonString = jsonString.replace(/\\}\\s*\\{/g, "},{ ");
    
    // Fallback: If it still doesn't look like JSON, try finding the first/last brace
    // (This handles cases where the AI might add introductory text before the JSON)
    if (!jsonString.startsWith('{') || !jsonString.endsWith('}')) {
        console.warn("Response might not be clean JSON, attempting brace extraction.");
        const firstBrace = jsonString.indexOf('{');
        const lastBrace = jsonString.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
            jsonString = jsonString.substring(firstBrace, lastBrace + 1);
        } else {
            console.error("Could not extract valid JSON object from response:", content);
            // Throw error to be caught by the outer try...catch
            throw new Error("Failed to extract JSON from AI response"); 
        }
    }

    try {
      // Parse the potentially cleaner JSON string
      const parsedResponse = JSON.parse(jsonString);
      
      // Validate the response structure
      if (!parsedResponse.answer || !parsedResponse.answer.japanese) {
        throw new Error('Invalid response structure');
      }

      // Clean up the japanese array
      parsedResponse.answer.japanese = parsedResponse.answer.japanese.filter(
        item => item && (item.word || item.reading)
      );

      // Clean up grammar breakdown
      if (parsedResponse.answer.grammarBreakdown) {
        parsedResponse.answer.grammarBreakdown = parsedResponse.answer.grammarBreakdown.map(
          breakdown => ({
            ...breakdown,
            chunks: (breakdown.chunks || []).filter(chunk => 
              chunk && chunk.japanese && Array.isArray(chunk.japanese) && 
              chunk.japanese.length > 0 && 
              chunk.japanese.every(j => j && (j.word || j.reading))
            )
          })
        ).filter(breakdown => breakdown.chunks && breakdown.chunks.length > 0);
      }
      
      return Response.json(parsedResponse);
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      console.log("Content that failed to parse:", jsonString);
      return Response.json({ 
        error: "Failed to parse AI response",
        details: parseError.message 
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in AI request:", error);
    return Response.json({ error: "Failed to get AI response" }, { status: 500 });
  }
}
