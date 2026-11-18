// Rótulos legíveis para chaves de efeito (estatísticas, grupos, setores).
import { STAT_INFO, GROUPS, SECTORS } from '../sim/constants.js';
const EXTRA = { exportAccess: 'acesso a mercados', importAccess: 'capacidade de importar', revenue: 'receita (% PIB)', housing: 'habitação', crime: 'criminalidade', congestion: 'congestionamento', creditLimit: 'limite de crédito', laborSupply: 'mão de obra', emigration: 'emigração', propaganda: 'propaganda', repression: 'repressão', birth: 'natalidade', sanctionShield: 'proteção a sanções', aid: 'ajuda externa' };
export function effLabel(k) {
  if (k.startsWith('g_')) return 'apoio de ' + (GROUPS[k.slice(2)]?.name || k.slice(2)).toLowerCase();
  if (k.startsWith('s_')) return 'produção de ' + (SECTORS[k.slice(2)]?.name || k.slice(2)).toLowerCase();
  return (STAT_INFO[k]?.[0] || EXTRA[k] || k).toLowerCase();
}
export const effList = (m, fmt) => Object.entries(m).map(([k, v]) => `${effLabel(k)} ${fmt(v)}`).join(', ');
