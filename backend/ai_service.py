import os
from jinja2 import Template as JinjaTemplate
from typing import Dict, Optional

# Optional: OpenAI for better drafts
USE_OPENAI = os.getenv("AI_PROVIDER", "openai").lower() == "openai" and bool(os.getenv("OPENAI_API_KEY"))
if USE_OPENAI:
    from openai import OpenAI
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM = (
    "You are an expert B2B outreach copywriter for Amazon wholesale partnerships. "
    "Write concise, friendly, personalized emails that drive replies. Avoid fluff."
)

def render_template(body: str, variables: Dict[str, str]) -> str:
    return JinjaTemplate(body).render(**variables)

def improve_with_ai(subject: str, body: str, tone: str="professional", length: str="short") -> Dict[str, str]:
    if not USE_OPENAI:
        # Lightweight heuristic fallback (no API key)
        pre = f"[Tone: {tone}, Length: {length}]\n"
        subject2 = subject.strip().rstrip(".")
        body2 = pre + body.replace("\n\n", "\n")
        return {"subject": subject2, "body": body2}

    prompt = f"""
Subject (draft):
{subject}

Body (draft):
{body}

Rewrite the email for B2B brand/supplier outreach.
- Keep it {length}, {tone} tone
- Clear ask for a quick call or reply
- Use bullet points only if essential
- Output JSON with keys: subject, body
"""
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role":"system","content":SYSTEM},
                  {"role":"user","content":prompt}],
        response_format={"type":"json_object"},
        temperature=0.7,
    )
    import json
    return json.loads(resp.choices[0].message.content)
