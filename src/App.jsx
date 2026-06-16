import { useState, useRef, useEffect } from "react";

// ── SUPABASE CONFIG ───────────────────────────────────────────────────────────
const SUPABASE_URL = "https://njxoevjpvrkmtmbrndpf.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qeG9ldmpwdnJrbXRtYnJuZHBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNTU1MDksImV4cCI6MjA5NjYzMTUwOX0._Wef12t2COcXA8gaOyOs7dlmCiF7m2OlXAJRsXSNaZc";

const sb = {
  from: (table) => ({
    select: (cols="*") => fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${cols}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    }).then(r => r.json()),
    insert: (data) => fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(data)
    }).then(r => r.json()),
    update: (data, match) => {
      const params = Object.entries(match).map(([k,v]) => `${k}=eq.${v}`).join("&");
      return fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
        method: "PATCH",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify(data)
      }).then(r => r.json());
    },
    delete: (match) => {
      const params = Object.entries(match).map(([k,v]) => `${k}=eq.${v}`).join("&");
      return fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
        method: "DELETE",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
      });
    },
    filter: (col, op, val) => {
      const base = `${SUPABASE_URL}/rest/v1/${table}?${col}=${op}.${val}`;
      return {
        select: (cols="*") => fetch(`${base}&select=${cols}`, {
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
        }).then(r => r.json()),
      };
    }
  })
};

// ── ESTADO INICIAL (simula lo que vendrá de Supabase) ────────────────────────
const VINOS_INICIALES = [
  { id: 1,  nombre: "Catena Zapata Adrianna",      tipo: "Tinto",    cepa: "Malbec",             pais: "Argentina", region: "Mendoza",          precio: 2800, clasificacion: "Gran Reserva", descripcion: "Ciruela negra, chocolate, violetas. Final eterno.",                   stock: 4,  imagen: null },
  { id: 2,  nombre: "Achaval Ferrer Quimera",       tipo: "Tinto",    cepa: "Blend",              pais: "Argentina", region: "Mendoza",          precio: 1650, clasificacion: "Reserva",      descripcion: "Elegante blend de Malbec con Cabernet y Merlot.",                    stock: 6,  imagen: null },
  { id: 3,  nombre: "Luigi Bosca Gala 1",           tipo: "Blanco",   cepa: "Chardonnay",         pais: "Argentina", region: "Luján de Cuyo",    precio: 980,  clasificacion: "Reserva",      descripcion: "Mantequilla, vainilla, manzana verde. Cremoso y fresco.",            stock: 3,  imagen: null },
  { id: 4,  nombre: "Barolo Marchesi di Barolo",    tipo: "Tinto",    cepa: "Nebbiolo",           pais: "Italia",    region: "Piemonte",         precio: 2200, clasificacion: "DOCG",         descripcion: "El rey de los vinos italianos. Cereza, rosas, alquitrán.",           stock: 5,  imagen: null },
  { id: 5,  nombre: "Chianti Classico Riserva",     tipo: "Tinto",    cepa: "Sangiovese",         pais: "Italia",    region: "Toscana",          precio: 1350, clasificacion: "Riserva",      descripcion: "Cerezas silvestres, cuero, hierbas mediterráneas.",                  stock: 8,  imagen: null },
  { id: 6,  nombre: "Pinot Grigio Santa Margherita",tipo: "Blanco",   cepa: "Pinot Grigio",       pais: "Italia",    region: "Alto Adige",       precio: 820,  clasificacion: "DOC",          descripcion: "Manzana, pera, almendras. Seco y vivaz.",                            stock: 12, imagen: null },
  { id: 7,  nombre: "Franciacorta Bellavista",      tipo: "Espumoso", cepa: "Chardonnay",         pais: "Italia",    region: "Lombardía",        precio: 1600, clasificacion: "DOCG",         descripcion: "El Champagne italiano. Brioche, cítricos, burbujas finas.",          stock: 4,  imagen: null },
  { id: 8,  nombre: "Vega Sicilia Valbuena",        tipo: "Tinto",    cepa: "Tempranillo",        pais: "España",    region: "Ribera del Duero", precio: 3200, clasificacion: "Gran Reserva", descripcion: "Leyenda española. Frutos rojos, cedro, especias.",                   stock: 2,  imagen: null },
  { id: 9,  nombre: "Albariño Pazo de Señoráns",    tipo: "Blanco",   cepa: "Albariño",           pais: "España",    region: "Rías Baixas",      precio: 760,  clasificacion: "DO",           descripcion: "Melocotón, flores blancas, acidez vibrante.",                        stock: 9,  imagen: null },
  { id: 10, nombre: "Cava Gramona Imperial",        tipo: "Espumoso", cepa: "Macabeo",            pais: "España",    region: "Penedès",          precio: 920,  clasificacion: "Gran Reserva", descripcion: "Tostado, miel, cítricos con burbuja elegante.",                      stock: 6,  imagen: null },
  { id: 11, nombre: "L.A. Cetto Nebbiolo",          tipo: "Tinto",    cepa: "Nebbiolo",           pais: "México",    region: "Baja California",  precio: 680,  clasificacion: "Reserva",      descripcion: "El orgullo mexicano. Cereza, vainilla y especias.",                  stock: 7,  imagen: null },
  { id: 12, nombre: "Monte Xanic Chenin Blanc",     tipo: "Blanco",   cepa: "Chenin Blanc",       pais: "México",    region: "Valle de Guadalupe",precio: 590, clasificacion: "Vino de autor",descripcion: "Durazno, miel y flores. Fresco y tropical.",                         stock: 5,  imagen: null },
  { id: 13, nombre: "Casas del Bosque Rosé",        tipo: "Rosado",   cepa: "Syrah",              pais: "Chile",     region: "Casablanca",       precio: 540,  clasificacion: "Reserva",      descripcion: "Fresas, sandía y pétalos de rosa. Seco y elegante.",                stock: 10, imagen: null },
  { id: 14, nombre: "Concha y Toro Don Melchor",    tipo: "Tinto",    cepa: "Cabernet Sauvignon", pais: "Chile",     region: "Puente Alto",      precio: 2100, clasificacion: "Gran Reserva", descripcion: "Ícono chileno. Grosellas, cedro, tabaco.",                           stock: 3,  imagen: null },
  { id: 15, nombre: "Moscato d'Asti Vietti",        tipo: "Dulce",    cepa: "Moscato",            pais: "Italia",    region: "Piemonte",         precio: 750,  clasificacion: "DOCG",         descripcion: "Durazno, albaricoque, flores. Levemente dulce y fresco.",            stock: 0,  imagen: null },
];

const PLATILLOS_INICIALES = [
  { id: 1, nombre: "Ossobuco alla Milanese", categoria: "Carnes",   imagen: null, vinosIds: [1, 2, 8] },
  { id: 2, nombre: "Branzino al Forno",      categoria: "Pescados", imagen: null, vinosIds: [3, 6, 9] },
  { id: 3, nombre: "Tagliatelle al Tartufo", categoria: "Pastas",   imagen: null, vinosIds: [4, 5, 7] },
  { id: 4, nombre: "Burrata con Prosciutto", categoria: "Entradas", imagen: null, vinosIds: [7, 10] },
  { id: 5, nombre: "Tiramisù della Casa",    categoria: "Postres",  imagen: null, vinosIds: [15, 12] },
];

const CONFIG_INICIAL = {
  nombre: "Trattoria al Passo",
  logo: null,
  fondoHome: null,          // imagen de fondo de la home
  fondoColor: "#0a0704",    // color de fondo si no hay imagen
  colorPrimario: "#c4a84e",
  colorSecundario: "#8b2035",
  colorFondo: "#0a0704",
  promoVinoId: 1,
  promoEtiqueta: "Vino del Mes",
  bloques: ["promo", "maridaje", "carta"], // orden configurable
};

const RAZONES_BAJA = ["Rotura", "Robo / Extravío", "Caducidad", "Error de inventario", "Cortesía / Muestra", "Otro"];
const TIPOS_VINO   = ["Tinto", "Blanco", "Rosado", "Espumoso", "Dulce"];
const TIPOS_FILTRO = ["Todos", ...TIPOS_VINO];

// ── ICONS ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 20, stroke = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke}>
    <path d={d}/>
  </svg>
);
const IWine   = () => <Icon d="M8 22h8M12 11v11M5 3h14l-1 6a6 6 0 01-12 0L5 3z"/>;
const IBack   = () => <Icon d="M15 18l-6-6 6-6"/>;
const IPlus   = () => <Icon d="M12 5v14M5 12h14"/>;
const IMinus  = () => <Icon d="M5 12h14"/>;
const ILock   = () => <Icon d="M7 11V7a5 5 0 0110 0v4M3 11h18v11H3z" size={32}/>;
const IEdit   = () => <Icon d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" size={16}/>;
const ITrash  = () => <Icon d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" size={16}/>;
const IStar   = ({ size=16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
const IImg    = () => <Icon d="M21 15l-5-5L5 20M3 3h18v18H3zM8.5 8.5a1 1 0 110-2 1 1 0 010 2z" size={16}/>;
const ICheck  = () => <Icon d="M20 6L9 17l-5-5"/>;

// ── WINE BOTTLE SVG ──────────────────────────────────────────────────────────
function WineBottle({ tipo, size = 120, imagen = null }) {
  const colors = { Tinto:["#5c1426","#8b2035"], Blanco:["#8b7a2e","#c4a84e"], Rosado:["#8b2d4e","#c46080"], Espumoso:["#1a5c48","#2e8a6e"], Dulce:["#5c4a1a","#8b7030"] };
  const [dark, light] = colors[tipo] || colors.Tinto;
  const w = size * 0.5, h = size;
  if (imagen) return (
    <div style={{ width: w, height: h, borderRadius: 6, overflow: "hidden", flexShrink: 0 }}>
      <img src={imagen} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
    </div>
  );
  return (
    <svg width={w} height={h} viewBox="0 0 60 120" fill="none">
      <defs>
        <linearGradient id={`bg-${tipo}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={dark}/><stop offset="50%" stopColor={light}/><stop offset="100%" stopColor={dark}/>
        </linearGradient>
      </defs>
      <path d="M18 45 Q15 50 15 60 L15 105 Q15 110 20 110 L40 110 Q45 110 45 105 L45 60 Q45 50 42 45 Z" fill={`url(#bg-${tipo})`} opacity="0.9"/>
      <rect x="23" y="18" width="14" height="28" rx="3" fill={`url(#bg-${tipo})`} opacity="0.9"/>
      <rect x="21" y="12" width="18" height="12" rx="3" fill={dark}/>
      <rect x="17" y="65" width="26" height="28" rx="2" fill="rgba(255,255,255,0.12)"/>
      <path d="M20 50 Q19 70 19 90" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

const Flag = ({ pais }) => {
  const f = { Argentina:"🇦🇷", Italia:"🇮🇹", España:"🇪🇸", México:"🇲🇽", Chile:"🇨🇱", Francia:"🇫🇷", Portugal:"🇵🇹", Australia:"🇦🇺", "Estados Unidos":"🇺🇸", Alemania:"🇩🇪" };
  return <span style={{ fontSize: 16 }}>{f[pais] || "🍷"}</span>;
};

const tipoBadge = { Tinto:{bg:"#7c1d2e",color:"#fce4ec"}, Blanco:{bg:"#6b5c2e",color:"#fffde7"}, Rosado:{bg:"#7c2d4a",color:"#fce4ec"}, Espumoso:{bg:"#1a4a3a",color:"#e0f2f1"}, Dulce:{bg:"#4a3a1a",color:"#fff8e1"} };

// ── IMAGE UPLOAD HELPER ──────────────────────────────────────────────────────
function ImageUploadBtn({ onImage, label = "Subir foto", small = false }) {
  const ref = useRef();
  const handle = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onImage(ev.target.result);
    reader.readAsDataURL(file);
  };
  return (
    <>
      <input type="file" accept="image/*" ref={ref} style={{ display: "none" }} onChange={handle}/>
      <button onClick={() => ref.current.click()} style={{
        background: "rgba(196,168,78,0.1)", border: "1px dashed rgba(196,168,78,0.4)",
        borderRadius: 8, padding: small ? "6px 12px" : "8px 16px",
        color: "#c4a84e", cursor: "pointer", fontFamily: "inherit",
        fontSize: small ? 11 : 13, display: "flex", alignItems: "center", gap: 6,
      }}>
        <IImg/> {label}
      </button>
    </>
  );
}

// ── COLOR PICKER HELPER ──────────────────────────────────────────────────────
function ColorPicker({ label, value, onChange }) {
  const ref = useRef();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div onClick={() => ref.current.click()} style={{ width: 32, height: 32, borderRadius: 6, background: value, border: "2px solid rgba(255,255,255,0.2)", cursor: "pointer", flexShrink: 0 }}/>
      <input type="color" ref={ref} value={value} onChange={e => onChange(e.target.value)} style={{ display: "none" }}/>
      <div>
        <div style={{ fontSize: 12, color: "#a09080" }}>{label}</div>
        <div style={{ fontSize: 11, color: "#806050", fontFamily: "monospace" }}>{value}</div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════════════════════════════════════
export default function CartaVinos() {
  // ── Shared state (en producción vendrá de Supabase) ──────────────────────
  const [vinos, setVinos] = useState(() =>
    VINOS_INICIALES.map(v => ({ ...v, pais: v.pais.trim().charAt(0).toUpperCase() + v.pais.trim().slice(1).toLowerCase() }))
  );
  const [platillos, setPlatillos] = useState(PLATILLOS_INICIALES);
  const [config,    setConfig]    = useState(CONFIG_INICIAL);

  // ── Navigation ───────────────────────────────────────────────────────────
  const [modo,          setModo]          = useState("guest");
  const [screen,        setScreen]        = useState("home");
  const [restauranteId, setRestauranteId] = useState(null);
  const [cargando,      setCargando]      = useState(false);
  const [restauranteActivo, setRestauranteActivo] = useState(null);

  // ── Cargar datos de Supabase al arrancar ─────────────────────────────────
  useEffect(() => {
    const cargar = async () => {
      try {
        // 1. Restaurante
        const rests = await sb.from("restaurantes").select("*");
        if (!rests || rests.error || rests.length === 0) { setCargando(false); return; }
        const rest = rests[0];
        setRestauranteId(rest.id);
        setRestauranteActivo(rest.activo);
        setConfig(c => ({
          ...c,
          nombre:          rest.nombre          || c.nombre,
          colorPrimario:   rest.color_primario   || c.colorPrimario,
          colorSecundario: rest.color_secundario || c.colorSecundario,
          colorFondo:      rest.color_fondo      || c.colorFondo,
          fondoColor:      rest.fondo_color      || c.fondoColor,
          promoEtiqueta:   rest.promo_etiqueta   || c.promoEtiqueta,
          bloques:         rest.bloques          || c.bloques,
        }));

        // 2. Vinos
        const vinosDB = await fetch(
          `${SUPABASE_URL}/rest/v1/vinos?restaurante_id=eq.${rest.id}&select=*`,
          { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
        ).then(r => r.json());

        if (vinosDB && vinosDB.length > 0) {
          setVinos(vinosDB.map(v => ({
            id: v.id, nombre: v.nombre, tipo: v.tipo, cepa: v.cepa,
            pais: v.pais, region: v.region, precio: Number(v.precio),
            clasificacion: v.clasificacion, descripcion: v.descripcion,
            stock: v.stock, activo: v.activo !== false, imagen: v.imagen_url || null,
          })));
        }

        // 3. Platillos + maridajes
        const platDB = await fetch(
          `${SUPABASE_URL}/rest/v1/platillos?restaurante_id=eq.${rest.id}&select=*`,
          { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
        ).then(r => r.json());

        if (platDB && platDB.length > 0) {
          const marDB = await fetch(
            `${SUPABASE_URL}/rest/v1/maridajes?select=*`,
            { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
          ).then(r => r.json());
          setPlatillos(platDB.map(p => ({
            id: p.id, nombre: p.nombre, categoria: p.categoria, imagen: p.imagen_url || null,
            vinosIds: (marDB||[]).filter(m => m.platillo_id === p.id)
              .sort((a,b) => a.orden - b.orden).map(m => m.vino_id),
          })));
        }

        // 4. Movimientos
        const movDB = await fetch(
          `${SUPABASE_URL}/rest/v1/movimientos?restaurante_id=eq.${rest.id}&order=created_at.desc&select=*`,
          { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
        ).then(r => r.json());

        if (movDB && movDB.length > 0) {
          setMovimientos(movDB.map(m => ({
            id: m.id, tipo: m.tipo, vinoNombre: m.vino_nombre,
            cantidad: m.cantidad, razon: m.razon,
            fecha: new Date(m.created_at).toLocaleDateString("es-MX", {day:"2-digit", month:"short", year:"numeric"}),
            hora:  new Date(m.created_at).toLocaleTimeString("es-MX", {hour:"2-digit", minute:"2-digit"}),
          })));
        }

      } catch(e) {
        console.error("Error cargando datos:", e);
      }
      setCargando(false);
    };
    cargar();
  }, []);

  // ── Guest state ──────────────────────────────────────────────────────────
  const [filtros,       setFiltros]       = useState({ tipo: "Todos", pais: "Todos", cepa: "Todas", precioMax: null });
  const [selectedVino,  setSelectedVino]  = useState(null);
  const [selectedPlat,  setSelectedPlat]  = useState(null);
  const [lockedVino,    setLockedVino]    = useState(null);
  const [pinInput,      setPinInput]      = useState("");
  const PIN = "1234";

  // ── Admin state ───────────────────────────────────────────────────────────
  const [adminPin,      setAdminPin]      = useState("");
  const [adminAuth,     setAdminAuth]     = useState(false);
  const ADMIN_PIN = "9999";
  const [adminTab,      setAdminTab]      = useState("inventario"); // inventario | maridaje | marca
  const [adminPais,     setAdminPais]     = useState("Todos");
  const [adminTipo,     setAdminTipo]     = useState("Todos");
  const [editingVino,   setEditingVino]   = useState(null);   // vino en edición
  const [nuevoVino,     setNuevoVino]     = useState(null);   // form nuevo vino
  const [bajaVino,      setBajaVino]      = useState(null);   // { vino, cantidad, razon }
  const [editingPlat,   setEditingPlat]   = useState(null);
  const [nuevoPlatillo, setNuevoPlatillo] = useState(null);
  const [toast,         setToast]         = useState(null);

  // ── Plataforma state ──────────────────────────────────────────────────────
  const [platPinInput,     setPlatPinInput]     = useState("");
  const [platRestaurantes, setPlatRestaurantes] = useState([]);

  const cargarPlataforma = async () => {
    try {
      const data = await fetch(`${SUPABASE_URL}/rest/v1/restaurantes?select=*&order=created_at.asc`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
      }).then(r => r.json());
      setPlatRestaurantes(data || []);
    } catch(e) { console.error("Error cargando plataforma:", e); }
  };

  const trackEvento = async (tipo, extra={}) => {
    if (!restauranteId) return;
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/eventos`, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, restaurante_id: restauranteId, ...extra }),
      });
    } catch(e) { /* silencioso */ }
  };

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 2500); };

  // ── Pantalla de carga ─────────────────────────────────────────────────────
  if (cargando) return (
    <div style={{ minHeight:"100vh", background:"#0a0704", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"'Cormorant Garamond','Georgia',serif", color:"#f5ede0" }}>
      <div style={{ fontSize:40, marginBottom:16 }}>🍷</div>
      <div style={{ fontSize:22, fontWeight:300, letterSpacing:4, marginBottom:8 }}>VinotecApp</div>
      <div style={{ fontSize:13, color:"#c4a84e", letterSpacing:3 }}>Cargando carta…</div>
    </div>
  );

  // ── Pantalla de servicio no disponible ────────────────────────────────────
  if (restauranteActivo === false) return (
    <div style={{ minHeight:"100vh", background:"#0a0704", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"'Cormorant Garamond','Georgia',serif", color:"#f5ede0", textAlign:"center", padding:32 }}>
      <div style={{ fontSize:48, marginBottom:20 }}>🍷</div>
      <div style={{ fontSize:11, letterSpacing:5, color:"#c4a84e", textTransform:"uppercase", marginBottom:12 }}>VinotecApp</div>
      <div style={{ fontSize:26, fontWeight:300, marginBottom:12 }}>Servicio no disponible</div>
      <div style={{ fontSize:15, color:"#806050", maxWidth:300, lineHeight:1.6 }}>La carta digital no está disponible en este momento. Por favor contacta al restaurante.</div>
    </div>
  );

  // ── Derived ───────────────────────────────────────────────────────────────
  const vinosVisibles = vinos.filter(v => v.stock > 0);
  const precioMin = vinosVisibles.length ? Math.min(...vinosVisibles.map(v => v.precio)) : 0;
  const precioMax = vinosVisibles.length ? Math.max(...vinosVisibles.map(v => v.precio)) : 5000;
  const precioFiltro = filtros.precioMax ?? precioMax;

  const PAISES_DIN = ["Todos", ...Array.from(new Set(vinos.map(v => v.pais))).sort()];
  const CEPAS_DIN  = ["Todas", ...Array.from(new Set(vinos.map(v => v.cepa))).sort()];

  const vinosFiltrados = vinosVisibles.filter(v => {
    if (filtros.tipo !== "Todos" && v.tipo !== filtros.tipo) return false;
    if (filtros.pais !== "Todos" && v.pais !== filtros.pais) return false;
    if (filtros.cepa !== "Todas" && v.cepa !== filtros.cepa) return false;
    if (v.precio > precioFiltro) return false;
    return true;
  });

  const tiposDisp  = new Set(vinosVisibles.filter(v => (filtros.pais==="Todos"||v.pais===filtros.pais)&&(filtros.cepa==="Todas"||v.cepa===filtros.cepa)&&v.precio<=precioFiltro).map(v=>v.tipo));
  const paisesDisp = new Set(vinosVisibles.filter(v => (filtros.tipo==="Todos"||v.tipo===filtros.tipo)&&(filtros.cepa==="Todas"||v.cepa===filtros.cepa)&&v.precio<=precioFiltro).map(v=>v.pais));
  const cepasDisp  = new Set(vinosVisibles.filter(v => (filtros.tipo==="Todos"||v.tipo===filtros.tipo)&&(filtros.pais==="Todos"||v.pais===filtros.pais)&&v.precio<=precioFiltro).map(v=>v.cepa));

  const promoVino = vinos.find(v => v.id === config.promoVinoId) || vinos[0];

  // ── Inventory helpers ─────────────────────────────────────────────────────
  const [movimientos, setMovimientos] = useState([]);

  // Normaliza país: primera letra mayúscula, resto minúsculas, sin espacios extra
  const normalizarPais = (str) => {
    if (!str) return "";
    return str.trim().charAt(0).toUpperCase() + str.trim().slice(1).toLowerCase();
  };

  const logMovimiento = async (tipo, vino, cantidad, razon="") => {
    const now = new Date();
    const fecha = now.toLocaleDateString("es-MX", { day:"2-digit", month:"short", year:"numeric" });
    const hora  = now.toLocaleTimeString("es-MX", { hour:"2-digit", minute:"2-digit" });
    setMovimientos(ms => [{ id: Date.now(), tipo, vinoNombre: vino.nombre, cantidad, razon, fecha, hora }, ...ms]);
    if (restauranteId) {
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/movimientos`, {
          method: "POST",
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ tipo, vino_nombre: vino.nombre, cantidad, razon, restaurante_id: restauranteId }),
        });
      } catch(e) { console.error("Error guardando movimiento:", e); }
    }
  };

  const ajustarStock = async (id, delta) => {
    const vino = vinos.find(v => v.id===id);
    const nuevoStock = Math.max(0, (vino?.stock||0) + delta);
    setVinos(vs => vs.map(v => v.id===id ? { ...v, stock: nuevoStock } : v));
    if (vino) {
      logMovimiento(delta>0 ? "Alta" : "Ajuste", vino, Math.abs(delta));
      if (typeof id === "string" && id.includes("-")) {
        try {
          await fetch(`${SUPABASE_URL}/rest/v1/vinos?id=eq.${id}`, {
            method: "PATCH",
            headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ stock: nuevoStock }),
          });
        } catch(e) { console.error("Error actualizando stock:", e); }
      }
    }
  };
  const guardarVino = async (v) => {
    const vNorm = { ...v, pais: normalizarPais(v.pais), cepa: v.cepa==="__otro__" ? v.cepaOtro?.trim() : v.cepa, nombre: v.nombre.trim() };
    delete vNorm.cepaOtro;
    const dbData = {
      nombre: vNorm.nombre, tipo: vNorm.tipo, cepa: vNorm.cepa,
      pais: vNorm.pais, region: vNorm.region, precio: vNorm.precio,
      clasificacion: vNorm.clasificacion, descripcion: vNorm.descripcion,
      stock: vNorm.stock, activo: vNorm.activo !== false,
      imagen_url: vNorm.imagen || null, restaurante_id: restauranteId,
    };
    try {
      if (vNorm.id && typeof vNorm.id === "string" && vNorm.id.includes("-")) {
        // Editar existente en Supabase
        await fetch(`${SUPABASE_URL}/rest/v1/vinos?id=eq.${vNorm.id}`, {
          method: "PATCH",
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify(dbData),
        });
        setVinos(vs => vs.map(x => x.id===vNorm.id ? vNorm : x));
        logMovimiento("Edición", vNorm, 0);
      } else {
        // Nuevo vino en Supabase
        const res = await fetch(`${SUPABASE_URL}/rest/v1/vinos`, {
          method: "POST",
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
          body: JSON.stringify(dbData),
        }).then(r => r.json());
        const nuevo = res[0] || { ...vNorm, id: Date.now().toString() };
        setVinos(vs => [...vs, { ...vNorm, id: nuevo.id }]);
        logMovimiento("Alta", { ...vNorm, id: nuevo.id }, vNorm.stock||0);
        setAdminPais("Todos"); setAdminTipo("Todos");
      }
    } catch(e) {
      console.error("Error guardando vino:", e);
    }
    showToast("Vino guardado ✓");
  };
  const eliminarVino = (id) => { setVinos(vs => vs.filter(v => v.id!==id)); showToast("Vino eliminado"); };
  const aplicarBaja = async (id, cantidad, razon) => {
    const vino = vinos.find(v => v.id===id);
    const nuevoStock = Math.max(0, (vino?.stock||0) - cantidad);
    setVinos(vs => vs.map(v => v.id===id ? { ...v, stock: nuevoStock } : v));
    if (vino) {
      logMovimiento("Baja", vino, cantidad, razon);
      if (typeof id === "string" && id.includes("-")) {
        try {
          await fetch(`${SUPABASE_URL}/rest/v1/vinos?id=eq.${id}`, {
            method: "PATCH",
            headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ stock: nuevoStock }),
          });
        } catch(e) { console.error("Error aplicando baja:", e); }
      }
    }
    showToast(`Baja registrada: ${razon}`);
    setBajaVino(null);
  };

  const guardarPlatillo = async (p) => {
    const dbData = { nombre: p.nombre, categoria: p.categoria, imagen_url: p.imagen || null, restaurante_id: restauranteId };
    try {
      let platilloId = p.id;
      if (p.id && typeof p.id === "string" && p.id.includes("-")) {
        await fetch(`${SUPABASE_URL}/rest/v1/platillos?id=eq.${p.id}`, {
          method: "PATCH",
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify(dbData),
        });
        // Actualizar maridajes: borrar los viejos e insertar nuevos
        await fetch(`${SUPABASE_URL}/rest/v1/maridajes?platillo_id=eq.${p.id}`, {
          method: "DELETE",
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        });
      } else {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/platillos`, {
          method: "POST",
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
          body: JSON.stringify(dbData),
        }).then(r => r.json());
        platilloId = res[0]?.id || p.id;
      }
      // Insertar maridajes
      if (p.vinosIds && p.vinosIds.length > 0) {
        await fetch(`${SUPABASE_URL}/rest/v1/maridajes`, {
          method: "POST",
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify(p.vinosIds.map((vid, i) => ({ platillo_id: platilloId, vino_id: vid, orden: i }))),
        });
      }
      if (p.id && typeof p.id === "string" && p.id.includes("-")) {
        setPlatillos(ps => ps.map(x => x.id===p.id ? p : x));
      } else {
        setPlatillos(ps => [...ps, { ...p, id: platilloId }]);
      }
    } catch(e) {
      console.error("Error guardando platillo:", e);
    }
    showToast("Platillo guardado ✓");
  };
  const eliminarPlatillo = (id) => { setPlatillos(ps => ps.filter(p => p.id!==id)); showToast("Platillo eliminado"); };

  // ── Styles ────────────────────────────────────────────────────────────────
  const C = { p: config.colorPrimario, s: config.colorSecundario, bg: config.colorFondo };
  const appStyle = { minHeight:"100vh", background: C.bg, color:"#f5ede0", fontFamily:"'Cormorant Garamond','Georgia',serif", position:"relative" };
  const noise = { position:"fixed", inset:0, pointerEvents:"none", zIndex:0, opacity:0.03, background:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` };

  const btnFiltro = (activo, disponible) => ({
    padding:"7px 12px", borderRadius:8, border:"1px solid",
    borderColor: activo ? C.p : disponible ? "rgba(196,168,78,0.15)" : "rgba(196,168,78,0.04)",
    background: activo ? `${C.p}22` : "transparent",
    color: activo ? C.p : disponible ? "#a09080" : "#2a1a0a",
    cursor: disponible ? "pointer" : "default",
    fontFamily:"inherit", fontSize:13, textAlign:"left", transition:"all 0.15s",
  });

  const backBtn = (action) => (
    <button onClick={action} style={{ background:"none", border:"none", color:C.p, cursor:"pointer", display:"flex", alignItems:"center", gap:6, fontFamily:"inherit", fontSize:14, padding:0, marginBottom:24 }}>
      <IBack/> Volver
    </button>
  );

  // ═══════════════════════════════════════════════════
  // GUEST SCREENS
  // ═══════════════════════════════════════════════════

  // ── HOME ─────────────────────────────────────────
  if (modo==="guest" && screen==="home") {
    const bloques = config.bloques || ["promo","maridaje","carta"];
    const renderBloque = (tipo) => {
      if (tipo==="promo" && promoVino) return (
        <div key="promo" onClick={() => { setSelectedVino({...promoVino, etiqueta:config.promoEtiqueta}); setScreen("vino"); }}
          style={{ background:"rgba(20,12,4,0.88)", border:`1px solid ${C.p}33`, borderRadius:14, padding:"14px 18px", cursor:"pointer", display:"flex", gap:16, alignItems:"center", backdropFilter:"blur(6px)", flex:1 }}>
          <WineBottle tipo={promoVino.tipo} size={80} imagen={promoVino.imagen}/>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:5, background:`${C.p}22`, border:`1px solid ${C.p}44`, borderRadius:20, padding:"2px 8px", marginBottom:6 }}>
              <IStar size={11}/> <span style={{ fontSize:9, letterSpacing:2, color:C.p, textTransform:"uppercase" }}>{config.promoEtiqueta}</span>
            </div>
            <div style={{ fontSize:17, fontWeight:400, lineHeight:1.2, marginBottom:3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{promoVino.nombre}</div>
            <div style={{ fontSize:12, color:C.p }}>{promoVino.pais} · {promoVino.cepa}</div>
            <div style={{ fontSize:20, fontWeight:300, color:C.p, marginTop:4 }}>${promoVino.precio?.toLocaleString()} <span style={{ fontSize:11, color:"#a08060" }}>MXN</span></div>
          </div>
        </div>
      );
      if (tipo==="maridaje" && platillos.length>0) return (
        <button key="maridaje" onClick={() => setScreen("maridaje")}
          style={{ background:"rgba(20,12,4,0.88)", border:`1px solid ${C.p}22`, borderRadius:14, padding:"18px 20px", color:"#f5ede0", cursor:"pointer", textAlign:"left", fontFamily:"inherit", backdropFilter:"blur(6px)", flex:1 }}>
          <div style={{ fontSize:24, marginBottom:8 }}>🍽️</div>
          <div style={{ fontSize:19, fontWeight:400, marginBottom:3 }}>Maridaje</div>
          <div style={{ fontSize:12, color:"#c8a878" }}>Vino por platillo</div>
        </button>
      );
      if (tipo==="carta") return (
        <button key="carta" onClick={() => setScreen("carta")}
          style={{ background:"rgba(20,12,4,0.88)", border:`1px solid ${C.p}22`, borderRadius:14, padding:"18px 20px", color:"#f5ede0", cursor:"pointer", textAlign:"left", fontFamily:"inherit", backdropFilter:"blur(6px)", flex:1 }}>
          <div style={{ color:C.p, marginBottom:8 }}><IWine/></div>
          <div style={{ fontSize:19, fontWeight:400, marginBottom:3 }}>Carta de Vinos</div>
          <div style={{ fontSize:12, color:"#c8a878" }}>Explorar catálogo</div>
        </button>
      );
      return null;
    };

    // Separar promo de los otros dos para layout diferente
    const bloquePromo = bloques.find(b => b==="promo");
    const bloquesNav  = bloques.filter(b => b!=="promo");

    return (
      <div style={{ height:"100vh", color:"#f5ede0", fontFamily:"'Cormorant Garamond','Georgia',serif", position:"relative", overflow:"hidden", display:"flex", flexDirection:"column",
        background: config.fondoHome ? `url(${config.fondoHome}) center/cover no-repeat` : (config.fondoColor || C.bg) }}>
        {config.fondoHome && <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:0 }}/>}
        <div style={noise}/>

        {/* LOGO — protagonista */}
        <div style={{ position:"relative", zIndex:1, flex:"0 0 auto", paddingTop:36, paddingBottom:12, textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center" }}>
          {config.logo ? (
            <img src={config.logo} alt={config.nombre} style={{ maxHeight:100, maxWidth:"68%", width:"auto", objectFit:"contain", display:"block", margin:"0 auto", filter:"drop-shadow(0 4px 20px rgba(0,0,0,0.8))" }}/>
          ) : (
            <div style={{ fontSize:30, fontWeight:300, letterSpacing:4, color:"#f5ede0", textShadow:"0 2px 20px rgba(0,0,0,0.9)", textAlign:"center" }}>{config.nombre}</div>
          )}
          <div style={{ height:1, background:`linear-gradient(90deg,transparent,${C.p}55,transparent)`, margin:"14px 28px 0", width:"100%" }}/>
        </div>

        {/* BLOQUES — ocupan el espacio disponible */}
        <div style={{ position:"relative", zIndex:1, flex:1, padding:"10px 20px", display:"flex", flexDirection:"column", gap:12, minHeight:0 }}>
          {/* Promo ocupa más espacio */}
          {bloquePromo && (
            <div style={{ flex:2, display:"flex" }}>
              {renderBloque(bloquePromo)}
            </div>
          )}
          {/* Maridaje y Carta lado a lado */}
          {bloquesNav.length > 0 && (
            <div style={{ flex:1, display:"flex", gap:12 }}>
              {bloquesNav.map(b => renderBloque(b))}
            </div>
          )}
        </div>

        {/* FOOTER — Admin + VinotecApp */}
        <div style={{ position:"relative", zIndex:1, flex:"0 0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 24px 20px" }}>
          <button onClick={() => { setModo("admin"); setScreen("admin-pin"); }} style={{ background:"rgba(0,0,0,0.3)", border:`1px solid ${C.p}22`, borderRadius:8, padding:"5px 14px", color:`${C.p}55`, cursor:"pointer", fontFamily:"inherit", fontSize:11, letterSpacing:2, backdropFilter:"blur(4px)" }}>Admin</button>
          <button onClick={() => { setModo("plataforma"); setScreen("plat-pin"); }} style={{ background:"none", border:"none", fontSize:14, color:C.p, letterSpacing:3, fontWeight:400, opacity:0.8, cursor:"pointer", fontFamily:"inherit", padding:0 }}>VinotecApp</button>
        </div>
      </div>
    );
  }

  // ── MARIDAJE ─────────────────────────────────────
  if (modo==="guest" && screen==="maridaje") return (
    <div style={appStyle}>
      <div style={noise}/>
      <div style={{ position:"relative", zIndex:1, padding:"28px 28px 40px" }}>
        {backBtn(() => { setSelectedPlat(null); setScreen("home"); })}
        <div style={{ fontSize:11, letterSpacing:5, color:C.p, textTransform:"uppercase", marginBottom:6 }}>Maridaje</div>
        <div style={{ fontSize:28, fontWeight:300, marginBottom:4 }}>¿Qué vas a comer?</div>
        <div style={{ fontSize:14, color:"#806050", marginBottom:28 }}>Cada platillo muestra sus vinos recomendados</div>

        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          {platillos.map(p => {
            const vinosPlat = (p.vinosIds||[]).map(vid => vinos.find(x => x.id===vid && x.stock>0)).filter(Boolean);
            return (
              <div key={p.id} style={{ background:"linear-gradient(135deg,#140c04,#1c1208)", border:`1px solid ${C.p}1a`, borderRadius:14, overflow:"hidden" }}>
                {/* Cabecera del platillo */}
                <div style={{ display:"flex", alignItems:"center", gap:0, borderBottom:`1px solid ${C.p}12` }}>
                  {p.imagen ? (
                    <img src={p.imagen} alt={p.nombre} style={{ width:80, height:80, objectFit:"cover", flexShrink:0 }}/>
                  ) : (
                    <div style={{ width:80, height:80, background:"#120a02", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:32 }}>🍽️</div>
                  )}
                  <div style={{ padding:"0 18px" }}>
                    <div style={{ fontSize:19, fontWeight:400, color:"#f0e4d0" }}>{p.nombre}</div>
                    <div style={{ fontSize:11, color:"#806050", letterSpacing:1, textTransform:"uppercase", marginTop:3 }}>{p.categoria}</div>
                  </div>
                </div>

                {/* Vinos del platillo */}
                {vinosPlat.length === 0 ? (
                  <div style={{ padding:"14px 18px", fontSize:13, color:"#4a3a2a" }}>Sin vinos disponibles</div>
                ) : (
                  <div style={{ display:"grid", gridTemplateColumns:`repeat(${vinosPlat.length}, 1fr)` }}>
                    {vinosPlat.map((v, i) => (
                      <div key={v.id} style={{ padding:"14px 16px", borderLeft: i>0 ? `1px solid ${C.p}10` : "none" }}>
                        <button onClick={() => { setSelectedVino(v); setScreen("vino"); }} style={{ background:"none", border:"none", padding:0, cursor:"pointer", fontFamily:"inherit", textAlign:"left", width:"100%" }}>
                          <div style={{ fontSize:15, color:"#f0e4d0", borderBottom:`1px solid ${C.p}33`, paddingBottom:5, marginBottom:7, lineHeight:1.3, fontWeight:400 }}>{v.nombre}</div>
                        </button>
                        <div style={{ fontSize:12, color:"#a09080", marginBottom:6 }}>{v.cepa}{v.clasificacion ? ` · ${v.clasificacion}` : ""}</div>
                        <div style={{ fontSize:19, color:C.p, fontWeight:300 }}>${v.precio.toLocaleString()} <span style={{ fontSize:10, color:"#806050" }}>MXN</span></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ── CARTA ─────────────────────────────────────────
  if (modo==="guest" && screen==="carta") return (
    <div style={{ ...appStyle, display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden" }}>
      <div style={noise}/>
      <div style={{ position:"relative", zIndex:1, padding:"20px 24px 14px", borderBottom:"1px solid rgba(196,168,78,0.1)", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <button onClick={() => setScreen("home")} style={{ background:"none", border:"none", color:C.p, cursor:"pointer", display:"flex", alignItems:"center", gap:6, fontFamily:"inherit", fontSize:14, padding:0 }}>
            <IBack/> Volver
          </button>
          <div style={{ flex:1, fontSize:11, letterSpacing:4, color:C.p, textTransform:"uppercase" }}>Catálogo · <span style={{ color:"#806050" }}>{vinosFiltrados.length} vinos</span></div>
          {(filtros.tipo!=="Todos"||filtros.pais!=="Todos"||filtros.cepa!=="Todas"||filtros.precioMax!==null) && (
            <button onClick={() => setFiltros({ tipo:"Todos", pais:"Todos", cepa:"Todas", precioMax:null })} style={{ background:`${C.p}18`, border:`1px solid ${C.p}33`, borderRadius:20, padding:"5px 14px", color:C.p, cursor:"pointer", fontFamily:"inherit", fontSize:12 }}>
              Limpiar
            </button>
          )}
        </div>
      </div>

      <div style={{ position:"relative", zIndex:1, display:"flex", flex:1, overflow:"hidden" }}>
        {/* Filtros */}
        <div style={{ width:210, flexShrink:0, borderRight:"1px solid rgba(196,168,78,0.1)", padding:"18px 14px", overflowY:"auto", display:"flex", flexDirection:"column", gap:18 }}>
          {[
            { label:"Tipo de Vino", opciones:TIPOS_FILTRO, key:"tipo", check:(t)=>t==="Todos"||tiposDisp.has(t), campo:"tipo" },
          ].map(({ label, opciones, key, check }) => (
            <div key={key}>
              <div style={{ fontSize:10, letterSpacing:3, color:"#806050", textTransform:"uppercase", marginBottom:8 }}>{label}</div>
              <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                {opciones.map(o => <button key={o} onClick={() => check(o) && setFiltros(f=>({...f,[key]:o}))} style={btnFiltro(filtros[key]===o, check(o))}>{o}</button>)}
              </div>
            </div>
          ))}
          <div style={{ height:1, background:"rgba(196,168,78,0.08)" }}/>
          <div>
            <div style={{ fontSize:10, letterSpacing:3, color:"#806050", textTransform:"uppercase", marginBottom:8 }}>País</div>
            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
              {PAISES_DIN.map(o => <button key={o} onClick={() => (o==="Todos"||paisesDisp.has(o)) && setFiltros(f=>({...f,pais:o}))} style={btnFiltro(filtros.pais===o, o==="Todos"||paisesDisp.has(o))}>{o}</button>)}
            </div>
          </div>
          <div style={{ height:1, background:"rgba(196,168,78,0.08)" }}/>
          <div>
            <div style={{ fontSize:10, letterSpacing:3, color:"#806050", textTransform:"uppercase", marginBottom:6 }}>Precio Máximo</div>
            <div style={{ fontSize:17, color:C.p, marginBottom:8 }}>${precioFiltro.toLocaleString()} <span style={{ fontSize:10, color:"#806050" }}>MXN</span></div>
            <div style={{ position:"relative", height:26, display:"flex", alignItems:"center" }}>
              <div style={{ position:"absolute", left:0, right:0, height:3, borderRadius:2, background:"rgba(196,168,78,0.12)" }}/>
              <div style={{ position:"absolute", left:0, height:3, borderRadius:2, background:`linear-gradient(90deg,${C.s},${C.p})`, width:`${((precioFiltro-precioMin)/(precioMax-precioMin||1))*100}%` }}/>
              <input type="range" min={precioMin} max={precioMax} step={50} value={precioFiltro}
                onChange={e => setFiltros(f=>({...f,precioMax:Number(e.target.value)}))}
                style={{ position:"absolute", left:0, right:0, width:"100%", appearance:"none", WebkitAppearance:"none", background:"transparent", cursor:"pointer", height:26, margin:0 }}/>
            </div>
            <style>{`input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:linear-gradient(135deg,${C.p},#e8c870);border:2px solid ${C.bg};box-shadow:0 2px 8px ${C.p}66;cursor:pointer}input[type=range]::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:${C.p};border:2px solid ${C.bg};cursor:pointer}`}</style>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
              <span style={{ fontSize:12, color:C.p, fontWeight:400 }}>${precioMin.toLocaleString()}</span>
              <span style={{ fontSize:12, color:C.p, fontWeight:400 }}>${precioMax.toLocaleString()}</span>
            </div>
          </div>
          <div style={{ height:1, background:"rgba(196,168,78,0.08)" }}/>
          <div>
            <div style={{ fontSize:10, letterSpacing:3, color:"#806050", textTransform:"uppercase", marginBottom:8 }}>Cepa</div>
            <select value={filtros.cepa} onChange={e => setFiltros(f=>({...f,cepa:e.target.value}))}
              style={{ width:"100%", background:"#0e0802", border:`1px solid ${C.p}22`, borderRadius:8, padding:"8px 10px", color: filtros.cepa==="Todas" ? "#806050" : C.p, fontFamily:"inherit", fontSize:13, cursor:"pointer" }}>
              {CEPAS_DIN.map(o => (
                <option key={o} value={o} disabled={o!=="Todas" && !cepasDisp.has(o)}>
                  {o}{o!=="Todas" && !cepasDisp.has(o) ? " (sin stock)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mosaico */}
        <div style={{ flex:1, overflowY:"auto", padding:18 }}>
          {vinosFiltrados.length===0 ? (
            <div style={{ textAlign:"center", paddingTop:60 }}>
              <div style={{ fontSize:40, marginBottom:12 }}>🍷</div>
              <div style={{ fontSize:16, color:"#806050" }}>Sin resultados — ajusta los filtros</div>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:12 }}>
              {vinosFiltrados.map(v => (
                <div key={v.id} onClick={() => { setSelectedVino(v); setScreen("vino"); }} style={{ background:"linear-gradient(160deg,#180e06,#221408)", border:`1px solid ${C.p}18`, borderRadius:14, padding:"14px 12px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                  <WineBottle tipo={v.tipo} size={86} imagen={v.imagen}/>
                  <div style={{ width:"100%", textAlign:"left" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:4 }}>
                      <span style={{ fontSize:9, padding:"2px 6px", borderRadius:10, background:tipoBadge[v.tipo]?.bg, color:tipoBadge[v.tipo]?.color }}>{v.tipo}</span>
                      <Flag pais={v.pais}/>
                    </div>
                    <div style={{ fontSize:14, lineHeight:1.3, marginBottom:3, color:"#f0e4d0" }}>{v.nombre}</div>
                    <div style={{ fontSize:12, color:"#c8a878", marginBottom:6 }}>{v.cepa}{v.clasificacion?` · ${v.clasificacion}`:""}</div>
                    <div style={{ fontSize:17, color:C.p }}>${v.precio.toLocaleString()} <span style={{ fontSize:10, color:"#a08060" }}>MXN</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ── FICHA DE VINO ─────────────────────────────────
  if (modo==="guest" && screen==="vino" && selectedVino) return (
    <div style={appStyle}>
      <div style={noise}/>
      <div style={{ position:"relative", zIndex:1, padding:32 }}>
        {backBtn(() => setScreen("carta"))}
        <div style={{ display:"flex", gap:24, marginBottom:28, alignItems:"flex-start" }}>
          <WineBottle tipo={selectedVino.tipo} size={160} imagen={selectedVino.imagen}/>
          <div style={{ flex:1, paddingTop:8 }}>
            {selectedVino.etiqueta && (
              <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:`${C.p}22`, border:`1px solid ${C.p}44`, borderRadius:20, padding:"3px 10px", marginBottom:10 }}>
                <IStar/> <span style={{ fontSize:10, letterSpacing:3, color:C.p, textTransform:"uppercase" }}>{selectedVino.etiqueta}</span>
              </div>
            )}
            <div style={{ fontSize:26, fontWeight:400, lineHeight:1.2, marginBottom:8 }}>{selectedVino.nombre}</div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, flexWrap:"wrap" }}>
              <span style={{ fontSize:12, padding:"3px 10px", borderRadius:10, background:tipoBadge[selectedVino.tipo]?.bg, color:tipoBadge[selectedVino.tipo]?.color }}>{selectedVino.tipo}</span>
              <Flag pais={selectedVino.pais||""}/>
              <span style={{ fontSize:13, color:"#806050" }}>{selectedVino.pais}</span>
            </div>
            {selectedVino.cepa && <div style={{ fontSize:14, color:"#a09080", marginBottom:3 }}><span style={{ color:"#4a3a2a" }}>Cepa:</span> {selectedVino.cepa}</div>}
            {selectedVino.region && <div style={{ fontSize:14, color:"#a09080", marginBottom:3 }}><span style={{ color:"#4a3a2a" }}>Región:</span> {selectedVino.region}</div>}
            {selectedVino.clasificacion && <div style={{ fontSize:14, color:"#a09080" }}><span style={{ color:"#4a3a2a" }}>Clasificación:</span> {selectedVino.clasificacion}</div>}
          </div>
        </div>
        <div style={{ height:1, background:`linear-gradient(90deg,transparent,${C.p}44,transparent)`, margin:"0 0 20px" }}/>
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:11, letterSpacing:4, color:C.p, textTransform:"uppercase", marginBottom:10 }}>Notas de Cata</div>
          <div style={{ fontSize:17, color:"#d0c0a8", lineHeight:1.7 }}>{selectedVino.descripcion}</div>
        </div>
        <div style={{ background:"linear-gradient(135deg,#140c04,#1e1208)", border:`1px solid ${C.p}2a`, borderRadius:12, padding:"16px 20px", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:13, color:"#806050" }}>Precio por botella</div>
          <div style={{ fontSize:30, fontWeight:300, color:C.p }}>${selectedVino.precio?.toLocaleString()} <span style={{ fontSize:13, color:"#806050" }}>MXN</span></div>
        </div>
        <button onClick={() => { setLockedVino(selectedVino); setScreen("locked"); setPinInput(""); }} style={{ width:"100%", padding:18, borderRadius:12, background:`linear-gradient(135deg,${C.s},${C.s}cc)`, border:"none", color:"#fff", fontSize:18, fontFamily:"inherit", cursor:"pointer", letterSpacing:2 }}>
          Seleccionar este vino
        </button>
      </div>
    </div>
  );

  // ── LOCKED ────────────────────────────────────────
  if (modo==="guest" && screen==="locked") return (
    <div style={{ ...appStyle, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh" }}>
      <div style={noise}/>
      <div style={{ position:"relative", zIndex:1, textAlign:"center", width:"100%", maxWidth:360, padding:32 }}>
        <div style={{ color:C.p, marginBottom:16 }}><ILock/></div>
        <div style={{ fontSize:24, fontWeight:300, marginBottom:6 }}>Vino Seleccionado</div>
        <div style={{ fontSize:16, color:"#a09080", marginBottom:4 }}>{lockedVino?.nombre}</div>
        <div style={{ fontSize:22, color:C.p, marginBottom:32 }}>${lockedVino?.precio?.toLocaleString()} MXN</div>
        <div style={{ fontSize:12, color:"#806050", letterSpacing:3, textTransform:"uppercase", marginBottom:20 }}>PIN del mesero</div>
        <div style={{ display:"flex", justifyContent:"center", gap:12, marginBottom:28 }}>
          {[0,1,2,3].map(i => <div key={i} style={{ width:14, height:14, borderRadius:"50%", background:i<pinInput.length?C.p:"transparent", border:`2px solid ${C.p}66`, transition:"all 0.2s" }}/>)}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
          {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d,i) => (
            <button key={i} onClick={() => {
              if (d==="⌫") { setPinInput(p=>p.slice(0,-1)); return; }
              if (d==="") return;
              const np = pinInput + String(d);
              setPinInput(np);
              if (np.length===4) {
                if (np===PIN) { setLockedVino(null); setPinInput(""); setScreen("carta"); }
                else setTimeout(() => setPinInput(""), 600);
              }
            }} style={{ background:d===""?"transparent":"linear-gradient(135deg,#1a0e06,#241404)", border:d===""?"none":`1px solid ${C.p}18`, borderRadius:12, padding:18, color:"#f5ede0", fontSize:22, fontFamily:"inherit", cursor:d===""?"default":"pointer" }}>{d}</button>
          ))}
        </div>
        <div style={{ fontSize:12, color:"#4a3a2a", marginTop:20, letterSpacing:2 }}>El mesero debe desbloquear la tablet</div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════
  // ADMIN SCREENS
  // ═══════════════════════════════════════════════════

  // ── ADMIN PIN ────────────────────────────────────
  if (modo==="admin" && screen==="admin-pin") return (
    <div style={{ ...appStyle, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh" }}>
      <div style={noise}/>
      <div style={{ position:"relative", zIndex:1, textAlign:"center", width:"100%", maxWidth:360, padding:32 }}>
        <div style={{ fontSize:11, letterSpacing:5, color:C.p, textTransform:"uppercase", marginBottom:6 }}>Administración</div>
        <div style={{ fontSize:28, fontWeight:300, marginBottom:32 }}>Acceso Admin</div>
        <div style={{ fontSize:12, color:"#806050", letterSpacing:3, textTransform:"uppercase", marginBottom:20 }}>PIN de administrador</div>
        <div style={{ display:"flex", justifyContent:"center", gap:12, marginBottom:28 }}>
          {[0,1,2,3].map(i => <div key={i} style={{ width:14, height:14, borderRadius:"50%", background:i<adminPin.length?C.p:"transparent", border:`2px solid ${C.p}66`, transition:"all 0.2s" }}/>)}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24 }}>
          {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d,i) => (
            <button key={i} onClick={() => {
              if (d==="⌫") { setAdminPin(p=>p.slice(0,-1)); return; }
              if (d==="") return;
              const np = adminPin + String(d);
              setAdminPin(np);
              if (np.length===4) {
                if (np===ADMIN_PIN) { setAdminAuth(true); setScreen("admin"); setAdminPin(""); }
                else setTimeout(() => setAdminPin(""), 600);
              }
            }} style={{ background:d===""?"transparent":"linear-gradient(135deg,#1a0e06,#241404)", border:d===""?"none":`1px solid ${C.p}18`, borderRadius:12, padding:18, color:"#f5ede0", fontSize:22, fontFamily:"inherit", cursor:d===""?"default":"pointer" }}>{d}</button>
          ))}
        </div>
        <div style={{ fontSize:11, color:"#3a2a1a", marginBottom:4 }}>PIN de prueba: 9999</div>
        <button onClick={() => { setModo("guest"); setScreen("home"); setAdminPin(""); }} style={{ background:"none", border:"none", color:"#4a3a2a", cursor:"pointer", fontFamily:"inherit", fontSize:13 }}>← Cancelar</button>
      </div>
    </div>
  );

  // ── ADMIN MAIN ───────────────────────────────────
  if (modo==="admin" && screen==="admin") {

    // Inventario por país y tipo — normalizar para evitar duplicados por espacios/acentos
    const paisesList = ["Todos", ...Array.from(new Set(vinos.map(v => v.pais.trim()))).sort()];
    const vinosAdmin = vinos
      .filter(v => (adminPais==="Todos"||v.pais.trim()===adminPais) && (adminTipo==="Todos"||v.tipo===adminTipo))
      .sort((a,b) => { const t=["Tinto","Blanco","Rosado","Espumoso","Dulce"]; return t.indexOf(a.tipo)-t.indexOf(b.tipo)||a.nombre.localeCompare(b.nombre); });

    const TabBtn = ({ id, label }) => (
      <button onClick={() => setAdminTab(id)} style={{ flex:1, padding:"12px 8px", background:adminTab===id?`${C.p}18`:"transparent", border:"none", borderBottom:adminTab===id?`2px solid ${C.p}`:"2px solid transparent", color:adminTab===id?C.p:"#806050", cursor:"pointer", fontFamily:"inherit", fontSize:14, transition:"all 0.2s" }}>{label}</button>
    );

    return (
      <div style={{ ...appStyle, display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden" }}>
        <div style={noise}/>

        {/* Toast */}
        {toast && (
          <div style={{ position:"fixed", top:20, left:"50%", transform:"translateX(-50%)", zIndex:100, background:toast.ok?"#1a3a1a":"#3a1a1a", border:`1px solid ${toast.ok?"#4a8a4a":"#8a4a4a"}`, borderRadius:10, padding:"10px 20px", color:toast.ok?"#a0d0a0":"#d0a0a0", fontSize:14, display:"flex", alignItems:"center", gap:8 }}>
            {toast.ok ? <ICheck/> : "✕"} {toast.msg}
          </div>
        )}

        {/* Header */}
        <div style={{ position:"relative", zIndex:1, padding:"16px 24px", borderBottom:`1px solid ${C.p}18`, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div>
            <div style={{ fontSize:11, letterSpacing:4, color:C.p, textTransform:"uppercase" }}>Panel de Administración</div>
            <div style={{ fontSize:20, fontWeight:300 }}>{config.nombre}</div>
          </div>
          <button onClick={() => { setModo("guest"); setScreen("home"); setAdminAuth(false); }} style={{ background:`${C.s}22`, border:`1px solid ${C.s}44`, borderRadius:8, padding:"8px 16px", color:"#f5ede0", cursor:"pointer", fontFamily:"inherit", fontSize:13 }}>
            Salir
          </button>
        </div>

        {/* Tabs */}
        <div style={{ position:"relative", zIndex:1, display:"flex", borderBottom:`1px solid ${C.p}18`, flexShrink:0 }}>
          <TabBtn id="inventario"  label="📦 Inventario"/>
          <TabBtn id="maridaje"    label="🍽️ Maridaje"/>
          <TabBtn id="marca"       label="🎨 Marca"/>
          <TabBtn id="movimientos" label="📋 Movimientos"/>
        </div>

        {/* ── TAB: INVENTARIO ── */}
        {adminTab==="inventario" && (
          <div style={{ position:"relative", zIndex:1, display:"flex", flex:1, overflow:"hidden" }}>
            {/* Sidebar filtros admin */}
            <div style={{ width:180, flexShrink:0, borderRight:`1px solid ${C.p}12`, padding:"16px 12px", overflowY:"auto" }}>
              <div style={{ fontSize:10, letterSpacing:3, color:"#806050", textTransform:"uppercase", marginBottom:8 }}>País</div>
              {paisesList.map((p, i) => (
                <button key={i} onClick={() => setAdminPais(p)} style={{ ...btnFiltro(adminPais===p, true), display:"block", width:"100%", marginBottom:4 }}>{p}</button>
              ))}
              <div style={{ height:1, background:`${C.p}10`, margin:"12px 0" }}/>
              <div style={{ fontSize:10, letterSpacing:3, color:"#806050", textTransform:"uppercase", marginBottom:8 }}>Tipo</div>
              {TIPOS_FILTRO.map(t => (
                <button key={t} onClick={() => setAdminTipo(t)} style={{ ...btnFiltro(adminTipo===t, true), display:"block", width:"100%", marginBottom:4 }}>{t}</button>
              ))}
              <div style={{ height:1, background:`${C.p}10`, margin:"12px 0" }}/>
              <button onClick={() => setNuevoVino({ id:null, nombre:"", tipo:"Tinto", cepa:"", pais:"", region:"", precio:"", clasificacion:"", descripcion:"", stock:"", imagen:null })} style={{ width:"100%", padding:"10px", background:`${C.p}18`, border:`1px solid ${C.p}44`, borderRadius:8, color:C.p, cursor:"pointer", fontFamily:"inherit", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                <IPlus/> Nuevo vino
              </button>
            </div>

            {/* Lista de vinos */}
            <div style={{ flex:1, overflowY:"auto", padding:16 }}>
              {vinosAdmin.length===0 ? (
                <div style={{ textAlign:"center", paddingTop:40, color:"#4a3a2a" }}>No hay vinos con estos filtros</div>
              ) : vinosAdmin.map(v => (
                <div key={v.id} style={{ background:"linear-gradient(135deg,#140c04,#1a1006)", border:`1px solid ${C.p}12`, borderRadius:12, padding:"14px 16px", marginBottom:10, display:"flex", alignItems:"center", gap:12 }}>
                  <WineBottle tipo={v.tipo} size={64} imagen={v.imagen}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                      <span style={{ fontSize:9, padding:"2px 6px", borderRadius:8, background:tipoBadge[v.tipo]?.bg, color:tipoBadge[v.tipo]?.color }}>{v.tipo}</span>
                      <Flag pais={v.pais}/>
                      <span style={{ fontSize:11, color:"#4a3a2a" }}>{v.clasificacion}</span>
                    </div>
                    <div style={{ fontSize:15, fontWeight:400, marginBottom:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{v.nombre}</div>
                    <div style={{ fontSize:12, color:"#806050" }}>{v.cepa} · ${v.precio.toLocaleString()}</div>
                  </div>

                  {/* Stock controls */}
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, minWidth:80 }}>
                    <div style={{ fontSize:10, color:"#806050", letterSpacing:2, textTransform:"uppercase" }}>Stock</div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <button onClick={() => setBajaVino({ vino:v, cantidad:1, razon:RAZONES_BAJA[0] })} style={{ width:28, height:28, borderRadius:6, background:`${C.s}22`, border:`1px solid ${C.s}44`, color:"#f5ede0", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><IMinus/></button>
                      <span style={{ fontSize:20, fontWeight:300, color:v.stock===0?"#8a4a4a":C.p, minWidth:28, textAlign:"center" }}>{v.stock}</span>
                      <button onClick={() => ajustarStock(v.id, 1)} style={{ width:28, height:28, borderRadius:6, background:`${C.p}22`, border:`1px solid ${C.p}44`, color:C.p, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><IPlus/></button>
                    </div>
                    {v.stock===0 && <div style={{ fontSize:9, color:"#8a4a4a", letterSpacing:1 }}>SIN STOCK</div>}
                  </div>

                  {/* Actions */}
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    <button onClick={() => setEditingVino({ ...v })} style={{ padding:"6px 10px", background:`${C.p}12`, border:`1px solid ${C.p}22`, borderRadius:6, color:C.p, cursor:"pointer", display:"flex", alignItems:"center", gap:4, fontFamily:"inherit", fontSize:11 }}><IEdit/> Editar</button>
                    <button onClick={() => { 
                      setVinos(vs => vs.map(x => x.id===v.id ? {...x, activo:false, stock:0} : x));
                      logMovimiento("Archivado", v, v.stock, "Vino archivado por admin");
                      showToast("Vino archivado");
                    }} style={{ padding:"6px 10px", background:"rgba(139,32,53,0.1)", border:"1px solid rgba(139,32,53,0.3)", borderRadius:6, color:"#c06070", cursor:"pointer", display:"flex", alignItems:"center", gap:4, fontFamily:"inherit", fontSize:11 }}><ITrash/> Archivar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB: MARIDAJE ── */}
        {adminTab==="maridaje" && (
          <div style={{ position:"relative", zIndex:1, flex:1, overflowY:"auto", padding:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div style={{ fontSize:16, fontWeight:300 }}>Platillos y Maridajes</div>
              <button onClick={() => setNuevoPlatillo({ id:null, nombre:"", categoria:"Carnes", imagen:null, vinosIds:[] })} style={{ padding:"8px 16px", background:`${C.p}18`, border:`1px solid ${C.p}44`, borderRadius:8, color:C.p, cursor:"pointer", fontFamily:"inherit", fontSize:13, display:"flex", alignItems:"center", gap:6 }}>
                <IPlus/> Nuevo platillo
              </button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {platillos.map(p => (
                <div key={p.id} style={{ background:"linear-gradient(135deg,#140c04,#1a1006)", border:`1px solid ${C.p}12`, borderRadius:12, padding:16, display:"flex", gap:14, alignItems:"flex-start" }}>
                  <div style={{ flexShrink:0 }}>
                    {p.imagen ? (
                      <img src={p.imagen} alt="" style={{ width:72, height:72, borderRadius:8, objectFit:"cover" }}/>
                    ) : (
                      <div style={{ width:72, height:72, borderRadius:8, background:"#1a0e06", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, border:`1px dashed ${C.p}22` }}>🍽️</div>
                    )}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:16, marginBottom:2 }}>{p.nombre}</div>
                    <div style={{ fontSize:12, color:"#806050", marginBottom:8 }}>{p.categoria}</div>
                    <div style={{ fontSize:11, color:"#4a3a2a", marginBottom:4 }}>Vinos asignados:</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                      {(p.vinosIds||[]).map(vid => {
                        const v = vinos.find(x=>x.id===vid);
                        return v ? <span key={vid} style={{ fontSize:11, padding:"3px 8px", background:`${C.p}12`, border:`1px solid ${C.p}22`, borderRadius:6, color:C.p }}>{v.nombre}</span> : null;
                      })}
                      {(!p.vinosIds||p.vinosIds.length===0) && <span style={{ fontSize:11, color:"#4a3a2a" }}>Sin vinos asignados</span>}
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6, flexShrink:0 }}>
                    <button onClick={() => setEditingPlat({ ...p, vinosIds:[...(p.vinosIds||[])] })} style={{ padding:"6px 10px", background:`${C.p}12`, border:`1px solid ${C.p}22`, borderRadius:6, color:C.p, cursor:"pointer", display:"flex", alignItems:"center", gap:4, fontFamily:"inherit", fontSize:11 }}><IEdit/> Editar</button>
                    <button onClick={() => eliminarPlatillo(p.id)} style={{ padding:"6px 10px", background:"rgba(139,32,53,0.1)", border:"1px solid rgba(139,32,53,0.3)", borderRadius:6, color:"#c06070", cursor:"pointer", display:"flex", alignItems:"center", gap:4, fontFamily:"inherit", fontSize:11 }}><ITrash/> Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB: MARCA ── */}
        {adminTab==="marca" && (
          <div style={{ position:"relative", zIndex:1, flex:1, overflowY:"auto", padding:24, maxWidth:520 }}>
            <div style={{ fontSize:16, fontWeight:300, marginBottom:20 }}>Configuración de Marca</div>

            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              {/* Fondo de la home */}
              <div>
                <div style={{ fontSize:11, letterSpacing:3, color:"#806050", textTransform:"uppercase", marginBottom:8 }}>Fondo de Pantalla de Inicio</div>
                <div style={{ display:"flex", gap:10, marginBottom:10 }}>
                  <button onClick={() => setConfig(c=>({...c, fondoHome:null}))} style={{ padding:"7px 14px", borderRadius:8, border:"1px solid", borderColor:!config.fondoHome?C.p:`${C.p}22`, background:!config.fondoHome?`${C.p}18`:"transparent", color:!config.fondoHome?C.p:"#806050", cursor:"pointer", fontFamily:"inherit", fontSize:12 }}>Color sólido</button>
                  <button onClick={() => {}} style={{ padding:"7px 14px", borderRadius:8, border:"1px solid", borderColor:config.fondoHome?C.p:`${C.p}22`, background:config.fondoHome?`${C.p}18`:"transparent", color:config.fondoHome?C.p:"#806050", cursor:"pointer", fontFamily:"inherit", fontSize:12 }}>Foto de fondo</button>
                </div>
                {!config.fondoHome ? (
                  <ColorPicker label="Color de fondo" value={config.fondoColor||"#0a0704"} onChange={v => setConfig(c=>({...c,fondoColor:v,colorFondo:v}))}/>
                ) : (
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <img src={config.fondoHome} alt="" style={{ width:80, height:50, objectFit:"cover", borderRadius:6 }}/>
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      <ImageUploadBtn onImage={img => setConfig(c=>({...c,fondoHome:img}))} label="Cambiar foto" small/>
                      <button onClick={() => setConfig(c=>({...c,fondoHome:null}))} style={{ background:"none", border:"none", color:"#806050", cursor:"pointer", fontFamily:"inherit", fontSize:11, textAlign:"left" }}>Quitar foto</button>
                    </div>
                  </div>
                )}
                {!config.fondoHome && (
                  <div style={{ marginTop:10 }}>
                    <ImageUploadBtn onImage={img => setConfig(c=>({...c,fondoHome:img}))} label="Subir foto de fondo"/>
                  </div>
                )}
              </div>

              {/* Orden de bloques */}
              <div>
                <div style={{ fontSize:11, letterSpacing:3, color:"#806050", textTransform:"uppercase", marginBottom:8 }}>Orden de la Pantalla de Inicio</div>
                <div style={{ fontSize:12, color:"#4a3a2a", marginBottom:10 }}>Arrastra o usa las flechas para reordenar</div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {(config.bloques||["promo","maridaje","carta"]).map((b, i, arr) => {
                    const labels = { promo:"🌟 Promoción", maridaje:"🍽️ Maridaje", carta:"🍷 Carta de Vinos" };
                    return (
                      <div key={b} style={{ display:"flex", alignItems:"center", gap:10, background:`${C.p}0e`, border:`1px solid ${C.p}18`, borderRadius:8, padding:"10px 14px" }}>
                        <span style={{ flex:1, fontSize:14, color:"#f0e4d0" }}>{labels[b]}</span>
                        <button onClick={() => {
                          if (i===0) return;
                          const nb = [...arr]; [nb[i-1],nb[i]]=[nb[i],nb[i-1]];
                          setConfig(c=>({...c,bloques:nb}));
                        }} style={{ background:"none", border:`1px solid ${C.p}22`, borderRadius:6, padding:"4px 8px", color:i===0?"#3a2a1a":C.p, cursor:i===0?"default":"pointer", fontFamily:"inherit", fontSize:14 }}>↑</button>
                        <button onClick={() => {
                          if (i===arr.length-1) return;
                          const nb = [...arr]; [nb[i],nb[i+1]]=[nb[i+1],nb[i]];
                          setConfig(c=>({...c,bloques:nb}));
                        }} style={{ background:"none", border:`1px solid ${C.p}22`, borderRadius:6, padding:"4px 8px", color:i===arr.length-1?"#3a2a1a":C.p, cursor:i===arr.length-1?"default":"pointer", fontFamily:"inherit", fontSize:14 }}>↓</button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Nombre */}
              <div>
                <div style={{ fontSize:11, letterSpacing:3, color:"#806050", textTransform:"uppercase", marginBottom:8 }}>Nombre del Restaurante</div>
                <input value={config.nombre} onChange={e => setConfig(c=>({...c,nombre:e.target.value}))} style={{ width:"100%", background:"#140c04", border:`1px solid ${C.p}22`, borderRadius:8, padding:"10px 14px", color:"#f5ede0", fontFamily:"inherit", fontSize:16, boxSizing:"border-box" }}/>
              </div>

              {/* Logo */}
              <div>
                <div style={{ fontSize:11, letterSpacing:3, color:"#806050", textTransform:"uppercase", marginBottom:8 }}>Logo del Restaurante</div>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  {config.logo ? (
                    <img src={config.logo} alt="" style={{ height:56, objectFit:"contain", background:"#1a0e06", borderRadius:8, padding:8 }}/>
                  ) : (
                    <div style={{ width:56, height:56, borderRadius:8, background:"#1a0e06", border:`1px dashed ${C.p}33`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>🍷</div>
                  )}
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    <ImageUploadBtn onImage={img => setConfig(c=>({...c,logo:img}))} label="Subir logo"/>
                    {config.logo && <button onClick={() => setConfig(c=>({...c,logo:null}))} style={{ background:"none", border:"none", color:"#806050", cursor:"pointer", fontFamily:"inherit", fontSize:12, textAlign:"left" }}>Quitar logo</button>}
                  </div>
                </div>
              </div>

              {/* Colores */}
              <div>
                <div style={{ fontSize:11, letterSpacing:3, color:"#806050", textTransform:"uppercase", marginBottom:12 }}>Colores</div>
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  <ColorPicker label="Color principal (dorado, acento)" value={config.colorPrimario} onChange={v => setConfig(c=>({...c,colorPrimario:v}))}/>
                  <ColorPicker label="Color secundario (botón seleccionar)" value={config.colorSecundario} onChange={v => setConfig(c=>({...c,colorSecundario:v}))}/>
                  <ColorPicker label="Color de fondo" value={config.colorFondo} onChange={v => setConfig(c=>({...c,colorFondo:v}))}/>
                </div>
              </div>

              {/* Promo */}
              <div>
                <div style={{ fontSize:11, letterSpacing:3, color:"#806050", textTransform:"uppercase", marginBottom:8 }}>Promoción en Pantalla de Inicio</div>
                <div style={{ fontSize:12, color:"#4a3a2a", marginBottom:8 }}>Etiqueta</div>
                <input value={config.promoEtiqueta} onChange={e => setConfig(c=>({...c,promoEtiqueta:e.target.value}))} style={{ width:"100%", background:"#140c04", border:`1px solid ${C.p}22`, borderRadius:8, padding:"8px 12px", color:"#f5ede0", fontFamily:"inherit", fontSize:14, marginBottom:10, boxSizing:"border-box" }}/>
                <div style={{ fontSize:12, color:"#4a3a2a", marginBottom:8 }}>Vino destacado</div>
                <select value={config.promoVinoId} onChange={e => setConfig(c=>({...c,promoVinoId:Number(e.target.value)}))} style={{ width:"100%", background:"#140c04", border:`1px solid ${C.p}22`, borderRadius:8, padding:"8px 12px", color:"#f5ede0", fontFamily:"inherit", fontSize:14, boxSizing:"border-box" }}>
                  {vinos.map(v => <option key={v.id} value={v.id}>{v.nombre} — {v.tipo}</option>)}
                </select>
              </div>

              <button onClick={() => showToast("Configuración guardada ✓")} style={{ padding:"14px", background:`linear-gradient(135deg,${C.s},${C.s}cc)`, border:"none", borderRadius:10, color:"#fff", fontSize:16, fontFamily:"inherit", cursor:"pointer" }}>
                Guardar configuración
              </button>
            </div>
          </div>
        )}

        {/* ── TAB: MOVIMIENTOS ── */}
        {adminTab==="movimientos" && (
          <div style={{ position:"relative", zIndex:1, flex:1, overflowY:"auto", padding:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div style={{ fontSize:16, fontWeight:300 }}>Registro de Movimientos</div>
              {movimientos.length>0 && (
                <button onClick={() => setMovimientos([])} style={{ background:"none", border:`1px solid rgba(139,32,53,0.3)`, borderRadius:8, padding:"6px 14px", color:"#c06070", cursor:"pointer", fontFamily:"inherit", fontSize:12 }}>
                  Limpiar registro
                </button>
              )}
            </div>
            {movimientos.length===0 ? (
              <div style={{ textAlign:"center", paddingTop:60, color:"#4a3a2a" }}>
                <div style={{ fontSize:32, marginBottom:12 }}>📋</div>
                <div style={{ fontSize:15, color:"#806050" }}>Sin movimientos registrados</div>
                <div style={{ fontSize:13, marginTop:6, color:"#4a3a2a" }}>Los altas, bajas y ajustes aparecerán aquí</div>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {movimientos.map(m => {
                  const colores = { Alta:{bg:"rgba(26,58,26,0.6)",border:"rgba(74,138,74,0.3)",color:"#a0d0a0",emoji:"⬆️"}, Baja:{bg:"rgba(58,26,26,0.6)",border:"rgba(138,74,74,0.3)",color:"#d0a0a0",emoji:"⬇️"}, Ajuste:{bg:"rgba(42,36,16,0.6)",border:"rgba(138,120,74,0.3)",color:"#d0c080",emoji:"↕️"}, Edición:{bg:"rgba(20,20,40,0.6)",border:"rgba(74,74,138,0.3)",color:"#a0a0d0",emoji:"✏️"} };
                  const c = colores[m.tipo] || colores.Ajuste;
                  return (
                    <div key={m.id} style={{ background:c.bg, border:`1px solid ${c.border}`, borderRadius:10, padding:"12px 16px", display:"flex", alignItems:"center", gap:12 }}>
                      <span style={{ fontSize:20 }}>{c.emoji}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
                          <span style={{ fontSize:12, color:c.color, fontWeight:400, letterSpacing:1 }}>{m.tipo}</span>
                          {m.cantidad>0 && <span style={{ fontSize:12, color:"#806050" }}>· {m.cantidad} {m.cantidad===1?"botella":"botellas"}</span>}
                          {m.razon && <span style={{ fontSize:12, color:"#806050" }}>· {m.razon}</span>}
                        </div>
                        <div style={{ fontSize:14, color:"#f0e4d0" }}>{m.vinoNombre}</div>
                      </div>
                      <div style={{ textAlign:"right", flexShrink:0 }}>
                        <div style={{ fontSize:12, color:C.p }}>{m.fecha}</div>
                        <div style={{ fontSize:11, color:"#806050" }}>{m.hora}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}


        {(editingVino||nuevoVino) && (() => {
          const v = editingVino||nuevoVino;
          const setV = editingVino ? setEditingVino : setNuevoVino;
          return (
            <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
              <div style={{ background:"#160e06", border:`1px solid ${C.p}22`, borderRadius:16, padding:24, width:"100%", maxWidth:480, maxHeight:"90vh", overflowY:"auto" }}>
                <div style={{ fontSize:18, fontWeight:300, marginBottom:20, color:C.p }}>{v.id?"Editar Vino":"Nuevo Vino"}</div>

                {[
                  ["Nombre",          "nombre",        "text"],
                  ["País",            "pais",          "text"],
                  ["Región",          "region",        "text"],
                  ["Precio (MXN)",    "precio",        "number"],
                  ["Clasificación",   "clasificacion", "text"],
                  ["Stock inicial",   "stock",         "number"],
                ].map(([label, key, type]) => (
                  <div key={key} style={{ marginBottom:12 }}>
                    <div style={{ fontSize:11, color:"#806050", marginBottom:4 }}>{label}</div>
                    <input type={type} value={v[key]||""} onChange={e => setV(x=>({...x,[key]:type==="number"?Number(e.target.value):e.target.value}))}
                      style={{ width:"100%", background:"#0e0802", border:`1px solid ${C.p}22`, borderRadius:8, padding:"8px 12px", color:"#f5ede0", fontFamily:"inherit", fontSize:14, boxSizing:"border-box" }}/>
                  </div>
                ))}

                {/* Cepa — dropdown + Otro */}
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11, color:"#806050", marginBottom:4 }}>Cepa</div>
                  <select value={["Malbec","Cabernet Sauvignon","Merlot","Tempranillo","Syrah / Shiraz","Nebbiolo","Sangiovese","Pinot Noir","Grenache","Blend Tinto","Chardonnay","Sauvignon Blanc","Pinot Grigio","Albariño","Chenin Blanc","Riesling","Viognier","Blend Blanco","Moscato","Macabeo"].includes(v.cepa) ? v.cepa : v.cepa ? "__otro__" : ""}
                    onChange={e => {
                      if (e.target.value === "__otro__") setV(x=>({...x, cepa:"__otro__", cepaOtro:""}));
                      else setV(x=>({...x, cepa:e.target.value, cepaOtro:undefined}));
                    }}
                    style={{ width:"100%", background:"#0e0802", border:`1px solid ${C.p}22`, borderRadius:8, padding:"8px 12px", color:"#f5ede0", fontFamily:"inherit", fontSize:14, marginBottom: v.cepa==="__otro__" ? 8 : 0 }}>
                    <option value="">— Selecciona una cepa —</option>
                    {["Malbec","Cabernet Sauvignon","Merlot","Tempranillo","Syrah / Shiraz","Nebbiolo","Sangiovese","Pinot Noir","Grenache","Blend Tinto","Chardonnay","Sauvignon Blanc","Pinot Grigio","Albariño","Chenin Blanc","Riesling","Viognier","Blend Blanco","Moscato","Macabeo"].map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="__otro__">Otra cepa…</option>
                  </select>
                  {v.cepa==="__otro__" && (
                    <input placeholder="Escribe la cepa" value={v.cepaOtro||""} onChange={e => setV(x=>({...x, cepaOtro:e.target.value}))}
                      style={{ width:"100%", background:"#0e0802", border:`1px solid ${C.p}22`, borderRadius:8, padding:"8px 12px", color:"#f5ede0", fontFamily:"inherit", fontSize:14, boxSizing:"border-box" }}/>
                  )}
                </div>

                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11, color:"#806050", marginBottom:4 }}>Tipo</div>
                  <select value={v.tipo} onChange={e => setV(x=>({...x,tipo:e.target.value}))} style={{ width:"100%", background:"#0e0802", border:`1px solid ${C.p}22`, borderRadius:8, padding:"8px 12px", color:"#f5ede0", fontFamily:"inherit", fontSize:14 }}>
                    {TIPOS_VINO.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:11, color:"#806050", marginBottom:4 }}>Descripción / Notas de cata</div>
                  <textarea value={v.descripcion||""} onChange={e => setV(x=>({...x,descripcion:e.target.value}))} rows={3}
                    style={{ width:"100%", background:"#0e0802", border:`1px solid ${C.p}22`, borderRadius:8, padding:"8px 12px", color:"#f5ede0", fontFamily:"inherit", fontSize:14, resize:"vertical", boxSizing:"border-box" }}/>
                </div>

                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:11, color:"#806050", marginBottom:8 }}>Foto de la etiqueta</div>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    {v.imagen ? <img src={v.imagen} alt="" style={{ width:48, height:72, objectFit:"cover", borderRadius:6 }}/> : <div style={{ width:48, height:72, borderRadius:6, background:"#0e0802", border:`1px dashed ${C.p}22`, display:"flex", alignItems:"center", justifyContent:"center" }}>📷</div>}
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      <ImageUploadBtn onImage={img => setV(x=>({...x,imagen:img}))} label="Subir foto" small/>
                      {v.imagen && <button onClick={() => setV(x=>({...x,imagen:null}))} style={{ background:"none", border:"none", color:"#806050", cursor:"pointer", fontFamily:"inherit", fontSize:11 }}>Quitar</button>}
                    </div>
                  </div>
                </div>

                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={() => { guardarVino(v); setEditingVino(null); setNuevoVino(null); }} style={{ flex:1, padding:12, background:`linear-gradient(135deg,${C.s},${C.s}cc)`, border:"none", borderRadius:8, color:"#fff", fontFamily:"inherit", fontSize:15, cursor:"pointer" }}>
                    Guardar
                  </button>
                  <button onClick={() => { setEditingVino(null); setNuevoVino(null); }} style={{ flex:1, padding:12, background:"#1a0e06", border:`1px solid ${C.p}22`, borderRadius:8, color:"#a09080", fontFamily:"inherit", fontSize:15, cursor:"pointer" }}>
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ══ MODAL: BAJA DE INVENTARIO ══ */}
        {bajaVino && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
            <div style={{ background:"#160e06", border:"1px solid rgba(139,32,53,0.4)", borderRadius:16, padding:24, width:"100%", maxWidth:380 }}>
              <div style={{ fontSize:18, fontWeight:300, marginBottom:6, color:"#c06070" }}>Baja de Inventario</div>
              <div style={{ fontSize:14, color:"#a09080", marginBottom:20 }}>{bajaVino.vino.nombre}</div>

              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, color:"#806050", marginBottom:8 }}>Cantidad a dar de baja</div>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <button onClick={() => setBajaVino(b=>({...b,cantidad:Math.max(1,b.cantidad-1)}))} style={{ width:36, height:36, borderRadius:8, background:"#1a0e06", border:"1px solid rgba(139,32,53,0.3)", color:"#f5ede0", cursor:"pointer", fontSize:20 }}>−</button>
                  <span style={{ fontSize:24, color:"#c06070", minWidth:40, textAlign:"center" }}>{bajaVino.cantidad}</span>
                  <button onClick={() => setBajaVino(b=>({...b,cantidad:Math.min(b.vino.stock,b.cantidad+1)}))} style={{ width:36, height:36, borderRadius:8, background:"#1a0e06", border:"1px solid rgba(139,32,53,0.3)", color:"#f5ede0", cursor:"pointer", fontSize:20 }}>+</button>
                  <span style={{ fontSize:13, color:"#4a3a2a" }}>de {bajaVino.vino.stock} en existencia</span>
                </div>
              </div>

              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, color:"#806050", marginBottom:8 }}>Razón de baja</div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {RAZONES_BAJA.map(r => (
                    <button key={r} onClick={() => setBajaVino(b=>({...b,razon:r}))} style={{ padding:"8px 12px", borderRadius:8, border:"1px solid", borderColor:bajaVino.razon===r?"rgba(139,32,53,0.6)":"rgba(139,32,53,0.15)", background:bajaVino.razon===r?"rgba(139,32,53,0.15)":"transparent", color:bajaVino.razon===r?"#c06070":"#806050", cursor:"pointer", fontFamily:"inherit", fontSize:13, textAlign:"left" }}>{r}</button>
                  ))}
                </div>
              </div>

              <div style={{ display:"flex", gap:10 }}>
                <button onClick={() => aplicarBaja(bajaVino.vino.id, bajaVino.cantidad, bajaVino.razon)} style={{ flex:1, padding:12, background:"linear-gradient(135deg,#5c1426,#8b2035)", border:"none", borderRadius:8, color:"#fff", fontFamily:"inherit", fontSize:15, cursor:"pointer" }}>
                  Registrar Baja
                </button>
                <button onClick={() => setBajaVino(null)} style={{ flex:1, padding:12, background:"#1a0e06", border:`1px solid ${C.p}22`, borderRadius:8, color:"#a09080", fontFamily:"inherit", fontSize:15, cursor:"pointer" }}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ MODAL: EDITAR / NUEVO PLATILLO ══ */}
        {(editingPlat||nuevoPlatillo) && (() => {
          const p = editingPlat||nuevoPlatillo;
          const setP = editingPlat ? setEditingPlat : setNuevoPlatillo;
          return (
            <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
              <div style={{ background:"#160e06", border:`1px solid ${C.p}22`, borderRadius:16, padding:24, width:"100%", maxWidth:480, maxHeight:"90vh", overflowY:"auto" }}>
                <div style={{ fontSize:18, fontWeight:300, marginBottom:20, color:C.p }}>{p.id?"Editar Platillo":"Nuevo Platillo"}</div>

                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11, color:"#806050", marginBottom:4 }}>Nombre del platillo</div>
                  <input value={p.nombre} onChange={e => setP(x=>({...x,nombre:e.target.value}))} style={{ width:"100%", background:"#0e0802", border:`1px solid ${C.p}22`, borderRadius:8, padding:"8px 12px", color:"#f5ede0", fontFamily:"inherit", fontSize:14, boxSizing:"border-box" }}/>
                </div>

                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:11, color:"#806050", marginBottom:4 }}>Categoría</div>
                  <select value={["Entradas","Sopas","Pastas","Carnes","Pescados","Postres"].includes(p.categoria) ? p.categoria : "__otro__"}
                    onChange={e => {
                      if (e.target.value === "__otro__") setP(x=>({...x, categoria:""}));
                      else setP(x=>({...x, categoria:e.target.value}));
                    }}
                    style={{ width:"100%", background:"#0e0802", border:`1px solid ${C.p}22`, borderRadius:8, padding:"8px 12px", color:"#f5ede0", fontFamily:"inherit", fontSize:14, marginBottom: ["Entradas","Sopas","Pastas","Carnes","Pescados","Postres"].includes(p.categoria) ? 0 : 8 }}>
                    {["Entradas","Sopas","Pastas","Carnes","Pescados","Postres"].map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="__otro__">Otra categoría…</option>
                  </select>
                  {!["Entradas","Sopas","Pastas","Carnes","Pescados","Postres"].includes(p.categoria) && (
                    <input placeholder="Escribe la categoría (ej. Sushi, Tapas…)" value={p.categoria||""} onChange={e => setP(x=>({...x, categoria:e.target.value}))}
                      style={{ width:"100%", background:"#0e0802", border:`1px solid ${C.p}22`, borderRadius:8, padding:"8px 12px", color:"#f5ede0", fontFamily:"inherit", fontSize:14, boxSizing:"border-box" }}/>
                  )}
                </div>

                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:11, color:"#806050", marginBottom:8 }}>Foto del platillo</div>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    {p.imagen ? <img src={p.imagen} alt="" style={{ width:80, height:60, objectFit:"cover", borderRadius:6 }}/> : <div style={{ width:80, height:60, borderRadius:6, background:"#0e0802", border:`1px dashed ${C.p}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>🍽️</div>}
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      <ImageUploadBtn onImage={img => setP(x=>({...x,imagen:img}))} label="Subir foto" small/>
                      {p.imagen && <button onClick={() => setP(x=>({...x,imagen:null}))} style={{ background:"none", border:"none", color:"#806050", cursor:"pointer", fontFamily:"inherit", fontSize:11 }}>Quitar</button>}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom:20 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                    <div style={{ fontSize:11, color:"#806050" }}>Vinos maridados</div>
                    <div style={{ fontSize:11, color:(p.vinosIds||[]).length>=3 ? "#c4a84e" : "#4a3a2a" }}>
                      {(p.vinosIds||[]).length}/3 seleccionados
                      {(p.vinosIds||[]).length>=3 && " — quita uno para cambiar"}
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:5, maxHeight:200, overflowY:"auto" }}>
                    {vinos.filter(v=>v.stock>0).map(v => {
                      const sel = (p.vinosIds||[]).includes(v.id);
                      const lleno = (p.vinosIds||[]).length >= 3 && !sel;
                      return (
                        <button key={v.id} onClick={() => {
                          const ids = p.vinosIds||[];
                          if (sel) setP(x=>({...x,vinosIds:ids.filter(id=>id!==v.id)}));
                          else if (ids.length<3) setP(x=>({...x,vinosIds:[...ids,v.id]}));
                        }} style={{ padding:"8px 10px", borderRadius:7, border:"1px solid", borderColor:sel?C.p:lleno?`${C.p}08`:`${C.p}18`, background:sel?`${C.p}18`:"transparent", color:sel?C.p:lleno?"#2a1a0a":"#a09080", cursor:lleno?"default":"pointer", fontFamily:"inherit", fontSize:13, textAlign:"left", display:"flex", alignItems:"center", gap:8, opacity:lleno?0.4:1 }}>
                          <span style={{ fontSize:10, padding:"1px 5px", borderRadius:6, background:tipoBadge[v.tipo]?.bg, color:tipoBadge[v.tipo]?.color }}>{v.tipo}</span>
                          {v.nombre} — ${v.precio.toLocaleString()}
                          {sel && <span style={{ marginLeft:"auto", color:C.p }}><ICheck/></span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={() => { guardarPlatillo(p); setEditingPlat(null); setNuevoPlatillo(null); }} style={{ flex:1, padding:12, background:`linear-gradient(135deg,${C.s},${C.s}cc)`, border:"none", borderRadius:8, color:"#fff", fontFamily:"inherit", fontSize:15, cursor:"pointer" }}>
                    Guardar
                  </button>
                  <button onClick={() => { setEditingPlat(null); setNuevoPlatillo(null); }} style={{ flex:1, padding:12, background:"#1a0e06", border:`1px solid ${C.p}22`, borderRadius:8, color:"#a09080", fontFamily:"inherit", fontSize:15, cursor:"pointer" }}>
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  // PANEL DE PLATAFORMA (Federico — dueño de VinotecApp)
  // ═══════════════════════════════════════════════════
  if (modo==="plataforma" && screen==="plat-pin") return (
    <div style={{ minHeight:"100vh", background:"#060408", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"'Cormorant Garamond','Georgia',serif", color:"#f5ede0" }}>
      <div style={{ textAlign:"center", width:"100%", maxWidth:360, padding:32 }}>
        <div style={{ fontSize:28, fontWeight:300, letterSpacing:4, marginBottom:4 }}>VinotecApp</div>
        <div style={{ fontSize:11, letterSpacing:4, color:"#9b7fe8", textTransform:"uppercase", marginBottom:32 }}>Panel de Plataforma</div>
        <div style={{ fontSize:12, color:"#806050", letterSpacing:3, textTransform:"uppercase", marginBottom:20 }}>PIN Maestro</div>
        <div style={{ display:"flex", justifyContent:"center", gap:12, marginBottom:28 }}>
          {[0,1,2,3].map(i => <div key={i} style={{ width:14, height:14, borderRadius:"50%", background:i<platPinInput.length?"#9b7fe8":"transparent", border:"2px solid #9b7fe866", transition:"all 0.2s" }}/>)}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24 }}>
          {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d,i) => (
            <button key={i} onClick={() => {
              if (d==="⌫") { setPlatPinInput(p=>p.slice(0,-1)); return; }
              if (d==="") return;
              const np = platPinInput + String(d);
              setPlatPinInput(np);
              if (np.length===4) {
                if (np==="0000") { setPlatPinInput(""); setScreen("plataforma"); cargarPlataforma(); }
                else setTimeout(() => setPlatPinInput(""), 600);
              }
            }} style={{ background:d===""?"transparent":"linear-gradient(135deg,#12080a,#1c1020)", border:d===""?"none":"1px solid #9b7fe822", borderRadius:12, padding:18, color:"#f5ede0", fontSize:22, fontFamily:"inherit", cursor:d===""?"default":"pointer" }}>{d}</button>
          ))}
        </div>
        <button onClick={() => { setModo("guest"); setScreen("home"); setPlatPinInput(""); }} style={{ background:"none", border:"none", color:"#4a3a2a", cursor:"pointer", fontFamily:"inherit", fontSize:13 }}>← Cancelar</button>
      </div>
    </div>
  );

  if (modo==="plataforma" && screen==="plataforma") return (
    <PanelPlataforma
      restaurantes={platRestaurantes}
      onRefresh={cargarPlataforma}
      onSalir={() => { setModo("guest"); setScreen("home"); }}
      SUPABASE_URL={SUPABASE_URL}
      SUPABASE_KEY={SUPABASE_KEY}
    />
  );

  return null;
}

// ═══════════════════════════════════════════════════
// COMPONENTE: PANEL DE PLATAFORMA
// ═══════════════════════════════════════════════════
function PanelPlataforma({ restaurantes, onRefresh, onSalir, SUPABASE_URL, SUPABASE_KEY }) {
  const [tab, setTab]           = useState("restaurantes");
  const [editRest, setEditRest] = useState(null);
  const [nuevoRest, setNuevoRest] = useState(null);
  const [eventos, setEventos]   = useState([]);
  const [restSelec, setRestSelec] = useState(null);
  const [toast, setToast]       = useState(null);

  const showToast = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),2500); };

  const P = "#9b7fe8"; // morado — color del panel maestro
  const bg = "#060408";

  const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" };

  const toggleActivo = async (rest) => {
    await fetch(`${SUPABASE_URL}/rest/v1/restaurantes?id=eq.${rest.id}`, {
      method: "PATCH", headers, body: JSON.stringify({ activo: !rest.activo })
    });
    showToast(rest.activo ? "Restaurante desactivado" : "Restaurante activado", !rest.activo);
    onRefresh();
  };

  const guardarRestaurante = async (r) => {
    const data = { nombre: r.nombre, contacto_nombre: r.contacto_nombre, contacto_email: r.contacto_email, contacto_tel: r.contacto_tel, plan: r.plan, fecha_vencimiento: r.fecha_vencimiento||null, notas: r.notas, pin_admin: r.pin_admin, pin_mesero: r.pin_mesero };
    if (r.id) {
      await fetch(`${SUPABASE_URL}/rest/v1/restaurantes?id=eq.${r.id}`, { method:"PATCH", headers, body:JSON.stringify(data) });
    } else {
      await fetch(`${SUPABASE_URL}/rest/v1/restaurantes`, { method:"POST", headers:{ ...headers, Prefer:"return=representation" }, body:JSON.stringify({ ...data, activo:true }) });
    }
    showToast("Restaurante guardado ✓");
    setEditRest(null); setNuevoRest(null);
    onRefresh();
  };

  const cargarEventos = async (restId) => {
    const data = await fetch(`${SUPABASE_URL}/rest/v1/eventos?restaurante_id=eq.${restId}&order=created_at.desc&limit=200`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }).then(r=>r.json());
    setEventos(data||[]);
    setRestSelec(restId);
  };

  const TabBtn = ({id, label}) => (
    <button onClick={()=>setTab(id)} style={{ flex:1, padding:"12px 8px", background:tab===id?`${P}18`:"transparent", border:"none", borderBottom:tab===id?`2px solid ${P}`:"2px solid transparent", color:tab===id?P:"#806050", cursor:"pointer", fontFamily:"inherit", fontSize:14, transition:"all 0.2s" }}>{label}</button>
  );

  // Contar eventos por tipo para un restaurante
  const contarEventos = (restId, tipo) => eventos.filter(e=>e.restaurante_id===restId&&e.tipo===tipo).length;

  return (
    <div style={{ minHeight:"100vh", background:bg, color:"#f5ede0", fontFamily:"'Cormorant Garamond','Georgia',serif", display:"flex", flexDirection:"column" }}>
      {toast && <div style={{ position:"fixed", top:20, left:"50%", transform:"translateX(-50%)", zIndex:100, background:toast.ok?"#1a3a1a":"#3a1a1a", border:`1px solid ${toast.ok?"#4a8a4a":"#8a4a4a"}`, borderRadius:10, padding:"10px 20px", color:toast.ok?"#a0d0a0":"#d0a0a0", fontSize:14 }}>{toast.msg}</div>}

      {/* Header */}
      <div style={{ padding:"16px 24px", borderBottom:`1px solid ${P}18`, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <div>
          <div style={{ fontSize:11, letterSpacing:4, color:P, textTransform:"uppercase" }}>Panel Maestro</div>
          <div style={{ fontSize:22, fontWeight:300 }}>VinotecApp</div>
        </div>
        <button onClick={onSalir} style={{ background:`${P}18`, border:`1px solid ${P}33`, borderRadius:8, padding:"8px 16px", color:"#f5ede0", cursor:"pointer", fontFamily:"inherit", fontSize:13 }}>Salir</button>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", borderBottom:`1px solid ${P}18`, flexShrink:0 }}>
        <TabBtn id="restaurantes" label="🏪 Restaurantes"/>
        <TabBtn id="analiticas"   label="📊 Analíticas"/>
      </div>

      {/* ── TAB: RESTAURANTES ── */}
      {tab==="restaurantes" && (
        <div style={{ flex:1, overflowY:"auto", padding:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <div style={{ fontSize:16, fontWeight:300 }}>{restaurantes.length} restaurantes registrados</div>
            <button onClick={() => setNuevoRest({ nombre:"", contacto_nombre:"", contacto_email:"", contacto_tel:"", plan:"mensual", pin_admin:"9999", pin_mesero:"1234", notas:"" })} style={{ padding:"8px 16px", background:`${P}18`, border:`1px solid ${P}44`, borderRadius:8, color:P, cursor:"pointer", fontFamily:"inherit", fontSize:13 }}>
              + Nuevo restaurante
            </button>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {restaurantes.map(r => (
              <div key={r.id} style={{ background:"linear-gradient(135deg,#0e080e,#160e18)", border:`1px solid ${r.activo?"#9b7fe822":"rgba(139,32,53,0.2)"}`, borderRadius:12, padding:"16px 20px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                  {/* Status dot */}
                  <div style={{ width:10, height:10, borderRadius:"50%", background:r.activo?"#4a8a4a":"#8a4a4a", flexShrink:0 }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:18, fontWeight:400 }}>{r.nombre}</div>
                    <div style={{ fontSize:12, color:"#806050" }}>{r.activo?"Activo":"Inactivo"} · {r.plan||"mensual"}{r.fecha_vencimiento?` · vence ${r.fecha_vencimiento}`:""}</div>
                  </div>
                  {/* Toggle activo */}
                  <button onClick={() => toggleActivo(r)} style={{ padding:"6px 14px", borderRadius:8, border:"1px solid", borderColor:r.activo?"rgba(139,32,53,0.4)":"rgba(74,138,74,0.4)", background:r.activo?"rgba(139,32,53,0.1)":"rgba(26,58,26,0.3)", color:r.activo?"#c06070":"#a0d0a0", cursor:"pointer", fontFamily:"inherit", fontSize:12 }}>
                    {r.activo ? "Desactivar" : "Activar"}
                  </button>
                  <button onClick={() => setEditRest({...r})} style={{ padding:"6px 14px", borderRadius:8, border:`1px solid ${P}22`, background:`${P}12`, color:P, cursor:"pointer", fontFamily:"inherit", fontSize:12 }}>
                    Editar
                  </button>
                </div>

                {/* Info de contacto */}
                {(r.contacto_nombre||r.contacto_email||r.contacto_tel) && (
                  <div style={{ fontSize:12, color:"#806050", marginBottom:8 }}>
                    {r.contacto_nombre && <span>{r.contacto_nombre} </span>}
                    {r.contacto_tel && <span>· {r.contacto_tel} </span>}
                    {r.contacto_email && <span>· {r.contacto_email}</span>}
                  </div>
                )}

                {/* Ver analíticas */}
                <button onClick={() => { cargarEventos(r.id); setTab("analiticas"); }} style={{ background:"none", border:"none", color:`${P}88`, cursor:"pointer", fontFamily:"inherit", fontSize:12, padding:0 }}>
                  Ver analíticas →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: ANALÍTICAS ── */}
      {tab==="analiticas" && (
        <div style={{ flex:1, overflowY:"auto", padding:20 }}>
          <div style={{ fontSize:16, fontWeight:300, marginBottom:16 }}>Comportamiento de Invitados</div>

          {/* Selector de restaurante */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, color:"#806050", letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>Restaurante</div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {restaurantes.map(r => (
                <button key={r.id} onClick={() => cargarEventos(r.id)} style={{ padding:"10px 14px", borderRadius:8, border:"1px solid", borderColor:restSelec===r.id?P:`${P}18`, background:restSelec===r.id?`${P}18`:"transparent", color:restSelec===r.id?P:"#a09080", cursor:"pointer", fontFamily:"inherit", fontSize:14, textAlign:"left" }}>
                  {r.nombre}
                </button>
              ))}
            </div>
          </div>

          {restSelec && eventos.length > 0 && (() => {
            const tiposEvento = [
              { tipo:"vista_home",     label:"Pantalla de inicio",  emoji:"🏠" },
              { tipo:"vista_carta",    label:"Carta de vinos",      emoji:"🍷" },
              { tipo:"vista_maridaje", label:"Maridaje",            emoji:"🍽️" },
              { tipo:"vista_promo",    label:"Promoción",           emoji:"🌟" },
              { tipo:"vista_vino",     label:"Fichas de vino vistas",emoji:"👁️" },
              { tipo:"seleccion_vino", label:"Vinos seleccionados", emoji:"✅" },
              { tipo:"uso_filtro",     label:"Filtros usados",      emoji:"🔍" },
            ];

            // Top vinos más vistos
            const vinosVistos = eventos.filter(e=>e.tipo==="vista_vino"&&e.vino_nombre)
              .reduce((acc,e) => { acc[e.vino_nombre]=(acc[e.vino_nombre]||0)+1; return acc; }, {});
            const topVinos = Object.entries(vinosVistos).sort((a,b)=>b[1]-a[1]).slice(0,5);

            // Top vinos seleccionados
            const vinosSelec = eventos.filter(e=>e.tipo==="seleccion_vino"&&e.vino_nombre)
              .reduce((acc,e) => { acc[e.vino_nombre]=(acc[e.vino_nombre]||0)+1; return acc; }, {});
            const topSelec = Object.entries(vinosSelec).sort((a,b)=>b[1]-a[1]).slice(0,5);

            return (
              <div>
                {/* Resumen general */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:20 }}>
                  {tiposEvento.slice(0,3).map(({tipo,label,emoji}) => (
                    <div key={tipo} style={{ background:`${P}10`, border:`1px solid ${P}18`, borderRadius:10, padding:"12px 14px", textAlign:"center" }}>
                      <div style={{ fontSize:24, marginBottom:4 }}>{emoji}</div>
                      <div style={{ fontSize:22, color:P, fontWeight:300 }}>{eventos.filter(e=>e.tipo===tipo).length}</div>
                      <div style={{ fontSize:11, color:"#806050", marginTop:2 }}>{label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, marginBottom:20 }}>
                  {tiposEvento.slice(3).map(({tipo,label,emoji}) => (
                    <div key={tipo} style={{ background:`${P}10`, border:`1px solid ${P}18`, borderRadius:10, padding:"12px 14px", textAlign:"center" }}>
                      <div style={{ fontSize:20, marginBottom:4 }}>{emoji}</div>
                      <div style={{ fontSize:22, color:P, fontWeight:300 }}>{eventos.filter(e=>e.tipo===tipo).length}</div>
                      <div style={{ fontSize:11, color:"#806050", marginTop:2 }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* Top vinos vistos */}
                {topVinos.length>0 && (
                  <div style={{ marginBottom:20 }}>
                    <div style={{ fontSize:13, letterSpacing:3, color:P, textTransform:"uppercase", marginBottom:10 }}>Top vinos más vistos</div>
                    {topVinos.map(([nombre,count],i) => (
                      <div key={nombre} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                        <div style={{ fontSize:12, color:"#4a3a2a", minWidth:16 }}>{i+1}</div>
                        <div style={{ flex:1, fontSize:14, color:"#f0e4d0" }}>{nombre}</div>
                        <div style={{ fontSize:14, color:P }}>{count} vistas</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Top vinos seleccionados */}
                {topSelec.length>0 && (
                  <div>
                    <div style={{ fontSize:13, letterSpacing:3, color:P, textTransform:"uppercase", marginBottom:10 }}>Vinos más seleccionados</div>
                    {topSelec.map(([nombre,count],i) => (
                      <div key={nombre} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                        <div style={{ fontSize:12, color:"#4a3a2a", minWidth:16 }}>{i+1}</div>
                        <div style={{ flex:1, fontSize:14, color:"#f0e4d0" }}>{nombre}</div>
                        <div style={{ fontSize:14, color:"#a0d0a0" }}>{count} veces</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {restSelec && eventos.length===0 && (
            <div style={{ textAlign:"center", paddingTop:40, color:"#4a3a2a" }}>
              <div style={{ fontSize:32, marginBottom:12 }}>📊</div>
              <div style={{ fontSize:15, color:"#806050" }}>Sin eventos registrados aún</div>
              <div style={{ fontSize:13, marginTop:6 }}>Los datos aparecen conforme los invitados usen la app</div>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: EDITAR / NUEVO RESTAURANTE ── */}
      {(editRest||nuevoRest) && (() => {
        const r = editRest||nuevoRest;
        const setR = editRest ? setEditRest : setNuevoRest;
        return (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
            <div style={{ background:"#100814", border:`1px solid ${P}22`, borderRadius:16, padding:24, width:"100%", maxWidth:460, maxHeight:"90vh", overflowY:"auto" }}>
              <div style={{ fontSize:18, fontWeight:300, marginBottom:20, color:P }}>{r.id?"Editar Restaurante":"Nuevo Restaurante"}</div>
              {[
                ["Nombre del restaurante", "nombre", "text"],
                ["Contacto (nombre)", "contacto_nombre", "text"],
                ["Teléfono", "contacto_tel", "text"],
                ["Email", "contacto_email", "email"],
                ["PIN Admin", "pin_admin", "text"],
                ["PIN Mesero", "pin_mesero", "text"],
              ].map(([label, key, type]) => (
                <div key={key} style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11, color:"#806050", marginBottom:4 }}>{label}</div>
                  <input type={type} value={r[key]||""} onChange={e=>setR(x=>({...x,[key]:e.target.value}))}
                    style={{ width:"100%", background:"#080410", border:`1px solid ${P}22`, borderRadius:8, padding:"8px 12px", color:"#f5ede0", fontFamily:"inherit", fontSize:14, boxSizing:"border-box" }}/>
                </div>
              ))}
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:11, color:"#806050", marginBottom:4 }}>Plan</div>
                <select value={r.plan||"mensual"} onChange={e=>setR(x=>({...x,plan:e.target.value}))} style={{ width:"100%", background:"#080410", border:`1px solid ${P}22`, borderRadius:8, padding:"8px 12px", color:"#f5ede0", fontFamily:"inherit", fontSize:14 }}>
                  <option value="mensual">Mensual</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="anual">Anual</option>
                  <option value="prueba">Prueba</option>
                </select>
              </div>
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, color:"#806050", marginBottom:4 }}>Fecha de vencimiento</div>
                <input type="date" value={r.fecha_vencimiento||""} onChange={e=>setR(x=>({...x,fecha_vencimiento:e.target.value}))}
                  style={{ width:"100%", background:"#080410", border:`1px solid ${P}22`, borderRadius:8, padding:"8px 12px", color:"#f5ede0", fontFamily:"inherit", fontSize:14, boxSizing:"border-box" }}/>
              </div>
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, color:"#806050", marginBottom:4 }}>Notas</div>
                <textarea value={r.notas||""} onChange={e=>setR(x=>({...x,notas:e.target.value}))} rows={2}
                  style={{ width:"100%", background:"#080410", border:`1px solid ${P}22`, borderRadius:8, padding:"8px 12px", color:"#f5ede0", fontFamily:"inherit", fontSize:14, resize:"vertical", boxSizing:"border-box" }}/>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={() => guardarRestaurante(r)} style={{ flex:1, padding:12, background:`linear-gradient(135deg,${P}88,${P})`, border:"none", borderRadius:8, color:"#fff", fontFamily:"inherit", fontSize:15, cursor:"pointer" }}>Guardar</button>
                <button onClick={() => { setEditRest(null); setNuevoRest(null); }} style={{ flex:1, padding:12, background:"#100814", border:`1px solid ${P}22`, borderRadius:8, color:"#a09080", fontFamily:"inherit", fontSize:15, cursor:"pointer" }}>Cancelar</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
