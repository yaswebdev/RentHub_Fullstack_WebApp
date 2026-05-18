import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  LayoutDashboard, Users, Home, Calendar, MessageSquare,
  TrendingUp, ChevronLeft, ChevronRight, Trash2, Eye,
  Shield, UserCheck, AlertCircle, CheckCircle, XCircle, Search
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { cn, formatDate } from '../lib/utils';
import {
  fetchAdminStats, fetchAdminUsers, deleteAdminUser,
  fetchAdminAnnonces, fetchAdminReservations
} from '../api/adminAPI';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const SECTIONS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'users', label: 'Utilisateurs', icon: Users },
  { key: 'listings', label: 'Annonces', icon: Home },
  { key: 'reservations', label: 'Réservations', icon: Calendar },
];

const ROLE_BADGE = {
  ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  HOTE: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  LOCATAIRE: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
};

const STATUS_BADGE = {
  EN_ATTENTE: 'bg-amber-100 text-amber-700',
  CONFIRMEE: 'bg-green-100 text-green-700',
  PAYEE: 'bg-blue-100 text-blue-700',
  ANNULEE: 'bg-red-100 text-red-700',
  REFUSEE: 'bg-slate-100 text-slate-700',
  TERMINEE: 'bg-slate-100 text-slate-600',
  ACTIVE: 'bg-green-100 text-green-700',
  DRAFT: 'bg-amber-100 text-amber-700',
  PAUSED: 'bg-slate-100 text-slate-600',
};

const PIE_COLORS = ['#6366f1', '#f59e0b', '#06b6d4'];

export const AdminPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [section, setSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Data
  const [stats, setStats] = useState(null);
  const [usersPage, setUsersPage] = useState(null);
  const [usersPageNum, setUsersPageNum] = useState(0);
  const [userSearch, setUserSearch] = useState('');
  const [annoncesPage, setAnnoncesPage] = useState(null);
  const [annoncesPageNum, setAnnoncesPageNum] = useState(0);
  const [reservationsPage, setReservationsPage] = useState(null);
  const [reservationsPageNum, setReservationsPageNum] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadStats = useCallback(async () => {
    try { setStats(await fetchAdminStats()); } catch { /* handled by interceptor */ }
  }, []);

  const loadUsers = useCallback(async (page = 0) => {
    setLoading(true);
    try { setUsersPage(await fetchAdminUsers(page, 15)); setUsersPageNum(page); } catch {} finally { setLoading(false); }
  }, []);

  const loadAnnonces = useCallback(async (page = 0) => {
    setLoading(true);
    try { setAnnoncesPage(await fetchAdminAnnonces(page, 12)); setAnnoncesPageNum(page); } catch {} finally { setLoading(false); }
  }, []);

  const loadReservations = useCallback(async (page = 0) => {
    setLoading(true);
    try { setReservationsPage(await fetchAdminReservations(page, 15)); setReservationsPageNum(page); } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { if (section === 'users') loadUsers(0); }, [section]);
  useEffect(() => { if (section === 'listings') loadAnnonces(0); }, [section]);
  useEffect(() => { if (section === 'reservations') loadReservations(0); }, [section]);

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Supprimer cet utilisateur définitivement ?')) return;
    setDeletingId(id);
    try {
      await deleteAdminUser(id);
      toast('Utilisateur supprimé', 'success');
      loadUsers(usersPageNum);
      loadStats();
    } catch (e) {
      toast(e?.response?.data?.message || 'Erreur de suppression', 'error');
    } finally { setDeletingId(null); }
  };

  const filteredUsers = usersPage?.content?.filter(u =>
    !userSearch || u.nom?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase())
  ) || [];

  const roleData = stats ? [
    { name: 'Hôtes', value: stats.totalHosts || 0 },
    { name: 'Locataires', value: stats.totalTenants || 0 },
    { name: 'Admins', value: Math.max(0, (stats.totalUsers || 0) - (stats.totalHosts || 0) - (stats.totalTenants || 0)) },
  ] : [];

  const statCards = stats ? [
    { title: 'Utilisateurs', value: stats.totalUsers, gradient: 'from-primary-500 to-violet-500', icon: Users },
    { title: 'Annonces', value: stats.totalAnnonces, gradient: 'from-emerald-500 to-green-500', icon: Home },
    { title: 'Actives', value: stats.activeListings, gradient: 'from-sky-500 to-blue-500', icon: CheckCircle },
    { title: 'Réservations', value: stats.totalReservations, gradient: 'from-amber-500 to-orange-500', icon: Calendar },
    { title: 'En attente', value: stats.pendingReservations, gradient: 'from-rose-500 to-red-500', icon: AlertCircle },
    { title: 'Messages', value: stats.totalMessages, gradient: 'from-teal-500 to-cyan-500', icon: MessageSquare },
  ] : [];

  const Pagination = ({ page, onPage }) => {
    if (!page || page.totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between mt-6 px-1">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Page {page.number + 1} / {page.totalPages} — {page.totalElements} résultats
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={page.first} onClick={() => onPage(page.number - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" disabled={page.last} onClick={() => onPage(page.number + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="pt-20 min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="flex">
        {/* ── Sidebar ──────────────────────────────── */}
        <aside className={cn(
          'sticky top-20 h-[calc(100vh-5rem)] border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 flex flex-col shrink-0 z-20',
          sidebarOpen ? 'w-56' : 'w-16'
        )}>
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {sidebarOpen && <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Admin</span>}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
              {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
          <nav className="flex-1 p-2 space-y-1">
            {SECTIONS.map(s => (
              <button
                key={s.key}
                onClick={() => setSection(s.key)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  section === s.key
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                <s.icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span>{s.label}</span>}
              </button>
            ))}
          </nav>
          {sidebarOpen && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-red-500" />
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{user?.displayName}</span>
              </div>
            </div>
          )}
        </aside>

        {/* ── Main Content ─────────────────────────── */}
        <main className="flex-1 p-6 lg:p-8 overflow-x-hidden">
          {/* DASHBOARD */}
          {section === 'dashboard' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-1">Tableau de bord Admin</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Vue d'ensemble de la plateforme RentHub</p>

              {!stats ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {[...Array(6)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-white dark:bg-slate-900 animate-pulse" />)}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {statCards.map((s, i) => (
                      <Card key={i} className="relative overflow-hidden border-none bg-white/80 dark:bg-slate-900/80 backdrop-blur shadow-sm">
                        <div className={cn('absolute -right-10 -top-10 h-24 w-24 rounded-full opacity-20 bg-gradient-to-br', s.gradient)} />
                        <CardContent className="p-5 relative">
                          <div className={cn('inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br text-white mb-3 mt-1 shadow-sm', s.gradient)}>
                            <s.icon className="h-5 w-5" />
                          </div>
                          <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold mb-1">{s.title}</p>
                          <p className="text-2xl font-black text-slate-900 dark:text-white">{s.value?.toLocaleString('fr-MA')}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <Card className="lg:col-span-2 shadow-sm border-none dark:bg-slate-900">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg dark:text-white flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-primary-500" /> Revenus totaux
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                          {(stats.totalRevenue || 0).toLocaleString('fr-MA')} <span className="text-lg font-normal text-slate-500">DH</span>
                        </p>
                        <p className="text-xs text-slate-400">Somme de tous les paiements confirmés</p>
                      </CardContent>
                    </Card>

                    <Card className="shadow-sm border-none dark:bg-slate-900">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg dark:text-white">Répartition des rôles</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col items-center">
                        <ResponsiveContainer width="100%" height={160}>
                          <PieChart>
                            <Pie data={roleData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={5} dataKey="value">
                              {roleData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex gap-4 mt-2">
                          {roleData.map((d, i) => (
                            <span key={i} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                              {d.name} ({d.value})
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* USERS */}
          {section === 'users' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-1">Gestion des utilisateurs</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{usersPage?.totalElements || 0} utilisateurs inscrits</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 w-56"
                  />
                </div>
              </div>

              {loading && !usersPage ? (
                <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-white dark:bg-slate-900 animate-pulse" />)}</div>
              ) : (
                <Card className="border-none shadow-sm dark:bg-slate-900 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800">
                          <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-slate-400 font-bold">Utilisateur</th>
                          <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-slate-400 font-bold">Email</th>
                          <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-slate-400 font-bold">Rôle</th>
                          <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-slate-400 font-bold">Inscrit le</th>
                          <th className="text-right px-5 py-3 text-[11px] uppercase tracking-wider text-slate-400 font-bold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map(u => (
                          <tr key={u.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={u.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.nom || 'U')}&background=6366f1&color=fff&size=40`}
                                  alt={u.nom}
                                  className="h-9 w-9 rounded-xl object-cover"
                                />
                                <span className="font-semibold text-slate-900 dark:text-white">{u.nom}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{u.email}</td>
                            <td className="px-5 py-3">
                              <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-bold uppercase', ROLE_BADGE[u.role] || 'bg-slate-100 text-slate-600')}>
                                {u.role}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-slate-500 dark:text-slate-400 text-xs">{formatDate(u.createdAt)}</td>
                            <td className="px-5 py-3 text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                                isLoading={deletingId === u.id}
                                onClick={() => handleDeleteUser(u.id)}
                                disabled={u.role === 'ADMIN'}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                          <tr><td colSpan={5} className="text-center py-12 text-slate-400">Aucun utilisateur trouvé</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-5 pb-4">
                    <Pagination page={usersPage} onPage={loadUsers} />
                  </div>
                </Card>
              )}
            </motion.div>
          )}

          {/* LISTINGS */}
          {section === 'listings' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-1">Toutes les annonces</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{annoncesPage?.totalElements || 0} annonces sur la plateforme</p>

              {loading && !annoncesPage ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => <div key={i} className="h-52 rounded-2xl bg-white dark:bg-slate-900 animate-pulse" />)}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(annoncesPage?.content || []).map(a => (
                      <Card key={a.id} className="overflow-hidden group dark:bg-slate-900 border-none shadow-sm">
                        <div className="relative h-36 overflow-hidden bg-slate-200 dark:bg-slate-800">
                          {a.photoUrls?.[0] ? (
                            <img src={a.photoUrls[0]} alt={a.titre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400"><Home className="h-10 w-10" /></div>
                          )}
                          <span className={cn('absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase', STATUS_BADGE[a.statut] || 'bg-slate-100 text-slate-600')}>
                            {a.statut || 'N/A'}
                          </span>
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1 line-clamp-1">{a.titre}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 line-clamp-1">{a.adresse}</p>
                          <div className="flex items-center justify-between mt-3">
                            <p className="font-bold text-sm text-slate-900 dark:text-white">{a.prixNuit} DH<span className="text-[10px] font-normal text-slate-400">/nuit</span></p>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400">par {a.userName || 'Hôte'}</span>
                              <Link to={`/property/${a.id}`}>
                                <Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                  <Pagination page={annoncesPage} onPage={loadAnnonces} />
                </>
              )}
            </motion.div>
          )}

          {/* RESERVATIONS */}
          {section === 'reservations' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-1">Toutes les réservations</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{reservationsPage?.totalElements || 0} réservations</p>

              {loading && !reservationsPage ? (
                <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-white dark:bg-slate-900 animate-pulse" />)}</div>
              ) : (
                <Card className="border-none shadow-sm dark:bg-slate-900 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800">
                          <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-slate-400 font-bold">ID</th>
                          <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-slate-400 font-bold">Locataire</th>
                          <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-slate-400 font-bold">Annonce</th>
                          <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-slate-400 font-bold">Dates</th>
                          <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-slate-400 font-bold">Montant</th>
                          <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-slate-400 font-bold">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(reservationsPage?.content || []).map(r => (
                          <tr key={r.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-5 py-3 font-mono text-xs text-slate-400">#{r.id}</td>
                            <td className="px-5 py-3 font-semibold text-slate-900 dark:text-white">{r.locataireNom}</td>
                            <td className="px-5 py-3 text-slate-500 dark:text-slate-400 max-w-[200px] truncate">{r.annonceTitre}</td>
                            <td className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400">
                              {formatDate(r.dateDebut)} → {formatDate(r.dateFin)}
                            </td>
                            <td className="px-5 py-3 font-bold text-slate-900 dark:text-white">{Number(r.montant || 0).toLocaleString('fr-MA')} DH</td>
                            <td className="px-5 py-3">
                              <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-bold uppercase', STATUS_BADGE[r.statut] || 'bg-slate-100 text-slate-600')}>
                                {r.statut}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {(!reservationsPage?.content?.length) && (
                          <tr><td colSpan={6} className="text-center py-12 text-slate-400">Aucune réservation</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-5 pb-4">
                    <Pagination page={reservationsPage} onPage={loadReservations} />
                  </div>
                </Card>
              )}
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
};
