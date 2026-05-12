from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
import uuid
from collections import defaultdict, deque

app = Flask(__name__)
CORS(app)

# =========================
# LOAD QWEN MODEL
# =========================

MODEL_NAME = "Qwen/Qwen2.5-0.5B-Instruct"

print("Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

print("Loading model...")
model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    dtype=torch.float32,
    low_cpu_mem_usage=True
)

print("Qwen loaded successfully!")

# =========================
# MEMORY
# =========================

conversation_memory = defaultdict(lambda: deque(maxlen=20))
user_profiles = defaultdict(dict)

# =========================
# CRISIS KEYWORDS
# =========================

CRISIS_KEYWORDS = [
    "suicide",
    "kill myself",
    "end my life",
    "self harm",
    "self-harm",
    "hurt myself",
    "cut myself",
    "die",
    "i want to die"
]
SUPPORT_KEYWORDS = [
    "depressed",
    "anxiety",
    "panic",
    "therapy",
    "therapist",
    "mental health",
    "stress",
    "overthinking",
    "sad",
    "lonely",
    "trauma",
    "hopeless",
    "emotionally exhausted",
    "burnout",
    "crying",
    "can't handle",
    "need help"
]

PROFESSIONAL_HELP_LINKS = """

\n\n💙 Professional Support Resources:

• Find Therapists:
https://www.psychologytoday.com/

• Online Therapy & Mental Health Support:
https://www.betterhelp.com/

• Crisis & Emotional Support:
https://findahelpline.com/
"""
# =========================
# SYSTEM PROMPT
# =========================

def get_system_prompt(user_profile=None):
    name = user_profile.get("name") if user_profile else None

    return f"""
You are Nova, a warm, calm, empathetic emotional support companion.

Important rules:
- Do NOT claim to be a licensed therapist.
- Do NOT diagnose medical or mental health conditions.
- Speak like a kind human, not like a robot.
- Keep replies short, natural, and emotionally supportive.
- Validate the user's feelings first.
- Ask gentle follow-up questions when appropriate.
- Encourage healthy coping strategies.
- If the user is in crisis, encourage immediate support from trusted people or local emergency help.

Personality:
- caring
- patient
- emotionally aware
- gentle
- supportive

Style:
- Use simple, human language
- Avoid long lectures
- Be conversational and warm
- Sound present and attentive

Personalization:
- User name: {name if name else "unknown"}
- Remember details from the conversation if available
"""

# =========================
# CRISIS CHECK
# =========================

def contains_crisis_language(text):
    text = (text or "").lower()
    return any(keyword in text for keyword in CRISIS_KEYWORDS)

# =========================
# HOME ROUTE
# =========================

@app.route("/", methods=["GET"])
def home():
    return "Nova Qwen Backend Running Successfully!"


# =========================
# CHAT ROUTE
# =========================

@app.route("/chat", methods=["POST"])
def chat():

    data = request.get_json(silent=True) or {}

    user_message = data.get("message", "").strip()
    session_id = data.get("session_id")

    if not session_id:
        session_id = str(uuid.uuid4())

    if not user_message:
        return jsonify({
            "reply": "Please send a message.",
            "session_id": session_id
        }), 400

    # SAVE USER NAME
    if data.get("name"):
        user_profiles[session_id]["name"] = data["name"].strip()

    user_profile = user_profiles[session_id]

    # =========================
    # CRISIS HANDLING
    # =========================

    if contains_crisis_language(user_message):

        safe_reply = (
            "I’m really sorry you’re feeling this way. "
            "Please reach out to someone you trust right now, "
            "and contact local emergency services or a crisis helpline immediately. "
            "You don’t have to go through this alone."
        )

        return jsonify({
            "reply": safe_reply,
            "session_id": session_id,
            "crisis": True
        })

    # =========================
    # BUILD CHAT MEMORY
    # =========================

    system_prompt = get_system_prompt(user_profile)

    messages = [
        {
            "role": "system",
            "content": system_prompt
        }
    ]

    messages.extend(list(conversation_memory[session_id]))

    messages.append({
        "role": "user",
        "content": user_message
    })

    # =========================
    # TOKENIZER TEMPLATE
    # =========================

    text = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True
    )

    # =========================
    # MODEL INPUT
    # =========================

    model_inputs = tokenizer(
        [text],
        return_tensors="pt"
    )

    # =========================
    # GENERATE RESPONSE
    # =========================

    generated_ids = model.generate(
        **model_inputs,
        max_new_tokens=150,
        temperature=0.7,
        do_sample=True
    )

    output = tokenizer.batch_decode(
        generated_ids,
        skip_special_tokens=True
    )

    bot_reply = output[0].split("assistant")[-1].strip()

    if not bot_reply:
        bot_reply = "I’m here with you. Tell me a little more."

    # Add professional help links only when needed
    if needs_professional_help(user_message):
        bot_reply += PROFESSIONAL_HELP_LINKS
        

    # =========================
    # SAVE MEMORY
    # =========================

    conversation_memory[session_id].append({
        "role": "user",
        "content": user_message
    })

    conversation_memory[session_id].append({
        "role": "assistant",
        "content": bot_reply
    })

    # =========================
    # RETURN RESPONSE
    # =========================

    return jsonify({
        "reply": bot_reply,
        "session_id": session_id
    })

# =========================
# RUN APP
# =========================

if __name__ == "__main__":
    app.run(debug=True)