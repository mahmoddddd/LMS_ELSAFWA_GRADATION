import express from "express";
import axios from "axios";

const router = express.Router();

// OpenRouter.ai configuration
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "sk-or-v1-..."; // You'll need to set this

// LMS-specific system prompt for better context
const SYSTEM_PROMPT = `You are an intelligent AI learning assistant for an online Learning Management System (LMS) platform. Your role is to help students and educators with:

1. **Course Information**: Help users find courses, understand course content, and navigate the platform
2. **Enrollment Support**: Guide users through the enrollment process and explain course access
3. **Learning Progress**: Help users track their progress, understand completion requirements
4. **Technical Support**: Assist with platform issues, video playback, and technical problems
5. **Payment & Pricing**: Answer questions about course costs, payment options, and refunds
6. **Certificates**: Explain certificate requirements and how to access them
7. **General Learning Support**: Provide motivation, study tips, and learning strategies

Always be:
- Helpful and encouraging
- Specific to online learning context
- Professional but friendly
- Clear and concise
- Focused on the user's learning journey

If you don't know something specific about the platform, suggest they contact support or check the help section.`;

// Function to get response from OpenRouter.ai
const getOpenRouterResponse = async (userMessage) => {
  try {
    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: "anthropic/claude-3.5-sonnet", // You can change this to other models
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
        top_p: 0.9,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://lms-backend-omega-two.vercel.app",
          "X-Title": "LMS AI Assistant",
        },
        timeout: 30000, // 30 second timeout
      }
    );

    if (response.data && response.data.choices && response.data.choices[0]) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error("Invalid response format");
    }
  } catch (error) {
    console.error(
      "OpenRouter API error:",
      error.response?.data || error.message
    );
    throw error;
  }
};
//
// Fallback responses for when OpenRouter is not available
const FALLBACK_RESPONSES = {
  course: [
    "I can help you find courses that match your interests. What subject are you looking to learn?",
    "We have a variety of courses available. Are you interested in programming, design, business, or something else?",
    "You can browse all available courses in our course catalog. What specific topic interests you?",
  ],
  enroll: [
    "To enroll in a course, simply click the 'Enroll' button on the course page. You'll have immediate access to all course materials.",
    "Enrollment is easy! Just select your desired course and click enroll. You can start learning right away.",
  ],
  progress: [
    "You can track your learning progress in the 'My Enrollments' section. It shows your completion percentage and remaining content.",
    "Check your dashboard to see your course progress, completed lessons, and upcoming assignments.",
  ],
  technical: [
    "If you're experiencing technical issues, try refreshing the page or clearing your browser cache. If the problem persists, contact our support team.",
    "For video playback issues, make sure you have a stable internet connection and try using a different browser.",
  ],
  payment: [
    "We offer various payment options including credit cards and digital wallets. All payments are secure and encrypted.",
    "Course prices vary based on content and duration. You can see the price on each course page before enrolling.",
  ],
  certificate: [
    "Upon completing a course, you'll receive a certificate of completion that you can download and share.",
    "Certificates are automatically generated when you finish all course requirements and pass the final assessment.",
  ],
  default: [
    "I'm your AI learning assistant! I can help you with course information, enrollment, technical support, and more. What would you like to know?",
    "Welcome to our learning platform! I'm here to help you make the most of your educational experience. How can I assist you today?",
  ],
};

// Keywords to categorize user questions for fallback
const KEYWORDS = {
  course: [
    "course",
    "class",
    "lesson",
    "subject",
    "topic",
    "curriculum",
    "syllabus",
    "module",
  ],
  enroll: [
    "enroll",
    "enrollment",
    "register",
    "sign up",
    "join",
    "start course",
    "begin",
  ],
  progress: [
    "progress",
    "completion",
    "finished",
    "complete",
    "track",
    "status",
    "percentage",
    "remaining",
  ],
  technical: [
    "technical",
    "problem",
    "issue",
    "error",
    "not working",
    "broken",
    "video",
    "audio",
    "download",
  ],
  payment: [
    "payment",
    "price",
    "cost",
    "money",
    "pay",
    "billing",
    "subscription",
    "free",
    "discount",
  ],
  certificate: [
    "certificate",
    "certification",
    "diploma",
    "completion",
    "proof",
    "credential",
  ],
};

// Function to get fallback response
const getFallbackResponse = (userMessage) => {
  const lowerMessage = userMessage.toLowerCase();

  for (const [category, keywordList] of Object.entries(KEYWORDS)) {
    for (const keyword of keywordList) {
      if (lowerMessage.includes(keyword)) {
        const responses = FALLBACK_RESPONSES[category];
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }
  }

  const defaultResponses = FALLBACK_RESPONSES.default;
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
};

// Chat endpoint
router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        message: "Message is required and must be a string",
      });
    }

    const userMessage = message.trim();

    if (userMessage.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message cannot be empty",
      });
    }

    let aiResponse;

    // Try OpenRouter.ai first
    if (OPENROUTER_API_KEY && OPENROUTER_API_KEY !== "sk-or-v1-...") {
      try {
        aiResponse = await getOpenRouterResponse(userMessage);
      } catch (error) {
        console.log("OpenRouter failed, using fallback:", error.message);
        aiResponse = getFallbackResponse(userMessage);
      }
    } else {
      // Use fallback if no API key is configured
      aiResponse = getFallbackResponse(userMessage);
    }

    res.json({
      success: true,
      response: aiResponse,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Chatbot error:", error);

    // Return a fallback response on error
    const fallbackResponse = getFallbackResponse(req.body?.message || "");

    res.json({
      success: true,
      response: fallbackResponse,
      timestamp: new Date().toISOString(),
    });
  }
});

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "LMS AI Assistant is running",
    openrouter_configured:
      OPENROUTER_API_KEY && OPENROUTER_API_KEY !== "sk-or-v1-...",
    timestamp: new Date().toISOString(),
  });
});

export default router;
