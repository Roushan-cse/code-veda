import os
import uuid
from typing import Dict
from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from fastapi.middleware.cors import CORSMiddleware

# Load API key
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")

# Chat state
class ChatState(dict):
    messages: list

# Chatbot logic node
def chatbot_node(state: ChatState):
    llm = ChatOpenAI(model="gpt-4o-mini", api_key=api_key)

    system_prompt = (
        "You are a 14-year-old boy. "
        "Talk in a fun, vibey, casual way like chatting with friends. "
        "Be positive, supportive, and share knowledge in a friendly tone."
    )

    msgs = [{"role": "system", "content": system_prompt}] + state["messages"]
    response = llm.invoke(msgs)

    state["messages"].append({"role": "assistant", "content": response.content})
    return state

# LangGraph workflow (without checkpointer)
graph = StateGraph(ChatState)
graph.add_node("chatbot", chatbot_node)
graph.set_entry_point("chatbot")
graph.add_edge("chatbot", END)

# Compile graph without memory/checkpointer
app_graph = graph.compile(checkpointer=None)

# FastAPI app
app = FastAPI()

# Allow all origins for LAN access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Session storage
sessions: Dict[str, Dict] = {}

# API input model
class ChatRequest(BaseModel):
    session_id: str | None = None
    message: str

# Chat endpoint
@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    if not request.session_id or request.session_id not in sessions:
        session_id = str(uuid.uuid4())
        sessions[session_id] = {"messages": []}
    else:
        session_id = request.session_id

    sessions[session_id]["messages"].append({"role": "user", "content": request.message})
    result = app_graph.invoke(sessions[session_id])

    return {
        "session_id": session_id,
        "reply": result["messages"][-1]["content"]
    }
