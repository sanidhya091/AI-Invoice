from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
import bcrypt
import os
import uuid
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import io

from database import engine, get_db
from models import Base, User, Client, Invoice, InvoiceStatus

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:5173", "https://ai-invoice-hazel.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

security = HTTPBearer()
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))


# ---------- Pydantic Schemas ----------

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class AIRequest(BaseModel):
    description: str

class InvoiceCreate(BaseModel):
    client_id: str | None = None
    invoice_number: str
    description: str | None = None
    amount: float
    due_date: datetime | None = None

class ClientCreate(BaseModel):
    name: str
    email: str
    phone: str | None = None
    address: str | None = None


# ---------- Helpers ----------

def hash_password(password: str):
     return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain: str, hashed: str):
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))

def create_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ---------- Auth Routes ----------

@app.get("/")
def health():
    return {"status": "InvoiceAI backend is running"}

@app.post("/auth/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        name=req.name,
        email=req.email,
        hashed_password=hash_password(req.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    token = create_token({"sub": user.email})
    return {"token": token, "token_type": "bearer", "name": user.name}

@app.post("/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token({"sub": user.email})
    return {"token": token, "token_type": "bearer", "name": user.name}

@app.get("/auth/me")
def me(current_user: User = Depends(get_current_user)):
    return {"id": str(current_user.id), "name": current_user.name, "email": current_user.email}


# ---------- AI Route ----------

@app.post("/ai/suggest")
def ai_suggest(req: AIRequest, current_user: User = Depends(get_current_user)):
    chat = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "You are an expert at writing professional invoice descriptions. Given a rough description, return a clean, professional invoice line item description. Keep it concise and business-appropriate."},
            {"role": "user", "content": req.description}
        ]
    )
    return {"suggestion": chat.choices[0].message.content}


# ---------- Invoice Routes ----------

@app.post("/invoices")
def create_invoice(req: InvoiceCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    invoice = Invoice(
        user_id=current_user.id,
        client_id=uuid.UUID(req.client_id) if req.client_id else None,
        invoice_number=req.invoice_number,
        description=req.description,
        amount=req.amount,
        due_date=req.due_date,
        status=InvoiceStatus.draft
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return {"id": str(invoice.id), "invoice_number": invoice.invoice_number, "status": invoice.status}

@app.get("/invoices")
def get_invoices(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    invoices = db.query(Invoice).filter(Invoice.user_id == current_user.id).all()
    return [
        {
            "id": str(i.id),
            "invoice_number": i.invoice_number,
            "description": i.description,
            "amount": i.amount,
            "status": i.status,
            "due_date": i.due_date,
            "created_at": i.created_at
        }
        for i in invoices
    ]


# ---------- Client Routes ----------

@app.post("/clients")
def create_client(req: ClientCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    client = Client(
        user_id=current_user.id,
        name=req.name,
        email=req.email,
        phone=req.phone,
        address=req.address
    )
    db.add(client)
    db.commit()
    db.refresh(client)
    return {"id": str(client.id), "name": client.name, "email": client.email}

@app.get("/clients")
def get_clients(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    clients = db.query(Client).filter(Client.user_id == current_user.id).all()
    return [
        {
            "id": str(c.id),
            "name": c.name,
            "email": c.email,
            "phone": c.phone,
            "address": c.address,
            "created_at": c.created_at
        }
        for c in clients
    ]

# ---------- PDF Export ----------

@app.get("/invoices/{invoice_id}/pdf")
def export_pdf(invoice_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(
        Invoice.id == uuid.UUID(invoice_id),
        Invoice.user_id == current_user.id
    ).first()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            rightMargin=60, leftMargin=60,
                            topMargin=60, bottomMargin=60)
    styles = getSampleStyleSheet()
    story = []

    # ── Header ──────────────────────────────────────────────
    header_data = [
        [
            Paragraph("<b>InvoiceAI</b>", ParagraphStyle("co", fontSize=22, fontName="Helvetica-Bold")),
            Paragraph(f"<b>INVOICE</b>", ParagraphStyle("inv", fontSize=22, fontName="Helvetica-Bold", alignment=2)),
        ]
    ]
    header_table = Table(header_data, colWidths=[3.5*inch, 3.5*inch])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(header_table)

    # ── Divider ──────────────────────────────────────────────
    story.append(Table([[""]], colWidths=[7*inch], rowHeights=[2]))
    story[-1].setStyle(TableStyle([("BACKGROUND", (0,0), (-1,-1), colors.black)]))
    story.append(Spacer(1, 16))

    # ── Invoice Meta ─────────────────────────────────────────
    meta_data = [
        [
            Paragraph(f"<b>Invoice No:</b> {invoice.invoice_number}", styles["Normal"]),
            Paragraph(f"<b>Date:</b> {invoice.created_at.strftime('%d %B %Y')}", ParagraphStyle("r", fontSize=10, alignment=2)),
        ],
        [
            Paragraph(f"<b>Status:</b> {invoice.status.value.upper()}", styles["Normal"]),
            Paragraph(f"<b>Due Date:</b> {invoice.due_date.strftime('%d %B %Y') if invoice.due_date else '—'}", ParagraphStyle("r", fontSize=10, alignment=2)),
        ],
    ]
    meta_table = Table(meta_data, colWidths=[3.5*inch, 3.5*inch])
    meta_table.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 24))

    # ── Bill To ───────────────────────────────────────────────
    story.append(Paragraph("<b>BILL TO</b>", ParagraphStyle("label", fontSize=9, fontName="Helvetica-Bold", textColor=colors.HexColor("#555555"), spaceAfter=4)))
    story.append(Paragraph(current_user.name, ParagraphStyle("val", fontSize=11, fontName="Helvetica-Bold")))
    story.append(Paragraph(current_user.email, ParagraphStyle("val2", fontSize=10)))
    story.append(Spacer(1, 24))

    # ── Line Items Table ──────────────────────────────────────
    item_data = [
        ["#", "Description", "Amount"],
        ["1", invoice.description or "Service", f"${invoice.amount:,.2f}"],
    ]
    item_table = Table(item_data, colWidths=[0.4*inch, 5.1*inch, 1.5*inch])
    item_table.setStyle(TableStyle([
        # Header row
        ("BACKGROUND", (0, 0), (-1, 0), colors.black),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("TOPPADDING", (0, 0), (-1, 0), 10),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
        # Data rows
        ("FONTSIZE", (0, 1), (-1, -1), 10),
        ("TOPPADDING", (0, 1), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F5F5F5")]),
        ("LINEBELOW", (0, -1), (-1, -1), 0.5, colors.black),
        ("ALIGN", (2, 0), (2, -1), "RIGHT"),
    ]))
    story.append(item_table)
    story.append(Spacer(1, 12))

    # ── Total ─────────────────────────────────────────────────
    total_data = [
        ["", "Subtotal", f"${invoice.amount:,.2f}"],
        ["", "Tax (0%)", "$0.00"],
        ["", "TOTAL DUE", f"${invoice.amount:,.2f}"],
    ]
    total_table = Table(total_data, colWidths=[4*inch, 1.5*inch, 1.5*inch])
    total_table.setStyle(TableStyle([
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, -1), (-1, -1), 12),
        ("LINEABOVE", (1, -1), (-1, -1), 1, colors.black),
        ("LINEABOVE", (1, 0), (-1, 0), 0.5, colors.HexColor("#CCCCCC")),
    ]))
    story.append(total_table)
    story.append(Spacer(1, 40))

    # ── Footer ────────────────────────────────────────────────
    story.append(Table([[""]], colWidths=[7*inch], rowHeights=[1]))
    story[-1].setStyle(TableStyle([("BACKGROUND", (0,0), (-1,-1), colors.HexColor("#CCCCCC"))]))
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "Thank you for your business. Please make payment by the due date.",
        ParagraphStyle("footer", fontSize=9, textColor=colors.HexColor("#777777"), alignment=1)
    ))
    story.append(Paragraph(
        "Generated by InvoiceAI",
        ParagraphStyle("footer2", fontSize=8, textColor=colors.HexColor("#AAAAAA"), alignment=1)
    ))

    doc.build(story)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=invoice-{invoice.invoice_number}.pdf"}
    )