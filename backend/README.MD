## Local Development

### 1) Backend (FastAPI)

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install fastapi "uvicorn[standard]" sqlmodel pydantic python-dotenv openai==1.*