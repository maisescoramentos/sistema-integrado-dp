import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, AlertTriangle, FileSpreadsheet, CheckCircle, ArrowRight, FileText, CalendarDays, Calculator, Bus, Coffee, Users, PieChart, Plus, Trash2, Clock, RotateCcw, Save, Eye, EyeOff, Building2, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';

// ================= COMPONENTE DE INPUT MONETÁRIO INTELIGENTE =================
const CurrencyInput = ({ value, onChange, className, placeholder }) => {
  const formatVal = (v) => {
    if (v === '' || v === null || v === undefined) return '';
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(v));
  };

  const [displayValue, setDisplayValue] = useState(formatVal(value));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) setDisplayValue(formatVal(value));
  }, [value, isFocused]);

  const handleBlur = () => {
    setIsFocused(false);
    if (!displayValue) {
      onChange('');
      return;
    }
    const cleanStr = displayValue.replace(/[^0-9.,]/g, '');
    const lastCommaIndex = cleanStr.lastIndexOf(',');
    const lastDotIndex = cleanStr.lastIndexOf('.');
    
    let numericVal = 0;
    if (lastCommaIndex > lastDotIndex) {
        numericVal = parseFloat(cleanStr.replace(/\./g, '').replace(',', '.'));
    } else if (lastDotIndex > lastCommaIndex) {
        numericVal = parseFloat(cleanStr.replace(/,/g, ''));
    } else {
        numericVal = parseFloat(cleanStr);
    }

    if (!isNaN(numericVal)) {
      onChange(numericVal);
      setDisplayValue(formatVal(numericVal));
    } else {
      onChange('');
      setDisplayValue('');
    }
  };

  return (
    <input
      type="text"
      value={isFocused ? displayValue : (displayValue ? `R$ ${displayValue}` : '')}
      onChange={(e) => setDisplayValue(e.target.value)}
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
      className={className}
      placeholder={placeholder}
    />
  );
};

export default function App() {
  // Abas
  const [activeTab, setActiveTab] = useState('colaboradores');

  // ================= ESTADOS COM AUTO-SAVE (LOCAL STORAGE) =================
  const [colaboradores, setColaboradores] = useState(() => {
    const saved = localStorage.getItem('dp_colaboradores');
    return saved ? JSON.parse(saved) : [];
  });

  const [salarioData, setSalarioData] = useState(() => {
    const saved = localStorage.getItem('dp_salarioData');
    return saved ? JSON.parse(saved) : [];
  });
  const [paymentType, setPaymentType] = useState(() => localStorage.getItem('dp_paymentType') || '1');

  const [periodo, setPeriodo] = useState(() => {
    const saved = localStorage.getItem('dp_periodo');
    return saved ? JSON.parse(saved) : { start: '', end: '', feriados: 0 };
  });
  const [valorVRDiario, setValorVRDiario] = useState(() => localStorage.getItem('dp_valorVRDiario') || '');
  const [beneficiosData, setBeneficiosData] = useState(() => {
    const saved = localStorage.getItem('dp_beneficiosData');
    return saved ? JSON.parse(saved) : [];
  });
  const [beneficiosOverrides, setBeneficiosOverrides] = useState(() => {
    const saved = localStorage.getItem('dp_beneficiosOverrides');
    return saved ? JSON.parse(saved) : {};
  });

  const [historico, setHistorico] = useState(() => {
    const saved = localStorage.getItem('dp_historico');
    return saved ? JSON.parse(saved) : [];
  });

  // Controle de Visualização do ERP
  const [incluirBeneficiosNoERP, setIncluirBeneficiosNoERP] = useState(true);

  // Estado para controlar expansão das empresas no ERP
  const [expandedEmpresas, setExpandedEmpresas] = useState({});

  useEffect(() => localStorage.setItem('dp_colaboradores', JSON.stringify(colaboradores)), [colaboradores]);
  useEffect(() => localStorage.setItem('dp_salarioData', JSON.stringify(salarioData)), [salarioData]);
  useEffect(() => localStorage.setItem('dp_paymentType', paymentType), [paymentType]);
  useEffect(() => localStorage.setItem('dp_periodo', JSON.stringify(periodo)), [periodo]);
  useEffect(() => localStorage.setItem('dp_valorVRDiario', valorVRDiario), [valorVRDiario]);
  useEffect(() => localStorage.setItem('dp_beneficiosData', JSON.stringify(beneficiosData)), [beneficiosData]);
  useEffect(() => localStorage.setItem('dp_beneficiosOverrides', JSON.stringify(beneficiosOverrides)), [beneficiosOverrides]);
  useEffect(() => localStorage.setItem('dp_historico', JSON.stringify(historico)), [historico]);

  // ================= OUTROS ESTADOS =================
  const fileInputCadastro = useRef(null);
  const fileInputEspelho = useRef(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ matricula: '', nome: '', cpf: '', banco: '', agencia: '', conta: '', valorVT: '', centroCusto: 'ADMINISTRATIVO', empresa: '' });
  const [espelhoFile, setEspelhoFile] = useState(null);
  const [errorsSalario, setErrorsSalario] = useState([]);
  const [isProcessingSalario, setIsProcessingSalario] = useState(false);
  const [diasUteisBase, setDiasUteisBase] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });
  const showAlert = (title, message) => setModalConfig({ isOpen: true, title, message, type: 'alert', onConfirm: null });
  const showConfirm = (title, message, onConfirm) => setModalConfig({ isOpen: true, title, message, type: 'confirm', onConfirm });
  const closeModal = () => setModalConfig({ ...modalConfig, isOpen: false });

  // Funções Auxiliares
  const normalizeKey = (key) => key ? String(key).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '';
  const normalizeText = (text) => text ? String(text).trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '';
  const formatCPF = (cpfRaw) => {
    let cpf = String(cpfRaw).replace(/[^\d]/g, '');
    if (cpf.length > 0 && cpf.length <= 11) return cpf.padStart(11, '0').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    return cpfRaw;
  };
  const formatMoney = (val) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(val) || 0);

  const getBankCode = (bankStr) => {
    const str = String(bankStr).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (str.includes('ITAU')) return '341';
    if (str.includes('BRADESCO')) return '237';
    if (str.includes('BRASIL') || str === 'BB') return '001';
    if (str.includes('CAIXA') || str.includes('CEF')) return '104';
    if (str.includes('SANTANDER')) return '033';
    if (str.includes('NUBANK')) return '260';
    if (str.includes('INTER')) return '077';
    if (str.includes('C6')) return '336';
    if (str.includes('SICOOB')) return '756';
    if (str.includes('SICREDI')) return '748';
    if (/^\d+$/.test(str.trim())) return str.trim(); 
    return str; 
  };

  // ================= FUNÇÃO DE RESET COMPLETO =================
  const resetCompleto = () => {
    showConfirm(
      "Reset Completo do Sistema",
      "⚠️ ATENÇÃO: Isso irá limpar TODOS os dados do sistema, incluindo:\n\n• Colaboradores cadastrados\n• Dados de salário processados\n• Lançamentos de benefícios\n• Histórico de fechamentos\n• Configurações de período\n\nEssa ação NÃO pode ser desfeita. Deseja continuar?",
      () => {
        // Limpa todos os estados
        setColaboradores([]);
        setSalarioData([]);
        setBeneficiosData([]);
        setBeneficiosOverrides({});
        setHistorico([]);
        setPeriodo({ start: '', end: '', feriados: 0 });
        setValorVRDiario('');
        setEspelhoFile(null);
        setErrorsSalario([]);
        setExpandedEmpresas({});
        setFormData({ matricula: '', nome: '', cpf: '', banco: '', agencia: '', conta: '', valorVT: '', centroCusto: 'ADMINISTRATIVO', empresa: '' });
        
        // Limpa localStorage
        localStorage.removeItem('dp_colaboradores');
        localStorage.removeItem('dp_salarioData');
        localStorage.removeItem('dp_beneficiosData');
        localStorage.removeItem('dp_beneficiosOverrides');
        localStorage.removeItem('dp_historico');
        localStorage.removeItem('dp_periodo');
        localStorage.removeItem('dp_valorVRDiario');
        localStorage.removeItem('dp_paymentType');
        
        setActiveTab('colaboradores');
        showAlert("✅ Reset Concluído", "Todos os dados foram limpos com sucesso. O sistema está pronto para uma nova operação.");
      }
    );
  };

  // ================= FUNÇÃO PARA SINCRONIZAR DADOS =================
  const sincronizarDados = () => {
    // Sincroniza beneficiosData com colaboradores atuais
    if (colaboradores.length > 0) {
      const lista = [...colaboradores].sort((a, b) => a.nome.localeCompare(b.nome));
      setBeneficiosData(lista);
      
      // Mantém overrides existentes e adiciona novos colaboradores
      const novosOverrides = {};
      lista.forEach(c => {
        if (beneficiosOverrides[c.matricula]) {
          novosOverrides[c.matricula] = beneficiosOverrides[c.matricula];
        } else {
          novosOverrides[c.matricula] = { ausencias: 0, descontoVT: 0, descontoVR: 0, acrescimosVT: 0, acrescimosVR: 0, obs: '', valorVT: c.valorVT || '' };
        }
      });
      setBeneficiosOverrides(novosOverrides);
      
      // Limpa salarioData se as matrículas não correspondem
      if (salarioData.length > 0) {
        const matriculasColaboradores = new Set(colaboradores.map(c => c.matricula));
        const salariosFiltrados = salarioData.filter(s => matriculasColaboradores.has(s.matricula));
        if (salariosFiltrados.length !== salarioData.length) {
          setSalarioData(salariosFiltrados);
        }
      }
      
      showAlert("✅ Sincronização Concluída", `Dados sincronizados!\n\n• ${lista.length} colaboradores na base\n• Benefícios atualizados\n• Dados inconsistentes removidos`);
    } else {
      showAlert("⚠️ Atenção", "Não há colaboradores cadastrados para sincronizar.");
    }
  };

  useEffect(() => {
    const loadDependencies = async () => {
      if (!window.XLSX) {
        const xlsxScript = document.createElement('script');
        xlsxScript.src = "https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js";
        document.body.appendChild(xlsxScript);
        await new Promise(r => xlsxScript.onload = r);
      }
      if (!window.pdfjsLib) {
        const pdfScript = document.createElement('script');
        pdfScript.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
        document.body.appendChild(pdfScript);
        await new Promise(r => pdfScript.onload = r);
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      }
      if (!window.jspdf) {
        const jspdfScript = document.createElement('script');
        jspdfScript.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        document.body.appendChild(jspdfScript);
        await new Promise(r => jspdfScript.onload = r);
      }
      if (!window.jspdf?.jsPDF?.API?.autoTable) {
         const autoTableScript = document.createElement('script');
         autoTableScript.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js";
         document.body.appendChild(autoTableScript);
      }
      setIsReady(true);
    };
    loadDependencies();
  }, []);

  // ---------- ABA 1: COLABORADORES ----------
  const handleSaveColaborador = (e) => {
    e.preventDefault();
    if(!formData.matricula || !formData.nome) return showAlert("Atenção", "Matrícula e Nome são obrigatórios.");
    
    const matSegura = String(formData.matricula).trim().replace(/^0+/, '') || '0';
    const empresaFormatada = formData.empresa.trim().toUpperCase() || 'NÃO INFORMADA';
    
    setColaboradores(prev => {
      const idx = prev.findIndex(c => c.matricula === matSegura);
      const novo = { ...formData, matricula: matSegura, empresa: empresaFormatada };
      if (idx >= 0) { const updated = [...prev]; updated[idx] = novo; return updated; }
      return [...prev, novo];
    });
    setFormData({ matricula: '', nome: '', cpf: '', banco: '', agencia: '', conta: '', valorVT: '', centroCusto: 'ADMINISTRATIVO', empresa: '' });
    setShowAddForm(false);
  };

  const removerColaborador = (mat) => {
    showConfirm("Excluir Colaborador", "Deseja realmente remover este colaborador?", () => {
      setColaboradores(prev => prev.filter(c => c.matricula !== mat));
    });
  };

  const downloadTemplate = () => {
    if (!window.XLSX) return showAlert("Aviso", "Aguarde, sistema carregando...");
    const headers = [['Matrícula', 'Nome', 'CPF', 'Banco', 'Agência', 'Conta', 'Valor VT', 'Centro de Custo', 'Empresa']];
    const exampleRow = [['001', 'EXEMPLO COLABORADOR', '123.456.789-00', 'ITAU', '1234', '12345-6', '10,50', 'ADMINISTRATIVO', 'EMPRESA EXEMPLO LTDA']];
    const ws = window.XLSX.utils.aoa_to_sheet([...headers, ...exampleRow]);
    
    ws['!cols'] = [
      { wch: 12 },
      { wch: 30 },
      { wch: 16 },
      { wch: 12 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      { wch: 18 },
      { wch: 25 },
    ];
    
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Cadastro_Padrao");
    window.XLSX.writeFile(wb, "Modelo_Cadastro_Colaboradores.xlsx");
  };

  const handleImportColaboradores = async (e) => {
    const file = e.target.files[0];
    if (!file || !window.XLSX) return;
    try {
      const buffer = await file.arrayBuffer();
      const wb = window.XLSX.read(buffer, { type: 'array' });
      const rawData = window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
      const novos = [];
      rawData.forEach(row => {
        const getVal = (possibleKeys) => {
          const k = Object.keys(row).find(key => possibleKeys.some(pk => normalizeKey(key).includes(pk)));
          return k ? row[k] : "";
        };
        const mat = String(getVal(['matricula', 'mat'])).trim();
        if(!mat) return;
        const matSegura = mat.replace(/^0+/, '') || '0';
        const empresaRaw = String(getVal(['empresa', 'company', 'emp', 'razao'])).trim();
        
        novos.push({
          matricula: matSegura,
          nome: String(getVal(['nome'])).trim(),
          cpf: formatCPF(getVal(['cpf'])),
          banco: String(getVal(['banco'])).trim(),
          agencia: String(getVal(['agencia'])).trim(),
          conta: String(getVal(['conta'])).trim(),
          valorVT: parseFloat(String(getVal(['valor vt', 'vale transporte', 'vt di'])).replace(',', '.')) || '',
          centroCusto: (String(getVal(['centro', 'cc', 'custo', 'setor'])).trim() || 'GERAL').toUpperCase(),
          empresa: empresaRaw.toUpperCase() || 'NÃO INFORMADA'
        });
      });
      if(novos.length > 0) {
        setColaboradores(novos);
        
        // ✅ CORREÇÃO: Limpar dados derivados ao importar nova base
        setSalarioData([]);
        setBeneficiosData([]);
        setBeneficiosOverrides({});
        setEspelhoFile(null);
        setErrorsSalario([]);
        
        const empresasDistintas = [...new Set(novos.map(c => c.empresa || 'NÃO INFORMADA'))];
        showAlert("✅ Importação Concluída", `${novos.length} colaboradores importados de ${empresasDistintas.length} empresa(s)!\n\n⚠️ Os dados de salário e benefícios anteriores foram limpos para evitar inconsistências.`);
      } else {
        showAlert("Erro", "Nenhum colaborador encontrado na planilha.");
      }
    } catch (error) {
      console.error(error);
      showAlert("Erro", "Erro ao ler a planilha. Verifique o formato do arquivo.");
    }
    if(fileInputCadastro.current) fileInputCadastro.current.value = '';
  };

  // ---------- ABA 2: SALÁRIO ----------
  const processarSalario = async () => {
    if (colaboradores.length === 0) return showAlert("Atenção", "Cadastre ou importe os colaboradores primeiro na aba 'Colaboradores'.");
    if (!espelhoFile) return showAlert("Atenção", "Faça o upload do Espelho de Salário (PDF).");

    setIsProcessingSalario(true);
    setErrorsSalario([]);
    setSalarioData([]);

    try {
      const espelhoBuffer = await espelhoFile.arrayBuffer();
      const pdfData = new Uint8Array(espelhoBuffer);
      const pdf = await window.pdfjsLib.getDocument({data: pdfData}).promise;
      const pdfLines = [];
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const items = textContent.items;

        items.sort((a, b) => {
          if (Math.abs(b.transform[5] - a.transform[5]) > 5) return b.transform[5] - a.transform[5];
          return a.transform[4] - b.transform[4];
        });

        let currentLine = [];
        let currentY = items.length > 0 ? items[0].transform[5] : 0;
        
        items.forEach(item => {
          const text = item.str.trim();
          if (Math.abs(item.transform[5] - currentY) > 5) {
            if (currentLine.length > 0) pdfLines.push(currentLine.join(" "));
            currentLine = text ? [text] : [];
            currentY = item.transform[5];
          } else {
            if (text) currentLine.push(text);
          }
        });
        if (currentLine.length > 0) pdfLines.push(currentLine.join(" "));
      }

      const result = [];
      const currentErrors = [];
      const matriculasEncontradas = new Set();

      pdfLines.forEach((line) => {
        const lineNormalized = normalizeText(line);

        for (const colab of colaboradores) {
          const safeMat = colab.matricula;
          const regexMat = new RegExp(`\\b0*${safeMat}\\b`);
          const partesNome = normalizeText(colab.nome).split(' ').filter(n => n.length > 1);
          const primeiroNome = partesNome.length > 0 ? partesNome[0] : '';

          if (regexMat.test(line) && (primeiroNome === '' || lineNormalized.includes(primeiroNome))) {
            const valueMatches = line.match(/(?:\d{1,3}(?:\.\d{3})*|\d+),\d{2}/g);
            if (valueMatches && valueMatches.length > 0) {
              const lastMatch = valueMatches[valueMatches.length - 1];
              const valor = parseFloat(lastMatch.replace(/\./g, '').replace(',', '.'));
              
              if (valor > 0 && !matriculasEncontradas.has(safeMat)) {
                matriculasEncontradas.add(safeMat);
                let conta = colab.conta;
                let digito = "";
                if (conta.includes('-')) {
                  const parts = conta.split('-'); digito = parts.pop(); conta = parts.join('-');
                }
                if (!colab.agencia || !conta) currentErrors.push(`Atenção: Dados bancários incompletos para "${colab.nome}" (Matrícula: ${safeMat}).`);

                result.push({
                  agencia: colab.agencia, conta: conta, digito: digito, nome: colab.nome, cpf: colab.cpf,
                  bancoCode: getBankCode(colab.banco), valor: valor, centroCusto: colab.centroCusto || 'GERAL', 
                  empresa: colab.empresa || 'NÃO INFORMADA', matricula: safeMat
                });
              }
            }
          }
        }
      });

      if (result.length === 0) currentErrors.push("Erro: Não foi possível extrair valores cruzando com os colaboradores cadastrados.");
      setSalarioData(result);
      setErrorsSalario(currentErrors);
    } catch (error) {
      console.error(error);
      setErrorsSalario(["Ocorreu um erro ao processar o arquivo PDF."]);
    } finally {
      setIsProcessingSalario(false);
    }
  };

  const exportarArquivoBancoSalario = () => {
    if (salarioData.length === 0 || !window.XLSX) return;

    const bankData = salarioData.map(row => [row.agencia, row.conta, row.digito, row.nome, row.cpf, paymentType, row.valor]);
    const ws = window.XLSX.utils.aoa_to_sheet(bankData);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Pagamentos");
    
    const tipoNome = paymentType === '1' ? 'Salário' : 'Adiantamento Salárial';
    const dataFormatada = new Date().toISOString().split('T')[0];
    window.XLSX.writeFile(wb, `${tipoNome} (${dataFormatada}).xlsx`);
  };

  const limparDadosSalario = () => {
    showConfirm("Limpar Dados de Salário", "Deseja remover os dados processados da tela de salário?", () => {
      setSalarioData([]);
      setEspelhoFile(null);
      setErrorsSalario([]);
    });
  };

  // ---------- ABA 3: BENEFÍCIOS ----------
  useEffect(() => {
    if (periodo.start && periodo.end) {
      const startDate = new Date(periodo.start + 'T00:00:00');
      const endDate = new Date(periodo.end + 'T00:00:00');
      let count = 0;
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
        currentDate.setDate(currentDate.getDate() + 1);
      }
      setDiasUteisBase(Math.max(0, count - (parseInt(periodo.feriados) || 0)));
    } else {
      setDiasUteisBase(0);
    }
  }, [periodo]);

  const carregarColaboradoresBeneficios = () => {
    if (colaboradores.length === 0) return showAlert("Atenção", "Cadastre ou importe os colaboradores na aba 'Colaboradores'.");
    
    const lista = [...colaboradores].sort((a, b) => a.nome.localeCompare(b.nome));
    setBeneficiosData(lista);
    
    const novosOverrides = { ...beneficiosOverrides }; 
    lista.forEach(c => {
      if (!novosOverrides[c.matricula]) {
        novosOverrides[c.matricula] = { ausencias: 0, descontoVT: 0, descontoVR: 0, acrescimosVT: 0, acrescimosVR: 0, obs: '', valorVT: c.valorVT || '' };
      }
    });
    setBeneficiosOverrides(novosOverrides);
    
    showAlert("✅ Base Carregada", `${lista.length} colaboradores carregados para lançamento de benefícios.`);
  };

  const limparMesBeneficios = () => {
    showConfirm("Limpar Dados", "Tem certeza que deseja zerar todos os descontos, acréscimos e observações desta tabela? (Os valores fixos de VT não serão apagados)", () => {
      const novosOverrides = {};
      beneficiosData.forEach(c => {
        novosOverrides[c.matricula] = { ausencias: 0, descontoVT: 0, descontoVR: 0, acrescimosVT: 0, acrescimosVR: 0, obs: '', valorVT: c.valorVT || '' };
      });
      setBeneficiosOverrides(novosOverrides);
    });
  };

  const updateOverride = (matricula, field, value) => {
    setBeneficiosOverrides(prev => ({
      ...prev,
      [matricula]: {
        ...(prev[matricula] || { ausencias: 0, descontoVT: 0, descontoVR: 0, acrescimosVT: 0, acrescimosVR: 0, obs: '', valorVT: '' }),
        [field]: value
      }
    }));
  };

  const calcBeneficios = () => {
    const vrDiarioNumGlobal = parseFloat(valorVRDiario) || 0;
    return beneficiosData.map(colab => {
      const overrides = beneficiosOverrides[colab.matricula] || {};
      const ausencias = parseInt(overrides.ausencias) || 0;
      const descontoVT = parseInt(overrides.descontoVT) || 0;
      const descontoVR = parseInt(overrides.descontoVR) || 0;
      const acrescimosVT = parseInt(overrides.acrescimosVT) || 0;
      const acrescimosVR = parseInt(overrides.acrescimosVR) || 0;
      const valorVT = parseFloat(overrides.valorVT) || 0;
      
      const totalDiasVT = Math.max(0, diasUteisBase - ausencias - descontoVT + acrescimosVT);
      const totalDiasVR = Math.max(0, diasUteisBase - ausencias - descontoVR + acrescimosVR);
      
      const totalVT = totalDiasVT * valorVT;
      const totalVRBruto = totalDiasVR * vrDiarioNumGlobal;
      const descontoVRTaxa = totalVRBruto * 0.09;
      const totalVRLiquido = totalVRBruto - descontoVRTaxa;
      const totalGeral = totalVT + totalVRLiquido;

      return {
        ...colab, diasVT: totalDiasVT, diasVR: totalDiasVR, totalVT, totalVRLiquido, totalGeral,
        ausencias, descontoVT, descontoVR, acrescimosVT, acrescimosVR, valorVT, obs: overrides.obs || ''
      };
    });
  };

  const exportBeneficiosBasePDF = () => {
    if (beneficiosData.length === 0 || !window.jspdf || !window.jspdf.jsPDF.API.autoTable) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape'); 
    const data = calcBeneficios();
    let somaVT = 0, somaVR = 0, somaGeral = 0;

    const tableRows = data.map(item => {
      somaVT += item.totalVT; somaVR += item.totalVRLiquido; somaGeral += item.totalGeral;
      
      return [
        item.matricula, 
        item.nome.substring(0, 22),
        item.empresa ? item.empresa.substring(0, 15) : '-',
        formatMoney(item.valorVT),
        item.ausencias > 0 ? `-${item.ausencias}` : '-', 
        item.descontoVT > 0 ? `-${item.descontoVT}` : '-',
        item.descontoVR > 0 ? `-${item.descontoVR}` : '-',
        item.acrescimosVT > 0 ? `+${item.acrescimosVT}` : '-',
        item.acrescimosVR > 0 ? `+${item.acrescimosVR}` : '-',
        formatMoney(item.totalVT), 
        formatMoney(item.totalVRLiquido), 
        formatMoney(item.totalGeral),
        item.obs || ''
      ];
    });

    doc.setFont("helvetica", "bold"); doc.setFontSize(16);
    doc.text("RELATÓRIO BASE - VALE TRANSPORTE E REFEIÇÃO", 14, 20);
    
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    const periodoStr = `${periodo.start ? periodo.start.split('-').reverse().join('/') : ''} a ${periodo.end ? periodo.end.split('-').reverse().join('/') : ''}`;
    doc.text(`Período: ${periodoStr} | Dias Úteis Base: ${diasUteisBase}`, 14, 28);
    doc.text(`Valor Padrão VR Diário: R$ ${formatMoney(parseFloat(valorVRDiario) || 0)} (-9% CCT aplicado na folha)`, 14, 34);

    doc.autoTable({
      startY: 40,
      head: [['Mat', 'Colaborador', 'Empresa', 'VT Diário', 'Faltas', 'Desc. VT', 'Desc. VR', 'Acrés. VT', 'Acrés. VR', 'Total VT', 'Total VR', 'Total Geral', 'Obs']],
      body: tableRows,
      theme: 'striped', showFoot: 'lastPage',
      headStyles: { fillColor: [30, 64, 175] }, styles: { fontSize: 6, cellPadding: 1.5 },
      columnStyles: { 9: {halign: 'right'}, 10: {halign: 'right'}, 11: {halign: 'right', fontStyle: 'bold'} },
      foot: [['', '', '', '', '', '', '', '', 'TOTAIS', formatMoney(somaVT), formatMoney(somaVR), formatMoney(somaGeral), '']],
      footStyles: { fillColor: [240, 253, 244], textColor: [21, 128, 61], fontStyle: 'bold' }
    });

    doc.save(`Relatorio_Base_VTVR_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportVTBankFile = () => {
    const data = calcBeneficios();
    const vtData = [];
    
    data.forEach(item => {
      if (item.totalVT > 0) {
        let conta = item.conta; let digito = "";
        if (conta && conta.includes('-')) { const parts = conta.split('-'); digito = parts.pop(); conta = parts.join('-'); }
        vtData.push([item.agencia || '', conta || '', digito || '', item.nome, item.cpf || '', '3', item.totalVT]);
      }
    });

    if (vtData.length === 0) return showAlert("Atenção", "Não há valores de VT a serem pagos.");
    const ws = window.XLSX.utils.aoa_to_sheet(vtData);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Pagamentos VT");
    window.XLSX.writeFile(wb, `Arquivo_Itau_VT_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportVRSolidesFile = () => {
    const data = calcBeneficios();
    const vrData = [];

    data.forEach(item => {
      if (item.totalVRLiquido > 0) {
        const cpfLimpo = item.cpf ? String(item.cpf).replace(/[^\d]/g, '') : '';
        
        vrData.push([
          cpfLimpo,
          '',
          '',
          '',
          '',
          '',
          item.totalVRLiquido,
          ''
        ]);
      }
    });

    if (vrData.length === 0) return showAlert("Atenção", "Não há valores de VR a serem pagos.");

    const headers = ['CPF', 'Alimentação', 'Cultura', 'Home Office', 'Mobilidade', 'Refeição', 'Saldo Livre', 'Saúde'];
    const wsData = [headers, ...vrData];

    const ws = window.XLSX.utils.aoa_to_sheet(wsData);
    
    ws['!cols'] = [
      { wch: 15 },
      { wch: 12 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
      { wch: 12 },
      { wch: 10 }
    ];

    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Solides VR");
    window.XLSX.writeFile(wb, `Arquivo_Solides_VR_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const generateReceiptsPDF = () => {
    if (beneficiosData.length === 0 || !window.jspdf) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const startStr = periodo.start ? periodo.start.split('-').reverse().join('/') : '';
    const endStr = periodo.end ? periodo.end.split('-').reverse().join('/') : '';
    const data = calcBeneficios();
    let pageAdded = false;

    data.forEach((item) => {
      if (item.totalGeral <= 0 && item.ausencias === 0 && item.acrescimosVT === 0 && item.acrescimosVR === 0) return;
      if (pageAdded) doc.addPage();
      pageAdded = true;

      doc.setFont("helvetica", "bold"); doc.setFontSize(16);
      doc.text("RECIBO INDIVIDUAL DE BENEFÍCIOS", 105, 20, { align: "center" });

      doc.setFontSize(11); doc.setFont("helvetica", "normal");
      doc.text(`Colaborador: ${item.nome}`, 20, 35);
      doc.text(`Empresa: ${item.empresa || 'NÃO INFORMADA'}`, 20, 42);
      doc.text(`Matrícula: ${item.matricula}   |   Centro de Custo: ${item.centroCusto}`, 20, 49);
      doc.text(`Período de Apuração: ${startStr} até ${endStr}`, 20, 56);
      doc.text(`Dias Úteis Base no Período: ${diasUteisBase} dias`, 20, 63);

      doc.setFont("helvetica", "bold"); doc.setFontSize(12);
      doc.text("Resumo de Valores Apurados:", 20, 82);

      doc.setFont("helvetica", "normal"); doc.setFontSize(11);
      doc.text(`Valor Total de VT: R$ ${formatMoney(item.totalVT)}`, 20, 92);
      doc.text(`Valor Total de VR: R$ ${formatMoney(item.totalVRLiquido)}`, 20, 100);

      doc.setFontSize(14); doc.setFont("helvetica", "bold");
      doc.text(`TOTAL GERAL A RECEBER: R$ ${formatMoney(item.totalGeral)}`, 20, 122);

      doc.setFontSize(10); doc.setFont("helvetica", "normal");
      doc.text(`Observações: ${item.obs}`, 20, 142);

      doc.setDrawColor(0, 0, 0); doc.line(40, 180, 170, 180);
      doc.text(item.nome, 105, 187, { align: "center" });
      doc.setFontSize(8); doc.text("Assinatura do Colaborador", 105, 192, { align: "center" });
    });

    if (!pageAdded) return showAlert("Atenção", "Nenhum recibo para gerar. Verifique os valores.");
    doc.save(`Recibos_Beneficios_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // ---------- ABA 4: DASHBOARD ERP & FECHAMENTO HISTÓRICO ----------
  
  const getERPDataHierarchico = () => {
    const erp = {};
    
    // Processa salários
    salarioData.forEach(item => {
      const empresa = item.empresa || 'NÃO INFORMADA';
      const cc = item.centroCusto || 'GERAL';
      
      if (!erp[empresa]) erp[empresa] = {};
      if (!erp[empresa][cc]) erp[empresa][cc] = { salario: 0, vt: 0, vr: 0, headCount: new Set() };
      
      erp[empresa][cc].salario += item.valor;
      erp[empresa][cc].headCount.add(item.matricula);
    });

    // Processa benefícios se habilitado
    if (incluirBeneficiosNoERP && beneficiosData.length > 0) {
      const benData = calcBeneficios();
      benData.forEach(item => {
        if (item.totalGeral > 0) {
          const empresa = item.empresa || 'NÃO INFORMADA';
          const cc = item.centroCusto || 'GERAL';
          
          if (!erp[empresa]) erp[empresa] = {};
          if (!erp[empresa][cc]) erp[empresa][cc] = { salario: 0, vt: 0, vr: 0, headCount: new Set() };
          
          erp[empresa][cc].vt += item.totalVT;
          erp[empresa][cc].vr += item.totalVRLiquido;
          erp[empresa][cc].headCount.add(item.matricula);
        }
      });
    }

    const resultado = Object.keys(erp).sort().map(empresa => {
      const centrosCusto = Object.keys(erp[empresa]).sort().map(cc => ({
        centroCusto: cc,
        salario: erp[empresa][cc].salario,
        vt: erp[empresa][cc].vt,
        vr: erp[empresa][cc].vr,
        total: erp[empresa][cc].salario + erp[empresa][cc].vt + erp[empresa][cc].vr,
        vidas: erp[empresa][cc].headCount.size
      }));

      const subtotalEmpresa = centrosCusto.reduce((acc, cc) => ({
        salario: acc.salario + cc.salario,
        vt: acc.vt + cc.vt,
        vr: acc.vr + cc.vr,
        total: acc.total + cc.total,
        vidas: acc.vidas + cc.vidas
      }), { salario: 0, vt: 0, vr: 0, total: 0, vidas: 0 });

      return {
        empresa,
        centrosCusto,
        subtotal: subtotalEmpresa
      };
    });

    return resultado;
  };

  const getERPData = () => {
    const hierarquico = getERPDataHierarchico();
    const flat = [];
    hierarquico.forEach(emp => {
      emp.centrosCusto.forEach(cc => {
        flat.push({
          empresa: emp.empresa,
          centroCusto: cc.centroCusto,
          salario: cc.salario,
          vt: cc.vt,
          vr: cc.vr,
          total: cc.total,
          vidas: cc.vidas
        });
      });
    });
    return flat;
  };

  const toggleEmpresaExpand = (empresa) => {
    setExpandedEmpresas(prev => ({
      ...prev,
      [empresa]: !prev[empresa]
    }));
  };

  const expandirTodasEmpresas = () => {
    const erpData = getERPDataHierarchico();
    const todas = {};
    erpData.forEach(emp => {
      todas[emp.empresa] = true;
    });
    setExpandedEmpresas(todas);
  };

  const recolherTodasEmpresas = () => {
    setExpandedEmpresas({});
  };

  const exportERPPDF = () => {
    const erpHierarquico = getERPDataHierarchico();
    if (erpHierarquico.length === 0 || !window.jspdf || !window.jspdf.jsPDF.API.autoTable) {
      return showAlert("Atenção", "Não há dados calculados para imprimir.");
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('portrait');

    doc.setFont("helvetica", "bold"); doc.setFontSize(16);
    doc.text("RESUMO GERENCIAL POR EMPRESA E CENTRO DE CUSTO", 14, 20);

    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    const periodoStr = `${periodo.start ? periodo.start.split('-').reverse().join('/') : ''} a ${periodo.end ? periodo.end.split('-').reverse().join('/') : ''}`;
    doc.text(`Período de Referência (Benefícios): ${periodoStr}`, 14, 28);
    doc.text(`Data de Emissão: ${new Date().toLocaleString('pt-BR')}`, 14, 34);

    let startY = 42;
    let totalGeralSalario = 0, totalGeralVT = 0, totalGeralVR = 0, totalGeralTotal = 0, totalGeralVidas = 0;

    erpHierarquico.forEach((empresaData, idx) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setFillColor(30, 64, 175);
      doc.setTextColor(255, 255, 255);
      doc.rect(14, startY, 182, 8, 'F');
      doc.text(`${empresaData.empresa}`, 16, startY + 5.5);
      startY += 10;

      const tableRows = empresaData.centrosCusto.map(cc => [
        cc.centroCusto,
        cc.vidas,
        formatMoney(cc.salario),
        formatMoney(cc.vt),
        formatMoney(cc.vr),
        formatMoney(cc.total)
      ]);

      doc.autoTable({
        startY: startY,
        head: [['Centro de Custo', 'Qtd', 'Salário/Adiant.', 'VT', 'VR', 'Total']],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [100, 116, 139], fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: { 1: {halign: 'center'}, 2: {halign: 'right'}, 3: {halign: 'right'}, 4: {halign: 'right'}, 5: {halign: 'right', fontStyle: 'bold'} },
        foot: [[
          'Subtotal ' + empresaData.empresa.substring(0, 20),
          empresaData.subtotal.vidas,
          formatMoney(empresaData.subtotal.salario),
          formatMoney(empresaData.subtotal.vt),
          formatMoney(empresaData.subtotal.vr),
          formatMoney(empresaData.subtotal.total)
        ]],
        footStyles: { fillColor: [219, 234, 254], textColor: [30, 64, 175], fontStyle: 'bold', halign: 'right' },
        margin: { left: 14, right: 14 }
      });

      startY = doc.lastAutoTable.finalY + 8;

      totalGeralSalario += empresaData.subtotal.salario;
      totalGeralVT += empresaData.subtotal.vt;
      totalGeralVR += empresaData.subtotal.vr;
      totalGeralTotal += empresaData.subtotal.total;
      totalGeralVidas += empresaData.subtotal.vidas;

      if (startY > 250 && idx < erpHierarquico.length - 1) {
        doc.addPage();
        startY = 20;
      }
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setFillColor(21, 128, 61);
    doc.setTextColor(255, 255, 255);
    doc.rect(14, startY, 182, 10, 'F');
    doc.text("TOTAL GERAL CONSOLIDADO", 16, startY + 7);
    startY += 12;

    doc.autoTable({
      startY: startY,
      head: [['', 'Colaboradores', 'Salário/Adiant.', 'VT', 'VR', 'Total Geral']],
      body: [['TODAS AS EMPRESAS', totalGeralVidas, formatMoney(totalGeralSalario), formatMoney(totalGeralVT), formatMoney(totalGeralVR), formatMoney(totalGeralTotal)]],
      theme: 'plain',
      headStyles: { fillColor: [240, 253, 244], textColor: [21, 128, 61], fontSize: 9 },
      styles: { fontSize: 10, cellPadding: 3, fontStyle: 'bold' },
      columnStyles: { 1: {halign: 'center'}, 2: {halign: 'right'}, 3: {halign: 'right'}, 4: {halign: 'right'}, 5: {halign: 'right'} },
      margin: { left: 14, right: 14 }
    });

    doc.save(`Resumo_ERP_Empresa_CC_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const salvarFechamento = () => {
    const erpResumo = getERPData();
    if (erpResumo.length === 0) {
      return showAlert("Atenção", "Não há dados calculados para salvar no histórico.");
    }
    const totalGeralERP = erpResumo.reduce((acc, curr) => acc + curr.total, 0);

    const snapshot = {
      colaboradores: [...colaboradores],
      salarioData: [...salarioData],
      paymentType,
      periodo: { ...periodo },
      valorVRDiario,
      beneficiosData: [...beneficiosData],
      beneficiosOverrides: JSON.parse(JSON.stringify(beneficiosOverrides)),
      incluirBeneficiosNoERP
    };

    const periodoStr = periodo.start && periodo.end
      ? `${periodo.start.split('-').reverse().join('/')} a ${periodo.end.split('-').reverse().join('/')}`
      : 'Sem período definido';

    const empresasDistintas = [...new Set(colaboradores.map(c => c.empresa || 'NÃO INFORMADA'))];

    const novoRegistro = {
      id: Date.now(),
      dataHora: new Date().toLocaleString('pt-BR'),
      tipo: incluirBeneficiosNoERP ? 'Fechamento Completo (Salário + Benefícios)' : 'Fechamento Simples (Apenas Salários)',
      detalhes: `Período: ${periodoStr} | ${empresasDistintas.length} Empresa(s) | ${colaboradores.length} Colaboradores`,
      valorTotal: totalGeralERP,
      snapshot
    };

    setHistorico(prev => [novoRegistro, ...prev]);
    showAlert("✅ Sucesso", "Fechamento salvo no histórico! Você pode acessá-lo futuramente na aba 'Histórico'.");
  };

  const restaurarHistorico = (registro) => {
    showConfirm(
      "Restaurar Fechamento",
      `Isso irá substituir todos os dados atuais (Colaboradores, Salários e Benefícios) pelos dados do dia ${registro.dataHora}. Deseja continuar?`,
      () => {
        const snap = registro.snapshot;
        setColaboradores(snap.colaboradores || []);
        setSalarioData(snap.salarioData || []);
        setPaymentType(snap.paymentType || '1');
        setPeriodo(snap.periodo || { start: '', end: '', feriados: 0 });
        setValorVRDiario(snap.valorVRDiario || '');
        setBeneficiosData(snap.beneficiosData || []);
        setBeneficiosOverrides(snap.beneficiosOverrides || {});
        setIncluirBeneficiosNoERP(snap.incluirBeneficiosNoERP ?? true);
        
        setActiveTab('erp');
        showAlert("✅ Restaurado", "Dados restaurados com sucesso! Você pode conferir os valores ou re-gerar os arquivos.");
      }
    );
  };

  const excluirHistorico = (id) => {
    showConfirm("Excluir Registro", "Tem certeza que deseja excluir este registro do histórico?", () => {
      setHistorico(prev => prev.filter(h => h.id !== id));
    });
  };

  // ================= CONTADORES PARA EXIBIÇÃO =================
  const getTotalERPInfo = () => {
    const erpData = getERPDataHierarchico();
    return {
      empresas: erpData.length,
      colaboradores: erpData.reduce((acc, e) => acc + e.subtotal.vidas, 0),
      salario: erpData.reduce((acc, e) => acc + e.subtotal.salario, 0),
      vt: erpData.reduce((acc, e) => acc + e.subtotal.vt, 0),
      vr: erpData.reduce((acc, e) => acc + e.subtotal.vr, 0),
      total: erpData.reduce((acc, e) => acc + e.subtotal.total, 0)
    };
  };
  // ================= RENDER =================
  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans pb-20 relative">
      
      {/* Sistema de Modal Customizado */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{modalConfig.title}</h3>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed whitespace-pre-line">{modalConfig.message}</p>
            <div className="flex justify-end space-x-3">
              {modalConfig.type === 'confirm' && (
                <button onClick={closeModal} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors text-sm">
                  Cancelar
                </button>
              )}
              <button onClick={() => { if (modalConfig.onConfirm) modalConfig.onConfirm(); closeModal(); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors text-sm">
                {modalConfig.type === 'confirm' ? 'Confirmar' : 'Entendi'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Header e Navegação de Abas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 flex flex-col md:flex-row items-center justify-between border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 p-3 rounded-lg text-white shadow-md"><FileSpreadsheet className="w-8 h-8" /></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Sistema Integrado de DP</h1>
                <p className="text-sm text-gray-600 mt-1">Colaboradores, Remessas, Benefícios, ERP e Histórico</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 mt-4 md:mt-0">
  {/* Botão Documentação */}
  <a 
    href="/docs.html"
    target="_blank"
    rel="noopener noreferrer"
    className="px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 flex items-center space-x-1 font-medium"
    title="Abrir documentação técnica"
  >
    <FileText className="w-4 h-4" />
    <span>Docs</span>
  </a>
  <button 
    onClick={sincronizarDados}
    className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center space-x-1 font-medium"
    title="Sincronizar dados entre abas"
  >
    <RefreshCw className="w-4 h-4" />
    <span>Sincronizar</span>
  </button>
  <button 
    onClick={resetCompleto}
    className="px-3 py-2 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 flex items-center space-x-1 font-medium"
    title="Limpar todos os dados do sistema"
  >
    <Trash2 className="w-4 h-4" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
            <div className="flex flex-wrap border-b border-gray-200">
            <button onClick={() => setActiveTab('colaboradores')} className={`flex-1 py-4 px-4 text-sm font-bold tracking-wide transition-colors flex justify-center items-center space-x-2 ${activeTab === 'colaboradores' ? 'text-blue-700 bg-blue-50 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>
              <Users className="w-5 h-5" /><span>Base Local</span>
              {colaboradores.length > 0 && <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">{colaboradores.length}</span>}
            </button>
            <button onClick={() => setActiveTab('salario')} className={`flex-1 py-4 px-4 text-sm font-bold tracking-wide transition-colors flex justify-center items-center space-x-2 ${activeTab === 'salario' ? 'text-blue-700 bg-blue-50 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>
              <Calculator className="w-5 h-5" /><span>Salário / Adiant.</span>
              {salarioData.length > 0 && <span className="ml-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">{salarioData.length}</span>}
            </button>
            <button onClick={() => setActiveTab('beneficios')} className={`flex-1 py-4 px-4 text-sm font-bold tracking-wide transition-colors flex justify-center items-center space-x-2 ${activeTab === 'beneficios' ? 'text-blue-700 bg-blue-50 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>
              <div className="flex items-center space-x-1"><Bus className="w-5 h-5" /><Coffee className="w-5 h-5" /></div><span>VT e VR</span>
              {beneficiosData.length > 0 && <span className="ml-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">{beneficiosData.length}</span>}
            </button>
            <button onClick={() => setActiveTab('erp')} className={`flex-1 py-4 px-4 text-sm font-bold tracking-wide transition-colors flex justify-center items-center space-x-2 ${activeTab === 'erp' ? 'text-blue-700 bg-blue-50 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>
              <PieChart className="w-5 h-5" /><span>Resumo ERP</span>
            </button>
            <button onClick={() => setActiveTab('historico')} className={`flex-1 py-4 px-4 text-sm font-bold tracking-wide transition-colors flex justify-center items-center space-x-2 ${activeTab === 'historico' ? 'text-blue-700 bg-blue-50 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>
              <Clock className="w-5 h-5" /><span>Histórico</span>
              {historico.length > 0 && <span className="ml-1 px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full text-xs">{historico.length}</span>}
            </button>
          </div>
        </div>

        {/* ================= ABA 1: COLABORADORES ================= */}
        {activeTab === 'colaboradores' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Importar Planilha Simplificada</h2>
                  <p className="text-sm text-gray-500 mt-1">Matrícula, Nome, CPF, Banco, Agência, Conta, Valor VT, Centro de Custo, <strong className="text-blue-600">Empresa</strong>.</p>
                  <p className="text-xs text-orange-600 mt-2 flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Importar nova planilha irá substituir todos os dados atuais.
                  </p>
                </div>
                <div className="flex flex-col space-y-2 items-end">
                  <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputCadastro} onChange={handleImportColaboradores} />
                  <button onClick={() => fileInputCadastro.current.click()} className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 font-medium border border-blue-200 rounded-lg hover:bg-blue-100">
                    <Upload className="w-5 h-5" /> <span>Upload XLSX</span>
                  </button>
                  <button onClick={downloadTemplate} className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-1">
                    <Download className="w-3 h-3"/> <span>Baixar Modelo</span>
                  </button>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-center">
                <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700">
                  <Plus className="w-5 h-5" /> <span>{showAddForm ? 'Fechar Formulário' : 'Cadastro Manual'}</span>
                </button>
              </div>
            </div>

            {showAddForm && (
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 shadow-inner">
                <form onSubmit={handleSaveColaborador} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input required placeholder="Matrícula *" value={formData.matricula} onChange={e => setFormData({...formData, matricula: e.target.value})} className="border p-2 rounded" />
                  <input required placeholder="Nome Completo *" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="border p-2 rounded col-span-2" />
                  <input placeholder="CPF (Apenas números)" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} className="border p-2 rounded" />
                  <input placeholder="Banco (Nome ou Cód)" value={formData.banco} onChange={e => setFormData({...formData, banco: e.target.value})} className="border p-2 rounded" />
                  <input placeholder="Agência" value={formData.agencia} onChange={e => setFormData({...formData, agencia: e.target.value})} className="border p-2 rounded" />
                  <input placeholder="Conta (com dígito ex: 123-4)" value={formData.conta} onChange={e => setFormData({...formData, conta: e.target.value})} className="border p-2 rounded" />
                  <CurrencyInput placeholder="Valor VT Fixo (Ex: 10,50)" value={formData.valorVT} onChange={val => setFormData({...formData, valorVT: val})} className="border p-2 rounded" />
                  <input placeholder="Centro de Custo" value={formData.centroCusto} onChange={e => setFormData({...formData, centroCusto: e.target.value.toUpperCase()})} className="border p-2 rounded" />
                  <input placeholder="Empresa *" value={formData.empresa} onChange={e => setFormData({...formData, empresa: e.target.value})} className="border p-2 rounded col-span-2 bg-blue-100 border-blue-300" />
                  <button type="submit" className="bg-green-600 text-white font-bold rounded py-2 hover:bg-green-700">Salvar Dados</button>
                </form>
              </div>
            )}

            {/* Resumo de Empresas Cadastradas */}
            {colaboradores.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                <div className="flex items-center space-x-2 mb-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-800">Empresas Cadastradas</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[...new Set(colaboradores.map(c => c.empresa || 'NÃO INFORMADA'))].sort().map((empresa, idx) => {
                    const count = colaboradores.filter(c => (c.empresa || 'NÃO INFORMADA') === empresa).length;
                    return (
                      <span key={idx} className="px-3 py-1 bg-white rounded-full text-sm font-medium text-blue-700 border border-blue-200 shadow-sm">
                        {empresa} <span className="text-blue-500">({count})</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Banco de Dados Local ({colaboradores.length} pessoas)</h3>
              </div>
              {colaboradores.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhum colaborador cadastrado. Importe uma planilha ou cadastre manualmente.</p>
              ) : (
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="p-2 text-left">Mat</th>
                        <th className="p-2 text-left">Nome</th>
                        <th className="p-2 text-left">CPF</th>
                        <th className="p-2 text-left">Empresa</th>
                        <th className="p-2 text-left">Banco</th>
                        <th className="p-2 text-left">Ag</th>
                        <th className="p-2 text-left">Conta</th>
                        <th className="p-2 text-right">VT</th>
                        <th className="p-2 text-left">CC</th>
                        <th className="p-2 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {colaboradores.map((c, idx) => (
                        <tr key={idx} className="border-t hover:bg-gray-50">
                          <td className="p-2 font-mono text-xs">{c.matricula}</td>
                          <td className="p-2 font-medium">{c.nome}</td>
                          <td className="p-2 text-xs">{c.cpf}</td>
                          <td className="p-2 text-xs">{c.empresa || '-'}</td>
                          <td className="p-2">{c.banco}</td>
                          <td className="p-2">{c.agencia}</td>
                          <td className="p-2">{c.conta}</td>
                          <td className="p-2 text-right">{c.valorVT ? `R$ ${formatMoney(c.valorVT)}` : '-'}</td>
                          <td className="p-2">{c.centroCusto}</td>
                          <td className="p-2 text-center">
                            <button onClick={() => removerColaborador(c.matricula)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= ABA 2: SALÁRIO ================= */}
        {activeTab === 'salario' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Processamento de Salário / Adiantamento</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Pagamento</label>
                  <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} className="w-full border p-2 rounded">
                    <option value="1">Salário</option>
                    <option value="5">Adiantamento Salarial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Espelho de Salário (PDF)</label>
                  <input type="file" accept=".pdf" ref={fileInputEspelho} onChange={(e) => setEspelhoFile(e.target.files[0])} className="w-full border p-2 rounded text-sm" />
                </div>
                <div className="flex items-end gap-2">
                  <button onClick={processarSalario} disabled={isProcessingSalario} className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50">
                    {isProcessingSalario ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                    <span>{isProcessingSalario ? 'Processando...' : 'Processar'}</span>
                  </button>
                  {salarioData.length > 0 && (
                    <button onClick={limparDadosSalario} className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300" title="Limpar dados">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
              {errorsSalario.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  {errorsSalario.map((err, idx) => (
                    <p key={idx} className="text-yellow-800 text-sm flex items-center"><AlertTriangle className="w-4 h-4 mr-2" />{err}</p>
                  ))}
                </div>
              )}
            </div>

            {salarioData.length > 0 && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">Resultado: {salarioData.length} pagamentos</h3>
                  <button onClick={exportarArquivoBancoSalario} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">
                    <Download className="w-5 h-5" /><span>Exportar Arquivo Banco</span>
                  </button>
                </div>
                <div className="overflow-x-auto max-h-[400px]">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="p-2 text-left">Ag</th>
                        <th className="p-2 text-left">Conta</th>
                        <th className="p-2 text-left">Dig</th>
                        <th className="p-2 text-left">Nome</th>
                        <th className="p-2 text-left">Empresa</th>
                        <th className="p-2 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salarioData.map((row, idx) => (
                        <tr key={idx} className="border-t hover:bg-gray-50">
                          <td className="p-2">{row.agencia}</td>
                          <td className="p-2">{row.conta}</td>
                          <td className="p-2">{row.digito}</td>
                          <td className="p-2 font-medium">{row.nome}</td>
                          <td className="p-2 text-xs">{row.empresa}</td>
                          <td className="p-2 text-right font-bold text-green-700">R$ {formatMoney(row.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-green-50 font-bold">
                      <tr>
                        <td colSpan={5} className="p-2 text-right">TOTAL:</td>
                        <td className="p-2 text-right text-green-700">R$ {formatMoney(salarioData.reduce((a, b) => a + b.valor, 0))}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= ABA 3: BENEFÍCIOS ================= */}
        {activeTab === 'beneficios' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Configuração do Período e Valores</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
                  <input type="date" value={periodo.start} onChange={(e) => setPeriodo({...periodo, start: e.target.value})} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
                  <input type="date" value={periodo.end} onChange={(e) => setPeriodo({...periodo, end: e.target.value})} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Feriados no Período</label>
                  <input type="number" min="0" value={periodo.feriados} onChange={(e) => setPeriodo({...periodo, feriados: e.target.value})} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dias Úteis (calculado)</label>
                  <div className="w-full border p-2 rounded bg-blue-50 text-blue-700 font-bold text-center">{diasUteisBase}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">VR Diário Padrão (R$)</label>
                  <CurrencyInput value={valorVRDiario} onChange={setValorVRDiario} className="w-full border p-2 rounded" placeholder="Ex: 45,00" />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={carregarColaboradoresBeneficios} className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700">
                  <Users className="w-5 h-5" /><span>Carregar Base</span>
                </button>
                {beneficiosData.length > 0 && (
                  <button onClick={limparMesBeneficios} className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                    <RotateCcw className="w-5 h-5" /><span>Zerar Lançamentos</span>
                  </button>
                )}
              </div>
            </div>

            {beneficiosData.length > 0 && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">Lançamentos de Benefícios ({beneficiosData.length} colaboradores)</h3>
                  <div className="flex gap-2">
                    <button onClick={exportBeneficiosBasePDF} className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 text-sm">
                      <FileText className="w-4 h-4" /><span>PDF Base</span>
                    </button>
                    <button onClick={exportVTBankFile} className="flex items-center space-x-1 px-3 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 text-sm">
                      <Download className="w-4 h-4" /><span>VT Banco</span>
                    </button>
                    <button onClick={exportVRSolidesFile} className="flex items-center space-x-1 px-3 py-2 bg-teal-500 text-white font-medium rounded-lg hover:bg-teal-600 text-sm">
                      <Download className="w-4 h-4" /><span>VR Solides</span>
                    </button>
                    <button onClick={generateReceiptsPDF} className="flex items-center space-x-1 px-3 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 text-sm">
                      <FileText className="w-4 h-4" /><span>Recibos</span>
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="p-2 text-left">Mat</th>
                        <th className="p-2 text-left">Nome</th>
                        <th className="p-2 text-left">Empresa</th>
                        <th className="p-2 text-center">VT Diário</th>
                        <th className="p-2 text-center">Faltas</th>
                        <th className="p-2 text-center">Desc VT</th>
                        <th className="p-2 text-center">Desc VR</th>
                        <th className="p-2 text-center">Acrés VT</th>
                        <th className="p-2 text-center">Acrés VR</th>
                        <th className="p-2 text-right">Total VT</th>
                        <th className="p-2 text-right">Total VR</th>
                        <th className="p-2 text-right font-bold">Total</th>
                        <th className="p-2 text-left">Obs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calcBeneficios().map((item, idx) => {
                        const overrides = beneficiosOverrides[item.matricula] || {};
                        return (
                          <tr key={idx} className="border-t hover:bg-gray-50">
                            <td className="p-1 font-mono">{item.matricula}</td>
                            <td className="p-1 font-medium truncate max-w-[150px]">{item.nome}</td>
                            <td className="p-1 truncate max-w-[100px]">{item.empresa || '-'}</td>
                            <td className="p-1"><CurrencyInput value={overrides.valorVT || ''} onChange={(v) => updateOverride(item.matricula, 'valorVT', v)} className="w-16 border p-1 rounded text-center text-xs" /></td>
                            <td className="p-1"><input type="number" min="0" value={overrides.ausencias || ''} onChange={(e) => updateOverride(item.matricula, 'ausencias', e.target.value)} className="w-12 border p-1 rounded text-center" /></td>
                            <td className="p-1"><input type="number" min="0" value={overrides.descontoVT || ''} onChange={(e) => updateOverride(item.matricula, 'descontoVT', e.target.value)} className="w-12 border p-1 rounded text-center" /></td>
                            <td className="p-1"><input type="number" min="0" value={overrides.descontoVR || ''} onChange={(e) => updateOverride(item.matricula, 'descontoVR', e.target.value)} className="w-12 border p-1 rounded text-center" /></td>
                            <td className="p-1"><input type="number" min="0" value={overrides.acrescimosVT || ''} onChange={(e) => updateOverride(item.matricula, 'acrescimosVT', e.target.value)} className="w-12 border p-1 rounded text-center" /></td>
                            <td className="p-1"><input type="number" min="0" value={overrides.acrescimosVR || ''} onChange={(e) => updateOverride(item.matricula, 'acrescimosVR', e.target.value)} className="w-12 border p-1 rounded text-center" /></td>
                            <td className="p-1 text-right text-orange-600">R$ {formatMoney(item.totalVT)}</td>
                            <td className="p-1 text-right text-teal-600">R$ {formatMoney(item.totalVRLiquido)}</td>
                            <td className="p-1 text-right font-bold text-green-700">R$ {formatMoney(item.totalGeral)}</td>
                            <td className="p-1"><input type="text" value={overrides.obs || ''} onChange={(e) => updateOverride(item.matricula, 'obs', e.target.value)} className="w-24 border p-1 rounded text-xs" placeholder="Obs..." /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-green-50 font-bold">
                      <tr>
                        <td colSpan={9} className="p-2 text-right">TOTAIS:</td>
                        <td className="p-2 text-right text-orange-600">R$ {formatMoney(calcBeneficios().reduce((a, b) => a + b.totalVT, 0))}</td>
                        <td className="p-2 text-right text-teal-600">R$ {formatMoney(calcBeneficios().reduce((a, b) => a + b.totalVRLiquido, 0))}</td>
                        <td className="p-2 text-right text-green-700">R$ {formatMoney(calcBeneficios().reduce((a, b) => a + b.totalGeral, 0))}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= ABA 4: ERP ================= */}
        {activeTab === 'erp' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Resumo ERP por Empresa e Centro de Custo</h2>
                <div className="flex items-center gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={incluirBeneficiosNoERP} onChange={(e) => setIncluirBeneficiosNoERP(e.target.checked)} className="w-4 h-4" />
                    <span className="text-sm text-gray-700">Incluir VT/VR</span>
                  </label>
                  <button onClick={expandirTodasEmpresas} className="text-xs text-blue-600 hover:underline">Expandir Todas</button>
                  <button onClick={recolherTodasEmpresas} className="text-xs text-blue-600 hover:underline">Recolher Todas</button>
                </div>
              </div>

              {getERPDataHierarchico().length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhum dado disponível. Processe salários e/ou benefícios primeiro.</p>
              ) : (
                <div className="space-y-4">
                  {getERPDataHierarchico().map((empresaData, idx) => (
                    <div key={idx} className="border rounded-lg overflow-hidden">
                      <div onClick={() => toggleEmpresaExpand(empresaData.empresa)} className="flex justify-between items-center p-4 bg-blue-50 cursor-pointer hover:bg-blue-100">
                        <div className="flex items-center space-x-2">
                          {expandedEmpresas[empresaData.empresa] ? <ChevronDown className="w-5 h-5 text-blue-600" /> : <ChevronRight className="w-5 h-5 text-blue-600" />}
                          <Building2 className="w-5 h-5 text-blue-600" />
                          <span className="font-bold text-gray-800">{empresaData.empresa}</span>
                          <span className="text-sm text-gray-500">({empresaData.subtotal.vidas} colaboradores)</span>
                        </div>
                        <span className="font-bold text-green-700">R$ {formatMoney(empresaData.subtotal.total)}</span>
                      </div>
                      {expandedEmpresas[empresaData.empresa] && (
                        <div className="p-4">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="p-2 text-left">Centro de Custo</th>
                                <th className="p-2 text-center">Qtd</th>
                                <th className="p-2 text-right">Salário</th>
                                <th className="p-2 text-right">VT</th>
                                <th className="p-2 text-right">VR</th>
                                <th className="p-2 text-right font-bold">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {empresaData.centrosCusto.map((cc, ccIdx) => (
                                <tr key={ccIdx} className="border-t">
                                  <td className="p-2">{cc.centroCusto}</td>
                                  <td className="p-2 text-center">{cc.vidas}</td>
                                  <td className="p-2 text-right">R$ {formatMoney(cc.salario)}</td>
                                  <td className="p-2 text-right">R$ {formatMoney(cc.vt)}</td>
                                  <td className="p-2 text-right">R$ {formatMoney(cc.vr)}</td>
                                  <td className="p-2 text-right font-bold text-green-700">R$ {formatMoney(cc.total)}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-blue-50 font-bold">
                              <tr>
                                <td className="p-2">Subtotal {empresaData.empresa.substring(0, 15)}...</td>
                                <td className="p-2 text-center">{empresaData.subtotal.vidas}</td>
                                <td className="p-2 text-right">R$ {formatMoney(empresaData.subtotal.salario)}</td>
                                <td className="p-2 text-right">R$ {formatMoney(empresaData.subtotal.vt)}</td>
                                <td className="p-2 text-right">R$ {formatMoney(empresaData.subtotal.vr)}</td>
                                <td className="p-2 text-right text-green-700">R$ {formatMoney(empresaData.subtotal.total)}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Total Geral */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-bold text-gray-800">TOTAL GERAL CONSOLIDADO</span>
                        <span className="ml-2 text-sm text-gray-500">({getTotalERPInfo().empresas} empresas | {getTotalERPInfo().colaboradores} colaboradores)</span>
                      </div>
                      <span className="text-xl font-bold text-green-700">R$ {formatMoney(getTotalERPInfo().total)}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={exportERPPDF} className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700">
                      <FileText className="w-5 h-5" /><span>Exportar PDF</span>
                    </button>
                    <button onClick={salvarFechamento} className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700">
                      <Save className="w-5 h-5" /><span>Salvar no Histórico</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= ABA 5: HISTÓRICO ================= */}
        {activeTab === 'historico' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                  <Clock className="w-6 h-6 text-gray-600" />
                  <span>Histórico de Fechamentos</span>
                </h2>
              </div>
              {historico.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Nenhum fechamento salvo ainda.</p>
                  <p className="text-sm">Vá na aba "Resumo ERP" e clique em "Salvar Fechamento".</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {historico.map((registro) => (
                    <div key={registro.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold text-gray-800">{registro.dataHora}</span>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">{registro.tipo}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{registro.detalhes}</p>
                          <p className="text-lg font-bold text-green-600 mt-2">Total: R$ {formatMoney(registro.valorTotal)}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button onClick={() => restaurarHistorico(registro)} className="flex items-center space-x-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium text-sm">
                            <RotateCcw className="w-4 h-4" />
                            <span>Restaurar</span>
                          </button>
                          <button onClick={() => excluirHistorico(registro.id)} className="flex items-center space-x-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium text-sm">
                            <Trash2 className="w-4 h-4" />
                            <span>Excluir</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
