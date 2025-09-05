# backend/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, Literal
from sqlmodel import SQLModel, Field, Session, create_engine, select
from datetime import datetime
import os, json, random
from openai import OpenAI

# ---------- Config ----------
DB_URL = os.getenv("DB_URL", "sqlite:///./aphasia.db")
engine = create_engine(DB_URL, connect_args={"check_same_thread": False})

OPENAI_KEY = os.getenv("OPENAI_API_KEY")
MOCK_MODE = os.getenv("MOCK_MODE", "0") == "1"
client = OpenAI(api_key=OPENAI_KEY) if (OPENAI_KEY and not MOCK_MODE) else None


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","http://localhost:8080","http://127.0.0.1:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- DB Models ----------
class Attempt(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str
    exercise: str
    item_id: Optional[str] = None
    correct: bool
    latency_ms: Optional[int] = 0
    difficulty_level: Optional[int] = 1
    ts: datetime = Field(default_factory=datetime.utcnow)

class Progress(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str
    exercise: str
    level: int = 1
    ema_accuracy: float = 0.0
    ema_latency_ms: float = 0.0
    attempts: int = 0
    streak: int = 0
    last_updated: datetime = Field(default_factory=datetime.utcnow)

SQLModel.metadata.create_all(engine)

# ---------- Schemas ----------
class AttemptIn(BaseModel):
    user_id: str
    exercise: Literal['speech','prepositions','sentence_tf']
    item_id: Optional[str] = None
    correct: bool
    latency_ms: Optional[int] = 0
    difficulty_level: Optional[int] = 1

class NextIn(BaseModel):
    user_id: str
    exercise: Literal['speech','prepositions','sentence_tf']
    options: Dict[str, Any] = {}

# ---------- Adaptation helpers ----------
ALPHA = 0.3
LAT_THRESH = {
    'speech':       {1:8000,2:7000,3:6000,4:5000,5:4500},
    'prepositions': {1:10000,2:9000,3:8000,4:7000,5:6000},
    'sentence_tf':  {1:12000,2:10000,3:9000,4:8000,5:8000},
}

def get_or_init_progress(s: Session, user_id: str, exercise: str) -> Progress:
    p = s.exec(select(Progress).where(Progress.user_id==user_id, Progress.exercise==exercise)).first()
    if not p:
        p = Progress(user_id=user_id, exercise=exercise)
        s.add(p); s.commit(); s.refresh(p)
    return p

def adjust_level(p: Progress, last_correct: bool):
    lat_ok = p.ema_latency_ms <= LAT_THRESH.get(p.exercise, {}).get(p.level, 8000)
    if last_correct:
        p.streak += 1
        if p.attempts >= 5 and p.ema_accuracy >= 0.85 and lat_ok and p.streak >= 3 and p.level < 5:
            p.level += 1; p.streak = 0
    else:
        p.streak = 0
        if p.attempts >= 4 and p.ema_accuracy <= 0.60 and p.level > 1:
            p.level -= 1

def speech_params(level:int):
    return {
        "count": 5,
        "strictness": "lenient" if level<=2 else ("normal" if level==3 else "strict"),
        "max_words": 3 if level<=1 else 4 if level==2 else 5 if level==3 else 6 if level==4 else 8,
    }

def preposition_params(level:int):
    return {
        "count": 5,
        "blanks": min(1 + level//2, 3),
        "allowed": ["in","on","at","under","over","between","behind"][:3+min(level,4)],
    }

def sentence_tf_params(level:int):
    return {
        "count": 5,
        "sentences": 1 if level<=3 else 2,
        "inference": level>=3,
        "negation": level>=5,
    }

# ---------- OpenAI Structured Outputs ----------
def oa_json(model: str, system: str, name: str, schema: dict, prompt: str):
    """
    Use Chat Completions with response_format=json_object for broad SDK compatibility.
    """
    if client is None:
        raise RuntimeError("No OpenAI client (key missing or MOCK_MODE=1)")
    try:
        rr = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", model),
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
        )
        content = rr.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI error: {e}")


SPEECH_SCHEMA = {
    "type":"object","properties":{
        "phrases":{"type":"array","minItems":3,"items":{
            "type":"object","properties":{"id":{"type":"string"},"target":{"type":"string"}},
            "required":["id","target"],"additionalProperties":False
        }}
    },"required":["phrases"],"additionalProperties":False
}
PREP_SCHEMA = {
    "type":"object","properties":{
        "items":{"type":"array","minItems":3,"items":{
            "type":"object","properties":{
                "id":{"type":"string"},
                "tokens":{"type":"array","items":{"type":"string"}},
                "answer":{"type":"array","items":{"type":"string"}}
            },"required":["id","tokens","answer"],"additionalProperties":False
        }}
    },"required":["items"],"additionalProperties":False
}
TF_SCHEMA = {
    "type":"object","properties":{
        "items":{"type":"array","minItems":3,"items":{
            "type":"object","properties":{
                "id":{"type":"string"},
                "passage":{"type":"string"},
                "claim":{"type":"string"},
                "answer":{"type":"boolean"}
            },"required":["id","passage","claim","answer"],"additionalProperties":False
        }}
    },"required":["items"],"additionalProperties":False
}

# ---------- MOCK generators (for dev without API key) ----------
def mock_speech(count:int, max_words:int):
    bank = ["Good morning","I need help","Where is the bathroom","Please call my friend","I would like water","That hurts","I feel tired","Open the window"]
    return {"phrases":[{"id":f"s{i}", "target":" ".join(random.choice(bank).split()[:max_words])} for i in range(count)]}

def mock_prep(count:int, blanks:int, allowed):
    base = [
        ["The","book","is","{blank}","the","table"],
        ["We","meet","{blank}","3","PM","{blank}","Monday"],
        ["She","sat","{blank}","the","chair"],
        ["The","keys","are","{blank}","the","bag"],
        ["He","walked","{blank}","the","bridge"],
    ]
    items=[]
    for i in range(count):
        t = base[i % len(base)]
        ans = ["on","at","on","in","over"][:blanks]
        # duplicate tokens and insert multiple blanks if needed
        tokens=[]
        blanks_added=0
        for token in t:
            tokens.append(token)
            if token=="{blank}":
                blanks_added += 1
        # ensure length of answer matches blanks
        if blanks_added<blanks:
            tokens.append("{blank}")
        items.append({"id":f"p{i}", "tokens":tokens, "answer":ans[:len([x for x in tokens if x=='{blank}'])]})
    return {"items": items}

def mock_tf(count:int, sentences:int, inference:bool, negation:bool):
    passages = [
        "The cat slept on the rug by the window.",
        "Maria put the keys in her red bag and left the house.",
        "It rained all morning but the sun came out in the afternoon."
    ]
    claims = [
        ("The cat slept outside.", False),
        ("Maria put the keys in her pocket.", False),
        ("The afternoon was sunny.", True),
    ]
    items=[]
    for i in range(count):
        p = passages[i % len(passages)]
        if sentences==2:
            p = p + " The room was quiet."
        c, ans = claims[i % len(claims)]
        if negation and i%3==0:
            c = "It did not rain in the morning."; ans = False
        items.append({"id":f"t{i}","passage":p,"claim":c,"answer":ans})
    return {"items": items}

# ---------- Routes ----------
@app.post("/api/attempt")
def api_attempt(body: AttemptIn):
    with Session(engine) as s:
        p = get_or_init_progress(s, body.user_id, body.exercise)
        s.add(Attempt(**body.dict()))
        p.attempts += 1
        p.ema_accuracy = ALPHA*(1.0 if body.correct else 0.0) + (1-ALPHA)*p.ema_accuracy
        if body.latency_ms is not None:
            p.ema_latency_ms = ALPHA*float(body.latency_ms) + (1-ALPHA)*p.ema_latency_ms
        p.last_updated = datetime.utcnow()
        adjust_level(p, body.correct)
        s.add(p); s.commit()
    return {"ok": True}

@app.get("/api/progress")
def api_progress(user_id: str):
    with Session(engine) as s:
        rows = s.exec(select(Progress).where(Progress.user_id==user_id)).all()
        return {"user_id": user_id, "progress": [r.model_dump() for r in rows]}

@app.post("/api/next")
def api_next(body: NextIn):
    with Session(engine) as s:
        p = get_or_init_progress(s, body.user_id, body.exercise)

        if body.exercise == "speech":
            params = speech_params(p.level)
            if MOCK_MODE or client is None:
                out = mock_speech(params["count"], params["max_words"])
            else:
                sys = f"Generate short, functional phrases (A1/A2). Max words: {params['max_words']}. Return only JSON with fields: phrases:[{{id,target}}]."
                out = oa_json("gpt-4o-mini", sys, "SpeechPhrases", SPEECH_SCHEMA, f"Make {params['count']} phrases for daily use.")
            return {**out, "meta": {"level": p.level, "strictness": params["strictness"]}}

        if body.exercise == "prepositions":
            params = preposition_params(p.level)
            if MOCK_MODE or client is None:
                out = mock_prep(params["count"], params["blanks"], params["allowed"])
            else:
                allowed = ", ".join(params["allowed"])
                sys = (f"Create simple sentences with {params['blanks']} preposition blank(s). "
                       f"Use only these prepositions: {allowed}. Mark blanks with '{{blank}}'. "
                       "Return only JSON with fields: items:[{id,tokens[],answer[]}].")
                out = oa_json("gpt-4o-mini", sys, "PrepositionItems", PREP_SCHEMA, f"Make {params['count']} items. Keep language concrete.")
            return {**out, "meta": {"level": p.level}}

        if body.exercise == "sentence_tf":
            params = sentence_tf_params(p.level)
            if MOCK_MODE or client is None:
                out = mock_tf(params["count"], params["sentences"], params["inference"], params["negation"])
            else:
                flags = []
                if params.get("inference"): flags.append("include one inference-based claim")
                if params.get("negation"): flags.append("sometimes use negation in the claim")
                sys = ("Create short, concrete passages (1-2 sentences) with a single true/false claim; "
                       "avoid world knowledge. Return only JSON with fields: items:[{id,passage,claim,answer}].")
                out = oa_json("gpt-4o-mini", sys, "SentenceTFItems", TF_SCHEMA,
                              f"Make {params['count']} items. Passages: {params.get('sentences',1)} sentence(s). {' '.join(flags)}")
            return {**out, "meta": {"level": p.level}}

        raise HTTPException(400, "Unknown exercise")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
