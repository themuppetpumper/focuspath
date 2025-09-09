// aiAssistant.js
// Centralized AI Tutor logic

const ASSISTANT_ENDPOINT = window.fpAssistantUrl || 'http://localhost:3000/assistant';

export async function askAssistant(question, context = "") {
  try {
    const response = await fetch(ASSISTANT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, context })
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error('Assistant request failed:', response.status, text);
      return 'Sorry, the assistant is unavailable.';
    }

    const data = await response.json();
    return data.answer || data.result || JSON.stringify(data);
  } catch (err) {
    console.error("AI error:", err);
    return "Sorry, I had trouble answering that.";
  }
}

// Example: grab visible page text for context
export function getPageContext() {
  // Strip scripts and styles, only body text
  try {
    return document.body ? document.body.innerText.slice(0, 2000) : '';
  } catch (e) { return ''; }
}

export async function readPageAndAsk(question) {
  const context = getPageContext();
  return await askAssistant(question, context);
}
