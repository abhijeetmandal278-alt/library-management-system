const Book = require('../models/Book');

exports.chat = async (req, res, next) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return res.status(200).json({ 
        success: true, 
        reply: "AI is currently not configured. Please set the GEMINI_API_KEY in the environment variables." 
      });
    }

    const systemPrompt = "You are a helpful library assistant. You help librarians manage books, answer questions about library policies, recommend books, and assist with searches. Be concise and helpful.";

    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: systemPrompt + "\n\nUser: " + message }]
        }
      ]
    };

    // Very basic implementation without proper conversation history integration for Gemini REST API
    // as it expects specific structure, but simple single prompt suffices for the requirements.

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch from Gemini');
    }

    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process that request.";

    res.status(200).json({ success: true, reply: aiResponse });
  } catch (err) {
    next(err);
  }
};

exports.smartSearch = async (req, res, next) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ success: false, error: 'Query is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      // Fallback to basic text search
      const books = await Book.find({ $text: { $search: query } });
      return res.status(200).json({ success: true, data: books });
    }

    const prompt = `Extract search parameters from this natural language query for a library system. 
Query: "${query}"
Return a valid JSON object with any of the following keys if applicable: 'title', 'author', 'category'. Only return the JSON. No markdown, no extra text.`;

    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ]
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch from Gemini');
    }

    let searchParams = {};
    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    try {
      // Extract JSON if it's wrapped in markdown code blocks
      const jsonStr = textOutput.replace(/```json\n?|```/g, '').trim();
      searchParams = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse Gemini output:', textOutput);
      // Fallback to text search if parsing fails
      const books = await Book.find({ $text: { $search: query } });
      return res.status(200).json({ success: true, data: books });
    }

    // Build Mongoose query
    let mongoQuery = {};
    if (searchParams.title) mongoQuery.title = { $regex: searchParams.title, $options: 'i' };
    if (searchParams.author) mongoQuery.author = { $regex: searchParams.author, $options: 'i' };
    if (searchParams.category) mongoQuery.category = { $regex: searchParams.category, $options: 'i' };

    // If Gemini returns empty object, fallback to text search
    if (Object.keys(mongoQuery).length === 0) {
      const books = await Book.find({ $text: { $search: query } });
      return res.status(200).json({ success: true, data: books });
    }

    const books = await Book.find(mongoQuery);
    res.status(200).json({ success: true, data: books });
  } catch (err) {
    next(err);
  }
};
