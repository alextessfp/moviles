import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { ArrowDownToLine, ArrowLeft, ArrowRight, BusFront, CalendarDays, Check, ChevronDown, CircleHelp, Clock3, Download, LayoutDashboard, LogOut, Menu, MessageCircle, Search, Settings2, ShieldCheck, Users, X } from 'lucide-react-native';
import styles from './src/styles';

const initialStaff = [
  { id: '1', name: 'María Fernanda López', role: 'Coordinación de rutas', initials: 'ML', color: '#e9ddf7', status: 'presente', time: '08:02', department: 'Operaciones' },
  { id: '2', name: 'Jorge Alberto Ruiz', role: 'Recursos humanos', initials: 'JR', color: '#ddd0ef', status: 'presente', time: '08:11', department: 'Administración' },
  { id: '3', name: 'Sofía Herrera Cruz', role: 'Control de unidades', initials: 'SH', color: '#d2c0e8', status: 'retardo', time: '08:36', department: 'Operaciones' },
  { id: '4', name: 'Carlos Mendoza Pérez', role: 'Contabilidad', initials: 'CM', color: '#e3d8f0', status: 'presente', time: '07:54', department: 'Finanzas' },
  { id: '5', name: 'Valentina Torres Díaz', role: 'Atención al personal', initials: 'VT', color: '#eee5f6', status: 'pendiente', time: '—', department: 'Administración' },
  { id: '6', name: 'Diego Ramírez Soto', role: 'Planeación de servicio', initials: 'DR', color: '#ded1ee', status: 'presente', time: '08:05', department: 'Operaciones' },
];
const colors = { ink: '#241b2f', muted: '#81758f', line: '#e9e2ef', paper: '#fbf9fd', green: '#603a8b', lime: '#e9d9ff', pale: '#f1e9f8', orange: '#8958b3', red: '#79519e', white: '#ffffff' };
const API_URL = process.env.EXPO_PUBLIC_API_URL || '';
const api = async (path, options = {}) => {
  const response = await fetch(`${API_URL}/api/${path}`, { headers: { 'Content-Type': 'application/json', ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}) }, ...options, body: options.body ? JSON.stringify(options.body) : undefined });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'No fue posible conectar con el servidor.');
  return payload;
};
const todayLabel = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
const todayISO = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' }).format(new Date());

function IconButton({ icon: Icon, onPress, label, style }) { return <Pressable accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.iconButton, style, pressed && { opacity: .7 }]}><Icon size={18} color={colors.ink} /></Pressable>; }
function StatusPill({ status }) {
  const value = { presente: ['●  A tiempo', '#f1e9f8', '#603a8b'], retardo: ['●  Retardo', '#f4ecfa', '#8250b0'], pendiente: ['●  Sin registro', '#f0edf2', '#77717e'], salida: ['●  Salida', '#eee5f6', '#68458b'], permiso: ['●  Permiso', '#eee5f6', '#68458b'] }[status] || ['●  Sin registro', '#f0edf2', '#77717e'];
  return <View style={[styles.pill, { backgroundColor: value[1] }]}><Text style={[styles.pillText, { color: value[2] }]}>{value[0]}</Text></View>;
}
function StatCard({ label, value, note, icon: Icon, tint }) { return <View style={styles.statCard}><View style={[styles.statIcon, { backgroundColor: tint }]}><Icon size={18} color={colors.green} /></View><Text style={styles.statLabel}>{label}</Text><Text style={styles.statValue}>{value}</Text><Text style={styles.statNote}>{note}</Text></View>; }

export default function App() {
  const { width } = useWindowDimensions();
  const compact = width < 760;
  const [staff, setStaff] = useState(initialStaff);
  const [filter, setFilter] = useState('Todos');
  const [search, setSearch] = useState('');
  const [nav, setNav] = useState('Resumen');
  const [menu, setMenu] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showNew, setShowNew] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const isAdmin = user?.role === 'admin';
  const isWorker = user?.role === 'worker';
  const present = staff.filter(person => person.status === 'presente').length;
  const late = staff.filter(person => person.status === 'retardo').length;
  const absent = staff.filter(person => person.status === 'pendiente').length;
  const filtered = useMemo(() => staff.filter(person => (filter === 'Todos' || (filter === 'Presentes' && person.status === 'presente') || (filter === 'Retardos' && person.status === 'retardo') || (filter === 'Pendientes' && person.status === 'pendiente')) && `${person.name} ${person.role} ${person.department}`.toLowerCase().includes(search.toLowerCase())), [staff, filter, search]);
  const dateCaption = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).format(selectedDate);

  useEffect(() => { let active = true; api(`attendance?date=${todayISO}`).then(data => { if (active && Array.isArray(data.records)) { setStaff(data.records); setConnected(true); } }).catch(() => {}).finally(() => active && setLoading(false)); return () => { active = false; }; }, []);
  const notify = text => { setMessage(text); setTimeout(() => setMessage(''), 3400); };
  const openWhatsApp = async () => {
    const message = encodeURIComponent('Hola, necesito ayuda con Rodalia Asistencia.');
    try { await Linking.openURL(`https://wa.me/?text=${message}`); }
    catch { notify('No fue posible abrir WhatsApp en este dispositivo.'); }
  };
  const login = async () => {
    setLoginBusy(true);
    try { const session = await api('auth/login', { method: 'POST', body: { email: loginEmail, password: loginPassword } }); const data = await api(`attendance?date=${todayISO}`, { token: session.token }); setToken(session.token); setUser(session.user); setStaff(data.records); if (session.user.role === 'worker') setNav('Mi asistencia'); else setNav('Resumen'); setConnected(true); setShowLogin(false); setLoginPassword(''); notify(`Sesión iniciada como ${session.user.role === 'admin' ? 'administrador' : 'trabajador'}`); }
    catch (error) { notify(error.message); }
    finally { setLoginBusy(false); }
  };
  const logout = () => { setToken(''); setUser(null); setConnected(false); setStaff(initialStaff); setShowLogin(true); notify('Sesión cerrada'); };
  const mark = async (person) => {
    const isIn = person.status === 'pendiente';
    if (connected) { try { const data = await api(`attendance/${isIn ? 'check-in' : 'check-out'}`, { method: 'POST', token, body: { employeeId: person.id } }); setStaff(rows => rows.map(row => row.id === person.id ? { ...row, ...data.record, status: isIn ? data.record.status : 'salida' } : row)); } catch (error) { notify(error.message); } return; }
    setStaff(rows => rows.map(row => row.id === person.id ? { ...row, status: isIn ? 'presente' : 'salida', time: isIn ? new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()) : row.time } : row));
    notify(isIn ? `Entrada registrada: ${person.name}` : `Se registró la salida de ${person.name}`);
  };
  const addPerson = async () => { if (!newName.trim() || !newEmail.trim() || newPassword.length < 8) { notify('Completa nombre, correo y una contraseña de al menos 8 caracteres.'); return; } const names = newName.trim().split(/\s+/); const initials = names.slice(0, 2).map(item => item[0]).join('').toUpperCase(); const person = { id: String(Date.now()), name: newName.trim(), role: newRole.trim() || 'Personal administrativo', initials, color: '#e5d9f4', status: 'pendiente', time: '—', department: 'Administración' }; if (connected) { try { const data = await api('employees', { method: 'POST', token, body: { name: person.name, role: person.role, department: person.department, email: newEmail.trim(), password: newPassword } }); person.id = String(data.employee.id); } catch (error) { notify(error.message); return; } } else { notify('Inicia sesión como administrador para crear cuentas de trabajador.'); return; } setStaff(rows => [...rows, person]); setNewName(''); setNewRole(''); setNewEmail(''); setNewPassword(''); setShowNew(false); notify('Trabajador y cuenta de acceso creados.'); };
  const exportCsv = () => { const csv = ['Nombre,Puesto,Departamento,Estado,Hora', ...filtered.map(p => [p.name,p.role,p.department,p.status,p.time].map(v => `"${v}"`).join(','))].join('\n'); const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `asistencia-${new Date().toISOString().slice(0,10)}.csv`; link.click(); URL.revokeObjectURL(url); };

  const navItems = isWorker ? [['Mi asistencia', LayoutDashboard]] : [['Resumen', LayoutDashboard], ['Personal', Users], ['Reportes', ArrowDownToLine]];
  return <View style={styles.app}>
    <StatusBar barStyle="dark-content" backgroundColor="#fbf9fd" />
    {!compact && <View style={styles.sidebar}>
      <View style={styles.brand}><View style={styles.brandMark}><BusFront size={21} color={colors.lime} /></View><View><Text style={styles.brandName}>rodalia</Text><Text style={styles.brandCaption}>CONTROL DE PERSONAL</Text></View></View>
      <Text style={styles.sideLabel}>MENÚ PRINCIPAL</Text>
      {navItems.map(([label, Icon]) => <Pressable key={label} onPress={() => setNav(label)} style={[styles.navItem, nav === label && styles.navActive]}><Icon size={18} color={nav === label ? colors.green : colors.muted} /><Text style={[styles.navText, nav === label && styles.navActiveText]}>{label}</Text>{label === 'Personal' && <Text style={styles.navCount}>{staff.length}</Text>}</Pressable>)}
      <View style={styles.sideBottom}><View style={styles.helpBox}><CircleHelp size={17} color={colors.green}/><Text style={styles.helpTitle}>¿Necesitas ayuda?</Text><Text style={styles.helpText}>Consulta la guía de uso del sistema.</Text><Pressable onPress={() => notify('La guía de uso estará disponible próximamente.')}><Text style={styles.helpLink}>Ver guía <ArrowRight size={13}/></Text></Pressable></View><Pressable onPress={connected ? logout : () => setShowLogin(true)} style={styles.profile}><View style={styles.avatar}><Text style={styles.avatarText}>{(user?.name || 'AC').split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase()}</Text></View><View style={{ flex: 1 }}><Text style={styles.profileName}>{user?.name || 'Andrea Castillo'}</Text><Text style={styles.profileRole}>{isAdmin ? 'Administradora' : isWorker ? 'Trabajador' : 'Vista de demostración'}</Text></View>{connected ? <LogOut size={15} color={colors.muted}/> : <ChevronDown size={16} color={colors.muted}/>}</Pressable></View>
    </View>}
    <View style={styles.main}>
      <View style={styles.topbar}>{compact ? <><Pressable onPress={() => setMenu(v => !v)} style={styles.brandMobile}><View style={styles.brandMark}><BusFront size={20} color={colors.lime}/></View><Text style={styles.brandName}>rodalia</Text></Pressable><View style={{ flexDirection: 'row', gap: 9 }}>{connected ? <Pressable onPress={logout} style={styles.loginChip}><Text style={styles.loginChipText}>Salir</Text></Pressable> : <Pressable onPress={() => setShowLogin(true)} style={styles.loginChip}><Text style={styles.loginChipText}>Iniciar sesión</Text></Pressable>}<IconButton icon={Menu} label="Menú" onPress={() => setMenu(v => !v)} /></View></> : <><View><Text style={styles.breadcrumb}>{isWorker ? 'Mi cuenta' : 'Administración'} <Text style={{ color: '#c6c9c1' }}>/</Text> {nav}</Text><Text style={styles.pageTitle}>{nav === 'Resumen' ? 'Resumen de asistencia' : nav}</Text></View><View style={styles.topRight}><Pressable onPress={() => !connected && setShowLogin(true)} style={styles.connectionStatus}><View style={[styles.connectionDot, { backgroundColor: connected ? '#603a8b' : '#a68abf' }]} /><Text style={styles.syncText}>{connected ? 'Sincronizado' : 'Conectar base de datos'}</Text></Pressable><IconButton icon={connected ? LogOut : Settings2} label={connected ? 'Cerrar sesión' : 'Configuración'} onPress={connected ? logout : () => notify('Configuración disponible próximamente')} /><View style={styles.avatar}><Text style={styles.avatarText}>{(user?.name || 'AC').split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase()}</Text></View></View></>}</View>
      {compact && menu && <View style={styles.mobileMenu}>{navItems.map(([label, Icon]) => <Pressable key={label} onPress={() => { setNav(label); setMenu(false); }} style={styles.mobileNavItem}><Icon size={17} color={colors.green}/><Text style={styles.navText}>{label}</Text></Pressable>)}</View>}
      <ScrollView contentContainerStyle={[styles.content, compact && styles.contentCompact]} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeRow}><View><Text style={styles.eyebrow}>{todayLabel.toUpperCase()}</Text><Text style={styles.welcomeTitle}>Buen día, {user?.name?.split(' ')[0] || 'Andrea'} <Text style={{ color: colors.orange }}>✳</Text></Text><Text style={styles.subhead}>{isWorker ? 'Consulta y registra tu asistencia de hoy.' : 'Este es el resumen de tu equipo para hoy.'}</Text></View><View style={styles.datePicker}><CalendarDays size={16} color={colors.green}/><Text style={styles.dateText}>{dateCaption}</Text><ChevronDown size={14} color={colors.muted}/></View></View>
        {!connected && <Pressable onPress={() => setShowLogin(true)} style={styles.demoBanner}><ShieldCheck size={15} color={colors.orange}/><Text style={styles.demoText}>Vista de demostración · Inicia sesión para consultar y guardar los datos de tu empresa.</Text><Text style={styles.demoLink}>Conectar</Text></Pressable>}
        <View style={styles.stats}>{[["Personal activo", String(staff.length).padStart(2, '0'), 'En plantilla', Users, '#f1e9f8'], ['A tiempo', String(present).padStart(2, '0'), `${staff.length ? Math.round(present / staff.length * 100) : 0}% de asistencia`, Check, '#eee5f6'], ['Con retardo', String(late).padStart(2, '0'), 'Después de las 8:15', Clock3, '#f4ecfa'], ['Sin registro', String(absent).padStart(2, '0'), 'Jornada pendiente', X, '#f4f0f6']].map(item => <StatCard key={item[0]} label={item[0]} value={loading ? '—' : item[1]} note={item[2]} icon={item[3]} tint={item[4]}/> )}</View>
        <View style={styles.panel}>
          <View style={[styles.panelHead, compact && styles.panelHeadCompact]}><View><Text style={styles.panelTitle}>{isWorker ? 'Mi registro de asistencia' : 'Registro de asistencia'}</Text><Text style={styles.panelSubtitle}>{isWorker ? 'Tu entrada y salida para la jornada de hoy.' : 'Revisa y gestiona las entradas de tu equipo.'}</Text></View>{isAdmin && <View style={styles.headActions}><Pressable onPress={exportCsv} style={[styles.secondaryButton, compact && styles.compactButton]}><Download size={15} color={colors.ink}/><Text style={styles.buttonLabel}>Exportar</Text></Pressable><Pressable onPress={() => setShowNew(true)} style={[styles.primaryButton, compact && styles.compactButton]}><Text style={styles.primaryPlus}>＋</Text><Text style={styles.primaryLabel}>Agregar personal</Text></Pressable></View>}</View>
          {!isWorker && <View style={[styles.toolbar, compact && styles.toolbarCompact]}><View style={styles.filters}>{['Todos', 'Presentes', 'Retardos', 'Pendientes'].map(label => <Pressable key={label} onPress={() => setFilter(label)} style={[styles.filterTab, filter === label && styles.filterSelected]}><Text style={[styles.filterText, filter === label && styles.filterTextSelected]}>{label}{label === 'Todos' ? ` (${staff.length})` : label === 'Presentes' ? ` (${present})` : label === 'Retardos' ? ` (${late})` : ` (${absent})`}</Text></Pressable>)}</View><View style={styles.searchBox}><Search size={15} color={colors.muted}/><TextInput value={search} onChangeText={setSearch} placeholder="Buscar persona..." placeholderTextColor="#a4a89e" style={styles.searchInput}/><Text style={styles.shortcut}>⌘ K</Text></View></View>}
          {!compact && <View style={styles.tableHeader}><Text style={[styles.th, { flex: 2.5 }]}>COLABORADOR</Text><Text style={[styles.th, { flex: 1.45 }]}>DEPARTAMENTO</Text><Text style={[styles.th, { flex: 1.05 }]}>HORA DE ENTRADA</Text><Text style={[styles.th, { flex: 1.15 }]}>ESTADO</Text><Text style={[styles.th, { width: 134, textAlign: 'right' }]}>ACCIÓN</Text></View>}
          {loading ? <View style={styles.empty}><ActivityIndicator color={colors.green}/><Text style={styles.emptyText}>Cargando registros...</Text></View> : filtered.length === 0 ? <View style={styles.empty}><Text style={styles.emptyText}>No encontramos personal con ese criterio.</Text></View> : filtered.map(person => <View key={person.id} style={[styles.personRow, compact && styles.personRowCompact]}><View style={styles.personIdentity}><View style={[styles.personAvatar, { backgroundColor: person.color || '#e5d9f4' }]}><Text style={styles.personInitial}>{person.initials || person.name.split(' ').slice(0,2).map(n=>n[0]).join('')}</Text></View><View style={{ flex: 1 }}><Text style={styles.personName} numberOfLines={1}>{person.name}</Text><Text style={styles.personRole}>{person.role}</Text></View></View>{!compact && <Text style={[styles.cell, { flex: 1.45 }]}>{person.department || 'Administración'}</Text>}<View style={[styles.timeCell, compact && { marginLeft: 52 }]}><Clock3 size={13} color={colors.muted}/><Text style={styles.cell}>{person.time}</Text></View><View style={compact ? { marginLeft: 52, marginTop: 7 } : { flex: 1.15 }}><StatusPill status={person.status}/></View><View style={[styles.rowAction, compact && { marginLeft: 52, marginTop: 11, justifyContent: 'flex-start' }]}>{person.status === 'pendiente' ? <Pressable onPress={() => mark(person)} style={styles.checkInButton}><Check size={14} color={colors.green}/><Text style={styles.checkInText}>Registrar entrada</Text></Pressable> : person.status === 'salida' ? <Text style={styles.personRole}>Jornada cerrada</Text> : <Pressable onPress={() => mark(person)} style={styles.moreButton}><Text style={styles.moreText}>Registrar salida</Text></Pressable>}<Pressable accessibilityLabel="Ver detalles" onPress={() => notify(`${person.name} · ${person.role}`)} style={styles.dots}><Text style={styles.dotsText}>···</Text></Pressable></View></View>)}
          <View style={[styles.panelFooter, compact && { paddingHorizontal: 16 }]}><Text style={styles.footerInfo}>Mostrando <Text style={styles.footerStrong}>{filtered.length ? 1 : 0}–{filtered.length}</Text> de <Text style={styles.footerStrong}>{staff.length}</Text> colaboradores</Text><View style={styles.pagination}><Pressable style={styles.pageArrow} onPress={() => notify('Estás en la primera página')}><ArrowLeft size={15} color="#92978e"/></Pressable><View style={styles.pageNumber}><Text style={styles.pageNumberText}>1</Text></View><Pressable style={styles.pageArrow} onPress={() => notify('Estás en la última página')}><ArrowRight size={15} color="#92978e"/></Pressable></View></View>
        </View>
        <View style={styles.bottomNote}><ShieldCheck size={14} color={colors.muted}/><Text style={styles.noteText}>Tu información de personal está protegida y se actualiza de forma segura.</Text><Text style={styles.version}>RODALIA · V1.0</Text></View>
      </ScrollView>
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel="Abrir WhatsApp" onPress={openWhatsApp} style={({ pressed }) => [styles.whatsappButton, pressed && { opacity: .82, transform: [{ scale: .97 }] }]}><MessageCircle size={20} color="#fff"/><Text style={styles.whatsappLabel}>WhatsApp</Text></Pressable>
    {!!message && <View style={styles.toast}><Check size={16} color={colors.lime}/><Text style={styles.toastText}>{message}</Text></View>}
    {showLogin && <View style={styles.modalShade}><View style={styles.modal}><View style={styles.modalHead}><View><Text style={styles.modalTitle}>Iniciar sesión</Text><Text style={styles.modalSub}>Usa tu cuenta de administrador o trabajador.</Text></View><IconButton icon={X} label="Cerrar" onPress={() => setShowLogin(false)}/></View><Text style={styles.inputLabel}>CORREO ELECTRÓNICO</Text><TextInput style={styles.modalInput} value={loginEmail} onChangeText={setLoginEmail} placeholder="nombre@empresa.mx" placeholderTextColor="#a4a89e" autoCapitalize="none" keyboardType="email-address"/><Text style={styles.inputLabel}>CONTRASEÑA</Text><TextInput style={styles.modalInput} value={loginPassword} onChangeText={setLoginPassword} placeholder="Tu contraseña" placeholderTextColor="#a4a89e" secureTextEntry onSubmitEditing={login}/><View style={styles.modalActions}><Pressable onPress={() => setShowLogin(false)} style={styles.cancelButton}><Text style={styles.cancelLabel}>Cancelar</Text></Pressable><Pressable onPress={login} disabled={loginBusy} style={styles.primaryButton}>{loginBusy ? <ActivityIndicator size="small" color="#fff"/> : <Text style={styles.primaryLabel}>Iniciar sesión</Text>}</Pressable></View></View></View>}
    {showNew && <View style={styles.modalShade}><View style={styles.modal}><View style={styles.modalHead}><View><Text style={styles.modalTitle}>Agregar trabajador</Text><Text style={styles.modalSub}>Se creará su cuenta para registrar asistencia.</Text></View><IconButton icon={X} label="Cerrar" onPress={() => setShowNew(false)}/></View><Text style={styles.inputLabel}>NOMBRE COMPLETO</Text><TextInput style={styles.modalInput} value={newName} onChangeText={setNewName} placeholder="Ej. Ana García López" placeholderTextColor="#a4a89e"/><Text style={styles.inputLabel}>PUESTO</Text><TextInput style={styles.modalInput} value={newRole} onChangeText={setNewRole} placeholder="Ej. Asistente administrativa" placeholderTextColor="#a4a89e"/><Text style={styles.inputLabel}>CORREO PARA INICIAR SESIÓN</Text><TextInput style={styles.modalInput} value={newEmail} onChangeText={setNewEmail} placeholder="ana@empresa.mx" placeholderTextColor="#a4a89e" autoCapitalize="none" keyboardType="email-address"/><Text style={styles.inputLabel}>CONTRASEÑA INICIAL (MÍNIMO 8 CARACTERES)</Text><TextInput style={styles.modalInput} value={newPassword} onChangeText={setNewPassword} placeholder="Contraseña temporal" placeholderTextColor="#a4a89e" secureTextEntry/><View style={styles.modalActions}><Pressable onPress={() => setShowNew(false)} style={styles.cancelButton}><Text style={styles.cancelLabel}>Cancelar</Text></Pressable><Pressable onPress={addPerson} style={styles.primaryButton}><Text style={styles.primaryLabel}>Crear cuenta</Text></Pressable></View></View></View>}
  </View>;
}

