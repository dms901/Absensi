 "use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  LayoutDashboard, Users, ClipboardCheck, FileText, Settings,
  LogOut, Menu, X, Plus, Search, Download, CheckCircle2,
  Clock3, UserRound, CalendarDays, MoreHorizontal, Trash2,
  Pencil, ChevronLeft, ChevronRight, ShieldCheck
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const today = new Date().toISOString().slice(0, 10);
const nav = [
  ["dashboard","Dashboard",LayoutDashboard],
  ["attendance","Absensi",ClipboardCheck],
  ["members","Anggota",Users],
  ["reports","Laporan",FileText],
  ["settings","Pengaturan",Settings],
];

function fmtDate(d) {
  return new Intl.DateTimeFormat("id-ID",{day:"2-digit",month:"long",year:"numeric"}).format(new Date(d+"T00:00:00"));
}
function cls(...x){return x.filter(Boolean).join(" ")}
function Status({value}) {
  const c={Hadir:"green",Izin:"yellow",Sakit:"blue",Alpha:"red",Belum:"gray"}[value]||"gray";
  return <span className={`status ${c}`}><span/> {value}</span>;
}

export default function Home() {
  const [session,setSession]=useState(null);
  const [loading,setLoading]=useState(true);
  const [page,setPage]=useState("dashboard");
  const [mobile,setMobile]=useState(false);
  const [members,setMembers]=useState([]);
  const [attendance,setAttendance]=useState([]);
  const [date,setDate]=useState(today);
  const [search,setSearch]=useState("");
  const [showAdd,setShowAdd]=useState(false);
  const [showEdit,setShowEdit]=useState(null);
  const [toast,setToast]=useState("");
  const [login,setLogin]=useState({email:"",password:""});
  const [loginError,setLoginError]=useState("");
  const [reportFrom,setReportFrom]=useState(today);
  const [reportTo,setReportTo]=useState(today);

  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>{
      setSession(data.session); setLoading(false);
      if(data.session) refresh();
    });
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>{
      setSession(s); if(s) refresh();
    });
    return ()=>subscription.unsubscribe();
  },[]);

  async function refresh(){
    const [m,a]=await Promise.all([
      supabase.from("members").select("*").order("name"),
      supabase.from("attendance").select("*").eq("attendance_date",date)
    ]);
    if(m.error) notify(m.error.message); else setMembers(m.data||[]);
    if(a.error) notify(a.error.message); else setAttendance(a.data||[]);
  }
  useEffect(()=>{if(session) refresh()},[date]);

  function notify(t){setToast(t);setTimeout(()=>setToast(""),3000)}
  async function doLogin(e){
    e.preventDefault(); setLoginError("");
    const {error}=await supabase.auth.signInWithPassword(login);
    if(error) setLoginError(error.message);
  }
  async function logout(){await supabase.auth.signOut();}

  const map=useMemo(()=>Object.fromEntries(attendance.map(x=>[x.member_id,x])),[attendance]);
  const filtered=members.filter(m=>(m.name+" "+m.member_id+" "+(m.info||"")).toLowerCase().includes(search.toLowerCase()));
  const counts=useMemo(()=>{
    const c={Hadir:0,Izin:0,Sakit:0,Alpha:0};
    attendance.forEach(a=>c[a.status]=(c[a.status]||0)+1);
    return c;
  },[attendance]);

  async function addMember(form){
    const {error}=await supabase.from("members").insert(form);
    if(error) notify(error.message); else {setShowAdd(false);notify("Anggota berhasil ditambahkan");refresh();}
  }
  async function editMember(id,form){
    const {error}=await supabase.from("members").update(form).eq("id",id);
    if(error) notify(error.message); else {setShowEdit(null);notify("Data anggota diperbarui");refresh();}
  }
  async function removeMember(id){
    if(!confirm("Hapus anggota ini? Data absensinya juga akan ikut terhapus.")) return;
    const {error}=await supabase.from("members").delete().eq("id",id);
    if(error) notify(error.message); else {notify("Anggota dihapus");refresh();}
  }
  async function setStatus(memberId,status){
    const old=map[memberId];
    let q=old
      ? supabase.from("attendance").update({status}).eq("id",old.id)
      : supabase.from("attendance").insert({member_id:memberId,attendance_date:date,status});
    const {error}=await q;
    if(error) notify(error.message); else refresh();
  }
  async function resetStatus(memberId){
    const old=map[memberId]; if(!old)return;
    const {error}=await supabase.from("attendance").delete().eq("id",old.id);
    if(error)notify(error.message);else refresh();
  }

  async function exportPDF(){
    const {jsPDF}=await import("jspdf");
    const {default:autoTable}=await import("jspdf-autotable");
    const doc=new jsPDF();
    doc.setFontSize(18);doc.text("Laporan Absensi",14,18);
    doc.setFontSize(10);doc.text(`Tanggal: ${fmtDate(date)}`,14,26);
    autoTable(doc,{startY:32,head:[["No","ID Anggota","Nama","Status"]],
      body:members.map((m,i)=>[i+1,m.member_id,m.name,map[m.id]?.status||"Belum"])});
    doc.save(`absensi-${date}.pdf`);
  }

  if(loading) return <div className="center"><div className="loader"/></div>;
  if(!session) return <Login login={login} setLogin={setLogin} error={loginError} onSubmit={doLogin}/>;

  return <div className="shell">
    <aside className={cls("sidebar",mobile&&"open")}>
      <div className="logo"><div className="logoMark">A</div><div><b>AbsensiKu</b><small>Admin Panel</small></div><button className="mobileClose" onClick={()=>setMobile(false)}><X/></button></div>
      <div className="navTitle">MENU UTAMA</div>
      {nav.map(([id,label,Icon])=><button key={id} className={cls("navItem",page===id&&"active")} onClick={()=>{setPage(id);setMobile(false)}}><Icon size={19}/>{label}</button>)}
      <div className="sidebarBottom">
        <div className="adminMini"><div className="avatar"><ShieldCheck size={18}/></div><div><b>Administrator</b><small>{session.user.email}</small></div></div>
        <button className="navItem logout" onClick={logout}><LogOut size={19}/>Keluar</button>
      </div>
    </aside>

    <main className="main">
      <header className="topbar">
        <button className="hamb" onClick={()=>setMobile(true)}><Menu/></button>
        <div><h1>{page==="dashboard"?"Dashboard":page==="attendance"?"Absensi":page==="members"?"Anggota":page==="reports"?"Laporan":"Pengaturan"}</h1><p>{fmtDate(today)}</p></div>
        <div className="topActions"><button className="iconBtn"><CalendarDays size={19}/></button><div className="topUser"><div className="avatar small"><UserRound size={17}/></div><b>Admin</b></div></div>
      </header>

      {toast&&<div className="toast">{toast}</div>}

      {page==="dashboard"&&<Dashboard members={members} counts={counts} attendance={attendance} date={date} setDate={setDate} setPage={setPage} exportPDF={exportPDF}/>}
      {page==="attendance"&&<Attendance members={filtered} map={map} date={date} setDate={setDate} search={search} setSearch={setSearch} setStatus={setStatus} resetStatus={resetStatus} exportPDF={exportPDF}/>}
      {page==="members"&&<Members members={filtered} search={search} setSearch={setSearch} add={()=>setShowAdd(true)} edit={setShowEdit} remove={removeMember}/>}
      {page==="reports"&&<Reports members={members} from={reportFrom} to={reportTo} setFrom={setReportFrom} setTo={setReportTo}/>}
      {page==="settings"&&<SettingsPage email={session.user.email}/>}
    </main>

    {showAdd&&<MemberModal title="Tambah Anggota" onClose={()=>setShowAdd(false)} onSave={addMember}/>}
    {showEdit&&<MemberModal title="Edit Anggota" initial={showEdit} onClose={()=>setShowEdit(null)} onSave={(f)=>editMember(showEdit.id,f)}/>}
  </div>
}

function Login({login,setLogin,error,onSubmit}){
 return <div className="loginPage"><div className="loginCard">
   <div className="loginLogo"><div className="logoMark big">A</div><h1>AbsensiKu</h1></div>
   <p className="muted centerText">Masuk ke dashboard administrator</p>
   {error&&<div className="alert">{error}</div>}
   <form onSubmit={onSubmit}>
    <label>Email</label><input type="email" required value={login.email} onChange={e=>setLogin({...login,email:e.target.value})} placeholder="admin@email.com"/>
    <label>Password</label><input type="password" required value={login.password} onChange={e=>setLogin({...login,password:e.target.value})} placeholder="••••••••"/>
    <button className="primary full">Masuk ke Dashboard</button>
   </form>
   <small className="muted">Akun dikelola melalui Supabase Authentication.</small>
 </div></div>
}

function Dashboard({members,counts,attendance,date,setDate,setPage,exportPDF}){
 const total=members.length,done=Object.values(counts).reduce((a,b)=>a+b,0);
 const percent=total?Math.round((counts.Hadir/total)*100):0;
 return <div className="content">
   <div className="welcome"><div><h2>Selamat datang, Admin 👋</h2><p>Kelola absensi dan anggota dari satu dashboard.</p></div><button className="primary" onClick={()=>setPage("attendance")}><ClipboardCheck size={18}/> Isi Absensi</button></div>
   <div className="stats">
    <Stat icon={Users} label="Total Anggota" value={total} note="Anggota terdaftar"/>
    <Stat icon={CheckCircle2} label="Hadir Hari Ini" value={counts.Hadir} note={`${percent}% dari anggota`}/>
    <Stat icon={Clock3} label="Izin / Sakit" value={counts.Izin+counts.Sakit} note="Perlu diperhatikan"/>
    <Stat icon={UserRound} label="Belum Absen" value={Math.max(total-done,0)} note="Belum ada status"/>
   </div>
   <div className="grid2">
    <div className="panel">
      <div className="panelHead"><div><h3>Ringkasan Absensi</h3><p>Statistik pada tanggal yang dipilih</p></div><input className="dateInput" type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
      <div className="donutArea"><div className="donut" style={{"--p":`${total?counts.Hadir/total*100:0}%`}}><div><b>{total?Math.round(counts.Hadir/total*100):0}%</b><small>Hadir</small></div></div>
       <div className="legend"><Legend c="green" t="Hadir" n={counts.Hadir}/><Legend c="yellow" t="Izin" n={counts.Izin}/><Legend c="blue" t="Sakit" n={counts.Sakit}/><Legend c="red" t="Alpha" n={counts.Alpha}/></div>
      </div>
    </div>
    <div className="panel"><div className="panelHead"><div><h3>Aksi Cepat</h3><p>Fitur yang sering digunakan</p></div></div>
      <div className="quick"><button onClick={()=>setPage("attendance")}><ClipboardCheck/><span><b>Isi Absensi</b><small>Catat kehadiran hari ini</small></span></button>
      <button onClick={()=>setPage("members")}><Plus/><span><b>Tambah Anggota</b><small>Daftarkan anggota baru</small></span></button>
      <button onClick={exportPDF}><Download/><span><b>Download PDF</b><small>Unduh laporan hari ini</small></span></button></div>
    </div>
   </div>
   <div className="panel"><div className="panelHead"><div><h3>Aktivitas Absensi</h3><p>{fmtDate(date)}</p></div><button className="textBtn" onClick={()=>setPage("attendance")}>Lihat semua →</button></div>
    <div className="tableWrap"><table><thead><tr><th>Anggota</th><th>ID</th><th>Status</th><th>Waktu</th></tr></thead><tbody>
     {attendance.slice(0,8).map(a=><tr key={a.id}><td><b>Anggota</b></td><td>{a.member_id.slice(0,8)}</td><td><Status value={a.status}/></td><td>{new Date(a.created_at).toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})}</td></tr>)}
     {!attendance.length&&<tr><td colSpan="4" className="empty">Belum ada absensi pada tanggal ini.</td></tr>}
    </tbody></table></div>
   </div>
 </div>
}
function Stat({icon:Icon,label,value,note}){return <div className="stat"><div className="statIcon"><Icon size={20}/></div><div><p>{label}</p><strong>{value}</strong><small>{note}</small></div></div>}
function Legend({c,t,n}){return <div className="legendRow"><i className={`dot ${c}`}/><span>{t}</span><b>{n}</b></div>}

function Attendance({members,map,date,setDate,search,setSearch,setStatus,resetStatus,exportPDF}){
 return <div className="content"><div className="pageIntro"><div><h2>Daftar Absensi</h2><p>Catat kehadiran anggota berdasarkan tanggal.</p></div><button className="primary" onClick={exportPDF}><Download size={18}/> Download PDF</button></div>
 <div className="panel"><div className="filters"><div className="search"><Search size={18}/><input placeholder="Cari nama atau ID anggota..." value={search} onChange={e=>setSearch(e.target.value)}/></div><input className="dateInput" type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
 <div className="tableWrap"><table><thead><tr><th>ID</th><th>Nama Anggota</th><th>Status</th><th>Ubah Status</th></tr></thead><tbody>{members.map(m=><tr key={m.id}><td><b>{m.member_id}</b></td><td>{m.name}<small className="sub">{m.info||"Anggota"}</small></td><td><Status value={map[m.id]?.status||"Belum"}/></td><td><div className="statusButtons"><button onClick={()=>setStatus(m.id,"Hadir")}>Hadir</button><button onClick={()=>setStatus(m.id,"Izin")}>Izin</button><button onClick={()=>setStatus(m.id,"Sakit")}>Sakit</button><button onClick={()=>setStatus(m.id,"Alpha")}>Alpha</button>{map[m.id]&&<button className="reset" onClick={()=>resetStatus(m.id)}>Reset</button>}</div></td></tr>)}{!members.length&&<tr><td colSpan="4" className="empty">Belum ada anggota.</td></tr>}</tbody></table></div></div></div>
}
function Members({members,search,setSearch,add,edit,remove}){
 return <div className="content"><div className="pageIntro"><div><h2>Data Anggota</h2><p>Kelola semua anggota yang dapat dicatat absensinya.</p></div><button className="primary" onClick={add}><Plus size={18}/> Tambah Anggota</button></div>
 <div className="panel"><div className="filters"><div className="search"><Search size={18}/><input placeholder="Cari anggota..." value={search} onChange={e=>setSearch(e.target.value)}/></div></div>
 <div className="tableWrap"><table><thead><tr><th>ID Anggota</th><th>Nama</th><th>Keterangan</th><th>Aksi</th></tr></thead><tbody>{members.map(m=><tr key={m.id}><td><b>{m.member_id}</b></td><td><div className="person"><div className="avatar">{m.name?.[0]?.toUpperCase()}</div><b>{m.name}</b></div></td><td>{m.info||"—"}</td><td><div className="actions"><button onClick={()=>edit(m)}><Pencil size={16}/></button><button className="dangerIcon" onClick={()=>remove(m.id)}><Trash2 size={16}/></button></div></td></tr>)}{!members.length&&<tr><td colSpan="4" className="empty">Belum ada anggota.</td></tr>}</tbody></table></div></div></div>
}
function Reports({members,from,to,setFrom,setTo}){
 const [rows,setRows]=useState([]),[loading,setLoading]=useState(false);
 async function load(){
  setLoading(true); const {data,error}=await supabase.from("attendance").select("*").gte("attendance_date",from).lte("attendance_date",to);
  if(error){alert(error.message);setLoading(false);return}
  const c=Object.fromEntries(members.map(m=>[m.id,{...m,Hadir:0,Izin:0,Sakit:0,Alpha:0}]));
  (data||[]).forEach(a=>{if(c[a.member_id])c[a.member_id][a.status]++}); setRows(Object.values(c));setLoading(false);
 }
 useEffect(()=>{load()},[from,to,members.length]);
 async function pdf(){
  const {jsPDF}=await import("jspdf"); const {default:autoTable}=await import("jspdf-autotable");
  const doc=new jsPDF();doc.text("Rekap Absensi Anggota",14,18);doc.setFontSize(10);doc.text(`Periode: ${fmtDate(from)} - ${fmtDate(to)}`,14,26);
  autoTable(doc,{startY:32,head:[["ID","Nama","Hadir","Izin","Sakit","Alpha"]],body:rows.map(r=>[r.member_id,r.name,r.Hadir,r.Izin,r.Sakit,r.Alpha])});doc.save(`rekap-${from}-${to}.pdf`);
 }
 return <div className="content"><div className="pageIntro"><div><h2>Laporan & Rekap</h2><p>Ringkasan absensi berdasarkan periode.</p></div><button className="primary" onClick={pdf}><Download size={18}/> Download PDF</button></div>
 <div className="panel"><div className="filters"><div><label>Dari</label><input className="dateInput" type="date" value={from} onChange={e=>setFrom(e.target.value)}/></div><div><label>Sampai</label><input className="dateInput" type="date" value={to} onChange={e=>setTo(e.target.value)}/></div></div>
 <div className="tableWrap"><table><thead><tr><th>ID</th><th>Nama</th><th>Hadir</th><th>Izin</th><th>Sakit</th><th>Alpha</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.member_id}</td><td><b>{r.name}</b></td><td className="num">{r.Hadir}</td><td className="num">{r.Izin}</td><td className="num">{r.Sakit}</td><td className="num">{r.Alpha}</td></tr>)}</tbody></table>{loading&&<div className="loadingText">Memuat laporan...</div>}</div></div></div>
}
function SettingsPage({email}){return <div className="content"><div className="pageIntro"><div><h2>Pengaturan</h2><p>Informasi akun administrator.</p></div></div><div className="panel settingsPanel"><div className="setting"><ShieldCheck/><div><b>Akun Admin</b><p>{email}</p></div></div><div className="setting"><FileText/><div><b>Database</b><p>Supabase + Row Level Security (RLS)</p></div></div><div className="setting"><Download/><div><b>Hosting</b><p>Siap dideploy ke Vercel</p></div></div></div></div>}
function MemberModal({title,initial,onClose,onSave}){
 const [f,setF]=useState({member_id:initial?.member_id||"",name:initial?.name||"",info:initial?.info||""});
 return <div className="modalBack"><div className="modal"><div className="modalHead"><h3>{title}</h3><button onClick={onClose}><X/></button></div><label>ID Anggota</label><input value={f.member_id} onChange={e=>setF({...f,member_id:e.target.value})}/><label>Nama Lengkap</label><input value={f.name} onChange={e=>setF({...f,name:e.target.value})}/><label>Keterangan / Divisi</label><input value={f.info} onChange={e=>setF({...f,info:e.target.value})}/><div className="modalActions"><button onClick={onClose}>Batal</button><button className="primary" onClick={()=>onSave(f)}>Simpan</button></div></div></div>
}
