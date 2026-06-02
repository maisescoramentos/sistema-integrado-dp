// Vercel Function — proxy para API da Solides
// Evita bloqueio de CORS ao chamar a API diretamente do browser
// Arquivo: /api/solides.js (na raiz do projeto, não dentro de src/)

export const config = { runtime: 'edge' };

const SOLIDES_TOKEN = 'b62014bd9f42787c05402ba1d1f8d365551a034a19b0332aecb2';
const SOLIDES_BASE  = 'https://app.solides.com/pt-BR/api/v1';

export default async function handler(req) {
  // Aceita só GET
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Buscar todas as páginas de colaboradores ativos
    let todos = [];
    let page  = 1;
    const pageSize = 100;

    while (true) {
      const url = `${SOLIDES_BASE}/colaboradores?status=active&page=${page}&page_size=${pageSize}`;
      const resp = await fetch(url, {
        headers: {
          'Authorization': `Token token=${SOLIDES_TOKEN}`,
          'Accept':        'application/json',
          'Content-Type':  'application/json'
        }
      });

      if (!resp.ok) {
        const err = await resp.text();
        return new Response(JSON.stringify({ error: `Solides API error ${resp.status}`, detail: err }), {
          status: resp.status,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const data = await resp.json();
      const lista = Array.isArray(data) ? data : (data.data || data.colaboradores || []);

      if (lista.length === 0) break;
      todos = todos.concat(lista);
      if (lista.length < pageSize) break;
      page++;
    }

    // Mapear para o formato do sistema DP
    const colaboradores = todos.map(c => {
      // Departamento → centroCusto
      const dept = c.departament;
      const centroCusto = (
        (typeof dept === 'object' && dept !== null)
          ? (dept.name || dept.nome || '')
          : String(dept || '')
      ).trim().toUpperCase() || '';

      // Unity → empresa
      const unity = c.unity;
      const empresa = (
        (typeof unity === 'object' && unity !== null)
          ? (unity.name || unity.nome || unity.trading_name || '')
          : String(unity || '')
      ).trim().toUpperCase() || 'NÃO INFORMADA';

      return {
        matricula:   String(c.registration || c.id || '').trim().replace(/^0+/, '') || String(c.id),
        nome:        String(c.name || '').trim().toUpperCase(),
        cpf:         formatCPF(String(c.idNumber || c.cpf || '')),
        centroCusto,
        empresa,
        // Campos que precisam ser preenchidos manualmente no sistema DP:
        banco:    '',
        agencia:  '',
        conta:    '',
        valorVT:  '',
        // Metadados úteis
        _solidesId:      c.id,
        _ativo:          c.active,
        _dataAdmissao:   c.dateAdmission || '',
      };
    });

    return new Response(JSON.stringify({ colaboradores, total: colaboradores.length }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Erro interno', detail: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function formatCPF(raw) {
  const d = raw.replace(/\D/g, '');
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  return raw;
}
