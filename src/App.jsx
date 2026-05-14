import { useState, useEffect, useRef } from "react";

const SUPABASE_URL = "https://nuslkiubnwkojvbifggi.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51c2xraXVibndrb2p2YmlmZ2dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMjQzOTMsImV4cCI6MjA5MzYwMDM5M30.bKD9IvZNiZ69aoqrs01E2haf_RbwEC7l2RZmSUZG7GE";

const H = { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Prefer": "return=representation" };

async function dbGet(table, q = "") {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${q}`, { headers: H });
  return r.json();
}
async function dbInsert(table, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method: "POST", headers: H, body: JSON.stringify(body) });
  return r.json();
}
async function dbUpsert(table, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...H, "Prefer": "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(body),
  });
  return r.json();
}

const chapters = [
  { id: 1, title: "Los Primeros Años", icon: "🌱", color: "#b8860b", questions: ["¿Dónde naciste y cómo era ese lugar? ¿Qué recuerdas de tu infancia?", "¿Cómo eran tus padres? ¿Qué aprendiste de ellos?", "¿Cuál es el recuerdo más vívido de tu niñez?"] },
  { id: 2, title: "Juventud y Descubrimiento", icon: "🔥", color: "#c0522a", questions: ["¿Qué soñabas ser de joven? ¿Qué te apasionaba?", "¿Hubo algún momento que cambió el rumbo de tu vida?", "¿Cuál fue tu primera gran aventura o decisión importante?"] },
  { id: 3, title: "Amor y Familia", icon: "❤️", color: "#a0345a", questions: ["¿Cómo conociste a las personas más importantes de tu vida?", "¿Qué significa para ti la familia?", "¿Cuál es el momento más feliz que recuerdas con tus seres queridos?"] },
  { id: 4, title: "Retos y Fortaleza", icon: "⚡", color: "#2a5f8f", questions: ["¿Cuál ha sido el momento más difícil de tu vida y cómo lo superaste?", "¿Qué lección aprendiste de tus errores?", "¿De qué momento de tu vida te sientes más orgulloso/a?"] },
  { id: 5, title: "Legado y Reflexión", icon: "✨", color: "#5a3e8a", questions: ["¿Qué quieres que recuerden de ti?", "¿Qué consejo le darías a las generaciones futuras?", "Si pudieras resumir tu vida en una sola frase, ¿cuál sería?"] },
];

const allQ = chapters.flatMap(ch =>
  ch.questions.map((q, i) => ({ chapterId: ch.id, chapterTitle: ch.title, chapterIcon: ch.icon, chapterColor: ch.color, question: q, key: `${ch.id}-${i}` }))
);

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&family=Crimson+Pro:ital,wght@0,300;0,400;1,300&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  .app{min-height:100vh;background:#0d0b08;font-family:'Crimson Pro',Georgia,serif;color:#e0d5c5}
  .fade{animation:fi 0.5s ease forwards}
  @keyframes fi{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  .inp{width:100%;background:transparent;border:none;border-bottom:1px solid #2e2418;color:#e0d5c5;font-size:1.1rem;padding:.75rem 0;outline:none;font-family:'Crimson Pro',serif;transition:border-color .3s}
  .inp:focus{border-bottom-color:#b8860b}
  .inp::placeholder{color:#4a3e2e}
  .btn{background:#b8860b;color:#0d0b08;border:none;padding:.9rem 2.5rem;font-size:.78rem;letter-spacing:.25em;text-transform:uppercase;cursor:pointer;font-family:'Crimson Pro',serif;transition:all .3s}
  .btn:hover{background:#d4a017}
  .btn:disabled{background:#2e2418;color:#4a3e2e;cursor:not-allowed}
  .ghost{background:transparent;border:1px solid #2e2418;color:#8a7a5a;padding:.6rem 1.4rem;font-size:.72rem;letter-spacing:.2em;text-transform:uppercase;cursor:pointer;font-family:'Crimson Pro',serif;transition:all .3s}
  .ghost:hover{border-color:#b8860b;color:#b8860b}
  .ghost:disabled{opacity:.2;cursor:not-allowed}
  textarea{resize:none}
  ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0d0b08}::-webkit-scrollbar-thumb{background:#2e2418;border-radius:2px}
  .sq{padding:.3rem .75rem;margin-top:.2rem;border-radius:3px;cursor:pointer;font-size:.68rem;line-height:1.5;border-left:2px solid transparent;transition:all .2s;color:#3a3028}
  .sq:hover{color:#6a5e4e}
  .sq.cur{color:#e0d5c5;background:#1a1510}
  .sq.ok{color:#6a5e4e}
`;

export default function MemoDraft() {
  const [screen, setScreen] = useState("welcome");
  const [authorName, setAuthorName] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [bookId, setBookId] = useState(null);
  const [curQ, setCurQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [loadCode, setLoadCode] = useState("");
  const [loadMode, setLoadMode] = useState(false);
  const [error, setError] = useState("");
  const timer = useRef(null);

  const totalQ = allQ.length;
  const answered = Object.keys(answers).filter(k => answers[k]).length;
  const progress = Math.round((answered / totalQ) * 100);
  const cq = allQ[curQ];

  useEffect(() => {
    if (!bookId || !draft) return;
    clearTimeout(timer.current);
    setSavedOk(false);
    timer.current = setTimeout(() => saveAnswer(curQ, draft), 1400);
    return () => clearTimeout(timer.current);
  }, [draft]);

  async function saveAnswer(idx, text) {
    if (!bookId || !text.trim()) return;
    setSaving(true);
    const q = allQ[idx];
    await dbUpsert("respuestas", {
      libro_id: bookId, capitulo: q.chapterId,
      numero_pregunta: parseInt(q.key.split("-")[1]),
      texto: text.trim(), actualizado_en: new Date().toISOString(),
    });
    setAnswers(p => ({ ...p, [q.key]: text.trim() }));
    setSaving(false); setSavedOk(true);
    setTimeout(() => setSavedOk(false), 2000);
  }

  async function createBook() {
    if (!authorName.trim()) return;
    setScreen("loading"); setError("");
    const data = await dbInsert("libros", { nombre_autor: authorName.trim(), titulo_libro: bookTitle.trim() || "Mis Memorias" });
    if (!data?.[0]) { setError("Error al crear el libro. Intenta de nuevo."); setScreen("welcome"); return; }
    setBookId(data[0].id); setScreen("writing"); setDraft("");
  }

  async function loadBook() {
    if (!loadCode.trim()) return;
    setScreen("loading"); setError("");
    const id = parseInt(loadCode.trim());
    if (isNaN(id)) { setError("Código inválido."); setScreen("welcome"); return; }
    const libros = await dbGet("libros", `id=eq.${id}`);
    if (!libros?.[0]) { setError("No encontramos un libro con ese código."); setScreen("welcome"); return; }
    const libro = libros[0];
    const resps = await dbGet("respuestas", `libro_id=eq.${id}`);
    const loaded = {};
    resps?.forEach(r => { loaded[`${r.capitulo}-${r.numero_pregunta}`] = r.texto; });
    setAuthorName(libro.nombre_autor); setBookTitle(libro.titulo_libro);
    setBookId(id); setAnswers(loaded); setScreen("writing");
    setDraft(loaded[allQ[0].key] || "");
  }

  function goTo(idx) {
    if (draft.trim()) saveAnswer(curQ, draft);
    setCurQ(idx); setDraft(answers[allQ[idx]?.key] || "");
  }

  function handleNext() {
    if (draft.trim()) saveAnswer(curQ, draft);
    if (curQ < totalQ - 1) goTo(curQ + 1); else setScreen("preview");
  }

  if (screen === "welcome") return (
    <div className="app fade" style={{ display:"flex", minHeight:"100vh", alignItems:"center", justifyContent:"center", padding:"2rem" }}>
      <style>{css}</style>
      <div style={{ maxWidth:460, width:"100%" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"2.5rem" }}>
          <div style={{ flex:1, height:1, background:"linear-gradient(to right,transparent,#b8860b50)" }}/>
          <span style={{ color:"#b8860b" }}>📖</span>
          <div style={{ flex:1, height:1, background:"linear-gradient(to left,transparent,#b8860b50)" }}/>
        </div>
        <p style={{ color:"#b8860b", letterSpacing:".3em", fontSize:".65rem", textTransform:"uppercase", marginBottom:".75rem" }}>Tu historia merece ser contada</p>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(2.5rem,7vw,4rem)", fontWeight:400, color:"#f0e5d0", marginBottom:".5rem", lineHeight:1.1 }}>MemoDraft</h1>
        <p style={{ color:"#5a4e3a", fontStyle:"italic", marginBottom:"3rem" }}>Escribe el libro de tu vida</p>

        {!loadMode ? (<>
          <div style={{ marginBottom:"1.5rem" }}>
            <label style={{ display:"block", fontSize:".65rem", letterSpacing:".2em", color:"#b8860b", textTransform:"uppercase", marginBottom:".5rem" }}>Tu nombre</label>
            <input className="inp" value={authorName} onChange={e=>setAuthorName(e.target.value)} placeholder="¿Cómo te llamas?" />
          </div>
          <div style={{ marginBottom:"2.5rem" }}>
            <label style={{ display:"block", fontSize:".65rem", letterSpacing:".2em", color:"#b8860b", textTransform:"uppercase", marginBottom:".5rem" }}>Título de tu libro</label>
            <input className="inp" value={bookTitle} onChange={e=>setBookTitle(e.target.value)} placeholder="Ej: Historia de mi vida…" />
          </div>
          {error && <p style={{ color:"#c05030", fontSize:".85rem", marginBottom:"1rem" }}>{error}</p>}
          <button className="btn" onClick={createBook} disabled={!authorName.trim()}>Comenzar mi historia →</button>
          <p style={{ marginTop:"1.5rem", color:"#3a3028", fontSize:".8rem" }}>
            ¿Ya tienes un libro?{" "}
            <span style={{ color:"#b8860b", cursor:"pointer", textDecoration:"underline" }} onClick={()=>{setLoadMode(true);setError("")}}>Continuar con mi código</span>
          </p>
        </>) : (<>
          <div style={{ marginBottom:"2.5rem" }}>
            <label style={{ display:"block", fontSize:".65rem", letterSpacing:".2em", color:"#b8860b", textTransform:"uppercase", marginBottom:".5rem" }}>Tu código de libro</label>
            <input className="inp" value={loadCode} onChange={e=>setLoadCode(e.target.value)} placeholder="Ej: 1, 2, 3…" />
            <p style={{ color:"#4a3e2e", fontSize:".75rem", marginTop:".5rem" }}>El número que recibiste al crear tu libro</p>
          </div>
          {error && <p style={{ color:"#c05030", fontSize:".85rem", marginBottom:"1rem" }}>{error}</p>}
          <button className="btn" onClick={loadBook} disabled={!loadCode.trim()}>Continuar →</button>
          <p style={{ marginTop:"1.5rem", color:"#3a3028", fontSize:".8rem" }}>
            <span style={{ color:"#b8860b", cursor:"pointer", textDecoration:"underline" }} onClick={()=>{setLoadMode(false);setError("")}}>← Crear nuevo libro</span>
          </p>
        </>)}
      </div>
    </div>
  );

  if (screen === "loading") return (
    <div className="app" style={{ display:"flex", minHeight:"100vh", alignItems:"center", justifyContent:"center" }}>
      <style>{css}</style>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:36, height:36, border:"1px solid #b8860b", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 1s linear infinite", margin:"0 auto 1rem" }}/>
        <p style={{ color:"#5a4e3a", fontSize:".8rem", letterSpacing:".15em" }}>Cargando tu historia…</p>
      </div>
    </div>
  );

  if (screen === "preview") {
    const chaps = chapters.map(ch=>({
      ...ch, qa: ch.questions.map((q,i)=>({question:q,answer:answers[`${ch.id}-${i}`]||""})).filter(qa=>qa.answer)
    })).filter(ch=>ch.qa.length>0);
    return (
      <div className="app fade" style={{ padding:"3rem 2rem" }}>
        <style>{css}</style>
        <div style={{ maxWidth:660, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:"4rem", paddingBottom:"3rem", borderBottom:"1px solid #1e1810" }}>
            <p style={{ color:"#b8860b", letterSpacing:".3em", fontSize:".65rem", textTransform:"uppercase", marginBottom:"1rem" }}>Memorias personales</p>
            <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(2rem,5vw,3.5rem)", fontWeight:400, color:"#f0e5d0", marginBottom:".75rem" }}>{bookTitle||"Mis Memorias"}</h1>
            <p style={{ color:"#6a5e4a", fontStyle:"italic", marginBottom:"1rem" }}>por {authorName}</p>
            <div style={{ display:"inline-block", background:"#1a1410", border:"1px solid #2e2418", padding:".5rem 1.25rem", borderRadius:2 }}>
              <p style={{ color:"#5a4e3a", fontSize:".7rem" }}>Código de tu libro: <strong style={{ color:"#b8860b", fontSize:"1rem" }}>#{bookId}</strong></p>
              <p style={{ color:"#3a3028", fontSize:".65rem" }}>Guárdalo para continuar desde cualquier dispositivo</p>
            </div>
          </div>
          {chaps.map((ch,ci)=>(
            <div key={ch.id} style={{ marginBottom:"3.5rem" }}>
              <div style={{ display:"flex", alignItems:"center", gap:".75rem", marginBottom:"1.5rem" }}>
                <span style={{ fontSize:"1.3rem" }}>{ch.icon}</span>
                <div>
                  <p style={{ color:"#4a3e2e", fontSize:".65rem", letterSpacing:".2em", textTransform:"uppercase" }}>Capítulo {ci+1}</p>
                  <h2 style={{ fontFamily:"'Playfair Display',serif", color:ch.color, fontSize:"1.3rem", fontWeight:400 }}>{ch.title}</h2>
                </div>
              </div>
              {ch.qa.map((qa,qi)=>(
                <div key={qi} style={{ marginBottom:"1.5rem", paddingLeft:"1.5rem", borderLeft:`2px solid ${ch.color}30` }}>
                  <p style={{ color:"#5a4e3a", fontSize:".8rem", fontStyle:"italic", marginBottom:".5rem" }}>{qa.question}</p>
                  <p style={{ color:"#d0c5b0", lineHeight:1.9, fontSize:"1rem" }}>{qa.answer}</p>
                </div>
              ))}
            </div>
          ))}
          <div style={{ display:"flex", justifyContent:"center", paddingTop:"2rem", borderTop:"1px solid #1e1810" }}>
            <button className="ghost" onClick={()=>{setScreen("writing");setDraft(answers[allQ[curQ]?.key]||"")}}>← Seguir escribiendo</button>
          </div>
        </div>
      </div>
    );
  }

  // WRITING
  const chProg = chapters.map(ch=>({
    ...ch, total:ch.questions.length,
    done:ch.questions.filter((_,i)=>answers[`${ch.id}-${i}`]).length
  }));

  return (
    <div className="app" style={{ display:"flex", minHeight:"100vh" }}>
      <style>{css}</style>

      {/* Sidebar */}
      <div style={{ width:220, flexShrink:0, background:"#080604", borderRight:"1px solid #1a1410", padding:"1.5rem 1rem", display:"flex", flexDirection:"column", overflowY:"auto" }}>
        <p style={{ fontFamily:"'Playfair Display',serif", color:"#b8860b", fontSize:".9rem", marginBottom:".2rem" }}>MemoDraft</p>
        <p style={{ color:"#3a3028", fontSize:".7rem", fontStyle:"italic", marginBottom:"1.5rem" }}>{bookTitle||"Mis Memorias"}</p>

        {chProg.map(ch=>(
          <div key={ch.id} style={{ marginBottom:"1rem" }}>
            <div style={{ display:"flex", alignItems:"center", gap:".4rem", marginBottom:".3rem" }}>
              <span style={{ fontSize:".85rem" }}>{ch.icon}</span>
              <span style={{ fontSize:".68rem", color:ch.done===ch.total?ch.color:"#4a3e2e", flex:1 }}>{ch.title}</span>
              <span style={{ fontSize:".6rem", color:"#3a3028" }}>{ch.done}/{ch.total}</span>
            </div>
            <div style={{ height:1.5, background:"#1a1410", borderRadius:1, marginBottom:".3rem" }}>
              <div style={{ height:"100%", width:`${(ch.done/ch.total)*100}%`, background:ch.color, borderRadius:1, transition:"width .4s" }}/>
            </div>
            {ch.questions.map((q,i)=>{
              const key=`${ch.id}-${i}`;
              const gi=allQ.findIndex(aq=>aq.key===key);
              const isCur=gi===curQ; const isDone=!!answers[key];
              return (
                <div key={i} className={`sq ${isCur?"cur":""} ${isDone&&!isCur?"ok":""}`}
                  style={{ borderLeftColor:isCur?ch.color:"transparent" }}
                  onClick={()=>goTo(gi)}>
                  {isDone&&!isCur&&<span style={{ color:ch.color, marginRight:".3rem" }}>✓</span>}
                  {q.substring(0,36)}…
                </div>
              );
            })}
          </div>
        ))}

        <div style={{ marginTop:"auto", paddingTop:"1.5rem", borderTop:"1px solid #1a1410" }}>
          <div style={{ height:2, background:"#1a1410", borderRadius:1, marginBottom:".4rem" }}>
            <div style={{ height:"100%", width:`${progress}%`, background:"#b8860b", borderRadius:1, transition:"width .4s" }}/>
          </div>
          <p style={{ color:"#3a3028", fontSize:".65rem", marginBottom:".5rem" }}>{progress}% completado</p>
          <p style={{ color:"#3a3028", fontSize:".65rem", marginBottom:".75rem" }}>Tu código: <strong style={{ color:"#b8860b" }}>#{bookId}</strong></p>
          {answered>0&&<button className="ghost" style={{ width:"100%", fontSize:".65rem" }} onClick={()=>setScreen("preview")}>Ver libro →</button>}
        </div>
      </div>

      {/* Main */}
      <div style={{ flex:1, padding:"2.5rem 3rem", display:"flex", flexDirection:"column" }}>
        <div style={{ display:"flex", alignItems:"center", gap:".75rem", marginBottom:"2.5rem" }}>
          <span style={{ fontSize:"1.3rem" }}>{cq.chapterIcon}</span>
          <div style={{ flex:1 }}>
            <p style={{ color:"#3a3028", fontSize:".6rem", letterSpacing:".2em", textTransform:"uppercase" }}>
              Capítulo {cq.chapterId} · Pregunta {(curQ%3)+1} de 3
            </p>
            <p style={{ color:cq.chapterColor, fontSize:".85rem" }}>{cq.chapterTitle}</p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:".5rem" }}>
            {saving&&<span style={{ color:"#4a3e2e", fontSize:".65rem" }}>guardando…</span>}
            {!saving&&savedOk&&<span style={{ color:"#2a6a3a", fontSize:".65rem" }}>✓ guardado</span>}
            <span style={{ color:"#3a3028", fontSize:".75rem" }}>{curQ+1}/{totalQ}</span>
          </div>
        </div>

        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(1.2rem,2.5vw,1.7rem)", fontWeight:400, color:"#f0e5d0", lineHeight:1.5, marginBottom:"2rem", maxWidth:540 }}>
          {cq.question}
        </h2>

        <textarea
          value={draft} onChange={e=>setDraft(e.target.value)}
          placeholder="Escribe aquí… no hay respuestas incorrectas. Solo tus palabras, tu historia."
          style={{ flex:1, minHeight:200, background:"transparent", border:"none", borderTop:`1px solid ${cq.chapterColor}30`, color:"#d0c5b0", fontSize:"1rem", lineHeight:1.9, padding:"1.5rem 0", outline:"none", fontFamily:"'Crimson Pro',serif", width:"100%" }}
        />

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:"1.5rem", paddingTop:"1.5rem", borderTop:"1px solid #1a1410" }}>
          <button className="ghost" onClick={()=>goTo(curQ-1)} disabled={curQ===0}>← Anterior</button>
          <div style={{ display:"flex", gap:".3rem", alignItems:"center" }}>
            {allQ.map((q,i)=>(
              <div key={i} onClick={()=>goTo(i)} style={{ width:i===curQ?20:6, height:6, borderRadius:3, background:answers[q.key]?q.chapterColor:i===curQ?"#6a5e4a":"#2e2418", cursor:"pointer", transition:"all .3s" }}/>
            ))}
          </div>
          <button className="btn" onClick={handleNext}>{curQ===totalQ-1?"Ver libro ✨":"Siguiente →"}</button>
        </div>
      </div>
    </div>
  );
}
